import { z } from 'zod'

import type { CalendarEvent } from '../model/calendar-event'

import { CalendarReauthRequiredError } from './calendar-reauth-error'
import { getUpcomingEventsWindowEnd } from './calendar-window'

export const fetchUpcomingCalendarEvents = async ({
	accessToken,
	accountId,
	now = new Date(),
	timeZone,
}: Readonly<{
	accessToken: string
	accountId: string
	now?: Date
	timeZone: string
}>): Promise<CalendarEvent[]> => {
	const windowEnd = getUpcomingEventsWindowEnd({ now })
	const params = new URLSearchParams({
		$orderby: 'start/dateTime',
		$select: 'id,iCalUId,subject,start,end,isAllDay,location,webLink',
		$top: MAX_EVENTS.toString(),
		endDateTime: windowEnd.toISOString(),
		startDateTime: now.toISOString(),
	})

	const response = await fetch(
		`${CALENDAR_VIEW_ENDPOINT}?${params.toString()}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Prefer: `outlook.timezone="${timeZone}"`,
			},
		},
	)

	if (response.status === 401) {
		throw new CalendarReauthRequiredError()
	}

	if (!response.ok) {
		throw new Error(`Calendar fetch failed: ${response.status}`)
	}

	const parsed = calendarViewSchema.safeParse(await response.json())
	if (!parsed.success) {
		throw new Error('Invalid calendar response')
	}

	return parsed.data.value
		.map((event) => mapGraphEvent({ accountId, event }))
		.sort((a, b) => a.startTimestamp - b.startTimestamp)
}

const CALENDAR_VIEW_ENDPOINT =
	'https://graph.microsoft.com/v1.0/me/calendarView'
const MAX_EVENTS = 10

const graphDateTimeSchema = z.object({
	dateTime: z.string().min(1),
})

const graphEventSchema = z.object({
	end: graphDateTimeSchema,
	iCalUId: z.string().nullable().optional(),
	id: z.string().min(1),
	isAllDay: z.boolean(),
	location: z
		.object({ displayName: z.string().nullable().optional() })
		.nullable()
		.optional(),
	start: graphDateTimeSchema,
	subject: z.string().nullable().optional(),
	webLink: z.string().nullable().optional(),
})

const calendarViewSchema = z.object({
	value: z.array(graphEventSchema),
})

const mapGraphEvent = ({
	accountId,
	event,
}: Readonly<{
	accountId: string
	event: z.infer<typeof graphEventSchema>
}>): CalendarEvent => ({
	accountId,
	endTimestamp: parseGraphDateTime(event.end.dateTime),
	icalUid: event.iCalUId ?? null,
	id: event.id,
	isAllDay: event.isAllDay,
	location: event.location?.displayName?.trim() || null,
	startTimestamp: parseGraphDateTime(event.start.dateTime),
	subject: event.subject?.trim() ?? '',
	webLink: event.webLink ?? null,
})

// Graph returns wall-clock datetimes (with up to seven fractional digits and
// no offset) in the timezone requested via the `Prefer` header. That timezone
// matches the browser's, so parsing as a local datetime yields the correct
// instant. The fraction is trimmed to three digits for cross-engine parsing.
const parseGraphDateTime = (value: string) =>
	new Date(value.replace(/(\.\d{3})\d+$/, '$1')).getTime()

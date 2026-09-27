import { z } from 'zod'

import type { CalendarEvent } from '../model/calendar-event'

import { getCurrentInstant } from '../../../shared/lib/time'
import { CalendarReauthRequiredError } from './calendar-reauth-error'
import { getUpcomingEventsWindowEnd } from './calendar-window'

export const fetchUpcomingCalendarEvents = async ({
	accessToken,
	accountId,
	now = getCurrentInstant(),
	signal,
	timeZone,
}: Readonly<{
	accessToken: string
	accountId: string
	now?: Temporal.Instant
	signal?: AbortSignal
	timeZone: string
}>): Promise<CalendarEvent[]> => {
	const windowEnd = getUpcomingEventsWindowEnd({
		now: now.toZonedDateTimeISO(timeZone),
	})
	const params = new URLSearchParams({
		$orderby: 'start/dateTime',
		$select:
			'id,iCalUId,subject,bodyPreview,start,end,isAllDay,location,webLink',
		$top: MAX_EVENTS.toString(),
		endDateTime: windowEnd.toInstant().toString({ fractionalSecondDigits: 3 }),
		startDateTime: now.toString({ fractionalSecondDigits: 3 }),
	})

	const response = await fetch(
		`${CALENDAR_VIEW_ENDPOINT}?${params.toString()}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Prefer: `outlook.timezone="${timeZone}"`,
			},
			signal,
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
		.map((event) => mapGraphEvent({ accountId, event, timeZone }))
		.sort((a, b) => a.startTimestamp - b.startTimestamp)
}

const CALENDAR_VIEW_ENDPOINT =
	'https://graph.microsoft.com/v1.0/me/calendarView'
const MAX_EVENTS = 10

const graphDateTimeSchema = z.object({
	dateTime: z.string().min(1),
})

const graphEventSchema = z.object({
	bodyPreview: z.string().nullable().optional(),
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
	timeZone,
}: Readonly<{
	accountId: string
	event: z.infer<typeof graphEventSchema>
	timeZone: string
}>): CalendarEvent => ({
	accountId,
	description: event.bodyPreview?.trim() || null,
	endTimestamp: parseGraphDateTime({ dateTime: event.end.dateTime, timeZone }),
	icalUid: event.iCalUId ?? null,
	id: event.id,
	isAllDay: event.isAllDay,
	location: event.location?.displayName?.trim() || null,
	startTimestamp: parseGraphDateTime({
		dateTime: event.start.dateTime,
		timeZone,
	}),
	subject: event.subject?.trim() ?? '',
	webLink: event.webLink ?? null,
})

// Offset-free Graph timestamps belong to the requested zone, regardless of
// the runtime's zone. Preserve an explicit offset when the provider supplies one.
const parseGraphDateTime = ({
	dateTime,
	timeZone,
}: Readonly<{
	dateTime: string
	timeZone: string
}>): number =>
	/(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(dateTime)
		? Temporal.Instant.from(dateTime).epochMilliseconds
		: Temporal.PlainDateTime.from(dateTime).toZonedDateTime(timeZone, {
				disambiguation: 'compatible',
			}).epochMilliseconds

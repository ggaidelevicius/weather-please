import { z } from 'zod'

import type { CalendarEvent } from '../model/calendar-event'

import { getCurrentInstant, getSystemTimeZone } from '../../../shared/lib/time'
import { CalendarReauthRequiredError } from './calendar-reauth-error'
import { getUpcomingEventsWindowEnd } from './calendar-window'

export const fetchUpcomingGoogleCalendarEvents = async ({
	accessToken,
	accountId,
	now = getCurrentInstant(),
	signal,
	timeZone = getSystemTimeZone(),
}: Readonly<{
	accessToken: string
	accountId: string
	now?: Temporal.Instant
	signal?: AbortSignal
	timeZone?: string
}>): Promise<CalendarEvent[]> => {
	const windowEnd = getUpcomingEventsWindowEnd({
		now: now.toZonedDateTimeISO(timeZone),
	})
	const params = new URLSearchParams({
		maxResults: MAX_EVENTS.toString(),
		orderBy: 'startTime',
		singleEvents: 'true',
		timeMax: windowEnd.toInstant().toString({ fractionalSecondDigits: 3 }),
		timeMin: now.toString({ fractionalSecondDigits: 3 }),
	})

	const response = await fetch(`${EVENTS_ENDPOINT}?${params.toString()}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
		signal,
	})

	if (response.status === 401) {
		throw new CalendarReauthRequiredError()
	}

	if (!response.ok) {
		throw new Error(`Calendar fetch failed: ${response.status}`)
	}

	const parsed = eventsResponseSchema.safeParse(await response.json())
	if (!parsed.success) {
		throw new Error('Invalid calendar response')
	}

	return (parsed.data.items ?? [])
		.filter(
			(event) =>
				event.status !== 'cancelled' &&
				Boolean(event.start.date ?? event.start.dateTime),
		)
		.map((event) => mapGoogleEvent({ accountId, event, timeZone }))
		.sort((a, b) => a.startTimestamp - b.startTimestamp)
}

const EVENTS_ENDPOINT =
	'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const MAX_EVENTS = 10

const googleEventTimeSchema = z.object({
	date: z.string().optional(),
	dateTime: z.string().optional(),
})

const googleEventSchema = z.object({
	description: z.string().nullable().optional(),
	end: googleEventTimeSchema,
	htmlLink: z.string().nullable().optional(),
	iCalUID: z.string().nullable().optional(),
	id: z.string().min(1),
	location: z.string().nullable().optional(),
	start: googleEventTimeSchema,
	status: z.string().optional(),
	summary: z.string().nullable().optional(),
})

const eventsResponseSchema = z.object({
	items: z.array(googleEventSchema).optional(),
})

const mapGoogleEvent = ({
	accountId,
	event,
	timeZone,
}: Readonly<{
	accountId: string
	event: z.infer<typeof googleEventSchema>
	timeZone: string
}>): CalendarEvent => ({
	accountId,
	description: event.description?.trim() || null,
	endTimestamp: parseGoogleEventTime({ time: event.end, timeZone }),
	icalUid: event.iCalUID ?? null,
	id: event.id,
	isAllDay: Boolean(event.start.date),
	location: event.location?.trim() || null,
	startTimestamp: parseGoogleEventTime({ time: event.start, timeZone }),
	subject: event.summary?.trim() ?? '',
	webLink: event.htmlLink ?? null,
})

// All-day events retain their calendar date in the viewer's zone; their end
// date stays exclusive, even when a local day has fewer or more than 24 hours.
const parseGoogleEventTime = ({
	time,
	timeZone,
}: Readonly<{
	time: z.infer<typeof googleEventTimeSchema>
	timeZone: string
}>): number =>
	time.dateTime
		? Temporal.Instant.from(time.dateTime).epochMilliseconds
		: Temporal.PlainDate.from(time.date ?? '').toZonedDateTime(timeZone)
				.epochMilliseconds

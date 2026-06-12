import { z } from 'zod'

import type { CalendarEvent } from '../model/calendar-event'

import { CalendarReauthRequiredError } from './calendar-reauth-error'
import { UPCOMING_EVENTS_WINDOW_HOURS } from './microsoft-calendar'

export const fetchUpcomingGoogleCalendarEvents = async ({
	accessToken,
	accountId,
	now = new Date(),
}: Readonly<{
	accessToken: string
	accountId: string
	now?: Date
}>): Promise<CalendarEvent[]> => {
	const windowEnd = new Date(
		now.getTime() + UPCOMING_EVENTS_WINDOW_HOURS * 60 * 60 * 1000,
	)
	const params = new URLSearchParams({
		maxResults: MAX_EVENTS.toString(),
		orderBy: 'startTime',
		singleEvents: 'true',
		timeMax: windowEnd.toISOString(),
		timeMin: now.toISOString(),
	})

	const response = await fetch(`${EVENTS_ENDPOINT}?${params.toString()}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
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
		.map((event) => mapGoogleEvent({ accountId, event }))
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
}: Readonly<{
	accountId: string
	event: z.infer<typeof googleEventSchema>
}>): CalendarEvent => ({
	accountId,
	endTimestamp: parseGoogleEventTime(event.end),
	icalUid: event.iCalUID ?? null,
	id: event.id,
	isAllDay: Boolean(event.start.date),
	location: event.location?.trim() || null,
	startTimestamp: parseGoogleEventTime(event.start),
	subject: event.summary?.trim() ?? '',
	webLink: event.htmlLink ?? null,
})

// Timed events carry an RFC 3339 datetime with an offset; all-day events
// carry a plain date, which must be parsed as local midnight (the Date
// constructor would treat the bare string as UTC).
const parseGoogleEventTime = (
	time: z.infer<typeof googleEventTimeSchema>,
): number => {
	if (time.dateTime) {
		return new Date(time.dateTime).getTime()
	}

	const [year = 0, month = 1, day = 1] = (time.date ?? '')
		.split('-')
		.map(Number)

	return new Date(year, month - 1, day).getTime()
}

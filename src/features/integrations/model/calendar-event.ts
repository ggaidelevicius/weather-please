import { z } from 'zod'

import { epochMillisecondsSchema } from '../../../shared/lib/time-schema'

export const calendarEventSchema = z.object({
	accountId: z.string().min(1),
	description: z.string().nullable(),
	endTimestamp: epochMillisecondsSchema,
	icalUid: z.string().nullable(),
	id: z.string().min(1),
	isAllDay: z.boolean(),
	location: z.string().nullable(),
	startTimestamp: epochMillisecondsSchema,
	subject: z.string(),
	webLink: z.string().nullable(),
})

export type CalendarEvent = z.infer<typeof calendarEventSchema>

// Merges per-account event lists into one chronological list. The same event
// can exist in several connected calendars (the user invited their other
// address, or both were invited); `icalUid` is stable across those copies, so
// duplicates collapse to the earliest-sorted occurrence.
export const mergeCalendarEvents = (
	eventLists: ReadonlyArray<readonly CalendarEvent[]>,
): CalendarEvent[] => {
	const sortedEvents = eventLists
		.flat()
		.sort((a, b) => a.startTimestamp - b.startTimestamp)
	const seenKeys = new Set<string>()

	return sortedEvents.filter((event) => {
		const dedupeKey = event.icalUid ?? event.id
		if (seenKeys.has(dedupeKey)) {
			return false
		}

		seenKeys.add(dedupeKey)
		return true
	})
}

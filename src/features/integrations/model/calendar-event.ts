export type CalendarEvent = {
	accountId: string
	endTimestamp: number
	icalUid: null | string
	id: string
	isAllDay: boolean
	location: null | string
	startTimestamp: number
	subject: string
	webLink: null | string
}

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

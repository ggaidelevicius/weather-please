import { describe, expect, it } from 'vitest'

import type { CalendarEvent } from '../calendar-event'

import { mergeCalendarEvents } from '../calendar-event'

const createEvent = (
	overrides: Partial<CalendarEvent> = {},
): CalendarEvent => ({
	accountId: 'account-1',
	endTimestamp: 2000,
	icalUid: null,
	id: 'event-1',
	isAllDay: false,
	location: null,
	startTimestamp: 1000,
	subject: 'Standup',
	webLink: null,
	...overrides,
})

describe('mergeCalendarEvents', () => {
	it('merges per-account lists into chronological order', () => {
		const merged = mergeCalendarEvents([
			[createEvent({ id: 'b', startTimestamp: 2000 })],
			[
				createEvent({ accountId: 'account-2', id: 'c', startTimestamp: 3000 }),
				createEvent({ accountId: 'account-2', id: 'a', startTimestamp: 1000 }),
			],
		])

		expect(merged.map((event) => event.id)).toEqual(['a', 'b', 'c'])
	})

	it('collapses copies of the same event shared across accounts', () => {
		const merged = mergeCalendarEvents([
			[createEvent({ icalUid: 'shared-meeting', id: 'personal-copy' })],
			[
				createEvent({
					accountId: 'account-2',
					icalUid: 'shared-meeting',
					id: 'work-copy',
				}),
				createEvent({ accountId: 'account-2', icalUid: null, id: 'unique' }),
			],
		])

		expect(merged.map((event) => event.id)).toEqual(['personal-copy', 'unique'])
	})
})

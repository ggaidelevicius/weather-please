import { describe, expect, it } from 'vitest'

import type { CalendarEvent } from '../calendar-event'

import { calendarEventSchema, mergeCalendarEvents } from '../calendar-event'

const createEvent = (
	overrides: Partial<CalendarEvent> = {},
): CalendarEvent => ({
	accountId: 'account-1',
	description: null,
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

describe('calendar event timestamp validation', () => {
	it.each(['startTimestamp', 'endTimestamp'] as const)(
		'rejects invalid %s values before display',
		(field) => {
			for (const timestamp of [0.5, 8_640_000_000_000_001]) {
				expect(
					calendarEventSchema.safeParse(createEvent({ [field]: timestamp }))
						.success,
				).toBe(false)
			}
		},
	)
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

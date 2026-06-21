import { describe, expect, it } from 'vitest'

import { getUpcomingEventsWindowEnd } from '../calendar-window'

describe('getUpcomingEventsWindowEnd', () => {
	it('uses three days from now when that extends beyond this week', () => {
		const now = new Date(2026, 5, 19, 9, 30)

		expect(getUpcomingEventsWindowEnd({ now })).toEqual(
			new Date(2026, 5, 22, 9, 30),
		)
	})

	it('uses Saturday night as the end of a Sunday-started week', () => {
		const now = new Date(2026, 5, 15, 9, 30)

		expect(getUpcomingEventsWindowEnd({ now })).toEqual(
			new Date(2026, 5, 20, 23, 59, 59, 999),
		)
	})

	it('treats Sunday as the start of a new week', () => {
		const now = new Date(2026, 5, 14, 9, 30)

		expect(getUpcomingEventsWindowEnd({ now })).toEqual(
			new Date(2026, 5, 20, 23, 59, 59, 999),
		)
	})
})

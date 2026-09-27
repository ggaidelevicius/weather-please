import { describe, expect, it } from 'vitest'

import { getUpcomingEventsWindowEnd } from '../calendar-window'

describe('getUpcomingEventsWindowEnd', () => {
	it.each([
		['2026-06-19T09:30', '2026-06-22T09:30'],
		['2026-06-15T09:30', '2026-06-20T23:59:59.999'],
		['2026-06-14T09:30', '2026-06-20T23:59:59.999'],
	])(
		'extends %s to three calendar days or the end of the Sunday-started week',
		(start, end) => {
			const now = Temporal.ZonedDateTime.from(`${start}[Australia/Perth]`)
			const expected = Temporal.ZonedDateTime.from(`${end}[Australia/Perth]`)

			expect(getUpcomingEventsWindowEnd({ now }).equals(expected)).toBe(true)
		},
	)

	it.each([
		['2026-03-06T12:00', '2026-03-09T12:00', 71],
		['2026-10-30T12:00', '2026-11-02T12:00', 73],
	])(
		'preserves the local time three days after %s across daylight saving',
		(start, end, hours) => {
			const now = Temporal.ZonedDateTime.from(`${start}[America/New_York]`)
			const windowEnd = getUpcomingEventsWindowEnd({ now })

			expect(
				windowEnd.equals(
					Temporal.ZonedDateTime.from(`${end}[America/New_York]`),
				),
			).toBe(true)
			expect(now.until(windowEnd, { largestUnit: 'hours' }).hours).toBe(hours)
		},
	)
})

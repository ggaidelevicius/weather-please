import { describe, expect, it } from 'vitest'

import {
	getActiveSeasonalEvent,
	getSeasonalEventForDate,
} from '../seasonal-events-module'
import { SEASONAL_EVENT_OVERRIDE_NONE, SeasonalEventId } from '../types'

describe('seasonal event overrides', () => {
	it('returns the selected override even when the date does not match', () => {
		const event = getSeasonalEventForDate({
			date: Temporal.PlainDate.from('2026-01-15'),
			seasonalEventOverride: SeasonalEventId.ChristmasDay,
		})

		expect(event?.id).toBe(SeasonalEventId.ChristmasDay)
	})

	it('does not treat none as an override', () => {
		const activeEvent = getActiveSeasonalEvent({
			date: Temporal.PlainDate.from('2026-01-15'),
			enabledEvents: new Set<SeasonalEventId>(),
			seasonalEventOverride: SEASONAL_EVENT_OVERRIDE_NONE,
		})

		expect(activeEvent).toBeNull()
	})
})

describe('seasonal calendar dates', () => {
	it.each([
		['2026-01-01', SeasonalEventId.NewYearsDay],
		['2026-02-14', SeasonalEventId.ValentinesDay],
		['2026-10-31', SeasonalEventId.Halloween],
		['2026-11-01', SeasonalEventId.DayOfTheDead],
		['2026-11-02', SeasonalEventId.DayOfTheDead],
		['2026-12-25', SeasonalEventId.ChristmasDay],
	] as const)(
		'matches %s using one-based calendar months',
		(value, eventId) => {
			const date = Temporal.PlainDate.from(value)
			const enabledEvents = new Set([eventId])
			expect(getSeasonalEventForDate({ date, enabledEvents })?.id).toBe(eventId)
			expect(
				getSeasonalEventForDate({
					date: date.subtract({ months: 1 }),
					enabledEvents,
				}),
			).toBeNull()
		},
	)

	it.each(['2024-03-31', '2026-04-05'])(
		'finds Easter in March or April on %s',
		(value) => {
			const date = Temporal.PlainDate.from(value)
			const enabledEvents = new Set([SeasonalEventId.Easter])
			expect(getSeasonalEventForDate({ date, enabledEvents })?.id).toBe(
				SeasonalEventId.Easter,
			)
			expect(
				getSeasonalEventForDate({ date: date.add({ days: 1 }), enabledEvents }),
			).toBeNull()
		},
	)

	it('keeps a date-only Christmas on the selected day across the international date line', () => {
		const selectedDate = Temporal.PlainDate.from('2026-12-25')
		for (const timeZone of ['Pacific/Honolulu', 'Pacific/Kiritimati']) {
			const localMidnight = selectedDate.toZonedDateTime(timeZone)
			expect(
				getSeasonalEventForDate({ date: localMidnight.toPlainDate() })?.id,
			).toBe(SeasonalEventId.ChristmasDay)
		}
		expect(selectedDate.toString()).toBe('2026-12-25')
	})
})

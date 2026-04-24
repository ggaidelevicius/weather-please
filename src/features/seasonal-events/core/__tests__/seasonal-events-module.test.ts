import { describe, expect, it } from 'vitest'

import {
	getActiveSeasonalEvent,
	getSeasonalEventForDate,
} from '../seasonal-events-module'
import { SEASONAL_EVENT_OVERRIDE_NONE, SeasonalEventId } from '../types'

describe('seasonal event overrides', () => {
	it('returns the selected override even when the date does not match', () => {
		const event = getSeasonalEventForDate({
			date: new Date(2026, 0, 15),
			seasonalEventOverride: SeasonalEventId.ChristmasDay,
		})

		expect(event?.id).toBe(SeasonalEventId.ChristmasDay)
	})

	it('does not treat none as an override', () => {
		const activeEvent = getActiveSeasonalEvent({
			date: new Date(2026, 0, 15),
			enabledEvents: new Set<SeasonalEventId>(),
			seasonalEventOverride: SEASONAL_EVENT_OVERRIDE_NONE,
		})

		expect(activeEvent).toBeNull()
	})
})

import { describe, expect, it } from 'vitest'
import {
	getEnabledSeasonalEvents,
	type SeasonalEventSettings,
} from '../enabled-events'
import { SeasonalEventId } from '../types'

const createConfig = (
	overrides: Partial<SeasonalEventSettings> = {},
): SeasonalEventSettings => ({
	showSeasonalEvents: true,
	showNewYearsEvent: false,
	showValentinesEvent: false,
	showLunarNewYearEvent: false,
	showEasterEvent: false,
	showSpringEquinoxEvent: false,
	showAutumnEquinoxEvent: false,
	showDiwaliEvent: false,
	showHoliEvent: false,
	showEarthDayEvent: false,
	showSummerSolsticeEvent: false,
	showWinterSolsticeEvent: false,
	showHalloweenEvent: false,
	showDayOfTheDeadEvent: false,
	showPerseidsEvent: false,
	showQuadrantidsEvent: false,
	showLyridsEvent: false,
	showEtaAquariidsEvent: false,
	showOrionidsEvent: false,
	showLeonidsEvent: false,
	showTotalSolarEclipseEvent: false,
	showTotalLunarEclipseEvent: false,
	showGeminidsEvent: false,
	showEidAlFitrEvent: false,
	showEidAlAdhaEvent: false,
	showHanukkahEvent: false,
	showChristmasEvent: false,
	...overrides,
})

describe('getEnabledSeasonalEvents', () => {
	it('returns an empty set when seasonal events are disabled globally', () => {
		const enabledEvents = getEnabledSeasonalEvents(
			createConfig({
				showSeasonalEvents: false,
				showNewYearsEvent: true,
				showChristmasEvent: true,
			}),
		)

		expect(enabledEvents.size).toBe(0)
	})

	it('returns only enabled event ids', () => {
		const enabledEvents = getEnabledSeasonalEvents(
			createConfig({
				showNewYearsEvent: true,
				showChristmasEvent: true,
				showHoliEvent: true,
			}),
		)

		expect(enabledEvents).toEqual(
			new Set([
				SeasonalEventId.NewYearsDay,
				SeasonalEventId.Holi,
				SeasonalEventId.ChristmasDay,
			]),
		)
	})
})

import { describe, expect, it } from 'vitest'

import {
	getEnabledSeasonalEventBackgrounds,
	getEnabledSeasonalEvents,
	type SeasonalEventSettings,
} from '../enabled-events'
import { SeasonalEventId } from '../types'
import { BOOLEAN_CONFIG_DEFAULTS } from '../../../settings/model/boolean-settings'

const createConfig = (
	overrides: Partial<SeasonalEventSettings> = {},
): SeasonalEventSettings => ({
	...BOOLEAN_CONFIG_DEFAULTS,
	showAutumnEquinoxEvent: false,
	showChristmasEvent: false,
	showDayOfTheDeadEvent: false,
	showDiwaliEvent: false,
	showEarthDayEvent: false,
	showEasterEvent: false,
	showEidAlAdhaEvent: false,
	showEidAlFitrEvent: false,
	showEtaAquariidsEvent: false,
	showEventHorizonDayEvent: false,
	showGeminidsEvent: false,
	showHalloweenEvent: false,
	showHanukkahEvent: false,
	showHoliEvent: false,
	showLeonidsEvent: false,
	showLunarNewYearEvent: false,
	showLyridsEvent: false,
	showNewYearsEvent: false,
	showOrionidsEvent: false,
	showPerseidsEvent: false,
	showQuadrantidsEvent: false,
	showSeasonalEvents: true,
	showSpringEquinoxEvent: false,
	showSummerSolsticeEvent: false,
	showTotalLunarEclipseEvent: false,
	showTotalSolarEclipseEvent: false,
	showValentinesEvent: false,
	showWinterSolsticeEvent: false,
	...overrides,
})

describe('getEnabledSeasonalEvents', () => {
	it('returns an empty set when seasonal events are disabled globally', () => {
		const enabledEvents = getEnabledSeasonalEvents(
			createConfig({
				showChristmasEvent: true,
				showNewYearsEvent: true,
				showSeasonalEvents: false,
			}),
		)

		expect(enabledEvents.size).toBe(0)
	})

	it('returns only enabled event ids', () => {
		const enabledEvents = getEnabledSeasonalEvents(
			createConfig({
				showChristmasEvent: true,
				showHoliEvent: true,
				showNewYearsEvent: true,
			}),
		)

		expect(enabledEvents).toEqual(
			new Set([
				SeasonalEventId.ChristmasDay,
				SeasonalEventId.Holi,
				SeasonalEventId.NewYearsDay,
			]),
		)
	})

	it('resolves background preferences independently from event preferences', () => {
		const config = createConfig({
			showChristmasEvent: false,
			showChristmasEventBackground: true,
			showHoliEvent: true,
			showHoliEventBackground: false,
		})

		expect(getEnabledSeasonalEvents(config).has(SeasonalEventId.Holi)).toBe(
			true,
		)
		expect(
			getEnabledSeasonalEvents(config).has(SeasonalEventId.ChristmasDay),
		).toBe(false)
		expect(
			getEnabledSeasonalEventBackgrounds(config).has(
				SeasonalEventId.ChristmasDay,
			),
		).toBe(true)
		expect(
			getEnabledSeasonalEventBackgrounds(config).has(SeasonalEventId.Holi),
		).toBe(false)
	})
})

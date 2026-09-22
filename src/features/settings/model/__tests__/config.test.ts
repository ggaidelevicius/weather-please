import { describe, expect, it } from 'vitest'

import {
	SEASONAL_BACKGROUND_AUTOMATIC,
	SeasonalEventId,
} from '../../../seasonal-events/core/types'
import {
	configSchema,
	createDefaultConfig,
	hasValidCoordinates,
	repairConfig,
} from '../config'

describe('seasonal background configuration', () => {
	it('defaults to automatic seasonal backgrounds', () => {
		expect(createDefaultConfig().seasonalBackground).toBe(
			SEASONAL_BACKGROUND_AUTOMATIC,
		)
		expect(createDefaultConfig().shouldPreferSeasonalBackgrounds).toBe(false)
	})

	it.each([SEASONAL_BACKGROUND_AUTOMATIC, ...Object.values(SeasonalEventId)])(
		'accepts and preserves the background %s',
		(seasonalBackground) => {
			const config = { ...createDefaultConfig(), seasonalBackground }

			expect(configSchema.safeParse(config).success).toBe(true)
			expect(repairConfig(config).seasonalBackground).toBe(seasonalBackground)
		},
	)

	it.each([undefined, null, 'true', 1])(
		'repairs invalid seasonal background preference %s while preserving the chosen style',
		(shouldPreferSeasonalBackgrounds) => {
			const config = {
				...createDefaultConfig(),
				seasonalBackground: SeasonalEventId.Holi,
				shouldPreferSeasonalBackgrounds,
				showChristmasEventBackground: false,
			}

			expect(configSchema.safeParse(config).success).toBe(false)
			expect(repairConfig(config)).toMatchObject({
				seasonalBackground: SeasonalEventId.Holi,
				shouldPreferSeasonalBackgrounds: false,
				showChristmasEventBackground: false,
			})
		},
	)

	it.each([undefined, null, '', 'unsupported-event', true])(
		'repairs invalid background %s to automatic without resetting preferences',
		(seasonalBackground) => {
			const config = {
				...createDefaultConfig(),
				seasonalBackground,
				showSeasonalEvents: false,
				showChristmasEvent: false,
				showChristmasEventBackground: false,
			}

			expect(configSchema.safeParse(config).success).toBe(false)
			expect(repairConfig(config)).toMatchObject({
				seasonalBackground: SEASONAL_BACKGROUND_AUTOMATIC,
				showSeasonalEvents: false,
				showChristmasEvent: false,
				showChristmasEventBackground: false,
			})
		},
	)
})

describe('repairConfig', () => {
	it('repairs invalid fields while preserving valid preferences', () => {
		const config = repairConfig({
			lat: 123,
			lon: '115.8',
			lang: 'missing',
			daysToRetrieve: '900',
			showAlerts: 'false',
			showCalendarEvents: false,
			temperatureUnit: 'invalid',
			installed: -1,
			unknownField: 'ignored',
		})
		expect(config).toMatchObject({
			lat: '',
			lon: '115.8',
			lang: 'en',
			daysToRetrieve: '3',
			showAlerts: true,
			showCalendarEvents: false,
		})
		expect(config).not.toHaveProperty('unknownField')
		expect(configSchema.safeParse(config).success).toBe(true)
		expect(hasValidCoordinates(config)).toBe(false)
	})

	it('preserves supported coordinates without reducing precision', () => {
		const config = repairConfig({ lat: '-31.952300000001', lon: '180.0000' })
		expect(config.lat).toBe('-31.952300000001')
		expect(hasValidCoordinates(config)).toBe(true)
	})
})

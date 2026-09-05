import { describe, expect, it } from 'vitest'

import { configSchema, hasValidCoordinates, repairConfig } from '../config'

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

import { renderHook, act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useConfig, type Config } from '../use-config'

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {}
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value
		},
		removeItem: (key: string) => {
			delete store[key]
		},
		clear: () => {
			store = {}
		},
		get config() {
			return store.config || ''
		},
		set config(value: string) {
			store.config = value
		},
	}
})()

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
})

// Mock i18n functions
vi.mock('../../lib/i18n', () => ({
	changeLocalisation: vi.fn(),
	locales: {
		en: 'English',
		es: 'Spanish',
		fr: 'French',
		de: 'German',
	},
}))

// Mock helpers
vi.mock('../../lib/helpers', () => ({
	mergeObjects: vi.fn((target, source) => ({ ...source, ...target })),
}))

const mockValidConfig: Config = {
	lang: 'en',
	lat: '40.7128',
	lon: '-74.0060',
	periodicLocationUpdate: false,
	useMetric: true,
	showAlerts: true,
	showUvAlerts: true,
	showWindAlerts: true,
	showVisibilityAlerts: true,
	showPrecipitationAlerts: true,
	showNewYearsEvent: true,
	showValentinesEvent: true,
	showLunarNewYearEvent: true,
	showSeasonalEvents: true,
	showSeasonalTileGlow: true,
	showEarthDayEvent: true,
	showSpringEquinoxEvent: true,
	showAutumnEquinoxEvent: true,
	showDiwaliEvent: true,
	showSummerSolsticeEvent: true,
	showWinterSolsticeEvent: true,
	showHalloweenEvent: true,
	daysToRetrieve: '3',
	identifier: 'day',
	installed: 1640995200000,
	displayedReviewPrompt: false,
}

describe('useConfig - Core Functionality', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		localStorageMock.clear()
	})

	it('initializes with default state', () => {
		const { result } = renderHook(() => useConfig())

		expect(result.current.config).toEqual({
			lang: 'en',
			lat: '',
			lon: '',
			periodicLocationUpdate: false,
			useMetric: true,
			showAlerts: true,
			showUvAlerts: true,
			showWindAlerts: true,
			showVisibilityAlerts: true,
			showPrecipitationAlerts: true,
			showNewYearsEvent: true,
			showValentinesEvent: true,
			showLunarNewYearEvent: true,
			showSeasonalEvents: true,
			showSeasonalTileGlow: true,
			showEarthDayEvent: true,
			showSpringEquinoxEvent: true,
			showAutumnEquinoxEvent: true,
			showDiwaliEvent: true,
			showSummerSolsticeEvent: true,
			showWinterSolsticeEvent: true,
			showHalloweenEvent: true,
			daysToRetrieve: '3',
			identifier: 'day',
			installed: expect.any(Number),
			displayedReviewPrompt: false,
		})

		expect(result.current.input).toEqual(result.current.config)
	})

	it('loads valid config from localStorage on mount', async () => {
		localStorageMock.config = JSON.stringify(mockValidConfig)

		const { result } = renderHook(() => useConfig())

		await waitFor(() => {
			expect(result.current.config).toEqual(mockValidConfig)
			expect(result.current.input).toEqual(mockValidConfig)
		})
	})

	it('migrates legacy seasonal surprise keys', async () => {
		const legacyConfig = { ...mockValidConfig } as Record<string, unknown>

		legacyConfig.showSeasonalSurprises = false
		legacyConfig.showNewYearsSurprise = false
		legacyConfig.showValentinesSurprise = true
		legacyConfig.showLunarNewYearSurprise = false
		delete legacyConfig.showSeasonalEvents
		delete legacyConfig.showNewYearsEvent
		delete legacyConfig.showValentinesEvent
		delete legacyConfig.showLunarNewYearEvent

		localStorageMock.config = JSON.stringify(legacyConfig)

		const { result } = renderHook(() => useConfig())

		await waitFor(() => {
			expect(result.current.config.showSeasonalEvents).toBe(false)
			expect(result.current.config.showNewYearsEvent).toBe(false)
			expect(result.current.config.showValentinesEvent).toBe(true)
			expect(result.current.config.showLunarNewYearEvent).toBe(false)
		})
	})

	it('merges invalid config with defaults', async () => {
		const invalidConfig = {
			lang: 'en',
			lat: '40.7128',
			// Missing required fields
		}

		localStorageMock.config = JSON.stringify(invalidConfig)

		const { result } = renderHook(() => useConfig())

		// Should merge with defaults
		await waitFor(() => {
			expect(result.current.config).toMatchObject({
				lang: 'en',
				lat: '40.7128',
				lon: '', // Should be filled with default
				useMetric: true, // Should be filled with default
			})
		})
	})

	it('handles corrupted localStorage data gracefully', async () => {
		localStorageMock.config = 'invalid json'

		const { result } = renderHook(() => useConfig())

		// Should fall back to defaults
		await waitFor(() => {
			expect(result.current.config.lang).toBe('en')
			expect(result.current.config.lat).toBe('')
			expect(result.current.config.lon).toBe('')
		})
	})

	it('updates input state with handleChange', () => {
		const { result } = renderHook(() => useConfig())

		act(() => {
			result.current.handleChange('lang', 'es')
		})

		expect(result.current.input.lang).toBe('es')
		expect(result.current.config.lang).toBe('en') // Config should not change yet
	})

	it('trims string values in handleChange', () => {
		const { result } = renderHook(() => useConfig())

		act(() => {
			result.current.handleChange('lat', '  40.7128  ')
		})

		expect(result.current.input.lat).toBe('40.7128')
	})

	it('does not trim non-string values', () => {
		const { result } = renderHook(() => useConfig())

		act(() => {
			result.current.handleChange('useMetric', false)
		})

		expect(result.current.input.useMetric).toBe(false)
	})

	it('updates config with updateConfig', () => {
		const { result } = renderHook(() => useConfig())

		act(() => {
			result.current.updateConfig({
				lang: 'fr',
				useMetric: false,
			})
		})

		expect(result.current.input.lang).toBe('fr')
		expect(result.current.input.useMetric).toBe(false)
	})

	it('updates config with setInput', () => {
		const { result } = renderHook(() => useConfig())

		act(() => {
			result.current.setInput({
				...result.current.input,
				lang: 'de',
			})
		})

		expect(result.current.input.lang).toBe('de')
	})

	it('saves valid lat/lon to localStorage and updates config', () => {
		const { result } = renderHook(() => useConfig())

		act(() => {
			result.current.handleChange('lat', '40.7128')
			result.current.handleChange('lon', '-74.0060')
		})

		// Should save to localStorage and update config
		expect(localStorageMock.config).toBeTruthy()
		expect(result.current.config.lat).toBe('40.7128')
		expect(result.current.config.lon).toBe('-74.0060')
	})

	it('does not save invalid lat/lon coordinates', () => {
		const { result } = renderHook(() => useConfig())

		act(() => {
			result.current.handleChange('lat', 'invalid')
			result.current.handleChange('lon', 'invalid')
		})

		// Should not save invalid coordinates
		expect(localStorageMock.config).toBe('')
		expect(result.current.config.lat).toBe('')
		expect(result.current.config.lon).toBe('')
	})

	it('validates latitude range correctly', () => {
		const { result } = renderHook(() => useConfig())

		// Test valid latitudes
		const validLatitudes = ['0', '45.123', '90', '-90', '89.999999']
		validLatitudes.forEach((lat) => {
			act(() => {
				result.current.handleChange('lat', lat)
				result.current.handleChange('lon', '0')
			})
			expect(result.current.config.lat).toBe(lat)
		})

		// Test invalid latitudes
		const invalidLatitudes = ['91', '-91', '180', 'abc']
		invalidLatitudes.forEach((lat) => {
			act(() => {
				result.current.handleChange('lat', lat)
				result.current.handleChange('lon', '0')
			})
			// Invalid coordinates should not update the config
			expect(result.current.config.lat).toBe('89.999999') // Should keep previous valid value
		})
	})

	it('validates longitude range correctly', () => {
		const { result } = renderHook(() => useConfig())

		// Test valid longitudes
		const validLongitudes = ['0', '45.123', '180', '-180', '179.999999']
		validLongitudes.forEach((lon) => {
			act(() => {
				result.current.handleChange('lat', '0')
				result.current.handleChange('lon', lon)
			})
			expect(result.current.config.lon).toBe(lon)
		})

		// Test invalid longitudes
		const invalidLongitudes = ['181', '-181', '360', 'xyz']
		invalidLongitudes.forEach((lon) => {
			act(() => {
				result.current.handleChange('lat', '0')
				result.current.handleChange('lon', lon)
			})
			// Invalid coordinates should not update the config
			expect(result.current.config.lon).toBe('179.999999') // Should keep previous valid value
		})
	})

	it('calls changeLocalisation when language changes', async () => {
		const { changeLocalisation } = await import('../../lib/i18n')
		const { result } = renderHook(() => useConfig())

		act(() => {
			result.current.handleChange('lang', 'es')
		})

		expect(changeLocalisation).toHaveBeenCalledWith('es')
	})

	it('handles multiple rapid config changes', () => {
		const { result } = renderHook(() => useConfig())

		act(() => {
			result.current.handleChange('lang', 'es')
			result.current.handleChange('useMetric', false)
			result.current.handleChange('daysToRetrieve', '5')
		})

		expect(result.current.input.lang).toBe('es')
		expect(result.current.input.useMetric).toBe(false)
		expect(result.current.input.daysToRetrieve).toBe('5')
	})

	it('preserves existing values when updating partial config', () => {
		const { result } = renderHook(() => useConfig())

		act(() => {
			result.current.handleChange('lang', 'fr')
			result.current.handleChange('useMetric', false)
		})

		act(() => {
			result.current.updateConfig({ daysToRetrieve: '7' })
		})

		expect(result.current.input.lang).toBe('fr')
		expect(result.current.input.useMetric).toBe(false)
		expect(result.current.input.daysToRetrieve).toBe('7')
	})

	it('handles edge case coordinates', () => {
		const { result } = renderHook(() => useConfig())

		// Test edge cases that should be valid
		const edgeCases = [
			{ lat: '0', lon: '0' },
			{ lat: '90.0', lon: '180.0' },
			{ lat: '-90.0', lon: '-180.0' },
			{ lat: '45.123456', lon: '123.654321' },
		]

		edgeCases.forEach(({ lat, lon }) => {
			act(() => {
				result.current.handleChange('lat', lat)
				result.current.handleChange('lon', lon)
			})
			expect(result.current.config.lat).toBe(lat)
			expect(result.current.config.lon).toBe(lon)
		})
	})

	it('maintains consistent state between config and input', () => {
		const { result } = renderHook(() => useConfig())

		// Initially should be the same
		expect(result.current.config).toEqual(result.current.input)

		// After valid coordinate change, should sync
		act(() => {
			result.current.handleChange('lat', '40.7128')
			result.current.handleChange('lon', '-74.0060')
		})

		expect(result.current.config.lat).toBe('40.7128')
		expect(result.current.config.lon).toBe('-74.0060')
		expect(result.current.input.lat).toBe('40.7128')
		expect(result.current.input.lon).toBe('-74.0060')
	})
})

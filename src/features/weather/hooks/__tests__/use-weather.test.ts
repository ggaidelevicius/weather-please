import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useWeather } from '../use-weather'

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {}
	return {
		get alerts() {
			return store.alerts || ''
		},
		set alerts(value: string) {
			store.alerts = value
		},
		clear: () => {
			store = {}
		},
		get data() {
			return store.data || ''
		},
		set data(value: string) {
			store.data = value
		},
		getItem: (key: string) => store[key] || null,
		get lastUpdated() {
			return store.lastUpdated || ''
		},
		set lastUpdated(value: string) {
			store.lastUpdated = value
		},
		removeItem: (key: string) => {
			delete store[key]
		},
		setItem: (key: string, value: string) => {
			store[key] = value
		},
	}
})()

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
})

// Mock fetch
const fetchMock = vi.fn()
global.fetch = fetchMock

describe('useWeather - Core Functionality', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		localStorageMock.clear()
		fetchMock.mockImplementation(() => new Promise(() => {}))
	})

	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

	it('initializes with default state', () => {
		const { result } = renderHook(() => useWeather('', '', 0, false))

		expect(result.current.weatherData).toEqual([])
		expect(result.current.alertData).toEqual({
			hoursOfExtremeUv: Array(13).fill(false),
			hoursOfLowVisibility: Array(25).fill(false),
			hoursOfStrongWind: Array(25).fill(false),
			hoursOfStrongWindGusts: Array(25).fill(false),
			totalPrecipitation: {
				duration: Array(25).fill(false),
				precipitation: { flag: false, value: 0, zeroCount: 0 },
			},
		})
		expect(result.current.isLoading).toBe(true)
		expect(result.current.error).toBeNull()
	})

	it('does not fetch when lat/lon are empty', () => {
		renderHook(() => useWeather('', '', 0, false))

		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('is loading when lat/lon are provided but no cached data', () => {
		const { result } = renderHook(() =>
			useWeather('40.7128', '-74.0060', 0, false),
		)

		expect(result.current.isLoading).toBe(true)
	})

	it('uses cached data when available and valid', () => {
		const now = new Date()
		const cachedData = [
			{
				day: now.getTime(),
				description: 1,
				max: 30,
				min: 20,
				rain: 10,
				uv: 9,
				wind: 15,
			},
		]

		const cachedAlerts = {
			hoursOfExtremeUv: Array(13).fill(true),
			hoursOfLowVisibility: Array(25).fill(false),
			hoursOfStrongWind: Array(25).fill(false),
			hoursOfStrongWindGusts: Array(25).fill(false),
			totalPrecipitation: {
				duration: Array(25).fill(true),
				precipitation: { flag: false, value: 5, zeroCount: 0 },
			},
		}

		const lastUpdated = now.toISOString()

		localStorageMock.setItem('data', JSON.stringify(cachedData))
		localStorageMock.setItem('alerts', JSON.stringify(cachedAlerts))
		localStorageMock.setItem('lastUpdated', lastUpdated)
		localStorageMock.setItem('cachedLat', '40.7128')
		localStorageMock.setItem('cachedLon', '-74.0060')
		localStorageMock.setItem('cachedTimeZone', userTimeZone)
		localStorageMock.setItem('cachedUseAirQualityUv', JSON.stringify(false))

		const { result } = renderHook(() =>
			useWeather('40.7128', '-74.0060', 0, false),
		)

		expect(result.current.weatherData).toEqual(cachedData)
		expect(result.current.alertData).toEqual(cachedAlerts)
		expect(result.current.isLoading).toBe(false)
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('accepts legacy lastUpdated format', () => {
		const now = new Date()
		const cachedData = [
			{
				day: now.getTime(),
				description: 1,
				max: 30,
				min: 20,
				rain: 10,
				uv: 9,
				wind: 15,
			},
		]

		const cachedAlerts = {
			hoursOfExtremeUv: Array(13).fill(true),
			hoursOfLowVisibility: Array(25).fill(false),
			hoursOfStrongWind: Array(25).fill(false),
			hoursOfStrongWindGusts: Array(25).fill(false),
			totalPrecipitation: {
				duration: Array(25).fill(true),
				precipitation: { flag: false, value: 5, zeroCount: 0 },
			},
		}

		const lastUpdated = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`

		localStorageMock.setItem('data', JSON.stringify(cachedData))
		localStorageMock.setItem('alerts', JSON.stringify(cachedAlerts))
		localStorageMock.setItem('lastUpdated', lastUpdated)
		localStorageMock.setItem('cachedLat', '40.7128')
		localStorageMock.setItem('cachedLon', '-74.0060')
		localStorageMock.setItem('cachedTimeZone', userTimeZone)
		localStorageMock.setItem('cachedUseAirQualityUv', JSON.stringify(false))

		const { result } = renderHook(() =>
			useWeather('40.7128', '-74.0060', 0, false),
		)

		expect(result.current.weatherData).toEqual(cachedData)
		expect(result.current.alertData).toEqual(cachedAlerts)
		expect(result.current.isLoading).toBe(false)
	})

	it('ignores invalid cached data', () => {
		localStorageMock.setItem('data', 'invalid json')
		localStorageMock.setItem('alerts', 'invalid json')
		localStorageMock.setItem('lastUpdated', 'invalid date')
		localStorageMock.setItem('cachedLat', '40.7128')
		localStorageMock.setItem('cachedLon', '-74.0060')

		const { result } = renderHook(() =>
			useWeather('40.7128', '-74.0060', 0, false),
		)

		expect(result.current.weatherData).toEqual([])
		expect(result.current.isLoading).toBe(true)
	})

	it('forces refetch when location changes', () => {
		const { result } = renderHook(() =>
			useWeather('40.7128', '-74.0060', 1, false),
		)

		expect(result.current.isLoading).toBe(true)
		// Even with potentially valid cached data, location change should force refetch
	})

	it('returns proper loading state based on parameters', () => {
		const scenarios = [
			{ expected: true, lat: '', lon: '' },
			{ expected: true, lat: '40.7128', lon: '' },
			{ expected: true, lat: '', lon: '-74.0060' },
			{ expected: true, lat: '40.7128', lon: '-74.0060' }, // true because no cached data
		]

		scenarios.forEach(({ expected, lat, lon }) => {
			const { result } = renderHook(() => useWeather(lat, lon, 0, false))
			expect(result.current.isLoading).toBe(expected)
		})
	})
})

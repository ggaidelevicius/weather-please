import { renderHook, waitFor } from '@testing-library/react'
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
		expect(result.current.next24HoursData).toEqual([])
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
		const cachedNext24HoursData = [
			{
				apparentTemperature: 21,
				dewPoint: 12,
				humidity: 55,
				precipitation: 0,
				precipitationProbability: 10,
				shortwaveRadiation: 120,
				temperature: 22,
				time: Math.floor(now.getTime() / 1000),
				uv: 4,
				visibility: 10_000,
				weatherCode: 1,
				wind: 15,
				windGust: 20,
			},
		]
		const cachedWeatherMapData = {
			center: { lat: 40.7128, lon: -74.006 },
			frames: [
				{
					points: [
						{
							lat: 40.7128,
							lon: -74.006,
							precipitation: 0,
							precipitationProbability: 10,
							windDirection: 180,
							windSpeed: 15,
						},
					],
					time: Math.floor(now.getTime() / 1000),
				},
			],
		}

		const lastUpdated = now.toISOString()

		localStorageMock.setItem('data', JSON.stringify(cachedData))
		localStorageMock.setItem(
			'next24HoursData',
			JSON.stringify(cachedNext24HoursData),
		)
		localStorageMock.setItem('alerts', JSON.stringify(cachedAlerts))
		localStorageMock.setItem(
			'weatherMapData',
			JSON.stringify(cachedWeatherMapData),
		)
		localStorageMock.setItem('lastUpdated', lastUpdated)
		localStorageMock.setItem('cachedLat', '40.7128')
		localStorageMock.setItem('cachedLon', '-74.0060')
		localStorageMock.setItem('cachedTimeZone', userTimeZone)
		localStorageMock.setItem('cachedUseAirQualityUv', JSON.stringify(false))

		const { result } = renderHook(() =>
			useWeather('40.7128', '-74.0060', 0, false),
		)

		expect(result.current.weatherData).toEqual(cachedData)
		expect(result.current.next24HoursData).toEqual(cachedNext24HoursData)
		expect(result.current.alertData).toEqual(cachedAlerts)
		expect(result.current.weatherMapData).toEqual(cachedWeatherMapData)
		expect(result.current.isLoading).toBe(false)
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('fetches missing weather map data when weather cache is fresh', async () => {
		const now = new Date()
		const timestamp = Math.floor(now.getTime() / 1000)
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
		const cachedNext24HoursData = [
			{
				apparentTemperature: 21,
				dewPoint: 12,
				humidity: 55,
				precipitation: 0,
				precipitationProbability: 10,
				shortwaveRadiation: 120,
				temperature: 22,
				time: timestamp,
				uv: 4,
				visibility: 10_000,
				weatherCode: 1,
				wind: 15,
				windGust: 20,
			},
		]

		fetchMock.mockResolvedValue({
			json: async () => ({
				hourly: {
					precipitation: [0.2],
					precipitation_probability: [40],
					time: [timestamp],
					winddirection_10m: [90],
					windspeed_10m: [12],
				},
				latitude: 40.7128,
				longitude: -74.006,
			}),
			ok: true,
		})

		localStorageMock.setItem('data', JSON.stringify(cachedData))
		localStorageMock.setItem(
			'next24HoursData',
			JSON.stringify(cachedNext24HoursData),
		)
		localStorageMock.setItem('alerts', JSON.stringify(cachedAlerts))
		localStorageMock.setItem('lastUpdated', now.toISOString())
		localStorageMock.setItem('cachedLat', '40.7128')
		localStorageMock.setItem('cachedLon', '-74.0060')
		localStorageMock.setItem('cachedTimeZone', userTimeZone)
		localStorageMock.setItem('cachedUseAirQualityUv', JSON.stringify(false))

		const { result } = renderHook(() =>
			useWeather('40.7128', '-74.0060', 0, false),
		)

		expect(result.current.weatherData).toEqual(cachedData)
		expect(result.current.weatherMapData).toBeNull()

		await waitFor(() => {
			expect(result.current.weatherMapData).toEqual({
				center: { lat: 40.7128, lon: -74.006 },
				frames: [
					{
						points: [
							{
								lat: 40.7128,
								lon: -74.006,
								precipitation: 0.2,
								precipitationProbability: 40,
								windDirection: 90,
								windSpeed: 12,
							},
						],
						time: timestamp,
					},
				],
			})
		})
		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(localStorageMock.getItem('weatherMapData')).not.toBeNull()
	})

	it('shows weather data before fresh map data finishes loading', async () => {
		fetchMock
			.mockResolvedValueOnce({
				json: async () => createWeatherResponse(),
				ok: true,
			})
			.mockImplementationOnce(() => new Promise(() => {}))

		const { result } = renderHook(() =>
			useWeather('40.7128', '-74.0060', 0, false),
		)

		await waitFor(() => {
			expect(result.current.weatherData).toHaveLength(1)
		})

		expect(result.current.isLoading).toBe(false)
		expect(result.current.weatherMapData).toBeNull()
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})

	it('shows reduced stale cached data when weather refresh fails', async () => {
		const now = new Date()
		const nowSeconds = Math.floor(now.getTime() / 1000)
		const staleUpdatedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000)
		const cachedData = [
			{
				day: nowSeconds,
				description: 1,
				max: 30,
				min: 20,
				rain: 10,
				uv: 9,
				wind: 15,
			},
		]
		const cachedAlerts = {
			hoursOfExtremeUv: Array(13).fill(false),
			hoursOfLowVisibility: Array(25).fill(false),
			hoursOfStrongWind: Array(25).fill(false),
			hoursOfStrongWindGusts: Array(25).fill(false),
			totalPrecipitation: {
				duration: Array(25).fill(false),
				precipitation: { flag: false, value: 0, zeroCount: 0 },
			},
		}
		const cachedNext24HoursData = [
			{
				apparentTemperature: 21,
				dewPoint: 12,
				humidity: 55,
				precipitation: 0,
				precipitationProbability: 10,
				shortwaveRadiation: 120,
				temperature: 22,
				time: nowSeconds - 60 * 60,
				uv: 4,
				visibility: 10_000,
				weatherCode: 1,
				wind: 15,
				windGust: 20,
			},
			{
				apparentTemperature: 22,
				dewPoint: 13,
				humidity: 60,
				precipitation: 0,
				precipitationProbability: 10,
				shortwaveRadiation: 140,
				temperature: 23,
				time: nowSeconds + 60 * 60,
				uv: 4,
				visibility: 10_000,
				weatherCode: 1,
				wind: 70,
				windGust: 85,
			},
		]
		const cachedWeatherMapData = {
			center: { lat: 40.7128, lon: -74.006 },
			frames: [
				{
					points: [],
					time: nowSeconds - 60 * 60,
				},
				{
					points: [],
					time: nowSeconds + 60 * 60,
				},
			],
		}

		fetchMock.mockRejectedValue(new Error('Weather fetch failed: 503'))

		localStorageMock.setItem('data', JSON.stringify(cachedData))
		localStorageMock.setItem(
			'next24HoursData',
			JSON.stringify(cachedNext24HoursData),
		)
		localStorageMock.setItem('alerts', JSON.stringify(cachedAlerts))
		localStorageMock.setItem(
			'weatherMapData',
			JSON.stringify(cachedWeatherMapData),
		)
		localStorageMock.setItem('lastUpdated', staleUpdatedAt.toISOString())
		localStorageMock.setItem('cachedLat', '40.7128')
		localStorageMock.setItem('cachedLon', '-74.0060')
		localStorageMock.setItem('cachedTimeZone', userTimeZone)
		localStorageMock.setItem('cachedUseAirQualityUv', JSON.stringify(false))

		const { result } = renderHook(() =>
			useWeather('40.7128', '-74.0060', 0, false),
		)

		await waitFor(() => {
			expect(result.current.degradedForecast).not.toBeNull()
		})

		expect(result.current.error).toBeNull()
		expect(result.current.isLoading).toBe(false)
		expect(result.current.weatherData).toEqual(cachedData)
		expect(result.current.next24HoursData).toEqual([cachedNext24HoursData[1]])
		expect(result.current.weatherMapData?.frames).toEqual([
			cachedWeatherMapData.frames[1],
		])
		expect(result.current.alertData.hoursOfStrongWind[0]).toBe(true)
		expect(result.current.alertData.hoursOfStrongWindGusts[0]).toBe(true)
	})

	it('refreshes cached data when next 24 hours data is missing', async () => {
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

		localStorageMock.setItem('data', JSON.stringify(cachedData))
		localStorageMock.setItem('alerts', JSON.stringify(cachedAlerts))
		localStorageMock.setItem('lastUpdated', now.toISOString())
		localStorageMock.setItem('cachedLat', '40.7128')
		localStorageMock.setItem('cachedLon', '-74.0060')
		localStorageMock.setItem('cachedTimeZone', userTimeZone)
		localStorageMock.setItem('cachedUseAirQualityUv', JSON.stringify(false))

		renderHook(() => useWeather('40.7128', '-74.0060', 0, false))

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalled()
		})
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

const createWeatherResponse = () => ({
	daily: {
		precipitation_probability_max: [10],
		temperature_2m_max: [30],
		temperature_2m_min: [20],
		time: [0],
		uv_index_max: [8],
		weathercode: [1],
		windspeed_10m_max: [15],
	},
	hourly: {
		apparent_temperature: Array.from({ length: 60 }, (_, index) => index + 10),
		dew_point_2m: Array.from({ length: 60 }, () => 12),
		precipitation: Array.from({ length: 60 }, () => 0),
		precipitation_probability: Array.from({ length: 60 }, () => 0),
		relative_humidity_2m: Array.from({ length: 60 }, () => 55),
		shortwave_radiation_instant: Array.from({ length: 60 }, () => 120),
		temperature_2m: Array.from({ length: 60 }, (_, index) => index + 20),
		time: Array.from({ length: 60 }, (_, index) => index),
		uv_index: Array.from({ length: 60 }, (_, index) => index % 8),
		visibility: Array.from({ length: 60 }, () => 10_000),
		weathercode: Array.from({ length: 60 }, () => 1),
		windgusts_10m: Array.from({ length: 60 }, () => 20),
		windspeed_10m: Array.from({ length: 60 }, () => 10),
	},
})

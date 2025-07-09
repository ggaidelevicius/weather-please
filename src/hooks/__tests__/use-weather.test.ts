import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { ReactNode, createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWeather } from '../use-weather'

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
		get data() {
			return store.data || ''
		},
		set data(value: string) {
			store.data = value
		},
		get alerts() {
			return store.alerts || ''
		},
		set alerts(value: string) {
			store.alerts = value
		},
		get lastUpdated() {
			return store.lastUpdated || ''
		},
		set lastUpdated(value: string) {
			store.lastUpdated = value
		},
	}
})()

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
})

// Mock fetch
global.fetch = vi.fn()

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				staleTime: 0,
				gcTime: 0,
			},
		},
	})
	const TestWrapper = ({ children }: { children: ReactNode }) =>
		createElement(QueryClientProvider, { client: queryClient }, children)
	TestWrapper.displayName = 'TestWrapper'
	return TestWrapper
}

describe('useWeather - Core Functionality', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		localStorageMock.clear()
	})

	it('initializes with default state', () => {
		const { result } = renderHook(() => useWeather('', '', false), {
			wrapper: createWrapper(),
		})

		expect(result.current.weatherData).toEqual([])
		expect(result.current.alertData).toEqual({
			totalPrecipitation: {
				precipitation: { value: 0, flag: false, zeroCount: 0 },
				duration: Array(25).fill(false),
			},
			hoursOfExtremeUv: Array(13).fill(false),
			hoursOfStrongWind: Array(25).fill(false),
			hoursOfLowVisibility: Array(25).fill(false),
			hoursOfStrongWindGusts: Array(25).fill(false),
		})
		expect(result.current.isLoading).toBe(true)
		expect(result.current.error).toBeNull()
	})

	it('does not fetch when lat/lon are empty', () => {
		renderHook(() => useWeather('', '', false), {
			wrapper: createWrapper(),
		})

		expect(fetch).not.toHaveBeenCalled()
	})

	it('is loading when lat/lon are provided but no cached data', () => {
		const { result } = renderHook(
			() => useWeather('40.7128', '-74.0060', false),
			{
				wrapper: createWrapper(),
			},
		)

		expect(result.current.isLoading).toBe(true)
	})

	it('uses cached data when available and valid', () => {
		const now = new Date()
		const cachedData = [
			{
				day: now.getTime(),
				max: 30,
				min: 20,
				description: 1,
				uv: 9,
				wind: 15,
				rain: 10,
			},
		]

		const cachedAlerts = {
			totalPrecipitation: {
				precipitation: { value: 5, flag: false, zeroCount: 0 },
				duration: Array(25).fill(true),
			},
			hoursOfExtremeUv: Array(13).fill(true),
			hoursOfStrongWind: Array(25).fill(false),
			hoursOfLowVisibility: Array(25).fill(false),
			hoursOfStrongWindGusts: Array(25).fill(false),
		}

		const lastUpdated = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`

		localStorageMock.data = JSON.stringify(cachedData)
		localStorageMock.alerts = JSON.stringify(cachedAlerts)
		localStorageMock.lastUpdated = lastUpdated

		const { result } = renderHook(
			() => useWeather('40.7128', '-74.0060', false),
			{
				wrapper: createWrapper(),
			},
		)

		expect(result.current.weatherData).toEqual(cachedData)
		expect(result.current.alertData).toEqual(cachedAlerts)
		expect(result.current.isLoading).toBe(false)
		expect(fetch).not.toHaveBeenCalled()
	})

	it('ignores invalid cached data', () => {
		localStorageMock.data = 'invalid json'
		localStorageMock.alerts = 'invalid json'
		localStorageMock.lastUpdated = 'invalid date'

		const { result } = renderHook(
			() => useWeather('40.7128', '-74.0060', false),
			{
				wrapper: createWrapper(),
			},
		)

		expect(result.current.weatherData).toEqual([])
		expect(result.current.isLoading).toBe(true)
	})

	it('forces refetch when location changes', () => {
		const { result } = renderHook(
			() => useWeather('40.7128', '-74.0060', true),
			{
				wrapper: createWrapper(),
			},
		)

		expect(result.current.isLoading).toBe(true)
		// Even with potentially valid cached data, location change should force refetch
	})

	it('returns proper loading state based on parameters', () => {
		const scenarios = [
			{ lat: '', lon: '', expected: true },
			{ lat: '40.7128', lon: '', expected: true },
			{ lat: '', lon: '-74.0060', expected: true },
			{ lat: '40.7128', lon: '-74.0060', expected: true }, // true because no cached data
		]

		scenarios.forEach(({ lat, lon, expected }) => {
			const { result } = renderHook(() => useWeather(lat, lon, false), {
				wrapper: createWrapper(),
			})
			expect(result.current.isLoading).toBe(expected)
		})
	})
})

import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	getCurrentInstant,
	getCurrentTimestamp,
	getSystemTimeZone,
} from '../../../../shared/lib/time'
import { getUserTimeZone } from '../../api/weather-api'
import { createEmptyAlerts } from '../../model/alerts'
import {
	writeCachedWeather,
	writeCachedWeatherDegraded,
} from '../../model/cache'
import { next24HoursDataSchema } from '../../model/types'
import {
	isWeatherCacheFresh,
	readSharedWeatherCache,
	requestSharedWeather,
} from '../../services/shared-weather'
import { createWeatherResponse } from '../../testing/weather-response'
import { useWeather } from '../use-weather'

const getTimestamp = (dateTime: string) =>
	Temporal.PlainDateTime.from(dateTime).toZonedDateTime(getSystemTimeZone())
		.epochMilliseconds

let nextIdentity = 0
const createIdentity = () => ({
	lat: `40.${++nextIdentity}`,
	lon: '-74',
	shouldUseAirQualityUv: false,
	timeZone: getUserTimeZone(),
})
const mapResponse = {
	hourly: {
		precipitation: [0],
		precipitation_probability: [10],
		time: [0],
		winddirection_10m: [90],
		windspeed_10m: [12],
	},
	latitude: 40,
	longitude: -74,
}
const nextHour = () =>
	next24HoursDataSchema.parse([
		{
			apparentTemperature: 20,
			precipitation: 0,
			precipitationProbability: 0,
			temperature: 20,
			time: Math.floor(getCurrentTimestamp() / 1000) + 3600,
			uv: 1,
			visibility: 10_000,
			weatherCode: 1,
			wind: 5,
			windGust: 7,
		},
	])
const seedWeather = (identity: ReturnType<typeof createIdentity>) =>
	writeCachedWeather({
		...identity,
		alertData: createEmptyAlerts(),
		lastUpdatedDate: getCurrentInstant(),
		next24HoursData: nextHour(),
		weatherData: [
			{
				day: Math.floor(getCurrentTimestamp() / 1000),
				description: 1,
				max: 20,
				min: 10,
				rain: 0,
				uv: 1,
				wind: 5,
			},
		],
		weatherMapData: { center: { lat: 40, lon: -74 }, frames: [] },
	})
const mockForecasts = () =>
	vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
		const url = String(input)
		if (url.includes('air-quality')) {
			return Response.json({ hourly: { time: [], uv_index: [] } })
		}
		if (url.includes('forecast_hours')) return Response.json(mapResponse)
		return Response.json(createWeatherResponse())
	})

beforeEach(() => localStorage.clear())
afterEach(() => {
	cleanup()
	vi.useRealTimers()
	vi.restoreAllMocks()
})

describe('shared weather fetching', () => {
	it.each([
		['lastUpdatedAt', 0.5],
		['lastUpdatedAt', 8_640_000_000_000_001],
		['day', 0.5],
		['day', 8_640_000_000_001],
		['time', 0.5],
		['time', 8_640_000_000_001],
	] as const)(
		'recovers from invalid shared %s timestamp %s',
		async (field, timestamp) => {
			const identity = createIdentity()
			const cacheKey = `weather-please:shared-resource:v1:weather:${JSON.stringify(
				[
					identity.lat,
					identity.lon,
					identity.timeZone,
					identity.shouldUseAirQualityUv,
				],
			)}`
			localStorage.setItem(
				cacheKey,
				JSON.stringify({
					data: {
						alertData: createEmptyAlerts(),
						lastUpdatedAt:
							field === 'lastUpdatedAt' ? timestamp : getCurrentTimestamp(),
						next24HoursData: nextHour().map((hour) => ({
							...hour,
							time: field === 'time' ? timestamp : hour.time,
						})),
						weatherData: [
							{
								day:
									field === 'day'
										? timestamp
										: Math.floor(getCurrentTimestamp() / 1000),
								description: 1,
								max: 20,
								min: 10,
								rain: 0,
								uv: 1,
								wind: 5,
							},
						],
					},
					hasValue: true,
					id: 'corrupt-weather',
					revision: '',
					updatedAt: getCurrentTimestamp(),
					version: 1,
				}),
			)
			expect(() => readSharedWeatherCache(identity)).not.toThrow()
			expect(readSharedWeatherCache(identity)).toBeNull()
			mockForecasts()
			const { result } = renderHook(() =>
				useWeather(identity.lat, identity.lon, 0, false),
			)
			await waitFor(() => expect(result.current.weatherData[0]?.max).toBe(30))
			expect(result.current.error).toBeNull()
			expect(readSharedWeatherCache(identity)?.lastUpdatedDate).toBeInstanceOf(
				Temporal.Instant,
			)
			expect(localStorage.getItem(cacheKey)).not.toContain('corrupt-weather')
		},
	)

	it('shares forecast, air quality, and map requests between consumers', async () => {
		const identity = createIdentity()
		const fetchSpy = mockForecasts()
		const first = renderHook(() =>
			useWeather(identity.lat, identity.lon, 0, false),
		)
		const second = renderHook(() =>
			useWeather(identity.lat, identity.lon, 0, false),
		)

		await waitFor(() => {
			expect(first.result.current.weatherMapData).not.toBeNull()
			expect(second.result.current.weatherMapData).not.toBeNull()
		})
		expect(fetchSpy).toHaveBeenCalledTimes(3)
		expect(first.result.current.weatherData).toEqual(
			second.result.current.weatherData,
		)
		expect(first.result.current.next24HoursData).toEqual(
			second.result.current.next24HoursData,
		)
	})

	it('updates a tab that is displaying cached weather when another consumer refreshes', async () => {
		const identity = createIdentity()
		seedWeather(identity)
		const fetchSpy = mockForecasts()
		const { result } = renderHook(() =>
			useWeather(identity.lat, identity.lon, 0, false),
		)
		expect(result.current.weatherData[0]?.max).toBe(20)
		expect(fetchSpy).not.toHaveBeenCalled()

		await act(async () => {
			await requestSharedWeather({ ...identity, force: true })
		})

		await waitFor(() => expect(result.current.weatherData[0]?.max).toBe(30))
		expect(result.current.error).toBeNull()
	})

	it('joins simultaneous manual refreshes', async () => {
		const identity = createIdentity()
		seedWeather(identity)
		const fetchSpy = mockForecasts()
		const first = renderHook(() =>
			useWeather(identity.lat, identity.lon, 0, false),
		)
		const second = renderHook(() =>
			useWeather(identity.lat, identity.lon, 0, false),
		)

		act(() => {
			first.result.current.retry()
			second.result.current.retry()
		})

		await waitFor(() => {
			expect(first.result.current.weatherData[0]?.max).toBe(30)
			expect(second.result.current.weatherData[0]?.max).toBe(30)
			expect(first.result.current.weatherMapData?.frames).toHaveLength(1)
			expect(second.result.current.weatherMapData?.frames).toHaveLength(1)
		})
		expect(fetchSpy).toHaveBeenCalledTimes(3)
	})

	it('does not apply another location’s forecast', async () => {
		const firstIdentity = createIdentity()
		const otherIdentity = createIdentity()
		seedWeather(firstIdentity)
		mockForecasts()
		const { result } = renderHook(() =>
			useWeather(firstIdentity.lat, firstIdentity.lon, 0, false),
		)

		await act(async () => {
			await requestSharedWeather({ ...otherIdentity, force: true })
		})

		expect(result.current.weatherData[0]?.max).toBe(20)
	})

	it('hands an interrupted fetch to another consumer and ignores the former owner’s late result', async () => {
		const identity = createIdentity()
		let completeFirst: ((response: Response) => void) | undefined
		let forecastRequests = 0
		vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
			const url = String(input)
			if (url.includes('air-quality')) {
				return Response.json({ hourly: { time: [], uv_index: [] } })
			}
			if (url.includes('forecast_hours')) return Response.json(mapResponse)
			forecastRequests += 1
			if (forecastRequests === 1) {
				return new Promise<Response>((resolve) => {
					completeFirst = resolve
				})
			}
			return Response.json(createWeatherResponse())
		})
		const first = renderHook(() =>
			useWeather(identity.lat, identity.lon, 0, false),
		)
		const second = renderHook(() =>
			useWeather(identity.lat, identity.lon, 0, false),
		)
		await waitFor(() => expect(forecastRequests).toBe(1))

		first.unmount()
		await waitFor(() =>
			expect(second.result.current.weatherData[0]?.max).toBe(30),
		)
		expect(forecastRequests).toBe(2)

		await act(async () => {
			const staleResponse = createWeatherResponse()
			staleResponse.daily.temperature_2m_max = [99]
			completeFirst?.(Response.json(staleResponse))
		})
		expect(second.result.current.weatherData[0]?.max).toBe(30)
		expect(readSharedWeatherCache(identity)?.weatherData[0]?.max).toBe(30)
	})

	it('keeps UV preferences and time zones in the forecast identity', async () => {
		const identity = createIdentity()
		const fetchSpy = mockForecasts()
		const baseline = await requestSharedWeather(identity)
		await requestSharedWeather({ ...identity, shouldUseAirQualityUv: true })
		await requestSharedWeather({ ...identity, timeZone: 'Pacific/Auckland' })
		const cached = await requestSharedWeather(identity)

		expect(fetchSpy).toHaveBeenCalledTimes(6)
		expect(cached).toEqual(baseline)
	})

	it.each(['routine', 'manual'] as const)(
		'shares degraded-weather failures and coalesces the next %s recovery',
		async (recovery) => {
			vi.useFakeTimers()
			vi.setSystemTime(getTimestamp('2026-09-27T10:30'))
			const identity = createIdentity()
			let shouldFail = false
			const fetchSpy = vi
				.spyOn(globalThis, 'fetch')
				.mockImplementation(async (input) => {
					if (String(input).includes('air-quality')) {
						return Response.json({ hourly: { time: [], uv_index: [] } })
					}
					return shouldFail
						? new Response(null, { status: 503 })
						: Response.json(createWeatherResponse())
				})
			await requestSharedWeather(identity)
			writeCachedWeatherDegraded(identity)
			shouldFail = true
			await expect(requestSharedWeather(identity)).rejects.toThrow('503')
			expect(fetchSpy).toHaveBeenCalledTimes(4)

			const failedFollowers = await Promise.allSettled([
				requestSharedWeather(identity),
				requestSharedWeather(identity),
			])
			expect(failedFollowers.map(({ status }) => status)).toEqual([
				'rejected',
				'rejected',
			])
			expect(fetchSpy).toHaveBeenCalledTimes(4)

			shouldFail = false
			if (recovery === 'routine') await vi.advanceTimersByTimeAsync(5001)
			const recovered = await Promise.all([
				requestSharedWeather({ ...identity, force: recovery === 'manual' }),
				requestSharedWeather({ ...identity, force: recovery === 'manual' }),
			])
			expect(fetchSpy).toHaveBeenCalledTimes(6)
			expect(recovered[0]).toEqual(recovered[1])
			expect(readSharedWeatherCache(identity)?.isDegraded).toBe(false)
		},
	)

	it('refreshes after the hour’s grace minute and after resuming on a later day', () => {
		vi.useFakeTimers()
		const updated = getTimestamp('2026-09-27T10:45')
		vi.setSystemTime(updated)
		const identity = createIdentity()
		seedWeather(identity)
		const cached = readSharedWeatherCache(identity)
		expect(cached).not.toBeNull()
		if (!cached) throw new Error('Expected seeded weather')

		expect(
			isWeatherCacheFresh({
				cached,
				now: getTimestamp('2026-09-27T11:00'),
			}),
		).toBe(true)
		expect(
			isWeatherCacheFresh({
				cached,
				now: getTimestamp('2026-09-27T11:01'),
			}),
		).toBe(false)
		expect(
			isWeatherCacheFresh({
				cached,
				now: getTimestamp('2026-09-28T10:45'),
			}),
		).toBe(false)
	})

	it.each([
		{
			cachedAt: '2026-03-08T01:45:00-05:00',
			graceAt: '2026-03-08T03:00:30-04:00',
			name: 'spring-forward gap',
			refreshAt: '2026-03-08T03:01:00-04:00',
		},
		{
			cachedAt: '2026-11-01T01:45:00-04:00',
			graceAt: '2026-11-01T01:00:30-05:00',
			name: 'repeated fall-back hour',
			refreshAt: '2026-11-01T01:01:00-05:00',
		},
	])(
		'respects the refresh grace minute across a $name',
		({ cachedAt, graceAt, refreshAt }) => {
			vi.spyOn(Temporal.Now, 'timeZoneId').mockReturnValue('America/New_York')
			vi.useFakeTimers()
			vi.setSystemTime(Temporal.Instant.from(cachedAt).epochMilliseconds)
			const identity = createIdentity()
			seedWeather(identity)
			const cached = readSharedWeatherCache(identity)
			if (!cached) throw new Error('Expected seeded weather')
			expect(
				isWeatherCacheFresh({
					cached,
					now: Temporal.Instant.from(graceAt).epochMilliseconds,
				}),
			).toBe(true)
			expect(
				isWeatherCacheFresh({
					cached,
					now: Temporal.Instant.from(refreshAt).epochMilliseconds,
				}),
			).toBe(false)
		},
	)

	it('pauses routine refreshes while hidden and refreshes on return', async () => {
		vi.useFakeTimers()
		vi.setSystemTime(getTimestamp('2026-09-27T10:30'))
		const identity = createIdentity()
		seedWeather(identity)
		const fetchSpy = mockForecasts()
		const visibility = vi.spyOn(document, 'visibilityState', 'get')
		visibility.mockReturnValue('hidden')
		const { result } = renderHook(() =>
			useWeather(identity.lat, identity.lon, 0, false),
		)

		await act(async () => {
			await vi.advanceTimersByTimeAsync(32 * 60 * 1000)
		})
		expect(fetchSpy).not.toHaveBeenCalled()
		vi.useRealTimers()
		visibility.mockReturnValue('visible')
		act(() => document.dispatchEvent(new Event('visibilitychange')))

		await waitFor(() => expect(result.current.weatherData[0]?.max).toBe(30))
	})
})

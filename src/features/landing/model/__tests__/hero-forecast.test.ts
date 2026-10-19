import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { WeatherResponse } from '../../../weather/api/weather-api'

import {
	fetchWeatherResponse,
	mapWeatherResponseToForecastData,
} from '../../../weather/api/weather-api'
import { getHeroForecast, HERO_FORECAST_LOCATION } from '../hero-forecast'

vi.mock('../../../weather/api/weather-api', () => ({
	fetchWeatherResponse: vi.fn(),
	mapWeatherResponseToForecastData: vi.fn(),
}))

const perthMidnight = (date: string) =>
	Temporal.PlainDate.from(date).toZonedDateTime({
		timeZone: 'Australia/Perth',
	}).epochMilliseconds / 1000

const middayUtc = (date: string) =>
	Temporal.PlainDate.from(date).toZonedDateTime({
		plainTime: '12:00',
		timeZone: 'UTC',
	}).epochMilliseconds / 1000

const forecastDay = (date: string) => ({
	day: perthMidnight(date),
	description: 3,
	max: 20,
	min: 10,
	rain: 30,
	uv: 5,
	wind: 15,
})

beforeEach(() => {
	vi.useFakeTimers()
	vi.setSystemTime(new Date('2026-10-19T01:00:00Z'))
	vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
	vi.useRealTimers()
	vi.restoreAllMocks()
})

describe('getHeroForecast', () => {
	it('returns the first three Perth days, dated at midday UTC, for an hour', async () => {
		vi.mocked(fetchWeatherResponse).mockResolvedValue({} as WeatherResponse)
		vi.mocked(mapWeatherResponseToForecastData).mockReturnValue([
			forecastDay('2026-10-19'),
			forecastDay('2026-10-20'),
			forecastDay('2026-10-21'),
			forecastDay('2026-10-22'),
		])

		const { forecast, revalidateSeconds } = await getHeroForecast()

		expect(fetchWeatherResponse).toHaveBeenCalledWith(
			expect.objectContaining({
				...HERO_FORECAST_LOCATION,
				shouldUseAirQualityUv: false,
			}),
		)
		expect(forecast.map(({ day }) => day)).toEqual([
			middayUtc('2026-10-19'),
			middayUtc('2026-10-20'),
			middayUtc('2026-10-21'),
		])
		expect(forecast[0]).toMatchObject({ max: 20, min: 10, rain: 30 })
		expect(revalidateSeconds).toBe(60 * 60)
	})

	it('falls back to a sample forecast starting today in Perth, retrying sooner', async () => {
		vi.mocked(fetchWeatherResponse).mockRejectedValue(new Error('offline'))

		const { forecast, revalidateSeconds } = await getHeroForecast()

		expect(forecast.map(({ day }) => day)).toEqual([
			middayUtc('2026-10-19'),
			middayUtc('2026-10-20'),
			middayUtc('2026-10-21'),
		])
		expect(console.error).toHaveBeenCalled()
		expect(revalidateSeconds).toBe(5 * 60)
	})

	it('falls back when the forecast has fewer than three days', async () => {
		vi.mocked(fetchWeatherResponse).mockResolvedValue({} as WeatherResponse)
		vi.mocked(mapWeatherResponseToForecastData).mockReturnValue([
			forecastDay('2026-10-19'),
		])

		const { forecast, revalidateSeconds } = await getHeroForecast()

		expect(forecast).toHaveLength(3)
		expect(forecast[0].max).toBe(24)
		expect(revalidateSeconds).toBe(5 * 60)
	})
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { WeatherResponse } from '../../../weather/api/weather-api'
import type { Next24HoursData } from '../../../weather/model/types'

import {
	fetchWeatherResponse,
	mapWeatherResponseToForecastData,
	mapWeatherResponseToNext24HoursData,
} from '../../../weather/api/weather-api'
import { getHeroForecast, HERO_FORECAST_LOCATION } from '../hero-forecast'

vi.mock('../../../weather/api/weather-api', () => ({
	fetchWeatherResponse: vi.fn(),
	mapWeatherResponseToForecastData: vi.fn(),
	mapWeatherResponseToNext24HoursData: vi.fn(),
}))

// 9 AM on Monday 19 October in Perth.
const NOW = '2026-10-19T01:00:00Z'
const NOW_SECONDS = Date.parse(NOW) / 1000

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

const nextHours = (count: number) =>
	Array.from({ length: count }, (_, index) => ({
		apparentTemperature: 18 + index / 10,
		temperature: 20 + index / 10,
		time: NOW_SECONDS + index * 3600,
	})) as Next24HoursData

const mockLiveForecast = ({ hourCount }: { hourCount: number }) => {
	vi.mocked(fetchWeatherResponse).mockResolvedValue({} as WeatherResponse)
	vi.mocked(mapWeatherResponseToForecastData).mockReturnValue([
		forecastDay('2026-10-19'),
		forecastDay('2026-10-20'),
		forecastDay('2026-10-21'),
		forecastDay('2026-10-22'),
	])
	vi.mocked(mapWeatherResponseToNext24HoursData).mockReturnValue(
		nextHours(hourCount),
	)
}

beforeEach(() => {
	vi.useFakeTimers()
	vi.setSystemTime(new Date(NOW))
	vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
	vi.useRealTimers()
	vi.restoreAllMocks()
})

describe('getHeroForecast', () => {
	it('returns the first three Perth days, dated at midday UTC, for an hour', async () => {
		mockLiveForecast({ hourCount: 24 })

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

	it('takes the next 24 hours from the current Perth hour, labelled in Perth time', async () => {
		mockLiveForecast({ hourCount: 24 })

		const { hourly } = await getHeroForecast()

		expect(mapWeatherResponseToNext24HoursData).toHaveBeenCalledWith(
			expect.objectContaining({ currentHour: 9 }),
		)
		expect(hourly.temperatures).toHaveLength(24)
		expect(hourly.temperatures[0]).toBe(20)
		expect(hourly.apparentTemperatures[0]).toBe(18)
		expect(hourly.times[0]).toBe(NOW_SECONDS)
		expect(hourly.labels).toEqual({
			end: '8 AM',
			middle: '9 PM',
			start: '9 AM',
		})
	})

	it('falls back to a sample forecast starting now in Perth, retrying sooner', async () => {
		vi.mocked(fetchWeatherResponse).mockRejectedValue(new Error('offline'))

		const { forecast, hourly, revalidateSeconds } = await getHeroForecast()

		expect(forecast.map(({ day }) => day)).toEqual([
			middayUtc('2026-10-19'),
			middayUtc('2026-10-20'),
			middayUtc('2026-10-21'),
		])
		expect(hourly.times[0]).toBe(NOW_SECONDS)
		expect(hourly.labels.start).toBe('9 AM')
		expect(console.error).toHaveBeenCalled()
		expect(revalidateSeconds).toBe(5 * 60)
	})

	it('falls back when the daily forecast has fewer than three days', async () => {
		mockLiveForecast({ hourCount: 24 })
		vi.mocked(mapWeatherResponseToForecastData).mockReturnValue([
			forecastDay('2026-10-19'),
		])

		const { forecast, revalidateSeconds } = await getHeroForecast()

		expect(forecast).toHaveLength(3)
		expect(forecast[0].max).toBe(24)
		expect(revalidateSeconds).toBe(5 * 60)
	})

	it('falls back when there are too few hours to chart', async () => {
		mockLiveForecast({ hourCount: 2 })

		const { hourly, revalidateSeconds } = await getHeroForecast()

		expect(hourly.temperatures).toHaveLength(24)
		expect(revalidateSeconds).toBe(5 * 60)
	})
})

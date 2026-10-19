import { cacheLife } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { WeatherResponse } from '../../../weather/api/weather-api'

import {
	fetchWeatherResponse,
	mapWeatherResponseToForecastData,
	mapWeatherResponseToNext24HoursData,
} from '../../../weather/api/weather-api'
import { getCachedHeroForecast } from '../cached-hero-forecast'

vi.mock('next/cache', () => ({ cacheLife: vi.fn() }))

vi.mock('../../../weather/api/weather-api', () => ({
	fetchWeatherResponse: vi.fn(),
	mapWeatherResponseToForecastData: vi.fn(),
	mapWeatherResponseToNext24HoursData: vi.fn(),
}))

beforeEach(() => {
	vi.clearAllMocks()
	vi.useFakeTimers()
	vi.setSystemTime(new Date('2026-10-19T01:00:00Z'))
	vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
	vi.useRealTimers()
	vi.restoreAllMocks()
})

describe('getCachedHeroForecast cache policy', () => {
	it('keeps validated live data for an hour with a bounded refresh window', async () => {
		mockLiveForecast()

		const result = await getCachedHeroForecast()

		expect(result.forecast[0].max).toBe(20)
		expect(cacheLife).toHaveBeenCalledExactlyOnceWith({
			expire: 65 * 60,
			revalidate: 60 * 60,
			stale: 5 * 60,
		})
	})

	it('retries an unavailable upstream after five minutes and expires sample dates after ten', async () => {
		vi.mocked(fetchWeatherResponse).mockRejectedValue(new Error('offline'))

		const result = await getCachedHeroForecast()

		expect(result.forecast[0].max).toBe(24)
		expect(cacheLife).toHaveBeenCalledExactlyOnceWith({
			expire: 10 * 60,
			revalidate: 5 * 60,
			stale: 5 * 60,
		})
	})

	it('uses the short retry policy for an incomplete successful response', async () => {
		mockLiveForecast()
		vi.mocked(mapWeatherResponseToForecastData).mockReturnValue([])

		const result = await getCachedHeroForecast()

		expect(result.forecast[0].max).toBe(24)
		expect(cacheLife).toHaveBeenCalledExactlyOnceWith({
			expire: 10 * 60,
			revalidate: 5 * 60,
			stale: 5 * 60,
		})
	})

	it('restores the hourly policy when the next refresh recovers', async () => {
		vi.mocked(fetchWeatherResponse).mockRejectedValueOnce(new Error('offline'))
		await getCachedHeroForecast()

		mockLiveForecast()
		await getCachedHeroForecast()

		expect(cacheLife).toHaveBeenNthCalledWith(1, {
			expire: 10 * 60,
			revalidate: 5 * 60,
			stale: 5 * 60,
		})
		expect(cacheLife).toHaveBeenNthCalledWith(2, {
			expire: 65 * 60,
			revalidate: 60 * 60,
			stale: 5 * 60,
		})
	})
})

const mockLiveForecast = () => {
	vi.mocked(fetchWeatherResponse).mockResolvedValue({} as WeatherResponse)
	vi.mocked(mapWeatherResponseToForecastData).mockReturnValue(
		Array.from({ length: 3 }, (_, index) => ({
			day:
				Temporal.PlainDate.from('2026-10-19')
					.add({ days: index })
					.toZonedDateTime('Australia/Perth').epochMilliseconds / 1000,
			description: 3,
			max: 20,
			min: 10,
			rain: 30,
			uv: 5,
			wind: 15,
		})),
	)
	vi.mocked(mapWeatherResponseToNext24HoursData).mockReturnValue(
		Array.from({ length: 3 }, (_, index) => ({
			airQualityAqi: null,
			airQualityNitrogenDioxide: null,
			airQualityOzone: null,
			airQualityPm10: null,
			airQualityPm25: null,
			apparentTemperature: 18 + index,
			daylightDuration: 0,
			dewPoint: 10,
			humidity: 50,
			precipitation: 0,
			precipitationProbability: 0,
			shortwaveRadiation: 0,
			sunrise: null,
			sunset: null,
			sunshineDuration: 0,
			temperature: 20 + index,
			time:
				Temporal.Instant.from('2026-10-19T01:00:00Z').add({ hours: index })
					.epochMilliseconds / 1000,
			uv: 5,
			visibility: 10_000,
			weatherCode: 3,
			wind: 15,
			windGust: 20,
		})),
	)
}

import type { Data } from '../../weather/model/types'

import { getCurrentDate } from '../../../shared/lib/time'
import {
	fetchWeatherResponse,
	mapWeatherResponseToForecastData,
} from '../../weather/api/weather-api'

export const HERO_FORECAST_LOCATION = {
	lat: '-31.9523',
	lon: '115.8613',
	timeZone: 'Australia/Perth',
} as const
export const HERO_FORECAST_DAY_COUNT = 3

export type HeroForecast = Readonly<{
	forecast: Data
	// Seconds until the page should fetch a fresh forecast.
	revalidateSeconds: number
}>

export const getHeroForecast = async (): Promise<HeroForecast> => {
	try {
		const response = await fetchWeatherResponse({
			...HERO_FORECAST_LOCATION,
			shouldUseAirQualityUv: false,
			signal: AbortSignal.timeout(HERO_FORECAST_TIMEOUT_MS),
		})
		const forecast = mapWeatherResponseToForecastData(response).slice(
			0,
			HERO_FORECAST_DAY_COUNT,
		)
		if (forecast.length < HERO_FORECAST_DAY_COUNT) {
			throw new Error('Incomplete hero forecast')
		}

		return {
			forecast: forecast.map((day) => ({
				...day,
				day: toMiddayUtc(
					Temporal.Instant.fromEpochMilliseconds(day.day * 1000)
						.toZonedDateTimeISO(HERO_FORECAST_LOCATION.timeZone)
						.toPlainDate(),
				),
			})),
			revalidateSeconds: LIVE_FORECAST_REVALIDATE_SECONDS,
		}
	} catch (error) {
		console.error('Unable to load the hero forecast; using sample data.', error)
		return {
			forecast: createSampleHeroForecast(),
			revalidateSeconds: SAMPLE_FORECAST_REVALIDATE_SECONDS,
		}
	}
}

const HERO_FORECAST_TIMEOUT_MS = 5000
const LIVE_FORECAST_REVALIDATE_SECONDS = 60 * 60
// Retry sooner after a failed fetch so sample data doesn't linger for an hour.
const SAMPLE_FORECAST_REVALIDATE_SECONDS = 5 * 60

const SAMPLE_DAYS = [
	{ description: 1, max: 24, min: 13, rain: 0, uv: 9, wind: 18 },
	{ description: 0, max: 27, min: 15, rain: 0, uv: 10, wind: 22 },
	{ description: 2, max: 22, min: 14, rain: 10, uv: 8, wind: 16 },
] as const

const createSampleHeroForecast = (): Data => {
	const today = getCurrentDate(HERO_FORECAST_LOCATION.timeZone)

	return SAMPLE_DAYS.map((sample, index) => ({
		...sample,
		day: toMiddayUtc(today.add({ days: index })),
	}))
}

// Tiles name the day in the visitor's timezone. Midday UTC keeps the Perth
// calendar date for visitors almost anywhere.
const toMiddayUtc = (date: Temporal.PlainDate): number =>
	date.toZonedDateTime({ plainTime: '12:00', timeZone: 'UTC' })
		.epochMilliseconds / 1000

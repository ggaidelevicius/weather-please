import type { Data } from '../../weather/model/types'

import { getCurrentDateTime } from '../../../shared/lib/time'
import {
	fetchWeatherResponse,
	mapWeatherResponseToForecastData,
	mapWeatherResponseToNext24HoursData,
} from '../../weather/api/weather-api'

export const HERO_FORECAST_LOCATION = {
	lat: '-31.9523',
	lon: '115.8613',
	timeZone: 'Australia/Perth',
} as const
export const HERO_FORECAST_DAY_COUNT = 3

export type HeroForecast = Readonly<{
	forecast: Data
	hourly: HeroHourlyForecast
	// Seconds until the page should fetch a fresh forecast.
	revalidateSeconds: number
}>

export type HeroHourlyForecast = Readonly<{
	apparentTemperatures: number[]
	// Hour labels for the start, middle, and end of the chart, in Perth time.
	labels: Readonly<{ end: string; middle: string; start: string }>
	temperatures: number[]
	times: number[]
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

		// Match the app: the hourly series starts at midnight in the forecast's
		// timezone, so the current local hour is the index of "now".
		const next24Hours = mapWeatherResponseToNext24HoursData({
			currentHour: getCurrentDateTime(HERO_FORECAST_LOCATION.timeZone).hour,
			data: response,
		})
		if (next24Hours.length < MIN_HOURLY_POINTS) {
			throw new Error('Incomplete hero hourly forecast')
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
			hourly: toHourlyForecast({
				apparentTemperatures: next24Hours.map(
					(hour) => hour.apparentTemperature,
				),
				temperatures: next24Hours.map((hour) => hour.temperature),
				times: next24Hours.map((hour) => hour.time),
			}),
			revalidateSeconds: LIVE_FORECAST_REVALIDATE_SECONDS,
		}
	} catch (error) {
		console.error('Unable to load the hero forecast; using sample data.', error)
		return {
			...createSampleHeroForecast(),
			revalidateSeconds: SAMPLE_FORECAST_REVALIDATE_SECONDS,
		}
	}
}

const HERO_FORECAST_TIMEOUT_MS = 5000
const LIVE_FORECAST_REVALIDATE_SECONDS = 60 * 60
// Retry sooner after a failed fetch so sample data doesn't linger for an hour.
const SAMPLE_FORECAST_REVALIDATE_SECONDS = 5 * 60
// The chart needs a start, middle, and end to label.
const MIN_HOURLY_POINTS = 3

const SAMPLE_DAYS = [
	{ description: 1, max: 24, min: 13, rain: 0, uv: 9, wind: 18 },
	{ description: 0, max: 27, min: 15, rain: 0, uv: 10, wind: 22 },
	{ description: 2, max: 22, min: 14, rain: 10, uv: 8, wind: 16 },
] as const

// A mild spring day from late morning: warm afternoon, cool night.
const SAMPLE_HOURLY_TEMPERATURES = [
	20, 20.3, 20.1, 19.6, 19, 18.4, 17.6, 16.8, 15.9, 15.1, 14.3, 13.6, 13, 12.4,
	11.9, 11.6, 11.5, 11.9, 12.8, 14.1, 15.6, 17.1, 18.5, 19.6,
] as const
const SAMPLE_FEELS_LIKE_OFFSET = -1

const createSampleHeroForecast = (): Omit<
	HeroForecast,
	'revalidateSeconds'
> => {
	const now = getCurrentDateTime(HERO_FORECAST_LOCATION.timeZone)
	const currentHour = now.round({ roundingMode: 'floor', smallestUnit: 'hour' })

	return {
		forecast: SAMPLE_DAYS.map((sample, index) => ({
			...sample,
			day: toMiddayUtc(now.toPlainDate().add({ days: index })),
		})),
		hourly: toHourlyForecast({
			apparentTemperatures: SAMPLE_HOURLY_TEMPERATURES.map(
				(temperature) => temperature + SAMPLE_FEELS_LIKE_OFFSET,
			),
			temperatures: [...SAMPLE_HOURLY_TEMPERATURES],
			times: SAMPLE_HOURLY_TEMPERATURES.map(
				(_, index) =>
					currentHour.add({ hours: index }).epochMilliseconds / 1000,
			),
		}),
	}
}

const toHourlyForecast = ({
	apparentTemperatures,
	temperatures,
	times,
}: Omit<HeroHourlyForecast, 'labels'>): HeroHourlyForecast => ({
	apparentTemperatures,
	labels: {
		end: formatPerthHour(times.at(-1)),
		middle: formatPerthHour(times[Math.floor(times.length / 2)]),
		start: formatPerthHour(times[0]),
	},
	temperatures,
	times,
})

// Formatted on the server so the labels match the chart's location and
// hydrate identically everywhere.
const formatPerthHour = (time: number | undefined) =>
	typeof time === 'number'
		? new Intl.DateTimeFormat('en', {
				hour: 'numeric',
				timeZone: HERO_FORECAST_LOCATION.timeZone,
			}).format(time * 1000)
		: ''

// Tiles name the day in the visitor's timezone. Midday UTC keeps the Perth
// calendar date for visitors almost anywhere.
const toMiddayUtc = (date: Temporal.PlainDate): number =>
	date.toZonedDateTime({ plainTime: '12:00', timeZone: 'UTC' })
		.epochMilliseconds / 1000

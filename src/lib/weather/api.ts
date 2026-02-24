import { z } from 'zod'
import {
	AIR_QUALITY_FORECAST_DAYS,
	WEATHER_FORECAST_DAYS,
	type Data,
} from './types'

const SECONDS_PER_HOUR = 60 * 60
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR

const weatherResponseSchema = z
	.object({
		daily: z.object({
			time: z.array(z.number()).min(1),
			weathercode: z.array(z.number()).min(1),
			temperature_2m_max: z.array(z.number()).min(1),
			temperature_2m_min: z.array(z.number()).min(1),
			uv_index_max: z.array(z.number()).min(1),
			precipitation_probability_max: z.array(z.number()).min(1),
			windspeed_10m_max: z.array(z.number()).min(1),
		}),
		hourly: z.object({
			time: z.array(z.number()).min(1),
			precipitation: z.array(z.number()).min(1),
			uv_index: z.array(z.number()).min(1),
			windspeed_10m: z.array(z.number()).min(1),
			visibility: z.array(z.number()).min(1),
			windgusts_10m: z.array(z.number()).min(1),
		}),
	})
	.loose()

export type WeatherResponse = z.infer<typeof weatherResponseSchema>

const airQualityResponseSchema = z
	.object({
		hourly: z.object({
			time: z.array(z.number()),
			uv_index: z.array(z.number().nullable()),
		}),
	})
	.loose()

type AirQualityResponse = z.infer<typeof airQualityResponseSchema>

export const getUserTimeZone = (): string => {
	try {
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
		return timeZone || 'UTC'
	} catch {
		return 'UTC'
	}
}

const buildAirQualityUvByDay = ({
	dailyTimes,
	hourlyTimes,
	hourlyUv,
}: {
	dailyTimes: number[]
	hourlyTimes: number[]
	hourlyUv: Array<number | null>
}): Map<number, number> => {
	const dailyUvByDay = new Map<number, number>()
	if (dailyTimes.length === 0 || hourlyTimes.length === 0) {
		return dailyUvByDay
	}

	const maxHours = Math.min(hourlyTimes.length, hourlyUv.length)
	let dayIndex = 0
	let dayStart = dailyTimes[0]
	let nextDayStart = dailyTimes[1] ?? dayStart + SECONDS_PER_DAY

	for (let i = 0; i < maxHours; i += 1) {
		const time = hourlyTimes[i]
		if (time < dayStart) {
			continue
		}

		while (time >= nextDayStart && dayIndex < dailyTimes.length - 1) {
			dayIndex += 1
			dayStart = dailyTimes[dayIndex]
			nextDayStart = dailyTimes[dayIndex + 1] ?? dayStart + SECONDS_PER_DAY
		}

		if (time >= dayStart && time < nextDayStart) {
			const uv = hourlyUv[i]
			if (typeof uv !== 'number' || !Number.isFinite(uv)) {
				continue
			}
			const currentMax = dailyUvByDay.get(dayStart)
			if (currentMax === undefined || uv > currentMax) {
				dailyUvByDay.set(dayStart, uv)
			}
		}
	}

	return dailyUvByDay
}

const mergeHourlyUv = ({
	weatherTimes,
	weatherUv,
	airQualityTimes,
	airQualityUv,
}: {
	weatherTimes: number[]
	weatherUv: number[]
	airQualityTimes: number[]
	airQualityUv: Array<number | null>
}): number[] => {
	if (airQualityUv.length === 0) {
		return weatherUv
	}

	if (airQualityTimes.length > 0) {
		const maxHours = Math.min(airQualityTimes.length, airQualityUv.length)
		const uvByTime = new Map<number, number>()
		for (let i = 0; i < maxHours; i += 1) {
			const time = airQualityTimes[i]
			const uv = airQualityUv[i]
			if (
				typeof time === 'number' &&
				Number.isFinite(time) &&
				typeof uv === 'number' &&
				Number.isFinite(uv)
			) {
				uvByTime.set(time, uv)
			}
		}

		return weatherUv.map((value, index) => {
			const time = weatherTimes[index]
			if (typeof time !== 'number' || !Number.isFinite(time)) {
				return value
			}
			const override = uvByTime.get(time)
			return typeof override === 'number' && Number.isFinite(override)
				? override
				: value
		})
	}

	return weatherUv.map((value, index) => {
		const override = airQualityUv[index]
		return typeof override === 'number' && Number.isFinite(override)
			? override
			: value
	})
}

const mergeUvData = ({
	weather,
	airQuality,
}: {
	weather: WeatherResponse
	airQuality: AirQualityResponse | null
}): WeatherResponse => {
	if (!airQuality) {
		return weather
	}

	const airQualityTimes =
		airQuality.hourly.time.length > 0
			? airQuality.hourly.time
			: weather.hourly.time
	const airQualityUvByDay = buildAirQualityUvByDay({
		dailyTimes: weather.daily.time,
		hourlyTimes: airQualityTimes,
		hourlyUv: airQuality.hourly.uv_index,
	})

	const mergedDailyUv = weather.daily.uv_index_max.map((value, index) => {
		const day = weather.daily.time[index]
		const override = airQualityUvByDay.get(day)
		return typeof override === 'number' && Number.isFinite(override)
			? override
			: value
	})

	const mergedHourlyUv = mergeHourlyUv({
		weatherTimes: weather.hourly.time,
		weatherUv: weather.hourly.uv_index,
		airQualityTimes,
		airQualityUv: airQuality.hourly.uv_index,
	})

	return {
		...weather,
		daily: {
			...weather.daily,
			uv_index_max: mergedDailyUv,
		},
		hourly: {
			...weather.hourly,
			uv_index: mergedHourlyUv,
		},
	}
}

export const fetchWeatherResponse = async ({
	lat,
	lon,
	timeZone,
	shouldUseAirQualityUv,
}: {
	lat: string
	lon: string
	timeZone: string
	shouldUseAirQualityUv: boolean
}): Promise<WeatherResponse> => {
	try {
		const encodedTimeZone = encodeURIComponent(timeZone)
		const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,windspeed_10m_max&timeformat=unixtime&timezone=${encodedTimeZone}&hourly=precipitation,uv_index,windspeed_10m,visibility,windgusts_10m&forecast_days=${WEATHER_FORECAST_DAYS}`

		const response = await fetch(weatherUrl)
		if (!response.ok) {
			throw new Error('Weather fetch failed')
		}

		const json = await response.json()
		const parsed = weatherResponseSchema.safeParse(json)
		if (!parsed.success) {
			throw new Error('Invalid weather response')
		}

		let airQualityData: AirQualityResponse | null = null
		if (shouldUseAirQualityUv) {
			const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=uv_index&timeformat=unixtime&timezone=${encodedTimeZone}&forecast_days=${AIR_QUALITY_FORECAST_DAYS}`

			try {
				const airQualityResponse = await fetch(airQualityUrl)
				if (!airQualityResponse.ok) {
					throw new Error('Air quality fetch failed')
				}

				const airQualityJson = await airQualityResponse.json()
				const airQualityParsed =
					airQualityResponseSchema.safeParse(airQualityJson)
				if (!airQualityParsed.success) {
					throw new Error('Invalid air quality response')
				}

				airQualityData = airQualityParsed.data
			} catch (airQualityError) {
				console.error('Air quality fetch error:', airQualityError)
			}
		}

		return mergeUvData({
			weather: parsed.data,
			airQuality: airQualityData,
		})
	} catch (fetchError) {
		const errorMessage =
			fetchError instanceof Error ? fetchError.message : 'Weather fetch failed'
		throw new Error(errorMessage, { cause: fetchError })
	}
}

export const mapWeatherResponseToForecastData = (data: WeatherResponse): Data =>
	data.daily.time.map((day, index) => ({
		day,
		max: data.daily.temperature_2m_max[index],
		min: data.daily.temperature_2m_min[index],
		description: data.daily.weathercode[index],
		uv: data.daily.uv_index_max[index],
		wind: data.daily.windspeed_10m_max[index],
		rain: data.daily.precipitation_probability_max[index],
	}))

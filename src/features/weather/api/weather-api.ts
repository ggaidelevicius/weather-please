import { z } from 'zod'

import { isAbortError } from '../model/error-names'
import {
	AIR_QUALITY_FORECAST_DAYS,
	type Data,
	type Next24HoursData,
	NEXT_24_HOURS_FORECAST_HOURS,
	WEATHER_FORECAST_DAYS,
	WEATHER_MAP_FORECAST_HOURS,
	WEATHER_MAP_GRID_SIZE,
	type WeatherMapData,
} from '../model/types'

const SECONDS_PER_HOUR = 60 * 60
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR
const WEATHER_MAP_LATITUDE_SPAN = 1.8

const weatherResponseSchema = z
	.object({
		daily: z.object({
			precipitation_probability_max: z.array(z.number()).min(1),
			temperature_2m_max: z.array(z.number()).min(1),
			temperature_2m_min: z.array(z.number()).min(1),
			time: z.array(z.number()).min(1),
			uv_index_max: z.array(z.number()).min(1),
			weathercode: z.array(z.number()).min(1),
			windspeed_10m_max: z.array(z.number()).min(1),
		}),
		hourly: z.object({
			apparent_temperature: z.array(z.number()).min(1),
			precipitation: z.array(z.number()).min(1),
			precipitation_probability: z.array(z.number()).min(1),
			temperature_2m: z.array(z.number()).min(1),
			time: z.array(z.number()).min(1),
			uv_index: z.array(z.number()).min(1),
			visibility: z.array(z.number()).min(1),
			weathercode: z.array(z.number()).min(1),
			windgusts_10m: z.array(z.number()).min(1),
			windspeed_10m: z.array(z.number()).min(1),
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

const weatherMapLocationResponseSchema = z
	.object({
		hourly: z.object({
			precipitation: z.array(z.number()).min(1),
			precipitation_probability: z.array(z.number()).min(1),
			time: z.array(z.number()).min(1),
			winddirection_10m: z.array(z.number()).min(1),
			windspeed_10m: z.array(z.number()).min(1),
		}),
		latitude: z.number(),
		longitude: z.number(),
	})
	.loose()

const weatherMapResponseSchema = z.union([
	weatherMapLocationResponseSchema,
	z.array(weatherMapLocationResponseSchema).min(1),
])

type WeatherMapLocationResponse = z.infer<
	typeof weatherMapLocationResponseSchema
>

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
	hourlyUv: Array<null | number>
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
	airQualityTimes,
	airQualityUv,
	weatherTimes,
	weatherUv,
}: {
	airQualityTimes: number[]
	airQualityUv: Array<null | number>
	weatherTimes: number[]
	weatherUv: number[]
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
	airQuality,
	weather,
}: {
	airQuality: AirQualityResponse | null
	weather: WeatherResponse
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
		airQualityTimes,
		airQualityUv: airQuality.hourly.uv_index,
		weatherTimes: weather.hourly.time,
		weatherUv: weather.hourly.uv_index,
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

export const fetchWeatherMapData = async ({
	lat,
	lon,
	signal,
	timeZone,
}: {
	lat: string
	lon: string
	signal?: AbortSignal
	timeZone: string
}): Promise<WeatherMapData> => {
	try {
		const centerLat = parseCoordinate(lat)
		const centerLon = parseCoordinate(lon)
		const grid = getWeatherMapGrid({ lat: centerLat, lon: centerLon })
		const encodedTimeZone = encodeURIComponent(timeZone)
		const latitude = grid.map((point) => point.lat.toFixed(4)).join(',')
		const longitude = grid.map((point) => point.lon.toFixed(4)).join(',')
		const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=precipitation,precipitation_probability,windspeed_10m,winddirection_10m&forecast_hours=${WEATHER_MAP_FORECAST_HOURS}&timeformat=unixtime&timezone=${encodedTimeZone}`

		const response = await fetch(weatherUrl, { signal })
		if (!response.ok) {
			throw new Error(`Weather map fetch failed: ${response.status}`)
		}

		const json = await response.json()
		const parsed = weatherMapResponseSchema.safeParse(json)
		if (!parsed.success) {
			throw new Error('Invalid weather map response')
		}

		const locations = Array.isArray(parsed.data) ? parsed.data : [parsed.data]
		return mapWeatherMapResponseToData({
			center: { lat: centerLat, lon: centerLon },
			locations,
		})
	} catch (fetchError) {
		if (isAbortError(fetchError)) {
			throw fetchError
		}
		const errorMessage =
			fetchError instanceof Error
				? fetchError.message
				: 'Weather map fetch failed'
		throw new Error(errorMessage, { cause: fetchError })
	}
}

export const fetchWeatherResponse = async ({
	lat,
	lon,
	shouldUseAirQualityUv,
	signal,
	timeZone,
}: {
	lat: string
	lon: string
	shouldUseAirQualityUv: boolean
	signal?: AbortSignal
	timeZone: string
}): Promise<WeatherResponse> => {
	try {
		const encodedTimeZone = encodeURIComponent(timeZone)
		const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,windspeed_10m_max&timeformat=unixtime&timezone=${encodedTimeZone}&hourly=temperature_2m,apparent_temperature,precipitation,precipitation_probability,uv_index,windspeed_10m,visibility,weathercode,windgusts_10m&forecast_days=${WEATHER_FORECAST_DAYS}`

		const response = await fetch(weatherUrl, { signal })
		if (!response.ok) {
			throw new Error(`Weather fetch failed: ${response.status}`)
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
				const airQualityResponse = await fetch(airQualityUrl, { signal })
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
				if (isAbortError(airQualityError)) {
					throw airQualityError
				}
				console.error('Air quality fetch error:', airQualityError)
			}
		}

		return mergeUvData({
			airQuality: airQualityData,
			weather: parsed.data,
		})
	} catch (fetchError) {
		if (isAbortError(fetchError)) {
			throw fetchError
		}
		const errorMessage =
			fetchError instanceof Error ? fetchError.message : 'Weather fetch failed'
		throw new Error(errorMessage, { cause: fetchError })
	}
}

const getWeatherMapGrid = ({ lat, lon }: { lat: number; lon: number }) => {
	const grid: Array<{ lat: number; lon: number }> = []
	const latStep = WEATHER_MAP_LATITUDE_SPAN / (WEATHER_MAP_GRID_SIZE - 1)
	const lonSpan =
		WEATHER_MAP_LATITUDE_SPAN /
		Math.max(0.35, Math.cos((Math.abs(lat) * Math.PI) / 180))
	const lonStep = lonSpan / (WEATHER_MAP_GRID_SIZE - 1)
	const centerIndex = Math.floor(WEATHER_MAP_GRID_SIZE / 2)

	for (let row = 0; row < WEATHER_MAP_GRID_SIZE; row += 1) {
		for (let column = 0; column < WEATHER_MAP_GRID_SIZE; column += 1) {
			grid.push({
				lat: clampCoordinate(lat + (centerIndex - row) * latStep, -89, 89),
				lon: normalizeLongitude(lon + (column - centerIndex) * lonStep),
			})
		}
	}

	return grid
}

const mapWeatherMapResponseToData = ({
	center,
	locations,
}: {
	center: WeatherMapData['center']
	locations: WeatherMapLocationResponse[]
}): WeatherMapData => {
	const firstLocation = locations[0]
	const frameCount = Math.min(
		WEATHER_MAP_FORECAST_HOURS,
		firstLocation?.hourly.time.length ?? 0,
	)
	const frames: WeatherMapData['frames'] = []

	for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
		const time = firstLocation?.hourly.time[frameIndex]
		if (typeof time !== 'number' || !Number.isFinite(time)) {
			continue
		}

		const points = locations.flatMap((location) => {
			const precipitation = location.hourly.precipitation[frameIndex]
			const precipitationProbability =
				location.hourly.precipitation_probability[frameIndex]
			const windDirection = location.hourly.winddirection_10m[frameIndex]
			const windSpeed = location.hourly.windspeed_10m[frameIndex]

			if (
				!Number.isFinite(precipitation) ||
				!Number.isFinite(precipitationProbability) ||
				!Number.isFinite(windDirection) ||
				!Number.isFinite(windSpeed)
			) {
				return []
			}

			return {
				lat: location.latitude,
				lon: location.longitude,
				precipitation,
				precipitationProbability,
				windDirection,
				windSpeed,
			}
		})

		if (points.length > 0) {
			frames.push({ points, time })
		}
	}

	return { center, frames }
}

const parseCoordinate = (coordinate: string) => {
	const value = Number(coordinate)
	if (!Number.isFinite(value)) {
		throw new Error('Invalid map coordinate')
	}

	return value
}

const clampCoordinate = (coordinate: number, min: number, max: number) =>
	Math.min(Math.max(coordinate, min), max)

const normalizeLongitude = (lon: number) =>
	((((lon + 180) % 360) + 360) % 360) - 180

export const mapWeatherResponseToForecastData = (data: WeatherResponse): Data =>
	data.daily.time.map((day, index) => ({
		day,
		description: data.daily.weathercode[index],
		max: data.daily.temperature_2m_max[index],
		min: data.daily.temperature_2m_min[index],
		rain: data.daily.precipitation_probability_max[index],
		uv: data.daily.uv_index_max[index],
		wind: data.daily.windspeed_10m_max[index],
	}))

export const mapWeatherResponseToNext24HoursData = ({
	currentHour,
	data,
}: {
	currentHour: number
	data: WeatherResponse
}): Next24HoursData => {
	const start = Math.max(0, currentHour)
	const end = Math.min(
		data.hourly.time.length,
		start + NEXT_24_HOURS_FORECAST_HOURS,
	)
	const next24HoursData: Next24HoursData = []

	for (let index = start; index < end; index += 1) {
		const point = {
			apparentTemperature: data.hourly.apparent_temperature[index],
			precipitation: data.hourly.precipitation[index],
			precipitationProbability: data.hourly.precipitation_probability[index],
			temperature: data.hourly.temperature_2m[index],
			time: data.hourly.time[index],
			uv: data.hourly.uv_index[index],
			visibility: data.hourly.visibility[index],
			weatherCode: data.hourly.weathercode[index],
			wind: data.hourly.windspeed_10m[index],
			windGust: data.hourly.windgusts_10m[index],
		}

		if (Object.values(point).every(Number.isFinite)) {
			next24HoursData.push(point)
		}
	}

	return next24HoursData
}

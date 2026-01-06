import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
	ALERT_CONDITIONS,
	processPrecipitationAlert,
	processPrecipitationDuration,
	processSimpleAlert,
} from '../lib/alert-processor'
import { isLocationInAustralia } from '../lib/location'
import { queryClient } from '../lib/query-client'

const ALERT_HOURS_UV = 13 // 12 hours + current hour
const ALERT_HOURS_GENERAL = 25 // 24 hours + current hour
const WEATHER_FORECAST_DAYS = 9
const AIR_QUALITY_FORECAST_DAYS = 7
const SECONDS_PER_HOUR = 60 * 60
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR
const CACHE_REFRESH_INTERVAL_MS = 60 * 1000
const CACHE_REFRESH_DELAY_MINUTE = 1
const CACHE_VALIDITY_MS = 60 * 60 * 1000

const dataSchema = z
	.array(
		z.object({
			day: z.number(),
			description: z.number(),
			max: z.number(),
			min: z.number(),
			rain: z.number(),
			uv: z.number(),
			wind: z.number(),
		}),
	)
	.min(1)
	.max(WEATHER_FORECAST_DAYS)

type Data = z.infer<typeof dataSchema>

const alertSchema = z.object({
	hoursOfExtremeUv: z.array(z.boolean()).length(ALERT_HOURS_UV),
	hoursOfLowVisibility: z.array(z.boolean()).length(ALERT_HOURS_GENERAL),
	hoursOfStrongWind: z.array(z.boolean()).length(ALERT_HOURS_GENERAL),
	hoursOfStrongWindGusts: z.array(z.boolean()).length(ALERT_HOURS_GENERAL),
	totalPrecipitation: z.object({
		duration: z.array(z.boolean()).length(ALERT_HOURS_GENERAL),
		precipitation: z.object({
			flag: z.boolean(),
			value: z.number(),
			zeroCount: z.number(),
		}),
	}),
})

export type Alerts = z.infer<typeof alertSchema>

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

type WeatherResponse = z.infer<typeof weatherResponseSchema>

const airQualityResponseSchema = z
	.object({
		hourly: z.object({
			time: z.array(z.number()),
			uv_index: z.array(z.number().nullable()),
		}),
	})
	.loose()

type AirQualityResponse = z.infer<typeof airQualityResponseSchema>

const LEGACY_LAST_UPDATED_PATTERN = /^\d{4}-\d{1,2}-\d{1,2}-\d{1,2}$/

const lastUpdatedSchema = z.union([
	z.iso.datetime().transform((value) => new Date(value)),
	z
		.string()
		.regex(LEGACY_LAST_UPDATED_PATTERN)
		.transform((value) => {
			const [year, month, day, hour] = value.split('-').map(Number)
			return new Date(year, month, day, hour)
		}),
])

const readStorageItem = <T>({
	key,
	schema,
	parse,
	normalize,
}: {
	key: string
	schema: z.ZodType<T>
	parse?: (value: string) => unknown
	normalize?: (value: T) => string
}): T | null => {
	const raw = localStorage.getItem(key)
	if (!raw) {
		return null
	}

	let parsed: unknown = raw
	if (parse) {
		try {
			parsed = parse(raw)
		} catch {
			localStorage.removeItem(key)
			return null
		}
	}

	const result = schema.safeParse(parsed)
	if (!result.success) {
		localStorage.removeItem(key)
		return null
	}

	if (normalize) {
		const normalized = normalize(result.data)
		if (normalized !== raw) {
			localStorage.setItem(key, normalized)
		}
	}

	return result.data
}

const getCachedWeather = (
	lat: string,
	lon: string,
	timeZone: string,
	shouldUseAirQualityUv: boolean,
): { weatherData: Data; alertData: Alerts; lastUpdatedDate: Date } | null => {
	const cachedLat = readStorageItem({
		key: 'cachedLat',
		schema: z.string().min(1),
	})
	const cachedLon = readStorageItem({
		key: 'cachedLon',
		schema: z.string().min(1),
	})
	const cachedTimeZone = readStorageItem({
		key: 'cachedTimeZone',
		schema: z.string().min(1),
	})
	const cachedUseAirQualityUv = readStorageItem({
		key: 'cachedUseAirQualityUv',
		schema: z.boolean(),
		parse: JSON.parse,
		normalize: (value) => JSON.stringify(value),
	})
	const lastUpdatedDate = readStorageItem({
		key: 'lastUpdated',
		schema: lastUpdatedSchema,
		normalize: (value) => value.toISOString(),
	})
	const storedAlerts = readStorageItem({
		key: 'alerts',
		schema: alertSchema,
		parse: JSON.parse,
		normalize: (value) => JSON.stringify(value),
	})
	const storedData = readStorageItem({
		key: 'data',
		schema: dataSchema,
		parse: JSON.parse,
		normalize: (value) => JSON.stringify(value),
	})

	if (
		!cachedLat ||
		!cachedLon ||
		!cachedTimeZone ||
		!lastUpdatedDate ||
		!storedAlerts ||
		!storedData ||
		cachedUseAirQualityUv === null
	) {
		return null
	}

	// Check if coordinates match
	if (
		cachedLat !== lat ||
		cachedLon !== lon ||
		cachedTimeZone !== timeZone ||
		cachedUseAirQualityUv !== shouldUseAirQualityUv
	) {
		return null
	}
	const now = new Date()
	const isFresh = now.getTime() - lastUpdatedDate.getTime() <= CACHE_VALIDITY_MS

	if (!isFresh) {
		return null
	}

	return {
		weatherData: storedData,
		alertData: storedAlerts,
		lastUpdatedDate,
	}
}

const getUserTimeZone = (): string => {
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

export const useWeather = (
	lat: string,
	lon: string,
	changedLocation: boolean,
	useAirQualityUvOverride: boolean,
) => {
	const userTimeZone = getUserTimeZone()
	const shouldUseAirQualityUv =
		useAirQualityUvOverride || isLocationInAustralia(lat, lon)
	const [alertData, setAlertData] = useState<Alerts>({
		totalPrecipitation: {
			precipitation: {
				value: 0,
				flag: false,
				zeroCount: 0,
			},
			duration: Array(ALERT_HOURS_GENERAL).fill(false),
		},
		hoursOfExtremeUv: Array(ALERT_HOURS_UV).fill(false),
		hoursOfStrongWind: Array(ALERT_HOURS_GENERAL).fill(false),
		hoursOfLowVisibility: Array(ALERT_HOURS_GENERAL).fill(false),
		hoursOfStrongWindGusts: Array(ALERT_HOURS_GENERAL).fill(false),
	})
	const [weatherData, setWeatherData] = useState<[] | Data>([])
	const [usingCachedData, setUsingCachedData] = useState(true)

	const lastHourRef = useRef(new Date().getHours())

	const { error, data, refetch } = useQuery<WeatherResponse>({
		queryKey: ['weather', lat, lon, userTimeZone, shouldUseAirQualityUv],
		queryFn: async () => {
			try {
				const encodedTimeZone = encodeURIComponent(userTimeZone)
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
					fetchError instanceof Error
						? fetchError.message
						: 'Weather fetch failed'
				throw new Error(errorMessage, { cause: fetchError })
			}
		},
		enabled: Boolean(lat) && Boolean(lon) && !usingCachedData,
	})

	useEffect(() => {
		if (data) {
			const now = new Date()
			const currentHour = now.getHours()
			lastHourRef.current = currentHour

			const futureData = data.daily.time.map((day, i: number) => ({
				day,
				max: data.daily.temperature_2m_max[i],
				min: data.daily.temperature_2m_min[i],
				description: data.daily.weathercode[i],
				uv: data.daily.uv_index_max[i],
				wind: data.daily.windspeed_10m_max[i],
				rain: data.daily.precipitation_probability_max[i],
			}))
			setWeatherData(futureData)
			localStorage.setItem('data', JSON.stringify(futureData))

			const alerts = {
				totalPrecipitation: {
					precipitation: processPrecipitationAlert(
						data.hourly.precipitation.slice(
							currentHour,
							currentHour + ALERT_HOURS_GENERAL,
						),
					),
					duration: processPrecipitationDuration(
						data.hourly.precipitation.slice(
							currentHour,
							currentHour + ALERT_HOURS_GENERAL,
						),
					),
				},
				hoursOfExtremeUv: processSimpleAlert(
					data.hourly.uv_index.slice(currentHour, currentHour + ALERT_HOURS_UV),
					ALERT_CONDITIONS.extremeUv,
				),
				hoursOfStrongWind: processSimpleAlert(
					data.hourly.windspeed_10m.slice(
						currentHour,
						currentHour + ALERT_HOURS_GENERAL,
					),
					ALERT_CONDITIONS.strongWind,
				),
				hoursOfStrongWindGusts: processSimpleAlert(
					data.hourly.windgusts_10m.slice(
						currentHour,
						currentHour + ALERT_HOURS_GENERAL,
					),
					ALERT_CONDITIONS.strongWindGusts,
				),
				hoursOfLowVisibility: processSimpleAlert(
					data.hourly.visibility.slice(
						currentHour,
						currentHour + ALERT_HOURS_GENERAL,
					),
					ALERT_CONDITIONS.lowVisibility,
				),
			}
			setAlertData(alerts)
			localStorage.setItem('alerts', JSON.stringify(alerts))
			localStorage.setItem('cachedLat', lat)
			localStorage.setItem('cachedLon', lon)
			localStorage.setItem('cachedTimeZone', userTimeZone)
			localStorage.setItem(
				'cachedUseAirQualityUv',
				JSON.stringify(shouldUseAirQualityUv),
			)
			localStorage.setItem('lastUpdated', now.toISOString())
		} else if (error) {
			console.error('Weather fetch error:', error)
		}
	}, [data, error, lat, lon, userTimeZone, shouldUseAirQualityUv])

	useEffect(() => {
		const interval = setInterval(() => {
			const now = new Date()
			const currentHour = now.getHours()
			const currentMinute = now.getMinutes()
			if (
				currentHour !== lastHourRef.current &&
				currentMinute >= CACHE_REFRESH_DELAY_MINUTE
			) {
				lastHourRef.current = currentHour
				setUsingCachedData(false)
				queryClient.invalidateQueries({ queryKey: ['weather'] })
			}
		}, CACHE_REFRESH_INTERVAL_MS)

		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		if (!lat || !lon) {
			return
		}

		if (changedLocation) {
			setUsingCachedData(false)
		} else {
			const cached = getCachedWeather(
				lat,
				lon,
				userTimeZone,
				shouldUseAirQualityUv,
			)
			if (cached) {
				const now = new Date()
				setWeatherData(cached.weatherData)
				setAlertData(cached.alertData)
				lastHourRef.current = cached.lastUpdatedDate.getHours()
				const shouldRefresh =
					now.getHours() !== cached.lastUpdatedDate.getHours() &&
					now.getMinutes() >= CACHE_REFRESH_DELAY_MINUTE
				setUsingCachedData(!shouldRefresh)
				if (shouldRefresh) {
					queryClient.invalidateQueries({ queryKey: ['weather'] })
				}
				return
			}
			setUsingCachedData(false)
		}
	}, [lat, lon, changedLocation, userTimeZone, shouldUseAirQualityUv])

	const retry = () => {
		setUsingCachedData(false)
		refetch()
	}

	return {
		weatherData,
		alertData,
		isLoading:
			!Boolean(lat) || !Boolean(lon) || (weatherData.length === 0 && !data),
		error,
		retry,
	}
}

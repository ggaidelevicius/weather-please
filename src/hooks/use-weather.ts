import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
	ALERT_CONDITIONS,
	processPrecipitationAlert,
	processPrecipitationDuration,
	processSimpleAlert,
} from '../lib/alert-processor'
import { queryClient } from '../lib/query-client'

const ALERT_HOURS_UV = 13 // 12 hours + current hour
const ALERT_HOURS_GENERAL = 25 // 24 hours + current hour
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
	.max(9)

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
			precipitation: z.array(z.number()).min(1),
			uv_index: z.array(z.number()).min(1),
			windspeed_10m: z.array(z.number()).min(1),
			visibility: z.array(z.number()).min(1),
			windgusts_10m: z.array(z.number()).min(1),
		}),
	})
	.passthrough()

type WeatherResponse = z.infer<typeof weatherResponseSchema>

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
): { weatherData: Data; alertData: Alerts } | null => {
	const cachedLat = readStorageItem({
		key: 'cachedLat',
		schema: z.string().min(1),
	})
	const cachedLon = readStorageItem({
		key: 'cachedLon',
		schema: z.string().min(1),
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
		!lastUpdatedDate ||
		!storedAlerts ||
		!storedData
	) {
		return null
	}

	// Check if coordinates match
	if (cachedLat !== lat || cachedLon !== lon) {
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
	}
}

export const useWeather = (
	lat: string,
	lon: string,
	changedLocation: boolean,
) => {
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
		queryKey: ['weather', lat, lon],
		queryFn: async () => {
			try {
				const response = await fetch(
					`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,windspeed_10m_max&timeformat=unixtime&timezone=auto&hourly=precipitation,uv_index,windspeed_10m,visibility,windgusts_10m&forecast_days=9`,
				)

				if (!response.ok) {
					throw new Error('Weather fetch failed')
				}

				const json = await response.json()
				const parsed = weatherResponseSchema.safeParse(json)
				if (!parsed.success) {
					throw new Error('Invalid weather response')
				}
				return parsed.data
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
			localStorage.setItem('lastUpdated', now.toISOString())
		} else if (error) {
			console.error('Weather fetch error:', error)
		}
	}, [data, error, lat, lon])

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
		if (changedLocation) {
			setUsingCachedData(false)
		} else {
			const cached = getCachedWeather(lat, lon)
			if (cached) {
				setWeatherData(cached.weatherData)
				setAlertData(cached.alertData)
				return
			}
			setUsingCachedData(false)
		}
	}, [lat, lon, changedLocation])

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

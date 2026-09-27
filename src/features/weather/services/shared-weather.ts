import { z } from 'zod'

import {
	readSharedResource,
	requestSharedResource,
	subscribeSharedResource,
} from '../../../shared/lib/shared-resource'
import {
	getCurrentDateTime,
	getCurrentTimestamp,
	getDateTime,
} from '../../../shared/lib/time'
import { epochMillisecondsSchema } from '../../../shared/lib/time-schema'
import {
	fetchWeatherMapData,
	fetchWeatherResponse,
	mapWeatherResponseToForecastData,
	mapWeatherResponseToNext24HoursData,
} from '../api/weather-api'
import { deriveAlertsFromNext24HoursData } from '../model/alerts'
import {
	type CachedWeather,
	type CacheIdentity,
	getCachedWeather,
	writeCachedWeather,
	writeCachedWeatherMapData,
} from '../model/cache'
import {
	alertSchema,
	CACHE_REFRESH_DELAY_MINUTE,
	CACHE_VALIDITY_MS,
	dataSchema,
	next24HoursDataSchema,
	type WeatherMapData,
	weatherMapDataSchema,
} from '../model/types'

const sharedWeatherSchema = z.object({
	alertData: alertSchema,
	lastUpdatedAt: epochMillisecondsSchema,
	next24HoursData: next24HoursDataSchema,
	weatherData: dataSchema,
})

type SharedWeather = z.infer<typeof sharedWeatherSchema>

type SharedWeatherRequest = CacheIdentity & {
	force?: boolean
	signal?: AbortSignal
}

export const requestSharedWeather = async ({
	force = false,
	signal,
	...identity
}: SharedWeatherRequest): Promise<SharedWeather> => {
	signal?.throwIfAborted()
	const cached = readSharedWeatherCache(identity)
	if (!force && cached && isWeatherCacheFresh({ cached })) {
		return {
			alertData: cached.alertData,
			lastUpdatedAt: cached.lastUpdatedDate.epochMilliseconds,
			next24HoursData: cached.next24HoursData,
			weatherData: cached.weatherData,
		}
	}
	return requestSharedResource({
		fetcher: async ({ signal: requestSignal }) => {
			const response = await fetchWeatherResponse({
				...identity,
				signal: requestSignal,
			})
			requestSignal.throwIfAborted()
			const now = getCurrentDateTime()
			const currentHour = now.hour
			const next24HoursData = mapWeatherResponseToNext24HoursData({
				currentHour,
				data: response,
			})
			const weather = {
				alertData: deriveAlertsFromNext24HoursData(next24HoursData),
				lastUpdatedAt: now.epochMilliseconds,
				next24HoursData,
				weatherData: mapWeatherResponseToForecastData(response),
			}
			writeCachedWeather({
				...identity,
				...weather,
				lastUpdatedDate: now.toInstant(),
				weatherMapData: null,
			})
			return weather
		},
		force,
		isFresh: (weather) => isSharedWeatherFresh({ identity, weather }),
		key: getWeatherResourceKey(identity),
		maxAgeMs: getWeatherMaxAge(),
		schema: sharedWeatherSchema,
		signal,
	})
}

export const requestSharedWeatherMap = async ({
	force = false,
	signal,
	...identity
}: SharedWeatherRequest): Promise<WeatherMapData> => {
	signal?.throwIfAborted()
	const cached = readSharedWeatherCache(identity)
	if (!force && cached?.weatherMapData && isWeatherCacheFresh({ cached })) {
		return cached.weatherMapData
	}
	return requestSharedResource({
		fetcher: async ({ signal: requestSignal }) => {
			const weatherMapData = await fetchWeatherMapData({
				...identity,
				signal: requestSignal,
			})
			requestSignal.throwIfAborted()
			writeCachedWeatherMapData({ ...identity, weatherMapData })
			return weatherMapData
		},
		force,
		key: getMapResourceKey(identity),
		maxAgeMs: getWeatherMaxAge(),
		schema: weatherMapDataSchema,
		signal,
	})
}

export const readSharedWeatherCache = (
	identity: CacheIdentity,
): CachedWeather | null => {
	const stored = getCachedWeather({ ...identity, allowStale: true })
	const shared = readSharedResource({
		key: getWeatherResourceKey(identity),
		schema: sharedWeatherSchema,
	})
	const map = readSharedResource({
		key: getMapResourceKey(identity),
		schema: weatherMapDataSchema,
	})
	const cached =
		shared &&
		(!stored ||
			shared.value.lastUpdatedAt > stored.lastUpdatedDate.epochMilliseconds)
			? {
					...shared.value,
					isDegraded: false,
					lastUpdatedDate: Temporal.Instant.fromEpochMilliseconds(
						shared.value.lastUpdatedAt,
					),
					weatherMapData: null,
				}
			: stored
	if (!cached) return null
	return {
		...cached,
		weatherMapData:
			map && map.updatedAt >= cached.lastUpdatedDate.epochMilliseconds
				? map.value
				: cached.weatherMapData,
	}
}

export const subscribeSharedWeather = ({
	identity,
	onChange,
}: {
	identity: CacheIdentity
	onChange: () => void
}): (() => void) => {
	const unsubscribeWeather = subscribeSharedResource({
		key: getWeatherResourceKey(identity),
		onChange,
	})
	const unsubscribeMap = subscribeSharedResource({
		key: getMapResourceKey(identity),
		onChange,
	})
	return () => {
		unsubscribeWeather()
		unsubscribeMap()
	}
}

export const isWeatherCacheFresh = ({
	cached,
	now = getCurrentTimestamp(),
}: {
	cached: CachedWeather
	now?: number
}): boolean => {
	const age = now - cached.lastUpdatedDate.epochMilliseconds
	return (
		!cached.isDegraded &&
		cached.next24HoursData.length > 0 &&
		age >= 0 &&
		age <= getWeatherMaxAge(now)
	)
}

const isSharedWeatherFresh = ({
	identity,
	weather,
}: {
	identity: CacheIdentity
	weather: SharedWeather
}): boolean => {
	const persisted = getCachedWeather({ ...identity, allowStale: true })
	return isWeatherCacheFresh({
		cached: {
			...weather,
			isDegraded: Boolean(
				persisted?.isDegraded &&
				persisted.lastUpdatedDate.epochMilliseconds >= weather.lastUpdatedAt,
			),
			lastUpdatedDate: Temporal.Instant.fromEpochMilliseconds(
				weather.lastUpdatedAt,
			),
			weatherMapData: null,
		},
	})
}

const getWeatherMaxAge = (now = getCurrentTimestamp()): number => {
	const current = getDateTime({ timestamp: now })
	const refreshHour = (
		current.minute < CACHE_REFRESH_DELAY_MINUTE
			? current.subtract({ hours: 1 })
			: current
	).round({ roundingMode: 'floor', smallestUnit: 'hour' })
	return Math.min(CACHE_VALIDITY_MS, now - refreshHour.epochMilliseconds)
}

const getWeatherResourceKey = (identity: CacheIdentity): string =>
	`weather:${JSON.stringify([
		identity.lat,
		identity.lon,
		identity.timeZone,
		identity.shouldUseAirQualityUv,
	])}`

const getMapResourceKey = (identity: CacheIdentity): string =>
	`weather-map:${JSON.stringify([
		identity.lat,
		identity.lon,
		identity.timeZone,
	])}`

import type { Alerts, Next24HoursData, Data, WeatherMapData } from './types'
import {
	alertSchema,
	CACHE_VALIDITY_MS,
	dataSchema,
	next24HoursDataSchema,
	weatherMapDataSchema,
} from './types'
import { z } from 'zod'
import {
	readLocalStorage,
	writeLocalStorage,
	removeLocalStorage,
} from '../../../shared/lib/local-storage'

const LEGACY_LAST_UPDATED_PATTERN = /^\d{4}-\d{1,2}-\d{1,2}-\d{1,2}$/
const WEATHER_CACHE_DEGRADED_KEY = 'weatherCacheDegraded'

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
	normalize,
	parse,
	schema,
}: {
	key: string
	normalize?: (value: T) => string
	parse?: (value: string) => unknown
	schema: z.ZodType<T>
}): null | T => {
	const raw = readLocalStorage(key)
	if (!raw) {
		return null
	}

	let parsed: unknown = raw
	if (parse) {
		try {
			parsed = parse(raw)
		} catch {
			removeLocalStorage(key)
			return null
		}
	}

	const result = schema.safeParse(parsed)
	if (!result.success) {
		removeLocalStorage(key)
		return null
	}

	if (normalize) {
		const normalized = normalize(result.data)
		if (normalized !== raw) {
			writeLocalStorage({ key, value: normalized })
		}
	}

	return result.data
}

export type CachedWeather = {
	alertData: Alerts
	isDegraded: boolean
	lastUpdatedDate: Date
	next24HoursData: Next24HoursData
	weatherData: Data
	weatherMapData: null | WeatherMapData
}

export type CacheIdentity = {
	lat: string
	lon: string
	shouldUseAirQualityUv: boolean
	timeZone: string
}

const readLegacyCachedWeather = () => {
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
		normalize: (value) => JSON.stringify(value),
		parse: JSON.parse,
		schema: z.boolean(),
	})
	const lastUpdatedDate = readStorageItem({
		key: 'lastUpdated',
		normalize: (value) => value.toISOString(),
		schema: lastUpdatedSchema,
	})
	const storedAlerts = readStorageItem({
		key: 'alerts',
		normalize: (value) => JSON.stringify(value),
		parse: JSON.parse,
		schema: alertSchema,
	})
	const storedData = readStorageItem({
		key: 'data',
		normalize: (value) => JSON.stringify(value),
		parse: JSON.parse,
		schema: dataSchema,
	})
	const storedNext24HoursData = readStorageItem({
		key: 'next24HoursData',
		normalize: (value) => JSON.stringify(value),
		parse: JSON.parse,
		schema: next24HoursDataSchema,
	})
	const storedWeatherMapData = readStorageItem({
		key: 'weatherMapData',
		normalize: (value) => JSON.stringify(value),
		parse: JSON.parse,
		schema: weatherMapDataSchema.nullable(),
	})
	const isDegraded =
		readStorageItem({
			key: WEATHER_CACHE_DEGRADED_KEY,
			normalize: (value) => JSON.stringify(value),
			parse: JSON.parse,
			schema: z.boolean(),
		}) ?? false

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

	return {
		alertData: storedAlerts,
		lat: cachedLat,
		lon: cachedLon,
		timeZone: cachedTimeZone,
		shouldUseAirQualityUv: cachedUseAirQualityUv,
		isDegraded,
		lastUpdatedDate,
		next24HoursData: storedNext24HoursData ?? [],
		weatherData: storedData,
		weatherMapData: storedWeatherMapData,
	}
}

export const WEATHER_CACHE_STORAGE_KEY = 'weather-please:weather-cache'

const cacheSchema = z.object({
	version: z.literal(1),
	lat: z.string().min(1),
	lon: z.string().min(1),
	timeZone: z.string().min(1),
	shouldUseAirQualityUv: z.boolean(),
	lastUpdatedDate: lastUpdatedSchema,
	isDegraded: z.boolean(),
	alertData: alertSchema,
	weatherData: dataSchema,
	next24HoursData: next24HoursDataSchema,
	weatherMapData: weatherMapDataSchema.nullable(),
})

export const getCachedWeather = ({
	allowStale = false,
	...identity
}: CacheIdentity & { allowStale?: boolean }): CachedWeather | null => {
	const cached = readCache()
	if (!cached || !isSameIdentity(cached, identity)) return null
	const age = Date.now() - cached.lastUpdatedDate.getTime()
	if (!allowStale && (age < 0 || age > CACHE_VALIDITY_MS)) return null
	return cached
}

export const hasCachedWeather = (): boolean => Boolean(readCache())

export const writeCachedWeather = (
	weather: CacheIdentity & Omit<CachedWeather, 'isDegraded'>,
): boolean => persistCache({ ...weather, isDegraded: false, version: 1 })

export const writeCachedWeatherDegraded = (
	identity: CacheIdentity,
): boolean => {
	const cached = readCache()
	return Boolean(
		cached &&
		isSameIdentity(cached, identity) &&
		persistCache({ ...cached, isDegraded: true }),
	)
}

export const writeCachedWeatherMapData = ({
	weatherMapData,
	...identity
}: CacheIdentity & { weatherMapData: WeatherMapData }): boolean => {
	const cached = readCache()
	return Boolean(
		cached &&
		isSameIdentity(cached, identity) &&
		persistCache({ ...cached, weatherMapData }),
	)
}

const isSameIdentity = (left: CacheIdentity, right: CacheIdentity): boolean =>
	left.lat === right.lat &&
	left.lon === right.lon &&
	left.timeZone === right.timeZone &&
	left.shouldUseAirQualityUv === right.shouldUseAirQualityUv

const persistCache = (cache: z.infer<typeof cacheSchema>): boolean =>
	writeLocalStorage({
		key: WEATHER_CACHE_STORAGE_KEY,
		value: JSON.stringify(cache),
	})

const readCache = (): null | z.infer<typeof cacheSchema> => {
	const stored = readStorageItem({
		key: WEATHER_CACHE_STORAGE_KEY,
		parse: JSON.parse,
		schema: cacheSchema,
	})
	if (stored) return stored
	const legacy = readLegacyCachedWeather()
	if (!legacy) return null
	const migrated = { ...legacy, version: 1 as const }
	if (persistCache(migrated)) {
		for (const key of LEGACY_CACHE_KEYS) removeLocalStorage(key)
	}
	return migrated
}

const LEGACY_CACHE_KEYS = [
	'data',
	'next24HoursData',
	'weatherMapData',
	'alerts',
	'cachedLat',
	'cachedLon',
	'cachedTimeZone',
	'cachedUseAirQualityUv',
	'lastUpdated',
	WEATHER_CACHE_DEGRADED_KEY,
]

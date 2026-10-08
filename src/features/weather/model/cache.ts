import { z } from 'zod'

import type { Alerts, Data, Next24HoursData, WeatherMapData } from './types'

import {
	readLocalStorage,
	removeLocalStorage,
	writeLocalStorage,
} from '../../../shared/lib/local-storage'
import {
	getCurrentTimestamp,
	getSystemTimeZone,
} from '../../../shared/lib/time'
import {
	alertSchema,
	CACHE_VALIDITY_MS,
	dataSchema,
	next24HoursDataSchema,
	weatherMapDataSchema,
} from './types'

const LEGACY_LAST_UPDATED_PATTERN = /^\d{4}-\d{1,2}-\d{1,2}-\d{1,2}$/
const WEATHER_CACHE_DEGRADED_KEY = 'weatherCacheDegraded'

const lastUpdatedSchema = z
	.union([z.iso.datetime(), z.string().regex(LEGACY_LAST_UPDATED_PATTERN)])
	.transform((value, context) => {
		try {
			if (value.includes('T')) return Temporal.Instant.from(value)
			const [year, month, day, hour] = value.split('-').map(Number)
			return Temporal.ZonedDateTime.from(
				{ day, hour, month: month + 1, timeZone: getSystemTimeZone(), year },
				{ overflow: 'reject' },
			).toInstant()
		} catch {
			context.addIssue({
				code: 'custom',
				message: 'Invalid weather cache timestamp',
			})
			return z.NEVER
		}
	})

const readStorageItem = <T>({
	key,
	normalize,
	parse,
	schema,
	shouldRepair = true,
}: {
	key: string
	normalize?: (value: T) => string
	parse?: (value: string) => unknown
	schema: z.ZodType<T>
	shouldRepair?: boolean
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
			if (shouldRepair) removeLocalStorage(key)
			return null
		}
	}

	const result = schema.safeParse(parsed)
	if (!result.success) {
		if (shouldRepair) removeLocalStorage(key)
		return null
	}

	if (normalize && shouldRepair) {
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
	lastUpdatedDate: Temporal.Instant
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

const readLegacyCachedWeather = (shouldRepair = true) => {
	const cachedLat = readStorageItem({
		key: 'cachedLat',
		schema: z.string().min(1),
		shouldRepair,
	})
	const cachedLon = readStorageItem({
		key: 'cachedLon',
		schema: z.string().min(1),
		shouldRepair,
	})
	const cachedTimeZone = readStorageItem({
		key: 'cachedTimeZone',
		schema: z.string().min(1),
		shouldRepair,
	})
	const cachedUseAirQualityUv = readStorageItem({
		key: 'cachedUseAirQualityUv',
		normalize: (value) => JSON.stringify(value),
		parse: JSON.parse,
		schema: z.boolean(),
		shouldRepair,
	})
	const lastUpdatedDate = readStorageItem({
		key: 'lastUpdated',
		normalize: (value) => value.toString({ fractionalSecondDigits: 3 }),
		schema: lastUpdatedSchema,
		shouldRepair,
	})
	const storedAlerts = readStorageItem({
		key: 'alerts',
		normalize: (value) => JSON.stringify(value),
		parse: JSON.parse,
		schema: alertSchema,
		shouldRepair,
	})
	const storedData = readStorageItem({
		key: 'data',
		normalize: (value) => JSON.stringify(value),
		parse: JSON.parse,
		schema: dataSchema,
		shouldRepair,
	})
	const storedNext24HoursData = readStorageItem({
		key: 'next24HoursData',
		normalize: (value) => JSON.stringify(value),
		parse: JSON.parse,
		schema: next24HoursDataSchema,
		shouldRepair,
	})
	const storedWeatherMapData = readStorageItem({
		key: 'weatherMapData',
		normalize: (value) => JSON.stringify(value),
		parse: JSON.parse,
		schema: weatherMapDataSchema.nullable(),
		shouldRepair,
	})
	const isDegraded =
		readStorageItem({
			key: WEATHER_CACHE_DEGRADED_KEY,
			normalize: (value) => JSON.stringify(value),
			parse: JSON.parse,
			schema: z.boolean(),
			shouldRepair,
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
		isDegraded,
		lastUpdatedDate,
		lat: cachedLat,
		lon: cachedLon,
		next24HoursData: storedNext24HoursData ?? [],
		shouldUseAirQualityUv: cachedUseAirQualityUv,
		timeZone: cachedTimeZone,
		weatherData: storedData,
		weatherMapData: storedWeatherMapData,
	}
}

export const WEATHER_CACHE_STORAGE_KEY = 'weather-please:weather-cache'

const cacheSchema = z.object({
	alertData: alertSchema,
	isDegraded: z.boolean(),
	lastUpdatedDate: lastUpdatedSchema,
	lat: z.string().min(1),
	lon: z.string().min(1),
	next24HoursData: next24HoursDataSchema,
	shouldUseAirQualityUv: z.boolean(),
	timeZone: z.string().min(1),
	version: z.literal(1),
	weatherData: dataSchema,
	weatherMapData: weatherMapDataSchema.nullable(),
})

export const getCachedWeather = ({
	allowStale = false,
	...identity
}: CacheIdentity & { allowStale?: boolean }): CachedWeather | null => {
	const cached = readCache()
	if (!cached || !isSameIdentity(cached, identity)) return null
	const age = getCurrentTimestamp() - cached.lastUpdatedDate.epochMilliseconds
	if (!allowStale && (age < 0 || age > CACHE_VALIDITY_MS)) return null
	return cached
}

export const hasCachedWeather = (): boolean => Boolean(readCache())

export const readCachedWeatherSnapshot = ():
	| (CachedWeather & CacheIdentity)
	| null => {
	if (typeof window === 'undefined') return null
	let key: string
	try {
		key = JSON.stringify(
			[WEATHER_CACHE_STORAGE_KEY, ...LEGACY_CACHE_KEYS].map((storageKey) =>
				window.localStorage.getItem(storageKey),
			),
		)
	} catch {
		return cachedSnapshot
	}
	if (key !== cachedSnapshotKey) {
		cachedSnapshotKey = key
		cachedSnapshot = readCache(false)
	}
	return cachedSnapshot
}

export const subscribeCachedWeather = (onChange: () => void): (() => void) => {
	// Migrate and repair persistence only after React has committed.
	readCache()
	cacheListeners.add(onChange)
	const handleStorage = (event: StorageEvent) => {
		if (
			event.key === null ||
			event.key === WEATHER_CACHE_STORAGE_KEY ||
			LEGACY_CACHE_KEYS.includes(event.key)
		)
			onChange()
	}
	window.addEventListener('storage', handleStorage)
	return () => {
		cacheListeners.delete(onChange)
		window.removeEventListener('storage', handleStorage)
	}
}

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

const persistCache = (cache: z.infer<typeof cacheSchema>): boolean => {
	const hasPersisted = writeLocalStorage({
		key: WEATHER_CACHE_STORAGE_KEY,
		value: JSON.stringify({
			...cache,
			lastUpdatedDate: cache.lastUpdatedDate.toString({
				fractionalSecondDigits: 3,
			}),
		}),
	})
	if (hasPersisted) {
		for (const listener of cacheListeners) listener()
	}
	return hasPersisted
}

const readCache = (shouldRepair = true): null | z.infer<typeof cacheSchema> => {
	const stored = readStorageItem({
		key: WEATHER_CACHE_STORAGE_KEY,
		parse: JSON.parse,
		schema: cacheSchema,
		shouldRepair,
	})
	if (stored) return stored
	const legacy = readLegacyCachedWeather(shouldRepair)
	if (!legacy) return null
	const migrated = { ...legacy, version: 1 as const }
	if (shouldRepair && persistCache(migrated)) {
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

const cacheListeners = new Set<() => void>()
let cachedSnapshotKey: string | undefined
let cachedSnapshot: (CachedWeather & CacheIdentity) | null = null

import { z } from 'zod'
import {
	CACHE_VALIDITY_MS,
	alertSchema,
	dataSchema,
	type Alerts,
	type Data,
} from './types'

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

export type CachedWeather = {
	weatherData: Data
	alertData: Alerts
	lastUpdatedDate: Date
}

type CacheIdentity = {
	lat: string
	lon: string
	timeZone: string
	shouldUseAirQualityUv: boolean
}

export const getCachedWeather = ({
	lat,
	lon,
	timeZone,
	shouldUseAirQualityUv,
}: CacheIdentity): CachedWeather | null => {
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

	if (
		cachedLat !== lat ||
		cachedLon !== lon ||
		cachedTimeZone !== timeZone ||
		cachedUseAirQualityUv !== shouldUseAirQualityUv
	) {
		return null
	}

	const isFresh = Date.now() - lastUpdatedDate.getTime() <= CACHE_VALIDITY_MS
	if (!isFresh) {
		return null
	}

	return {
		weatherData: storedData,
		alertData: storedAlerts,
		lastUpdatedDate,
	}
}

export const writeCachedWeather = ({
	weatherData,
	alertData,
	lat,
	lon,
	timeZone,
	shouldUseAirQualityUv,
	lastUpdatedDate,
}: CacheIdentity & {
	weatherData: Data
	alertData: Alerts
	lastUpdatedDate: Date
}) => {
	localStorage.setItem('data', JSON.stringify(weatherData))
	localStorage.setItem('alerts', JSON.stringify(alertData))
	localStorage.setItem('cachedLat', lat)
	localStorage.setItem('cachedLon', lon)
	localStorage.setItem('cachedTimeZone', timeZone)
	localStorage.setItem(
		'cachedUseAirQualityUv',
		JSON.stringify(shouldUseAirQualityUv),
	)
	localStorage.setItem('lastUpdated', lastUpdatedDate.toISOString())
}

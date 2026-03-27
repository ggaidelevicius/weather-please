import { z } from 'zod'

import {
	type Alerts,
	alertSchema,
	CACHE_VALIDITY_MS,
	type Data,
	dataSchema,
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
	normalize,
	parse,
	schema,
}: {
	key: string
	normalize?: (value: T) => string
	parse?: (value: string) => unknown
	schema: z.ZodType<T>
}): null | T => {
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
	alertData: Alerts
	lastUpdatedDate: Date
	weatherData: Data
}

type CacheIdentity = {
	lat: string
	lon: string
	shouldUseAirQualityUv: boolean
	timeZone: string
}

export const getCachedWeather = ({
	lat,
	lon,
	shouldUseAirQualityUv,
	timeZone,
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
		alertData: storedAlerts,
		lastUpdatedDate,
		weatherData: storedData,
	}
}

export const writeCachedWeather = ({
	alertData,
	lastUpdatedDate,
	lat,
	lon,
	shouldUseAirQualityUv,
	timeZone,
	weatherData,
}: CacheIdentity & {
	alertData: Alerts
	lastUpdatedDate: Date
	weatherData: Data
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

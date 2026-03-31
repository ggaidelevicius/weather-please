import { z } from 'zod'

const IDENTIFIED_LOCATION_CACHE_STORAGE_KEY = 'identifiedLocationCache'
const IDENTIFIED_LOCATION_CACHE_ENTRY_LIMIT = 24
const LOCATION_CACHE_COORDINATE_PRECISION = 3

const identifiedLocationCacheEntrySchema = z.object({
	label: z.string(),
	storedAt: z.number(),
})

const identifiedLocationCacheSchema = z.record(
	z.string(),
	identifiedLocationCacheEntrySchema,
)

export const getIdentifiedLocationCacheKey = ({
	lat,
	locale,
	lon,
}: {
	lat: string
	locale: string
	lon: string
}) => `${locale}:${roundCoordinate(lat)}:${roundCoordinate(lon)}`

export const getCachedIdentifiedLocationLabel = ({
	cacheKey,
}: {
	cacheKey: string
}): null | string => {
	const cache = readIdentifiedLocationCache()
	return cache?.[cacheKey]?.label ?? null
}

export const writeCachedIdentifiedLocationLabel = ({
	cacheKey,
	label,
}: {
	cacheKey: string
	label: string
}) => {
	const existingCache = readIdentifiedLocationCache() ?? {}
	const nextCache = {
		...existingCache,
		[cacheKey]: {
			label,
			storedAt: Date.now(),
		},
	}

	writeIdentifiedLocationCache(trimLocationCache(nextCache))
}

const readIdentifiedLocationCache = () => {
	if (typeof window === 'undefined') {
		return null
	}

	try {
		const rawCache = localStorage.getItem(IDENTIFIED_LOCATION_CACHE_STORAGE_KEY)
		if (!rawCache) {
			return null
		}

		const parsedCache = JSON.parse(rawCache)
		const validatedCache = identifiedLocationCacheSchema.safeParse(parsedCache)
		if (validatedCache.success) {
			return validatedCache.data
		}
	} catch {
		console.warn('Invalid identified location cache, ignoring stored value')
	}

	localStorage.removeItem(IDENTIFIED_LOCATION_CACHE_STORAGE_KEY)
	return null
}

const roundCoordinate = (coordinate: string) =>
	Number.parseFloat(coordinate).toFixed(LOCATION_CACHE_COORDINATE_PRECISION)

const trimLocationCache = (
	cache: Record<string, { label: string; storedAt: number }>,
) =>
	Object.fromEntries(
		Object.entries(cache)
			.sort(([, left], [, right]) => right.storedAt - left.storedAt)
			.slice(0, IDENTIFIED_LOCATION_CACHE_ENTRY_LIMIT),
	)

const writeIdentifiedLocationCache = (
	cache: Record<string, { label: string; storedAt: number }>,
) => {
	if (typeof window === 'undefined') {
		return
	}

	localStorage.setItem(
		IDENTIFIED_LOCATION_CACHE_STORAGE_KEY,
		JSON.stringify(cache),
	)
}

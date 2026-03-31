import { z } from 'zod'

const NOMINATIM_REVERSE_API_URL = 'https://nominatim.openstreetmap.org/reverse'

const reverseGeocodeResponseSchema = z.object({
	features: z.array(
		z.object({
			properties: z.object({
				geocoding: z
					.object({
						city: z.string().optional(),
						country: z.string().optional(),
						county: z.string().optional(),
						district: z.string().optional(),
						label: z.string().optional(),
						locality: z.string().optional(),
						name: z.string().optional(),
						state: z.string().optional(),
					})
					.passthrough(),
			}),
		}),
	),
})

type ReverseGeocoding = z.infer<
	typeof reverseGeocodeResponseSchema
>['features'][number]['properties']['geocoding']

export const fetchReverseGeocodeLabel = async ({
	lat,
	locale,
	lon,
	signal,
}: {
	lat: string
	locale: string
	lon: string
	signal?: AbortSignal
}): Promise<null | string> => {
	const searchParams = new URLSearchParams({
		'accept-language': locale,
		addressdetails: '1',
		format: 'geocodejson',
		lat,
		lon,
	})
	const response = await fetch(
		`${NOMINATIM_REVERSE_API_URL}?${searchParams.toString()}`,
		{ signal },
	)

	if (!response.ok) {
		throw new Error('Reverse geocoding failed')
	}

	const json = await response.json()
	const parsed = reverseGeocodeResponseSchema.safeParse(json)

	if (!parsed.success) {
		throw new Error('Invalid reverse geocoding response')
	}

	const geocoding = parsed.data.features[0]?.properties.geocoding
	return geocoding ? formatReverseGeocodeLabel(geocoding) : null
}

const formatReverseGeocodeLabel = (geocoding: ReverseGeocoding) => {
	const primary = getFirstDefinedValue([
		geocoding.locality,
		geocoding.city,
		geocoding.district,
		geocoding.county,
		geocoding.state,
		geocoding.country,
		geocoding.name,
	])
	const secondary = getFirstDefinedValue([
		isDistinctValue(geocoding.state, primary) ? geocoding.state : null,
		isDistinctValue(geocoding.country, primary) ? geocoding.country : null,
	])

	const labelParts = [primary, secondary].filter((value): value is string =>
		Boolean(value),
	)

	if (labelParts.length > 0) {
		return labelParts.join(', ')
	}

	return geocoding.label ?? geocoding.name ?? null
}

const getFirstDefinedValue = (values: Array<null | string | undefined>) => {
	for (const value of values) {
		if (typeof value === 'string' && value.trim().length > 0) {
			return value.trim()
		}
	}

	return null
}

const isDistinctValue = (
	value: null | string | undefined,
	comparison: null | string,
) => {
	if (typeof value !== 'string' || typeof comparison !== 'string') {
		return typeof value === 'string'
	}

	return value.trim().toLowerCase() !== comparison.trim().toLowerCase()
}

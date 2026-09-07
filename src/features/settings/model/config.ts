import { z } from 'zod'

import type { LocaleKey } from '../../../shared/lib/i18n'

import { locales } from '../../../shared/lib/i18n'
import {
	SEASONAL_EVENT_OVERRIDE_NONE,
	SeasonalEventId,
} from '../../seasonal-events/core/types'
import { CURRENT_CONFIG_VERSION } from '../migrations/config-migrations'
import {
	BOOLEAN_CONFIG_DEFAULTS,
	BOOLEAN_CONFIG_SCHEMA_SHAPE,
} from './boolean-settings'
import { TileIdentifier } from './tile-identifier'
import { TemperatureUnit, UnitSystem } from './unit-system'

// Coordinates come from `GeolocationCoordinates.toString()`, so any decimal
// precision must be accepted. Single source of truth shared with
// `hasValidCoordinates`.
const LATITUDE_PATTERN = /^[-+]?(90(\.0+)?|[1-8]?\d(\.\d+)?)$/
const LONGITUDE_PATTERN = /^[-+]?(180(\.0+)?|(1[0-7]\d|[1-9]?\d)(\.\d+)?)$/

export const configSchema = z.object({
	daysToRetrieve: z.string().regex(/^[1-9]$/),
	identifier: z.enum(TileIdentifier),
	installed: z.number().nonnegative(),
	lang: z.enum(Object.keys(locales) as [LocaleKey, ...LocaleKey[]]),
	lat: z.union([z.literal(''), z.string().regex(LATITUDE_PATTERN)]),
	lon: z.union([z.literal(''), z.string().regex(LONGITUDE_PATTERN)]),
	seasonalEventOverride: z.union([
		z.literal(SEASONAL_EVENT_OVERRIDE_NONE),
		z.enum(SeasonalEventId),
	]),
	temperatureUnit: z.enum(TemperatureUnit),
	unitSystem: z.enum(UnitSystem),
	...BOOLEAN_CONFIG_SCHEMA_SHAPE,
})

export const persistedConfigSchema = configSchema.extend({
	configVersion: z.literal(CURRENT_CONFIG_VERSION),
})

export type Config = z.infer<typeof configSchema>

export type PersistedConfig = z.infer<typeof persistedConfigSchema>

export const createDefaultConfig = (): Config => ({
	lang: 'en',
	lat: '',
	lon: '',
	seasonalEventOverride: SEASONAL_EVENT_OVERRIDE_NONE,
	...BOOLEAN_CONFIG_DEFAULTS,
	daysToRetrieve: '3',
	identifier: TileIdentifier.Day,
	installed: Date.now(),
	temperatureUnit: TemperatureUnit.Celsius,
	unitSystem: UnitSystem.Metric,
})

export const hasValidCoordinates = ({
	lat,
	lon,
}: Pick<Config, 'lat' | 'lon'>): boolean =>
	LATITUDE_PATTERN.test(lat) && LONGITUDE_PATTERN.test(lon)

export const repairConfig = (input: Record<string, unknown>): Config => {
	const defaults = createDefaultConfig()
	const validFields: Record<string, unknown> = {}
	for (const [key, schema] of Object.entries(configSchema.shape)) {
		const result = schema.safeParse(input[key])
		if (result.success) validFields[key] = result.data
	}
	return configSchema.parse({ ...defaults, ...validFields })
}

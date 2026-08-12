import { isLocationInAustralia } from '../../../shared/lib/location'
import { SEASONAL_EVENT_BACKGROUND_BOOLEAN_SETTINGS } from '../model/boolean-settings'
import { SEASONAL_EVENT_TOGGLE_KEY_BY_ID } from '../model/seasonal-event-toggle-map'
import { TemperatureUnit, UnitSystem } from '../model/unit-system'

export const CONFIG_MIGRATION_STATE_STORAGE_KEY =
	'weather-please:config-migration-state'

const PREVIOUS_CONFIG_VERSION = '2026.04.10' as const

export const CURRENT_CONFIG_VERSION = '2026.08.12' as const

export type ConfigMigrationState = {
	completedMigrationIds: string[]
	currentVersion: ConfigVersion
	failedMigrationIds: string[]
	lastRunAt: string
	skippedMigrationIds: string[]
}

export type ConfigMigrationStatus = 'completed' | 'failed' | 'skipped'

export type ConfigVersion =
	'legacy' | CurrentConfigVersion | PreviousConfigVersion

type ConfigMigration = {
	fromVersion: ConfigVersion
	id: string
	migrate: (input: Record<string, unknown>) => ConfigMigrationResult
	toVersion: CurrentConfigVersion | PreviousConfigVersion
}

type ConfigMigrationResult = {
	nextConfig: Record<string, unknown>
	status: Exclude<ConfigMigrationStatus, 'failed'>
}

type CurrentConfigVersion = typeof CURRENT_CONFIG_VERSION
type PreviousConfigVersion = typeof PREVIOUS_CONFIG_VERSION

export const LEGACY_TO_2026_04_10_MIGRATION_ID = 'legacy-to-2026.04.10'
export const ADD_SEASONAL_EVENT_BACKGROUND_SETTINGS_MIGRATION_ID =
	'add-seasonal-event-background-settings'

const isKnownConfigVersion = (
	value: unknown,
): value is CurrentConfigVersion | PreviousConfigVersion =>
	value === CURRENT_CONFIG_VERSION || value === PREVIOUS_CONFIG_VERSION

const getConfigVersion = (input: Record<string, unknown>): ConfigVersion =>
	isKnownConfigVersion(input.configVersion) ? input.configVersion : 'legacy'

const getLegacyUnitPreferences = (input: Record<string, unknown>) => {
	if (!('useMetric' in input)) {
		return null
	}

	return input.useMetric === false
		? {
				temperatureUnit: TemperatureUnit.Fahrenheit,
				unitSystem: UnitSystem.Imperial,
			}
		: {
				temperatureUnit: TemperatureUnit.Celsius,
				unitSystem: UnitSystem.Metric,
			}
}

const legacyTo20260410Migration: ConfigMigration = {
	fromVersion: 'legacy',
	id: LEGACY_TO_2026_04_10_MIGRATION_ID,
	migrate: (input) => {
		// intentional removal via spread to drop deprecated property
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { useMetric, ...rest } = input
		const legacyUnitPreferences = getLegacyUnitPreferences(input)
		const hasTemperatureUnit = typeof input.temperatureUnit === 'string'
		const hasUnitSystem = typeof input.unitSystem === 'string'
		const hasAirQualityOverride = 'useAirQualityUvOverride' in input
		const lat = typeof input.lat === 'string' ? input.lat : ''
		const lon = typeof input.lon === 'string' ? input.lon : ''
		const shouldEnableAirQualityUv =
			!hasAirQualityOverride &&
			Boolean(lat) &&
			Boolean(lon) &&
			isLocationInAustralia(lat, lon)
		const nextConfig = {
			...rest,
			...(hasTemperatureUnit
				? { temperatureUnit: input.temperatureUnit }
				: legacyUnitPreferences?.temperatureUnit
					? { temperatureUnit: legacyUnitPreferences.temperatureUnit }
					: undefined),
			...(hasUnitSystem
				? { unitSystem: input.unitSystem }
				: legacyUnitPreferences?.unitSystem
					? { unitSystem: legacyUnitPreferences.unitSystem }
					: undefined),
			...(shouldEnableAirQualityUv
				? { useAirQualityUvOverride: true }
				: undefined),
		}
		const didChangeSettings =
			legacyUnitPreferences !== null ||
			shouldEnableAirQualityUv ||
			!hasTemperatureUnit ||
			!hasUnitSystem ||
			'useMetric' in input

		return {
			nextConfig,
			status: didChangeSettings ? 'completed' : 'skipped',
		}
	},
	toVersion: PREVIOUS_CONFIG_VERSION,
}

const addSeasonalEventBackgroundSettingsMigration: ConfigMigration = {
	fromVersion: PREVIOUS_CONFIG_VERSION,
	id: ADD_SEASONAL_EVENT_BACKGROUND_SETTINGS_MIGRATION_ID,
	migrate: (input) => {
		let hasAddedSetting = false
		const nextConfig = { ...input }

		for (const setting of SEASONAL_EVENT_BACKGROUND_BOOLEAN_SETTINGS) {
			if (typeof input[setting.key] === 'boolean') {
				continue
			}

			const eventToggleKey =
				SEASONAL_EVENT_TOGGLE_KEY_BY_ID[setting.seasonalEventId]
			nextConfig[setting.key] =
				typeof input[eventToggleKey] === 'boolean'
					? input[eventToggleKey]
					: setting.defaultValue
			hasAddedSetting = true
		}

		return {
			nextConfig,
			status: hasAddedSetting ? 'completed' : 'skipped',
		}
	},
	toVersion: CURRENT_CONFIG_VERSION,
}

const CONFIG_MIGRATIONS: ConfigMigration[] = [
	legacyTo20260410Migration,
	addSeasonalEventBackgroundSettingsMigration,
]

type MigrateConfigResult =
	| {
			config: null
			shouldPersist: false
			state: ConfigMigrationState
			success: false
	  }
	| {
			config: Record<string, unknown>
			shouldPersist: boolean
			state: ConfigMigrationState
			success: true
	  }

export const migrateConfig = ({
	input,
}: Readonly<{ input: unknown }>): MigrateConfigResult => {
	const nextConfig =
		typeof input === 'object' && input !== null ? { ...input } : {}
	let currentVersion = getConfigVersion(nextConfig)
	const startingVersion = currentVersion
	const completedMigrationIds: string[] = []
	const failedMigrationIds: string[] = []
	const skippedMigrationIds: string[] = []

	while (currentVersion !== CURRENT_CONFIG_VERSION) {
		const migration = CONFIG_MIGRATIONS.find(
			(candidate) => candidate.fromVersion === currentVersion,
		)

		if (!migration) {
			failedMigrationIds.push(`missing-migration:${currentVersion}`)
			return {
				config: null,
				shouldPersist: false,
				state: {
					completedMigrationIds,
					currentVersion,
					failedMigrationIds,
					lastRunAt: new Date().toISOString(),
					skippedMigrationIds,
				},
				success: false,
			}
		}

		try {
			const result = migration.migrate(nextConfig)
			if (result.status === 'completed') {
				completedMigrationIds.push(migration.id)
			} else {
				skippedMigrationIds.push(migration.id)
			}

			Object.assign(nextConfig, result.nextConfig, {
				configVersion: migration.toVersion,
			})
			currentVersion = migration.toVersion
		} catch {
			failedMigrationIds.push(migration.id)
			return {
				config: null,
				shouldPersist: false,
				state: {
					completedMigrationIds,
					currentVersion,
					failedMigrationIds,
					lastRunAt: new Date().toISOString(),
					skippedMigrationIds,
				},
				success: false,
			}
		}
	}

	return {
		config: nextConfig,
		shouldPersist:
			startingVersion !== CURRENT_CONFIG_VERSION ||
			completedMigrationIds.length > 0 ||
			skippedMigrationIds.length > 0,
		state: {
			completedMigrationIds,
			currentVersion,
			failedMigrationIds,
			lastRunAt: new Date().toISOString(),
			skippedMigrationIds,
		},
		success: true,
	}
}

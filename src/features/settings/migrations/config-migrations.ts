import { isLocationInAustralia } from '../../../shared/lib/location'
import { TemperatureUnit, UnitSystem } from '../model/unit-system'

export const CONFIG_MIGRATION_STATE_STORAGE_KEY =
	'weather-please:config-migration-state'

export const CURRENT_CONFIG_VERSION = '2026.04.10' as const

export type ConfigMigrationState = {
	completedMigrationIds: string[]
	currentVersion: ConfigVersion
	failedMigrationIds: string[]
	lastRunAt: string
	skippedMigrationIds: string[]
}

export type ConfigMigrationStatus = 'completed' | 'failed' | 'skipped'

export type ConfigVersion = 'legacy' | CurrentConfigVersion

type ConfigMigration = {
	fromVersion: ConfigVersion
	id: string
	migrate: (input: Record<string, unknown>) => ConfigMigrationResult
	toVersion: CurrentConfigVersion
}

type ConfigMigrationResult = {
	nextConfig: Record<string, unknown>
	status: Exclude<ConfigMigrationStatus, 'failed'>
}

type CurrentConfigVersion = typeof CURRENT_CONFIG_VERSION

export const LEGACY_TO_2026_04_10_MIGRATION_ID = 'legacy-to-2026.04.10'

const isCurrentConfigVersion = (
	value: unknown,
): value is CurrentConfigVersion => value === CURRENT_CONFIG_VERSION

const getConfigVersion = (input: Record<string, unknown>): ConfigVersion =>
	isCurrentConfigVersion(input.configVersion) ? input.configVersion : 'legacy'

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
	toVersion: CURRENT_CONFIG_VERSION,
}

const CONFIG_MIGRATIONS: ConfigMigration[] = [legacyTo20260410Migration]

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

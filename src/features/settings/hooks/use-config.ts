import type { Dispatch, SetStateAction } from 'react'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { z } from 'zod'

import type { LocaleKey } from '../../../shared/lib/i18n'

import { mergeObjects } from '../../../shared/lib/helpers'
import { changeLocalisation, locales } from '../../../shared/lib/i18n'
import { isLocationInAustralia } from '../../../shared/lib/location'
import {
	CONFIG_MIGRATION_STATE_STORAGE_KEY,
	CURRENT_CONFIG_VERSION,
	migrateConfig,
} from '../migrations/config-migrations'
import {
	BOOLEAN_CONFIG_DEFAULTS,
	BOOLEAN_CONFIG_SCHEMA_SHAPE,
} from '../model/boolean-settings'
import { TileIdentifier } from '../model/tile-identifier'
import { TemperatureUnit, UnitSystem } from '../model/unit-system'

const configSchema = z.object({
	daysToRetrieve: z.string(),
	identifier: z.enum(TileIdentifier),
	installed: z.number(),
	lang: z.enum(Object.keys(locales) as [LocaleKey, ...LocaleKey[]]),
	lat: z.string().regex(/^(\+|-)?(?:90(?:\.0{1,6})?|[1-8]?\d(?:\.\d{1,6})?)$/),
	lon: z
		.string()
		.regex(
			/^(\+|-)?(?:180(?:\.0{1,6})?|((1[0-7]\d)|([1-9]?\d))(?:\.\d{1,6})?)$/,
		),
	temperatureUnit: z.enum(TemperatureUnit),
	unitSystem: z.enum(UnitSystem),
	...BOOLEAN_CONFIG_SCHEMA_SHAPE,
})

const persistedConfigSchema = configSchema.extend({
	configVersion: z.literal(CURRENT_CONFIG_VERSION),
})

export type Config = z.infer<typeof configSchema>

type PersistedConfig = z.infer<typeof persistedConfigSchema>

const initialState: Config = {
	lang: 'en',
	lat: '',
	lon: '',
	...BOOLEAN_CONFIG_DEFAULTS,
	daysToRetrieve: '3',
	identifier: TileIdentifier.Day,
	installed: new Date().getTime(),
	temperatureUnit: TemperatureUnit.Celsius,
	unitSystem: UnitSystem.Metric,
}

const useIsomorphicLayoutEffect =
	typeof window === 'undefined' ? useEffect : useLayoutEffect

const toPersistedConfig = (config: Config): PersistedConfig => ({
	...config,
	configVersion: CURRENT_CONFIG_VERSION,
})

const persistMigrationState = (state: unknown) => {
	if (typeof window === 'undefined') {
		return
	}

	localStorage.setItem(
		CONFIG_MIGRATION_STATE_STORAGE_KEY,
		JSON.stringify(state),
	)
}

const getInitialConfig = (): {
	config: Config
	nextStoredConfig: null | PersistedConfig
} => {
	if (typeof window === 'undefined') {
		return { config: initialState, nextStoredConfig: null }
	}

	try {
		const storedData = localStorage.getItem('config')
		if (!storedData) {
			return { config: initialState, nextStoredConfig: null }
		}

		const parsed = JSON.parse(storedData)
		const migrated = migrateConfig({ input: parsed })
		persistMigrationState(migrated.state)

		if (!migrated.success || !migrated.config) {
			console.warn('Failed to migrate config in localStorage, using defaults')
			return { config: initialState, nextStoredConfig: null }
		}

		const persistedMatch = persistedConfigSchema.safeParse(migrated.config)
		if (persistedMatch.success) {
			const { configVersion: _, ...persistedConfig } = persistedMatch.data
			return {
				config: persistedConfig,
				nextStoredConfig: migrated.shouldPersist ? persistedMatch.data : null,
			}
		}

		const merged = mergeObjects(migrated.config, initialState) as Config

		return {
			config: merged,
			nextStoredConfig: toPersistedConfig(merged),
		}
	} catch {
		console.warn('Invalid config in localStorage, using defaults')
		return { config: initialState, nextStoredConfig: null }
	}
}

const hasValidCoordinates = ({ lat, lon }: Config) =>
	Boolean(lat) &&
	Boolean(lon) &&
	/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(lat) &&
	/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/.test(lon)

const persistConfigInput = (input: Config) => {
	if (typeof window === 'undefined' || !hasValidCoordinates(input)) {
		return { nextConfig: null, nextInput: input }
	}

	const hasStoredConfig = Boolean(localStorage.getItem('config'))
	const shouldEnableAirQualityUv =
		!hasStoredConfig &&
		!input.useAirQualityUvOverride &&
		isLocationInAustralia(input.lat, input.lon)
	const nextConfig = shouldEnableAirQualityUv
		? { ...input, useAirQualityUvOverride: true }
		: input

	localStorage.setItem('config', JSON.stringify(toPersistedConfig(nextConfig)))

	return {
		nextConfig,
		nextInput: shouldEnableAirQualityUv ? nextConfig : input,
	}
}

export const useConfig = () => {
	const [config, setConfig] = useState<Config>(initialState)
	const [inputState, setInputState] = useState<Config>(initialState)
	const [isHydrated, setIsHydrated] = useState(false)
	const inputRef = useRef(initialState)

	useIsomorphicLayoutEffect(() => {
		const { config: storedConfig, nextStoredConfig } = getInitialConfig()
		if (nextStoredConfig) {
			localStorage.setItem('config', JSON.stringify(nextStoredConfig))
		}
		inputRef.current = storedConfig
		setConfig(storedConfig)
		setInputState(storedConfig)
		setIsHydrated(true)
	}, [])

	const applyInputUpdate = (nextInput: Config) => {
		const { nextConfig, nextInput: persistedInput } =
			persistConfigInput(nextInput)
		inputRef.current = persistedInput
		setInputState(persistedInput)
		if (nextConfig) {
			setConfig(nextConfig)
		}
	}

	const setInput: Dispatch<SetStateAction<Config>> = (value) => {
		const nextInput =
			typeof value === 'function' ? value(inputRef.current) : value
		applyInputUpdate(nextInput)
	}

	useEffect(() => {
		if (inputState.lang) {
			changeLocalisation(inputState.lang)
		}
	}, [inputState.lang])

	const handleChange = (k: keyof Config, v: Config[keyof Config]) => {
		setInput((prev) => ({
			...prev,
			[k]: typeof v === 'string' ? v.trim() : v,
		}))
	}

	const updateConfig = (updates: Partial<Config>) => {
		setInput((prev) => ({ ...prev, ...updates }))
	}

	return {
		config,
		handleChange,
		input: inputState,
		isHydrated,
		setInput,
		updateConfig,
	}
}

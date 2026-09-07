import type { Dispatch, SetStateAction } from 'react'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { changeLocalisation } from '../../../shared/lib/i18n'
import {
	readLocalStorage,
	writeLocalStorage,
} from '../../../shared/lib/local-storage'
import { isLocationInAustralia } from '../../../shared/lib/location'
import {
	CONFIG_MIGRATION_STATE_STORAGE_KEY,
	CURRENT_CONFIG_VERSION,
	migrateConfig,
} from '../migrations/config-migrations'
import {
	type Config,
	configSchema,
	createDefaultConfig,
	hasValidCoordinates,
	type PersistedConfig,
	persistedConfigSchema,
	repairConfig,
} from '../model/config'

const initialState = createDefaultConfig()

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

	writeLocalStorage({
		key: CONFIG_MIGRATION_STATE_STORAGE_KEY,
		value: JSON.stringify(state),
	})
}

const getInitialConfig = (): {
	config: Config
	nextStoredConfig: null | PersistedConfig
} => {
	if (typeof window === 'undefined') {
		return { config: initialState, nextStoredConfig: null }
	}

	try {
		const storedData = readLocalStorage('config')
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

		const merged = repairConfig(migrated.config)

		return {
			config: merged,
			nextStoredConfig: toPersistedConfig(merged),
		}
	} catch {
		console.warn('Invalid config in localStorage, using defaults')
		return { config: initialState, nextStoredConfig: null }
	}
}

const persistConfigInput = (input: Config) => {
	if (!configSchema.safeParse(input).success || !hasValidCoordinates(input)) {
		return { nextConfig: null, nextInput: input }
	}

	const hasStoredConfig = Boolean(readLocalStorage('config'))
	const shouldEnableAirQualityUv =
		!hasStoredConfig &&
		!input.useAirQualityUvOverride &&
		isLocationInAustralia(input.lat, input.lon)
	const nextConfig = shouldEnableAirQualityUv
		? { ...input, useAirQualityUvOverride: true }
		: input

	writeLocalStorage({
		key: 'config',
		value: JSON.stringify(toPersistedConfig(nextConfig)),
	})

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
			writeLocalStorage({
				key: 'config',
				value: JSON.stringify(nextStoredConfig),
			})
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

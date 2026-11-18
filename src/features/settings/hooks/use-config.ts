import type { Dispatch, SetStateAction } from 'react'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { changeLocalisation } from '../../../shared/lib/i18n'
import {
	readLocalStorage,
	writeLocalStorage,
} from '../../../shared/lib/local-storage'
import { isLocationInAustralia } from '../../../shared/lib/location'
import { runWithSharedLock } from '../../../shared/lib/shared-resource'
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

const readConfig = (
	storedData: null | string,
	shouldRecordMigration = false,
): {
	config: Config
	nextStoredConfig: null | PersistedConfig
} => {
	if (!storedData) {
		return { config: initialState, nextStoredConfig: null }
	}

	try {
		const parsed = JSON.parse(storedData)
		const migrated = migrateConfig({ input: parsed })
		if (shouldRecordMigration) persistMigrationState(migrated.state)

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

const getChangedFields = (previous: Config, next: Config): Partial<Config> =>
	Object.fromEntries(
		Object.entries(next).filter(
			([key, value]) => previous[key as keyof Config] !== value,
		),
	)

const withConfigLock = (work: () => void) => {
	if (!navigator.locks) {
		work()
		return
	}
	void runWithSharedLock({ key: 'config', work }).catch((error: unknown) => {
		console.error('Could not save settings:', error)
	})
}

export const useConfig = () => {
	const [config, setConfig] = useState<Config>(initialState)
	const [inputState, setInputState] = useState<Config>(initialState)
	const [isHydrated, setIsHydrated] = useState(false)
	const inputRef = useRef(initialState)
	const configRef = useRef(initialState)
	const pendingChanges = useRef<Partial<Config>>({})

	const adoptConfig = (nextConfig: Config) => {
		const draft = getChangedFields(configRef.current, inputRef.current)
		configRef.current = nextConfig
		inputRef.current = { ...nextConfig, ...draft }
		setConfig(nextConfig)
		setInputState(inputRef.current)
	}

	useIsomorphicLayoutEffect(() => {
		const raw = readLocalStorage('config')
		const { config: storedConfig, nextStoredConfig } = readConfig(raw, true)
		if (nextStoredConfig) {
			withConfigLock(() => {
				if (readLocalStorage('config') === raw)
					writeLocalStorage({
						key: 'config',
						value: JSON.stringify(nextStoredConfig),
					})
			})
		}
		configRef.current = storedConfig
		inputRef.current = storedConfig
		setConfig(storedConfig)
		setInputState(storedConfig)
		setIsHydrated(true)
		const handleStorage = (event: StorageEvent) => {
			if (
				(event.key === null || event.key === 'config') &&
				(!event.storageArea || event.storageArea === window.localStorage)
			) {
				const { config: latest } = readConfig(readLocalStorage('config'))
				adoptConfig({ ...latest, ...pendingChanges.current })
			}
		}
		window.addEventListener('storage', handleStorage)
		return () => window.removeEventListener('storage', handleStorage)
	}, [])

	const applyInputUpdate = (nextInput: Config) => {
		if (
			!hasValidCoordinates(nextInput) ||
			!configSchema.safeParse(nextInput).success
		) {
			inputRef.current = nextInput
			setInputState(nextInput)
			return
		}

		const shouldDefaultToCams =
			!hasValidCoordinates(configRef.current) &&
			!readLocalStorage('config') &&
			isLocationInAustralia(nextInput.lat, nextInput.lon)
		const nextConfig = shouldDefaultToCams
			? { ...nextInput, useAirQualityUvOverride: true }
			: nextInput
		pendingChanges.current = {
			...pendingChanges.current,
			...getChangedFields(configRef.current, nextConfig),
		}
		configRef.current = nextConfig
		inputRef.current = nextConfig
		setConfig(nextConfig)
		setInputState(nextConfig)

		// Other tabs may have saved since this input was rendered. Apply just this
		// tab's edits to the latest document while holding its write lock.
		withConfigLock(() => {
			if (Object.keys(pendingChanges.current).length === 0) return
			const raw = readLocalStorage('config')
			const storedConfig = raw ? readConfig(raw).config : configRef.current
			const merged = { ...storedConfig, ...pendingChanges.current }
			if (
				writeLocalStorage({
					key: 'config',
					value: JSON.stringify(toPersistedConfig(merged)),
				})
			) {
				pendingChanges.current = {}
				adoptConfig(merged)
			}
		})
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

import type { Dispatch, SetStateAction } from 'react'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { z } from 'zod'

import type { LocaleKey } from '../../../shared/lib/i18n'

import { mergeObjects } from '../../../shared/lib/helpers'
import { changeLocalisation, locales } from '../../../shared/lib/i18n'
import { isLocationInAustralia } from '../../../shared/lib/location'
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

export type Config = z.infer<typeof configSchema>

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

const isTemperatureUnit = (value: unknown): value is TemperatureUnit =>
	Object.values(TemperatureUnit).includes(value as TemperatureUnit)

const isUnitSystem = (value: unknown): value is UnitSystem =>
	Object.values(UnitSystem).includes(value as UnitSystem)

const getLegacyUnitPreferences = (parsed: unknown) => {
	if (
		typeof parsed !== 'object' ||
		parsed === null ||
		!('useMetric' in parsed)
	) {
		return null
	}

	return parsed.useMetric === false
		? {
				temperatureUnit: TemperatureUnit.Fahrenheit,
				unitSystem: UnitSystem.Imperial,
			}
		: {
				temperatureUnit: TemperatureUnit.Celsius,
				unitSystem: UnitSystem.Metric,
			}
}

const mergeStoredConfig = (parsed: unknown) => {
	const parsedObject =
		typeof parsed === 'object' && parsed !== null ? parsed : {}
	const merged = mergeObjects(parsedObject, initialState) as Config
	const legacyUnitPreferences = getLegacyUnitPreferences(parsed)
	const parsedTemperatureUnit =
		typeof parsed === 'object' &&
		parsed !== null &&
		'temperatureUnit' in parsed &&
		isTemperatureUnit(parsed.temperatureUnit)
			? parsed.temperatureUnit
			: null
	const parsedUnitSystem =
		typeof parsed === 'object' &&
		parsed !== null &&
		'unitSystem' in parsed &&
		isUnitSystem(parsed.unitSystem)
			? parsed.unitSystem
			: null

	return {
		...merged,
		temperatureUnit:
			parsedTemperatureUnit ??
			legacyUnitPreferences?.temperatureUnit ??
			initialState.temperatureUnit,
		unitSystem:
			parsedUnitSystem ??
			legacyUnitPreferences?.unitSystem ??
			initialState.unitSystem,
	}
}

const getInitialConfig = (): Config => {
	if (typeof window === 'undefined') {
		return initialState
	}

	try {
		const storedData = localStorage.getItem('config')
		if (!storedData) {
			return initialState
		}

		const parsed = JSON.parse(storedData)
		const objectShapesMatch = configSchema.safeParse(parsed)

		if (objectShapesMatch.success) {
			return parsed
		}

		const merged = mergeStoredConfig(parsed)
		const hasAirQualityOverrideKey =
			typeof parsed === 'object' &&
			parsed !== null &&
			'useAirQualityUvOverride' in parsed

		if (
			!hasAirQualityOverrideKey &&
			isLocationInAustralia(merged.lat, merged.lon)
		) {
			return { ...merged, useAirQualityUvOverride: true }
		}

		return merged
	} catch {
		console.warn('Invalid config in localStorage, using defaults')
		return initialState
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

	localStorage.setItem('config', JSON.stringify(nextConfig))

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
		const storedConfig = getInitialConfig()
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

	// Handle language changes
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

import { useEffect, useLayoutEffect, useState } from 'react'
import { z } from 'zod'
import {
	BOOLEAN_CONFIG_DEFAULTS,
	BOOLEAN_CONFIG_SCHEMA_SHAPE,
} from '../model/boolean-settings'
import { mergeObjects } from '../../../shared/lib/helpers'
import { changeLocalisation, locales } from '../../../shared/lib/i18n'
import { isLocationInAustralia } from '../../../shared/lib/location'
import { TileIdentifier } from '../model/tile-identifier'
import type { LocaleKey } from '../../../shared/lib/i18n'

const configSchema = z.object({
	daysToRetrieve: z.string(),
	identifier: z.nativeEnum(TileIdentifier),
	installed: z.number(),
	lang: z.enum(Object.keys(locales) as [LocaleKey, ...LocaleKey[]]),
	lat: z.string().regex(/^(\+|-)?(?:90(?:\.0{1,6})?|[1-8]?\d(?:\.\d{1,6})?)$/),
	lon: z
		.string()
		.regex(
			/^(\+|-)?(?:180(?:\.0{1,6})?|((1[0-7]\d)|([1-9]?\d))(?:\.\d{1,6})?)$/,
		),
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
}

const useIsomorphicLayoutEffect =
	typeof window === 'undefined' ? useEffect : useLayoutEffect

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

		const merged = mergeObjects(parsed, initialState) as Config
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

export const useConfig = () => {
	const [config, setConfig] = useState<Config>(initialState)
	const [input, setInput] = useState<Config>(initialState)
	const [isHydrated, setIsHydrated] = useState(false)

	useIsomorphicLayoutEffect(() => {
		const storedConfig = getInitialConfig()
		setConfig(storedConfig)
		setInput(storedConfig)
		setIsHydrated(true)
	}, [])

	// Save config when input changes and is valid
	useEffect(() => {
		if (
			input.lat &&
			input.lon &&
			/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(input.lat) &&
			/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/.test(
				input.lon,
			)
		) {
			const hasStoredConfig = Boolean(localStorage.getItem('config'))
			const shouldEnableAirQualityUv =
				!hasStoredConfig &&
				!input.useAirQualityUvOverride &&
				isLocationInAustralia(input.lat, input.lon)
			const nextConfig = shouldEnableAirQualityUv
				? { ...input, useAirQualityUvOverride: true }
				: input
			localStorage.setItem('config', JSON.stringify(nextConfig))
			setConfig(nextConfig)
			if (shouldEnableAirQualityUv) {
				setInput(nextConfig)
			}
		}
	}, [input])

	// Handle language changes
	useEffect(() => {
		if (input.lang) {
			changeLocalisation(input.lang)
		}
	}, [input.lang])

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
		input,
		handleChange,
		updateConfig,
		setInput,
		isHydrated,
	}
}

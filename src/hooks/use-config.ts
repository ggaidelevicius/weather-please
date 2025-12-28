import { useEffect, useState } from 'react'
import { z } from 'zod'
import { mergeObjects } from '../lib/helpers'
import { changeLocalisation, locales } from '../lib/i18n'
import type { LocaleKey } from '../lib/i18n'

const configSchema = z.object({
	daysToRetrieve: z.string(),
	displayedReviewPrompt: z.boolean(),
	identifier: z.enum(['day', 'date']),
	installed: z.number(),
	lang: z.enum(Object.keys(locales) as [LocaleKey, ...LocaleKey[]]),
	lat: z.string().regex(/^(\+|-)?(?:90(?:\.0{1,6})?|[1-8]?\d(?:\.\d{1,6})?)$/),
	lon: z
		.string()
		.regex(
			/^(\+|-)?(?:180(?:\.0{1,6})?|((1[0-7]\d)|([1-9]?\d))(?:\.\d{1,6})?)$/,
		),
	periodicLocationUpdate: z.boolean(),
	showAlerts: z.boolean(),
	showPrecipitationAlerts: z.boolean(),
	showUvAlerts: z.boolean(),
	showVisibilityAlerts: z.boolean(),
	showWindAlerts: z.boolean(),
	useMetric: z.boolean(),
})

export type Config = z.infer<typeof configSchema>

const initialState: Config = {
	lang: 'en',
	lat: '',
	lon: '',
	periodicLocationUpdate: false,
	useMetric: true,
	showAlerts: true,
	showUvAlerts: true,
	showWindAlerts: true,
	showVisibilityAlerts: true,
	showPrecipitationAlerts: true,
	daysToRetrieve: '3',
	identifier: 'day',
	installed: new Date().getTime(),
	displayedReviewPrompt: false,
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
		} else {
			return mergeObjects(parsed, initialState) as Config
		}
	} catch {
		console.warn('Invalid config in localStorage, using defaults')
		return initialState
	}
}

export const useConfig = () => {
	const [config, setConfig] = useState<Config>(getInitialConfig)
	const [input, setInput] = useState<Config>(getInitialConfig)

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
			localStorage.setItem('config', JSON.stringify(input))
			setConfig(input)
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
	}
}

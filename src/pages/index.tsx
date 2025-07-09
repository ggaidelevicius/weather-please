import { Initialisation } from '@/components/initialisation'
import { RingLoader } from '@/components/loader'
import { ReviewPrompt } from '@/components/review-prompt'
import { Settings } from '@/components/settings'
import { Tile } from '@/components/tile'
import { WeatherAlert } from '@/components/weather-alert'
import { useWeather } from '@/hooks/use-weather'
import { mergeObjects } from '@/lib/helpers'
import { i18n } from '@lingui/core'
import { Trans } from '@lingui/react/macro'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { changeLocalisation, locales } from '../lib/i18n'
import { messages } from '../locales/en/messages'

i18n.load({
	en: messages,
})
i18n.activate('en')

const configSchema = z.object({
	daysToRetrieve: z.string(),
	displayedReviewPrompt: z.boolean(),
	identifier: z.enum(['day', 'date']),
	installed: z.number(),
	lang: z.enum(Object.keys(locales).map((key) => key) as [string, ...string[]]),
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

const App = () => {
	const [config, setConfig] = useState<Config>(initialState)
	const [input, setInput] = useState<Config>(initialState)
	const [changedLocation, setChangedLocation] = useState<boolean>(false)

	const currentDateRef = useRef(new Date().getDate())

	const { weatherData, alertData, isLoading, error } = useWeather(
		config.lat,
		config.lon,
		changedLocation,
	)

	useEffect(() => {
		if (changedLocation) {
			setChangedLocation(false)
		}
	}, [changedLocation])

	useEffect(() => {
		if (error) {
			console.error('Weather fetch error:', error)
		}
	}, [error])

	/**
	 * Synchronizes the active language with the language specified in the configuration.
	 *
	 * This effect listens for changes to `input.lang`. If `input.lang` is truthy, it will
	 * invoke the `i18n.activate` function with `input.lang` as its argument, changing the
	 * active language to the one specified in the configuration. This facilitates the dynamic
	 * switching of languages in Weather Please, allowing it to support internationalization.
	 *
	 * Input is used rather than config so users have instant feedback.
	 */
	useEffect(() => {
		if (input.lang) {
			changeLocalisation(input.lang)
		}
	}, [input.lang])

	/**
	 * On component mount, this effect hook checks the localStorage for a saved "config".
	 *
	 * - If "config" exists in localStorage, it is parsed and the states of both "config" and "input" are set.
	 * - If the object shape of the stored data matches the current "config", both states are directly set to the stored value.
	 * - If they don't match, the stored data is merged with the current "config" and the merged result is set to both states.
	 */
	useEffect(() => {
		const storedData = localStorage?.config
			? JSON.parse(localStorage.config)
			: null
		if (storedData) {
			const objectShapesMatch = configSchema.safeParse(storedData)
			if (objectShapesMatch.success) {
				setConfig(storedData)
				setInput(storedData)
			} else {
				const mergedObject = mergeObjects(storedData, config)
				setConfig(mergedObject as Config)
				setInput(mergedObject as Config)
			}
		}
	}, [])

	/**
	 * Manages updates to the "input" state.
	 *
	 * Takes in a key and a value. Existing attributes of the "input" state are retained,
	 * while the provided attribute (key-value pair) will either be added or, if the key already exists,
	 * its value will be overwritten with the new one.
	 */
	const handleChange = (k: keyof Config, v: Config[keyof Config]) => {
		setInput((prev) => {
			return {
				...prev,
				[k]: typeof v === 'string' ? v.trim() : v,
			}
		})
	}

	useEffect(() => {
		if (
			input.lat &&
			input.lon &&
			/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(input.lat) &&
			/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/.test(
				input.lon,
			)
		) {
			localStorage.config = JSON.stringify(input)
			setConfig(input)
		}
	}, [input])

	/**
	 * Periodically (every minute) checks if the current date has changed.
	 * If it's a new day and the user has opted-in for periodic location updates,
	 * the user's geolocation is checked
	 *
	 * If the geolocation has changed from what's saved in "config", the "changedLocation" flag is set to true.
	 *
	 * TODO:
	 *  - Consider abstracting the geolocation identifying techniques for code reusability and maintainability.
	 */
	useEffect(() => {
		const checkDate = setInterval(() => {
			if (new Date().getDate() !== currentDateRef.current) {
				currentDateRef.current = new Date().getDate()
			}
		}, 6e4)

		if (config.periodicLocationUpdate) {
			try {
				navigator.geolocation.getCurrentPosition((pos) => {
					if (
						config.lat !== pos.coords.latitude.toString() ||
						config.lon !== pos.coords.longitude.toString()
					) {
						setChangedLocation(true)
					}
					setInput((prev) => ({
						...prev,
						lat: pos.coords.latitude.toString(),
						lon: pos.coords.longitude.toString(),
					}))
				})
			} catch (e) {
				console.error(e)
			}
		}
		return () => {
			clearInterval(checkDate)
		}
	}, [currentDateRef, config.periodicLocationUpdate])

	const tiles = weatherData
		.slice(0, parseInt(config.daysToRetrieve))
		.map((day, index) => {
			let delayBaseline = 0.75
			if (localStorage.data) {
				delayBaseline = 0
			}
			return (
				<Tile
					{...day}
					key={day.day}
					index={index}
					delayBaseline={delayBaseline}
					useMetric={config.useMetric}
					identifier={config.identifier}
				/>
			)
		})

	return (
		<>
			{config.showAlerts && (
				<AnimatePresence>
					<WeatherAlert
						{...alertData}
						useMetric={config.useMetric}
						showUvAlerts={config.showUvAlerts}
						showWindAlerts={config.showWindAlerts}
						showVisibilityAlerts={config.showVisibilityAlerts}
						showPrecipitationAlerts={config.showPrecipitationAlerts}
					/>
				</AnimatePresence>
			)}
			<ReviewPrompt config={config} setInput={setInput} />
			<AnimatePresence>
				<motion.main
					className={`relative grid min-h-[84px] min-w-[84px] grid-cols-1 gap-5 p-5 ${config.daysToRetrieve === '1' ? 'lg:grid-cols-1' : ''}${config.daysToRetrieve === '2' ? 'lg:grid-cols-2' : ''}${config.daysToRetrieve === '3' ? 'lg:grid-cols-3' : ''}${config.daysToRetrieve === '4' ? 'lg:grid-cols-4' : ''}${config.daysToRetrieve === '5' ? 'lg:grid-cols-5' : ''}${config.daysToRetrieve === '6' ? 'lg:grid-cols-3' : ''}${config.daysToRetrieve === '7' ? 'lg:grid-cols-3' : ''}${config.daysToRetrieve === '8' ? 'lg:grid-cols-4' : ''}${config.daysToRetrieve === '9' ? 'lg:grid-cols-3' : ''}`}
				>
					<Initialisation
						setInput={setInput}
						input={input}
						handleChange={handleChange}
						pending={!config?.lat || !config?.lon}
					/>
					{isLoading ? (
						<AnimatePresence>
							<RingLoader />
						</AnimatePresence>
					) : (
						<AnimatePresence>{tiles}</AnimatePresence>
					)}
				</motion.main>
			</AnimatePresence>

			<a
				href="https://open-meteo.com/"
				target="_blank"
				className="fixed bottom-4 left-4 text-xs text-dark-300 hover:underline focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500"
			>
				<Trans>weather data provided by open-meteo</Trans>
			</a>

			<Settings handleChange={handleChange} input={input} />
		</>
	)
}

export default App

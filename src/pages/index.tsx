import { Initialisation } from '@/components/initialisation'
import { RingLoader } from '@/components/loader'
import { ReviewPrompt } from '@/components/review-prompt'
import { Settings } from '@/components/settings'
import { Tile } from '@/components/tile'
import { WeatherAlert } from '@/components/weather-alert'
import { mergeObjects } from '@/lib/helpers'
import { i18n } from '@lingui/core'
import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { changeLocalisation, locales } from '../lib/i18n'
import { messages } from '../locales/en/messages'
import { queryClient } from './_app'

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

const dataSchema = z
	.array(
		z.object({
			day: z.number(),
			description: z.number(),
			max: z.number(),
			min: z.number(),
			rain: z.number(),
			uv: z.number(),
			wind: z.number(),
		}),
	)
	.min(1)
	.max(9)

type Data = z.infer<typeof dataSchema>

const alertSchema = z.object({
	hoursOfExtremeUv: z.array(z.boolean()).length(13),
	hoursOfLowVisibility: z.array(z.boolean()).length(25),
	hoursOfStrongWind: z.array(z.boolean()).length(25),
	hoursOfStrongWindGusts: z.array(z.boolean()).length(25),
	totalPrecipitation: z.object({
		duration: z.array(z.boolean()).length(25),
		precipitation: z.object({
			flag: z.boolean(),
			value: z.number(),
			zeroCount: z.number(),
		}),
	}),
})

export type Alerts = z.infer<typeof alertSchema>

interface WeatherData {
	latitude: number
	longitude: number
	generationtime_ms: number
	utc_offset_seconds: number
	timezone: string
	timezone_abbreviation: string
	elevation: number
	hourly_units: HourlyUnits
	hourly: HourlyData
	daily_units: DailyUnits
	daily: DailyData
}

interface HourlyUnits {
	time: string
	precipitation: string
	uv_index: string
	windspeed_10m: string
	visibility: string
	windgusts_10m: string
}

interface HourlyData {
	time: number[]
	precipitation: number[]
	uv_index: number[]
	windspeed_10m: number[]
	visibility: number[]
	windgusts_10m: number[]
}

interface DailyUnits {
	time: string
	weathercode: string
	temperature_2m_max: string
	temperature_2m_min: string
	uv_index_max: string
	precipitation_probability_max: string
	windspeed_10m_max: string
}

interface DailyData {
	time: number[]
	weathercode: number[]
	temperature_2m_max: number[]
	temperature_2m_min: number[]
	uv_index_max: number[]
	precipitation_probability_max: number[]
	windspeed_10m_max: number[]
}

const App = () => {
	const [alertData, setAlertData] = useState<Alerts>({
		totalPrecipitation: {
			precipitation: {
				value: 0,
				flag: false,
				zeroCount: 0,
			},
			duration: Array(25).fill(false),
		},
		hoursOfExtremeUv: Array(13).fill(false),
		hoursOfStrongWind: Array(25).fill(false),
		hoursOfLowVisibility: Array(25).fill(false),
		hoursOfStrongWindGusts: Array(25).fill(false),
	})
	const [weatherData, setWeatherData] = useState<[] | Data>([])
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
	const [config, setConfig] = useState<Config>(initialState)
	const [input, setInput] = useState<Config>(initialState)
	const [changedLocation, setChangedLocation] = useState<boolean>(false)
	const [usingCachedData, setUsingCachedData] = useState(true)

	const currentDateRef = useRef(new Date().getDate())
	const lastHourRef = useRef(new Date().getHours())

	const { error, data } = useQuery<WeatherData>({
		queryKey: ['weather', config.lat, config.lon, usingCachedData],
		queryFn: () =>
			fetch(
				`https://api.open-meteo.com/v1/forecast?latitude=${config.lat}&longitude=${config.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,windspeed_10m_max&timeformat=unixtime&timezone=auto&hourly=precipitation,uv_index,windspeed_10m,visibility,windgusts_10m&forecast_days=9`,
			).then((res) => res.json()),
		enabled: Boolean(config.lat) && Boolean(config.lon) && !usingCachedData,
	})

	// good to go - still needs error display
	useEffect(() => {
		if (data) {
			const now = new Date()
			const currentHour = now.getHours()

			const futureData = data.daily.time.map((day, i: number) => ({
				day,
				max: data.daily.temperature_2m_max[i],
				min: data.daily.temperature_2m_min[i],
				description: data.daily.weathercode[i],
				uv: data.daily.uv_index_max[i],
				wind: data.daily.windspeed_10m_max[i],
				rain: data.daily.precipitation_probability_max[i],
			}))
			setWeatherData(futureData)
			localStorage.data = JSON.stringify(futureData)

			const alerts = {
				totalPrecipitation: {
					precipitation: data.hourly.precipitation
						.slice(currentHour, currentHour + 25)
						.reduce(
							(
								p: { value: number; flag: boolean; zeroCount: number },
								c: number,
							) => {
								if (p.flag) {
									return { ...p, flag: true }
								}
								if (c === 0) {
									if (p.zeroCount === 3) {
										return { ...p, flag: true }
									}
									return {
										value: p.value,
										flag: false,
										zeroCount: p.zeroCount + 1,
									}
								}
								return { value: p.value + c, flag: false, zeroCount: 0 }
							},
							{ value: 0, flag: false, zeroCount: 0 },
						),
					duration: (() => {
						let negativeCount = 0
						return data.hourly.precipitation
							.slice(currentHour, currentHour + 25)
							.map((val: number) => {
								if (negativeCount === 3) {
									return false
								}
								if (val === 0) {
									negativeCount++
									return true
								}
								negativeCount = 0
								return true
							})
					})(),
				},
				hoursOfExtremeUv: data.hourly.uv_index
					.slice(currentHour, currentHour + 13)
					.map((val: number) => val >= 11),
				hoursOfStrongWind: data.hourly.windspeed_10m
					.slice(currentHour, currentHour + 25)
					.map((val: number) => val >= 60),
				hoursOfStrongWindGusts: data.hourly.windgusts_10m
					.slice(currentHour, currentHour + 25)
					.map((val: number) => val >= 80),
				hoursOfLowVisibility: data.hourly.visibility
					.slice(currentHour, currentHour + 25)
					.map((val: number) => val <= 200),
			}
			setAlertData(alerts)
			localStorage.alerts = JSON.stringify(alerts)

			localStorage.lastUpdated = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`

			if (changedLocation) {
				setChangedLocation(false)
			}
		} else if (error) {
			// eslint-disable-next-line no-console
			console.error(error)
			// notifications.show({
			// 	title: <Trans>Error</Trans>,
			// 	message: (
			// 		<Trans>
			// 			An error has occurred while fetching weather data. Please try again
			// 			later.
			// 		</Trans>
			// 	),
			// 	color: 'red',
			// })
		}
	}, [data, error, changedLocation])

	// good to go
	useEffect(() => {
		const interval = setInterval(() => {
			const currentHour = new Date().getHours()
			if (currentHour !== lastHourRef.current) {
				lastHourRef.current = currentHour
				setUsingCachedData(false)
				queryClient.invalidateQueries({ queryKey: ['weather'] })
			}
		}, 6e4)

		return () => clearInterval(interval)
	}, [])

	/**
	 * Synchronizes the active language with the language specified in the configuration.
	 *
	 * This effect listens for changes to `input.lang`. If `input.lang` is truthy, it will
	 * invoke the `i18n.activate` function with `input.lang` as its argument, changing the
	 * active language to the one specified in the configuration. This facilitates the dynamic
	 * switching of languages in Weather Please, allowing it to support internationalization.
	 *
	 * Input is used rather than config so users have instant feedback without first needing to
	 * understand what the text on the 'save' or 'set my location' buttons do.
	 */
	// good to go
	useEffect(() => {
		if (input.lang) {
			changeLocalisation(input.lang)
		}
	}, [input.lang])

	/**
	 * On component mount, this effect hook checks the localStorage for a saved "config".
	 *
	 * - If "config" exists in localStorage, it is parsed and the states of both "config" and "input" are set.
	 *   - If the object shape of the stored data matches the current "config", both states are directly set to the stored value.
	 *   - If they don't match, the stored data is merged with the current "config" and the merged result is set to both states.
	 *
	 * - If "config" does not exist in localStorage, the <Initialisation /> modal is opened to prompt the user for initial configuration.
	 */
	// good to go
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	/**
	 * This effect hook is responsible for managing the weather data, deciding between using cached data or fetching new data.
	 *
	 * Process overview:
	 * - It first checks if there's cached weather data available in localStorage and verifies the timestamp of the last update.
	 * - The criteria for using cached data include:
	 *   - The date and hour of the last update match the current date and hour to ensure data is up-to-date by the hour.
	 *   - The amount of data (days retrieved) in the cache matches the user's current preference.
	 *   - The user's location has not changed since the last data fetch.
	 * - If the cached data meets these criteria, the weather states are set using the cached data from localStorage.
	 * - If the cached data does not meet the criteria or is absent, a flag is set to indicate that cached data is not being used, prompting a data refresh.
	 *
	 * Important considerations:
	 * - This effect depends on changes to the user's location (latitude and longitude), the number of days to retrieve, and whether the user's location has changed.
	 * - The effect does not directly fetch new data but sets conditions for determining the data source (cached or fresh).
	 * - It ensures that data used is timely and relevant, either by validating cached data against current criteria or signaling the need for new data fetching.
	 */
	useEffect(() => {
		if (changedLocation) {
			setUsingCachedData(false)
		} else if (isLocalStorageDataValid()) {
			setWeatherData(JSON.parse(localStorage.data))
			setAlertData(JSON.parse(localStorage.alerts))
		} else {
			setUsingCachedData(false)
		}
	}, [config.lat, config.lon, changedLocation])

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
				<motion.main className="relative grid min-h-[84px] max-w-4xl min-w-[84px] grid-cols-3 gap-5 p-5">
					<Initialisation
						setInput={setInput}
						input={input}
						handleChange={handleChange}
						pending={!config?.lat || !config?.lon}
					/>
					{weatherData.length === 0 ? (
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

const isLocalStorageDataValid = () => {
	const { data, lastUpdated, alerts } = localStorage
	if (!data || !lastUpdated) return false

	const [year, month, day, hour] = lastUpdated.split('-').map(Number)
	const currentDate = new Date()
	const isSameYear = currentDate.getFullYear() === year
	const isSameMonth = currentDate.getMonth() === month
	const isSameDay = currentDate.getDate() === day
	const isSameHour = currentDate.getHours() === hour
	const storedAlertsAreValid = alertSchema.safeParse(JSON.parse(alerts))
	const storedDataIsValid = dataSchema.safeParse(JSON.parse(data))

	return (
		isSameYear &&
		isSameMonth &&
		isSameDay &&
		isSameHour &&
		storedAlertsAreValid.success &&
		storedDataIsValid.success
	)
}

export default App

import Alert from '@/components/alert'
import type { CurrentWeatherProps } from '@/components/alert/types'
import Initialisation from '@/components/intialisation'
import { RingLoader } from '@/components/loader'
import Settings from '@/components/settings'
import Tile from '@/components/tile'
import type { TileProps } from '@/components/tile/types'
import styles from '@/styles/styles.module.css'
import type {
	CompareObjects,
	ConfigProps,
	DetermineGridColumns,
	HandleChange,
	HandleClick,
	MergeObjects,
	TileComponent,
} from '@/util/types'
import { i18n } from '@lingui/core'
import { Trans } from '@lingui/macro'
import { Button, Loader } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import * as Sentry from '@sentry/nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { messages } from '../locales/en/messages'
import { changeLocalisation } from '../util/i18n'

i18n.load({
	en: messages,
})
i18n.activate('en')

const WeatherPlease: FC<{}> = () => {
	const initialCurrentWeatherData = {
		totalPrecipitation: {
			precipitation: {
				value: 0,
				flag: false,
			},
			duration: [false],
		},
		hoursOfExtremeUv: [false],
		hoursOfStrongWind: [false],
		hoursOfLowVisibility: [false],
		hoursOfStrongWindGusts: [false],
	}
	const [currentWeatherData, setCurrentWeatherData] =
		useState<CurrentWeatherProps>(initialCurrentWeatherData)
	const [localStorageCurrentWeatherData, setLocalStorageCurrentWeatherData] =
		useState<CurrentWeatherProps>(initialCurrentWeatherData)
	const [futureWeatherData, setFutureWeatherData] = useState<[] | TileProps[]>(
		[],
	)
	const [currentHour, setCurrentHour] = useState<number>(new Date().getHours())
	const [currentDate, setCurrentDate] = useState<number>(new Date().getDate())
	const [loading, setLoading] = useState<boolean>(false)
	const [geolocationError, setGeolocationError] = useState<boolean>(false)
	const [opened, { open, close }] = useDisclosure(false)
	const initialState: ConfigProps = {
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
		shareCrashesAndErrors: false,
		installed: new Date().getTime(),
		displayedReviewPrompt: false,
	}
	const [config, setConfig] = useState<ConfigProps>(initialState)
	const [input, setInput] = useState<ConfigProps>(initialState)
	const [usingFreshData, setUsingFreshData] = useState<boolean>(false)
	const [changedLocation, setChangedLocation] = useState<boolean>(false)
	const [completedFirstLoad, setCompletedFirstLoad] = useState<boolean>(false)
	const [reviewLink, setReviewLink] = useState(
		'https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn/reviews',
	)
	const [usingSafari, setUsingSafari] = useState<boolean>(false)

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
	useEffect(() => {
		if (input.lang) {
			changeLocalisation(input.lang, config.shareCrashesAndErrors)
		}
	}, [input.lang, config.shareCrashesAndErrors])

	/**
	 * Initializes or closes the Sentry error reporting based on user permissions.
	 *
	 * When the `config.shareCrashesAndErrors` value changes (either read from localStorage or
	 * updated in the app), this effect hook checks its value. If the user has granted permission,
	 * Sentry is initialized to capture and report crashes and errors. If the permission is not given,
	 * Sentry is closed to stop any error reporting.
	 */
	useEffect(() => {
		if (config.shareCrashesAndErrors) {
			Sentry.init({
				dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? '',
				tracesSampleRate: 1,
				debug: false,
				replaysOnErrorSampleRate: 1.0,
				replaysSessionSampleRate: 0,
				beforeSend: (event) => event,
			})
		} else {
			Sentry.close()
		}
		return () => {
			Sentry.close()
		}
	}, [config.shareCrashesAndErrors])

	/**
	 * On component mount, this effect hook checks the localStorage for a saved "config".
	 *
	 * - If "config" exists in localStorage, it is parsed and the states of both "config" and "input" are set.
	 *   - If the object shape of the stored data matches the current "config", both states are directly set to the stored value.
	 *   - If they don't match, the stored data is merged with the current "config" and the merged result is set to both states.
	 *
	 * - If "config" does not exist in localStorage, the <Initialisation /> modal is opened to prompt the user for initial configuration.
	 */
	useEffect(() => {
		const storedData = localStorage?.config
			? JSON.parse(localStorage.config)
			: null
		if (storedData) {
			const objectShapesMatch = compareObjects(storedData, config) // should we be comparing against initialState here instead?
			if (objectShapesMatch) {
				setConfig(storedData)
				setInput(storedData)
				if (
					new Date().getTime() - storedData.installed >= 2419200000 &&
					!storedData.displayedReviewPrompt
				) {
					setTimeout(() => {
						displayReviewPrompt()
					}, 1e3)
				}
			} else {
				const mergedObject = mergeObjects(storedData, config) // should we be comparing against initialState here instead?
				setConfig(mergedObject as ConfigProps)
				setInput(mergedObject as ConfigProps) // we lose the generic capability of the function here
				if (
					new Date().getTime() - mergedObject.installed >= 2419200000 &&
					!mergedObject.displayedReviewPrompt
				) {
					setTimeout(() => {
						displayReviewPrompt()
					}, 1e3)
				}
			}
		} else {
			open()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	/**
	 * This effect hook manages fetching and updating weather data.
	 *
	 * - Initially, it checks localStorage to determine if we can use cached weather data. For cached data to be used:
	 *   - The current hour should match when the data was last updated.
	 *   - The user location and data retrieval preferences in "config" shouldn't have changed since the last fetch.
	 *
	 * - If the criteria for cached data are met, it sets the weather states using data from localStorage.
	 *
	 * - Otherwise, it fetches fresh weather data, saves it to the state and localStorage, and updates the time of the last update.
	 *
	 * - To ensure data freshness, every minute the hook checks if the hour has changed. If it has, the effect reruns to potentially fetch fresh data.
	 */
	useEffect(() => {
		const fetchData = async (): Promise<void> => {
			try {
				const req = await fetch(
					`https://api.open-meteo.com/v1/forecast?latitude=${config.lat}&longitude=${config.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,windspeed_10m_max&timeformat=unixtime&timezone=auto&hourly=precipitation,uv_index,windspeed_10m,visibility,windgusts_10m&forecast_days=${config.daysToRetrieve}`,
				)
				const res = await req.json()
				const futureData = res.daily.time.map((day: unknown, i: number) => ({
					day,
					max: res.daily.temperature_2m_max[i],
					min: res.daily.temperature_2m_min[i],
					description: res.daily.weathercode[i],
					uv: res.daily.uv_index_max[i],
					wind: res.daily.windspeed_10m_max[i],
					rain: res.daily.precipitation_probability_max[i],
				}))
				// const chooseWeather = () => { // mock data generator
				//   const weatherCodes = [
				//     0, // Clear sky
				//     1, 2, 3, // Mainly clear, partly cloudy, and overcast
				//     45, 48, // Fog and depositing rime fog
				//     51, 53, 55, // Drizzle: Light, moderate, and dense intensity
				//     56, 57, // Freezing Drizzle: Light and dense intensity
				//     61, 63, 65, // Rain: Slight, moderate, and heavy intensity
				//     66, 67, // Freezing Rain: Light and heavy intensity
				//     71, 73, 75, // Snow fall: Slight, moderate, and heavy intensity
				//     77, // Snow grains
				//     80, 81, 82, // Rain showers: Slight, moderate, and violent
				//     85, 86, // Snow showers slight and heavy
				//     95, // Thunderstorm: Slight or moderate
				//     96, 99, // Thunderstorm with slight and heavy hail
				//   ]
				//   const randomIndex = Math.floor(Math.random() * weatherCodes.length)
				//   return weatherCodes[randomIndex]
				// }
				// const futureData = []
				// const numbers = () => {
				//   const n1 = Math.random() * 40
				//   const n2 = (Math.random() - 0.125) * 15
				//   return [n1, n2].sort((a, b) => { return b - a })
				// }
				// for (let i = 0; i < 24; i++) {
				//   const t = numbers()
				//   futureData.push({
				//     day: Math.random() * 100000000,
				//     max: t[0],
				//     min: t[1],
				//     description: chooseWeather(),
				//     uv: Math.random() * 14,
				//     wind: Math.random() * 60,
				//     rain: Math.random() * 100,
				//   })
				// }
				setFutureWeatherData(futureData)
				localStorage.data = JSON.stringify(futureData)
				const alerts = {
					totalPrecipitation: {
						precipitation: res.hourly.precipitation
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
							return res.hourly.precipitation
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
					hoursOfExtremeUv: res.hourly.uv_index
						.slice(currentHour, currentHour + 13)
						.map((val: number) => val >= 11),
					hoursOfStrongWind: res.hourly.windspeed_10m
						.slice(currentHour, currentHour + 25)
						.map((val: number) => val >= 60),
					hoursOfStrongWindGusts: res.hourly.windgusts_10m
						.slice(currentHour, currentHour + 25)
						.map((val: number) => val >= 80),
					hoursOfLowVisibility: res.hourly.visibility
						.slice(currentHour, currentHour + 25)
						.map((val: number) => val <= 200),
				}
				setCurrentWeatherData(alerts)
				localStorage.alerts = JSON.stringify(alerts)
				const now = new Date()
				localStorage.lastUpdated = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`
				setChangedLocation(false)
			} catch (e: any) {
				// eslint-disable-next-line no-console
				console.error(e)
				// why can't i pass the value of state into message here?
				// why are these errors sometimes being shown + a console warning occurring despite data seemingly being fetched just fine?
				notifications.show({
					title: <Trans>Error</Trans>,
					message: (
						<Trans>
							An error has occurred while fetching weather data. Please check
							the console for more details.
						</Trans>
					),
					color: 'red',
				})
				if (config.shareCrashesAndErrors) {
					Sentry.captureException(e)
				}
			}
		}

		if (
			localStorage.data &&
			localStorage.lastUpdated &&
			new Date().getFullYear() ===
				parseInt(localStorage.lastUpdated.split('-')[0]) &&
			new Date().getMonth() ===
				parseInt(localStorage.lastUpdated.split('-')[1]) &&
			new Date().getDate() ===
				parseInt(localStorage.lastUpdated.split('-')[2]) &&
			new Date().getHours() ===
				parseInt(localStorage.lastUpdated.split('-')[3]) &&
			JSON.parse(localStorage.data).length ===
				parseInt(config.daysToRetrieve) &&
			!changedLocation
		) {
			const data = JSON.parse(localStorage.data)
			const alerts = JSON.parse(localStorage.alerts)
			setFutureWeatherData(data)
			setLocalStorageCurrentWeatherData(alerts)
		} else if (config.lat && config.lon) {
			fetchData()
		}

		const checkHour = setInterval(() => {
			if (new Date().getHours() !== currentHour) {
				setCurrentHour(new Date().getHours())
			}
		}, 6e4)

		return () => {
			clearInterval(checkHour)
		}
	}, [
		currentHour,
		config.lat,
		config.lon,
		config.daysToRetrieve,
		config.useMetric,
		changedLocation,
		config.shareCrashesAndErrors,
	])

	/**
	 * This useEffect hook is designed to maintain data integrity in the face of updates to the weather alert types defined
	 * in the `CurrentWeatherProps` type. It is triggered whenever the `localStorageCurrentWeatherData` dependency changes.
	 *
	 * It performs a deep equality check between `localStorageCurrentWeatherData` and `currentWeatherData` using the
	 * `compareObjects` function. This step is crucial to avoid overwriting potentially new alert types present in
	 * `currentWeatherData` with outdated data from local storage. Overwriting it directly without this check could result in
	 * errors if new alert types added to the `CurrentWeatherProps` type are missing in the old local storage data.
	 *
	 * If a discrepancy is detected, it merges the local storage data with the current data using the `mergeObjects` function,
	 * ensuring that no new alert types are lost while also incorporating any relevant data stored locally.
	 *
	 * The merged data is then asserted to be of `CurrentWeatherProps` type and set as the new `currentWeatherData`, preserving
	 * the integrity of the data structure and preventing errors that would occur from missing properties.
	 */
	useEffect(() => {
		if (!compareObjects(localStorageCurrentWeatherData, currentWeatherData)) {
			// this is running every load no matter what, but if it's not breaking anything (and still guards correctly), is it a problem?
			const mergedData = mergeObjects(
				localStorageCurrentWeatherData,
				currentWeatherData,
			)
			setCurrentWeatherData(mergedData as CurrentWeatherProps)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [localStorageCurrentWeatherData])

	const handleChange: HandleChange = (k, v) => {
		setInput((prev) => {
			return {
				...prev,
				[k]: v,
			}
		})
	}

	const handleClick: HandleClick = async (method) => {
		const userAgent = navigator.userAgent.toLowerCase()

		if (
			method === 'auto' &&
			!(
				userAgent.indexOf('safari') !== -1 && userAgent.indexOf('chrome') === -1
			)
		) {
			navigator.geolocation.getCurrentPosition((pos) => {
				if (
					config.lat !== pos.coords.latitude.toString() ||
					config.lon !== pos.coords.longitude.toString()
				) {
					setChangedLocation(true)
				}
				setConfig((prev) => ({
					...prev,
					lat: pos.coords.latitude.toString(),
					lon: pos.coords.longitude.toString(),
					lang: input.lang,
				}))
				setInput((prev) => ({
					...prev,
					lat: pos.coords.latitude.toString(),
					lon: pos.coords.longitude.toString(),
				}))
			})
			setTimeout(() => {
				setGeolocationError(true)
			}, 5e3)
		} else if (
			method === 'auto' &&
			userAgent.indexOf('safari') !== -1 &&
			userAgent.indexOf('chrome') === -1
		) {
			try {
				const req = await fetch('http://ip-api.com/json/', {
					method: 'GET',
					mode: 'cors',
				})
				const res = await req.json()
				const { lat, lon } = res
				if (config.lat !== lat || config.lon !== lon) {
					setChangedLocation(true)
				}
				setConfig((prev) => ({
					...prev,
					lat: lat,
					lon: lon,
					lang: input.lang,
				}))
				setInput((prev) => ({
					...prev,
					lat: lat,
					lon: lon,
				}))
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(e)
				setGeolocationError(true)
				if (config.shareCrashesAndErrors) {
					Sentry.captureException(e)
				}
			}
			setTimeout(() => {
				setGeolocationError(true)
			}, 5e3)
		} else {
			if (config.lat !== input.lat || config.lon !== input.lon) {
				setChangedLocation(true)
			}
			setConfig(input)
		}
	}

	/**
	 * Closes the <Initialisation /> modal if it's opened and both "lat" and "lon" are configured in the "config".
	 */
	useEffect(() => {
		if (opened && config.lat && config.lon) {
			close()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [opened, config.lat, config.lon])

	/**
	 * Commits the "config" to localStorage if "config.lat" and "config.lon" are valid latitude and longitude values, respectively.
	 * Latitude: -90 to +90, Longitude: -180 to +180.
	 * If the geolocation has been updated, it sets "usingFreshData" to true, indicating the need to fetch fresh data.
	 */
	useEffect(() => {
		if (
			config.lat &&
			config.lon &&
			/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(config.lat) &&
			/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/.test(
				config.lon,
			)
		) {
			localStorage.config = JSON.stringify(config)
			if (changedLocation) {
				setUsingFreshData(true)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [config])

	/**
	 * Periodically (every minute) checks if the current date has changed.
	 * If it's a new day and the user has opted-in for periodic location updates,
	 * the user's geolocation is checked:
	 * - For non-Safari browsers, the built-in Geolocation API is utilized.
	 * - For Safari, an external service (ip-api.com) is used to fetch geolocation data.
	 *
	 * If the geolocation has changed from what's saved in "config", the "changedLocation" flag is set to true.
	 *
	 * TODO:
	 *  - Consider abstracting the geolocation identifying techniques for code reusability and maintainability.
	 */
	useEffect(() => {
		const checkDate = setInterval(() => {
			if (new Date().getDate() !== currentDate) {
				setCurrentDate(new Date().getDate())
			}
		}, 6e4)

		if (config.periodicLocationUpdate) {
			const userAgent = navigator.userAgent.toLowerCase()

			if (
				userAgent.indexOf('safari') === -1 &&
				userAgent.indexOf('chrome') === -1
			) {
				try {
					navigator.geolocation.getCurrentPosition((pos) => {
						if (
							config.lat !== pos.coords.latitude.toString() ||
							config.lon !== pos.coords.longitude.toString()
						) {
							setChangedLocation(true)
						}
						setConfig((prev) => ({
							...prev,
							lat: pos.coords.latitude.toString(),
							lon: pos.coords.longitude.toString(),
						}))
					})
				} catch (e) {
					// eslint-disable-next-line no-console
					console.error(e)
					notifications.show({
						title: <Trans>Error</Trans>,
						message: (
							<Trans>
								An error has occurred while periodically updating location.
								Please check the console for more details.
							</Trans>
						),
						color: 'red',
					})
					if (config.shareCrashesAndErrors) {
						Sentry.captureException(e)
					}
				}
			} else {
				const fetchSafariGeoData = async () => {
					try {
						const req = await fetch('http://ip-api.com/json/', {
							method: 'GET',
							mode: 'cors',
						})
						const res = await req.json()
						const { latitude, longitude } = res
						if (latitude && longitude) {
							if (config.lat !== latitude || config.lon !== longitude) {
								setChangedLocation(true)
							}
							setConfig((prev) => ({
								...prev,
								lat: latitude,
								lon: longitude,
							}))
						}
					} catch (e) {
						// eslint-disable-next-line no-console
						console.warn(e)
						notifications.show({
							title: <Trans>Error</Trans>,
							message: (
								<Trans>
									An error has occurred while fetching location data. Please
									check the console for more details.
								</Trans>
							),
							color: 'red',
						})
						if (config.shareCrashesAndErrors) {
							Sentry.captureException(e)
						}
					}
				}
				fetchSafariGeoData()
			}
		}
		return () => {
			clearInterval(checkDate)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentDate, config.periodicLocationUpdate])

	const tiles: TileComponent = futureWeatherData.map((day, i: number) => {
		let delayBaseline = 0.75
		if (localStorage.data) {
			delayBaseline = 0
		}
		return (
			<motion.div
				key={day.day}
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{
					scale: 1,
					opacity: 1,
					transition: {
						type: 'spring',
						duration: 2,
						delay: i * 0.075 + delayBaseline,
					},
				}}
				exit={{ scale: 0.95, opacity: 0 }}
				layout={completedFirstLoad}
				style={{ background: 'none', willChange: 'transform, opacity' }}
			>
				<Tile
					{...day}
					useMetric={config.useMetric}
					identifier={config.identifier}
				/>
			</motion.div>
		)
	})

	/**
	 * Delays setting `completedFirstLoad` to mitigate layout shifts during initial render.
	 *
	 * The effect sets a delay of 1.9 seconds before marking the first load as complete. This
	 * ensures that weather tiles render smoothly without abrupt layout shifts due to
	 * alerts being mounted separately.
	 *
	 * NOTE: This currently does not work as expected. Need to figure another solution to prevent
	 * layout shift - changing keys mounts new elements
	 */
	useEffect(() => {
		setTimeout(() => {
			setCompletedFirstLoad(true)
		}, 0) // 1900
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const determineGridColumns: DetermineGridColumns = (daysToRetrieve) => {
		const value = parseInt(daysToRetrieve)

		switch (value) {
			case 1:
				return 1
			case 2:
				return 2
			case 3:
				return 3
			case 4:
				return 4
			case 5:
				return 5
			case 6:
				return 3
			case 7:
				return 3
			case 8:
				return 4
			case 9:
				return 3
			default:
				return 3
		}
	}

	/**
	 * A function that triggers a review prompt notification after a delay.
	 *
	 * When called, after a delay of 1 second, the function checks if:
	 * 1. The time difference between the current date and the installation date
	 *    (from `config.installed`) exceeds 28 days (2419200000 milliseconds).
	 * 2. The review prompt has not yet been displayed based on the value from `localStorage`.
	 *
	 * If both conditions are met, a notification is shown to the user, prompting them to leave a review.
	 *
	 * The notification contains two main actions:
	 * 1. A button to leave a review.
	 * 2. A button to dismiss the prompt and ensure it's never shown again.
	 */
	const displayReviewPrompt = () => {
		notifications.show({
			id: 'review',
			title: <Trans>You&apos;ve been using Weather Please for a while</Trans>,
			message: (
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<p style={{ margin: '0.2rem 0' }}>
						<Trans>Would you like to leave a review?</Trans>
					</p>
					<Button
						component="a"
						href={
							getUserAgent() ??
							'https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn/reviews'
						} // can't pass computed value in here, need to figure out alternative asap
						style={{ marginTop: '0.5rem' }}
						onClick={() => {
							notifications.hide('review')
							setConfig((prev) => ({
								...prev,
								displayedReviewPrompt: true,
							}))
						}}
					>
						<Trans>🌟 Leave a review</Trans>
					</Button>
					<Button
						style={{ marginTop: '0.5rem' }}
						variant="light"
						color="red"
						onClick={() => {
							notifications.hide('review')
							setConfig((prev) => ({
								...prev,
								displayedReviewPrompt: true,
							}))
						}}
					>
						<Trans>Never show this again</Trans>
					</Button>
				</div>
			),
			autoClose: false,
			withCloseButton: false,
		})
	}

	const getUserAgent = () => {
		const userAgent = navigator.userAgent.toLowerCase()

		if (
			userAgent.indexOf('safari') !== -1 &&
			userAgent.indexOf('chrome') === -1
		) {
			setUsingSafari(true)
			setReviewLink('https://apps.apple.com/au/app/weather-please/id6462968576')
			return 'https://apps.apple.com/au/app/weather-please/id6462968576'
		} else if (userAgent.includes('firefox/')) {
			setReviewLink(
				'https://addons.mozilla.org/en-US/firefox/addon/weather-please/reviews/',
			)
			return 'https://addons.mozilla.org/en-US/firefox/addon/weather-please/reviews/'
		}
	}

	useEffect(() => {
		getUserAgent()
	}, [])

	return (
		<>
			<AnimatePresence>
				{futureWeatherData.length === 0 && config.lat && config.lon && (
					<motion.div
						initial={{ scale: 1, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.95, opacity: 0 }}
						style={{
							position: 'absolute',
							width: '100%',
							margin: 'auto',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							background: 'none',
						}}
					>
						<Loader loaders={{ ring: RingLoader }} type="ring" size={80} />
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				<motion.main
					layout={usingFreshData}
					className={styles.main}
					style={{
						gridTemplateColumns: `repeat(${determineGridColumns(
							config.daysToRetrieve,
						)}, 1fr)`,
					}}
				>
					{tiles}
					{config.showAlerts && (
						<Alert
							{...currentWeatherData}
							useMetric={config.useMetric}
							showUvAlerts={config.showUvAlerts}
							showWindAlerts={config.showWindAlerts}
							showVisibilityAlerts={config.showVisibilityAlerts}
							showPrecipitationAlerts={config.showPrecipitationAlerts}
							width={determineGridColumns(config.daysToRetrieve)}
						/>
					)}
				</motion.main>
			</AnimatePresence>

			<Settings
				input={input}
				handleChange={handleChange}
				handleClick={handleClick}
				config={config}
				setInput={setInput}
				usingSafari={usingSafari}
				reviewLink={reviewLink}
			/>

			<Initialisation
				geolocationError={geolocationError}
				handleClick={handleClick}
				setLoading={setLoading}
				loading={loading}
				input={input}
				handleChange={handleChange}
				opened={opened}
				close={close}
			/>

			<a
				href="https://open-meteo.com/"
				target="_blank"
				className={styles.link}
				style={{
					position: 'fixed',
					bottom: '1rem',
					left: '1rem',
					fontSize: '0.75rem',
					color: 'hsl(220deg 2.78% 57.65%)',
					lineHeight: 1,
					textDecoration: 'none',
				}}
			>
				<Trans>weather data provided by open-meteo</Trans>
			</a>
		</>
	)
}

const compareObjects: CompareObjects = (obj1, obj2) => {
	const keys1 = Object.keys(obj1)
	const keys2 = Object.keys(obj2)

	if (keys1.length !== keys2.length) {
		return false
	}

	for (const key of keys1) {
		if (!keys2.includes(key)) {
			return false
		}

		const val1 = obj1[key]
		const val2 = obj2[key]

		// Check if both values are objects (but not arrays or null)
		if (
			val1 &&
			typeof val1 === 'object' &&
			!Array.isArray(val1) &&
			val2 &&
			typeof val2 === 'object' &&
			!Array.isArray(val2)
		) {
			if (!compareObjects(val1, val2)) {
				return false
			}
		} else if (val1 !== val2) {
			return false
		}
	}

	return true
}

const mergeObjects: MergeObjects = (targetObj, sourceObj) => {
	const mergedObject = { ...targetObj }

	Object.keys(sourceObj).forEach((key) => {
		if (!mergedObject.hasOwnProperty(key)) {
			mergedObject[key] = sourceObj[key]
		}
	})

	return mergedObject as ConfigProps
}

export default WeatherPlease

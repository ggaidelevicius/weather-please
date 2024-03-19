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
	WeatherData,
} from '@/util/types'
import { i18n } from '@lingui/core'
import { Trans } from '@lingui/macro'
import { Button, Loader } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import * as Sentry from '@sentry/nextjs'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import { messages } from '../locales/en/messages'
import { changeLocalisation } from '../util/i18n'
import { queryClient } from './_app'

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
	const [usingCachedData, setUsingCachedData] = useState<boolean>(true)
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
		shareCrashesAndErrors: true,
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

	const lastHourRef = useRef(new Date().getHours())

	const { error, data } = useQuery<WeatherData>({
		queryKey: [
			'weather',
			config.lat,
			config.lon,
			config.daysToRetrieve,
			usingCachedData,
		],
		queryFn: () =>
			fetch(
				`https://api.open-meteo.com/v1/forecast?latitude=${config.lat}&longitude=${config.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,windspeed_10m_max&timeformat=unixtime&timezone=auto&hourly=precipitation,uv_index,windspeed_10m,visibility,windgusts_10m&forecast_days=${config.daysToRetrieve}`,
			).then((res) => res.json()),
		enabled: Boolean(config.lat) && Boolean(config.lon) && !usingCachedData,
	})

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
			setFutureWeatherData(futureData as any)
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
			setCurrentWeatherData(alerts)
			localStorage.alerts = JSON.stringify(alerts)

			localStorage.lastUpdated = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`

			if (changedLocation) {
				setChangedLocation(false)
			}

			// eslint-disable-next-line no-console
			console.log('done data')
		} else if (error) {
			// eslint-disable-next-line no-console
			console.error(error)
			notifications.show({
				title: <Trans>Error</Trans>,
				message: (
					<Trans>
						An error has occurred while fetching weather data. Please try again
						later.
					</Trans>
				),
				color: 'red',
			})
			if (config.shareCrashesAndErrors) {
				Sentry.captureException(error)
			}
		}
	}, [data, error, config.shareCrashesAndErrors, changedLocation])

	useEffect(() => {
		const interval = setInterval(() => {
			const currentHour = new Date().getHours()
			if (currentHour !== lastHourRef.current) {
				lastHourRef.current = currentHour
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
				replaysOnErrorSampleRate: 0,
				replaysSessionSampleRate: 0,
				beforeSend: (event) => {
					if (event.request) {
						if (event.request.url) {
							const url = new URL(event.request.url)
							const params = url.searchParams

							if (params.has('latitude')) {
								const latValue = params.get('latitude')
								if (latValue !== null) {
									const lat = parseFloat(latValue).toFixed(1)
									params.set('latitude', lat)
									url.search = params.toString()
									event.request.url = url.toString()
								}
							}
							if (params.has('longitude')) {
								const lonValue = params.get('longitude')
								if (lonValue !== null) {
									const lon = parseFloat(lonValue).toFixed(1)
									params.set('longitude', lon)
									url.search = params.toString()
									event.request.url = url.toString()
								}
							}
						}

						if (event.request.data) {
							let data = event.request.data

							if (typeof data === 'string') {
								try {
									data = JSON.parse(data)
								} catch (e) { }
							}

							if (data && typeof data === 'object') {
								if ('latitude' in data && 'longitude' in data) {
									data.latitude = parseFloat(data.latitude).toFixed(1)
									data.longitude = parseFloat(data.longitude).toFixed(1)

									event.request.data = JSON.stringify(data)
								}
							}
						}
					}

					return event
				},
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
		if (
			isLocalStorageDataValid(
				config.daysToRetrieve,
				changedLocation,
			)
		) {
			const data = JSON.parse(localStorage.data)
			const alerts = JSON.parse(localStorage.alerts)
			setFutureWeatherData(data)
			setLocalStorageCurrentWeatherData(alerts)
		} else {
			setUsingCachedData(false)
		}
	}, [config.lat, config.lon, config.daysToRetrieve, changedLocation])

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

const isLocalStorageDataValid = (
	daysToRetrieve: string,
	changedLocation: boolean,
) => {
	const { data, lastUpdated } = localStorage
	if (!data || !lastUpdated || changedLocation) return false

	const [year, month, day, hour] = lastUpdated.split('-').map(Number)
	const currentDate = new Date()
	const isSameYear = currentDate.getFullYear() === year
	const isSameMonth = currentDate.getMonth() === month
	const isSameDay = currentDate.getDate() === day
	const isSameHour = currentDate.getHours() === hour
	const isSameLength =
		JSON.parse(data).length === parseInt(daysToRetrieve)

	return isSameYear && isSameMonth && isSameDay && isSameHour && isSameLength
}

export default WeatherPlease

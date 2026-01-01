import { i18n } from '@lingui/core'
import { Trans } from '@lingui/react/macro'
import { IconAlertTriangle } from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { Initialisation } from '../components/initialisation'
import { RingLoader } from '../components/loader'
import { ReviewPrompt } from '../components/review-prompt'
import { Settings } from '../components/settings'
import { Tile } from '../components/tile'
import { WeatherAlert } from '../components/weather-alert'
import { useConfig } from '../hooks/use-config'
import { useSeasonalEvents } from '../hooks/use-seasonal-events'
import { useWeather } from '../hooks/use-weather'
import { getHemisphereFromLatitude } from '../hooks/seasonal-events/utils'
import { messages } from '../locales/en/messages'
import type { SeasonalEventId } from '../hooks/seasonal-events'

i18n.load({
	en: messages,
})
i18n.activate('en')

const LOCATION_CHANGE_THRESHOLD_KM = 1
const LOCATION_CHECK_INTERVAL_MS = 60 * 1000
const TILE_STAGGER_DELAY_BASELINE = 0.75

const GRID_COLS_CLASS = {
	'1': 'lg:grid-cols-1',
	'2': 'lg:grid-cols-2',
	'3': 'lg:grid-cols-3',
	'4': 'lg:grid-cols-4',
	'5': 'lg:grid-cols-5',
	'6': 'lg:grid-cols-3',
	'7': 'lg:grid-cols-3',
	'8': 'lg:grid-cols-4',
	'9': 'lg:grid-cols-3',
} as const

const App = () => {
	const [changedLocation, setChangedLocation] = useState<boolean>(false)

	const { config, input, handleChange, updateConfig, setInput, isHydrated } =
		useConfig()
	const { weatherData, alertData, isLoading, error, retry } = useWeather(
		config.lat,
		config.lon,
		changedLocation,
	)
	const isOnboarded = Boolean(config.lat && config.lon)
	const hemisphere = getHemisphereFromLatitude(config.lat)
	const canShowSeasonalEvents =
		config.showSeasonalEvents && isHydrated && isOnboarded
	const enabledSeasonalEvents = new Set<SeasonalEventId>()

	if (config.showSeasonalEvents) {
		if (config.showNewYearsEvent) {
			enabledSeasonalEvents.add('new-years-day')
		}
		if (config.showValentinesEvent) {
			enabledSeasonalEvents.add('valentines-day')
		}
		if (config.showLunarNewYearEvent) {
			enabledSeasonalEvents.add('lunar-new-year')
		}
		if (config.showSpringEquinoxEvent) {
			enabledSeasonalEvents.add('spring-equinox')
		}
		if (config.showAutumnEquinoxEvent) {
			enabledSeasonalEvents.add('autumn-equinox')
		}
		if (config.showDiwaliEvent) {
			enabledSeasonalEvents.add('diwali')
		}
		if (config.showEarthDayEvent) {
			enabledSeasonalEvents.add('earth-day')
		}
		if (config.showSummerSolsticeEvent) {
			enabledSeasonalEvents.add('summer-solstice')
		}
		if (config.showWinterSolsticeEvent) {
			enabledSeasonalEvents.add('winter-solstice')
		}
		if (config.showHalloweenEvent) {
			enabledSeasonalEvents.add('halloween')
		}
	}

	const activeSeasonalEvent = useSeasonalEvents({
		isEnabled: config.showSeasonalEvents,
		isHydrated,
		isOnboarded: isHydrated && isOnboarded,
		enabledEvents: enabledSeasonalEvents,
		hemisphere,
	})

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
	 * Periodically (every minute) checks the user's geolocation when opted in.
	 * If the geolocation has changed from what's saved in "config", the "changedLocation" flag is set to true.
	 */
	useEffect(() => {
		if (!config.periodicLocationUpdate) {
			return
		}

		const handleLocationUpdate = () => {
			if (!navigator.geolocation) {
				console.error('Geolocation is not supported in this browser.')
				return
			}
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					// Calculate distance between current and new coordinates using Haversine formula
					const calculateDistance = (
						currentLat: number,
						currentLon: number,
						incomingLat: number,
						incomingLon: number,
					) => {
						const R = 6371 // Earth's radius in kilometers

						// Haversine formula variables:
						const dLat = ((incomingLat - currentLat) * Math.PI) / 180 // Latitude difference in radians
						const dLon = ((incomingLon - currentLon) * Math.PI) / 180 // Longitude difference in radians

						// 'a' is the square of half the chord length between the two points
						const a =
							Math.sin(dLat / 2) * Math.sin(dLat / 2) +
							Math.cos((currentLat * Math.PI) / 180) *
								Math.cos((incomingLat * Math.PI) / 180) *
								Math.sin(dLon / 2) *
								Math.sin(dLon / 2)

						// 'c' is the angular distance in radians
						const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

						return R * c // Distance in kilometers
					}

					const currentLat = parseFloat(config.lat)
					const currentLon = parseFloat(config.lon)
					const newLat = pos.coords.latitude
					const newLon = pos.coords.longitude

					// Only update if user has moved more than 1km or if we don't have coordinates yet
					if (!config.lat || !config.lon) {
						// First time setting coordinates
						setChangedLocation(true)
						updateConfig({
							lat: newLat.toString(),
							lon: newLon.toString(),
						})
					} else {
						const distance = calculateDistance(
							currentLat,
							currentLon,
							newLat,
							newLon,
						)

						if (distance > LOCATION_CHANGE_THRESHOLD_KM) {
							// User has moved more than threshold distance, trigger refresh
							setChangedLocation(true)
							updateConfig({
								lat: newLat.toString(),
								lon: newLon.toString(),
							})
						}
						// If distance <= threshold, don't update anything to avoid unnecessary refreshes
					}
				},
				(geoError) => {
					console.error('Geolocation error:', geoError)
				},
			)
		}

		handleLocationUpdate()
		const checkLocation = setInterval(() => {
			handleLocationUpdate()
		}, LOCATION_CHECK_INTERVAL_MS)

		return () => {
			clearInterval(checkLocation)
		}
	}, [config.periodicLocationUpdate, config.lat, config.lon, updateConfig])

	const hasCachedData =
		typeof window !== 'undefined' && Boolean(localStorage.getItem('data'))

	const tiles = weatherData
		.slice(0, parseInt(config.daysToRetrieve))
		.map((day, index) => {
			const delayBaseline = hasCachedData ? 0 : TILE_STAGGER_DELAY_BASELINE
			return (
				<Tile
					{...day}
					key={day.day}
					index={index}
					delayBaseline={delayBaseline}
					useMetric={config.useMetric}
					identifier={config.identifier}
					showSeasonalEvents={canShowSeasonalEvents}
					showSeasonalTileGlow={config.showSeasonalTileGlow}
					enabledSeasonalEvents={enabledSeasonalEvents}
					hemisphere={hemisphere}
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
				<motion.main className="relative min-h-21 min-w-21 p-5">
					<div
						className={`relative z-10 grid h-full w-full grid-cols-1 gap-5 ${GRID_COLS_CLASS[config.daysToRetrieve as keyof typeof GRID_COLS_CLASS] ?? ''}`}
					>
						<Initialisation
							setInput={setInput}
							input={input}
							handleChange={handleChange}
							pending={isHydrated && (!config?.lat || !config?.lon)}
						/>
						{error ? (
							<div className="col-span-full flex flex-col items-center justify-center gap-4">
								<Alert icon={IconAlertTriangle} variant="info-red">
									<Trans>
										Unable to fetch weather data. Please check your internet
										connection and try again.
									</Trans>
								</Alert>
								<Button className="ml-auto" onClick={retry}>
									<Trans>Retry</Trans>
								</Button>
							</div>
						) : isLoading ? (
							<AnimatePresence>
								<RingLoader />
							</AnimatePresence>
						) : (
							<AnimatePresence>{tiles}</AnimatePresence>
						)}
					</div>
				</motion.main>
			</AnimatePresence>

			<div className="fixed bottom-4 left-4 flex flex-col items-start gap-2">
				<a
					href="https://open-meteo.com/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-xs text-dark-300 hover:underline focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500"
				>
					<Trans>weather data provided by open-meteo</Trans>
				</a>
			</div>

			<Settings handleChange={handleChange} input={input} />
		</>
	)
}

export default App

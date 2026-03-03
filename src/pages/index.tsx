import { i18n } from '@lingui/core'
import { Trans } from '@lingui/react/macro'
import { IconAlertTriangle } from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Alert } from '../shared/ui/alert'
import { AlertVariant } from '../shared/ui/alert-variant'
import { Button } from '../shared/ui/button'
import { RingLoader } from '../shared/ui/loader'
import { ReviewPrompt } from '../features/settings/ui/review-prompt'
import { useSeasonalEvents } from '../features/seasonal-events/hooks/use-seasonal-events'
import { getEnabledSeasonalEvents } from '../features/seasonal-events/core/enabled-events'
import { SeasonalEventId } from '../features/seasonal-events/core/types'
import {
	getHemisphereFromLatitude,
	isLikelySoftwareRenderer,
} from '../features/seasonal-events/core/utils'
import { useConfig } from '../features/settings/hooks/use-config'
import { SEASONAL_EVENT_TOGGLE_KEY_BY_ID } from '../features/settings/model/seasonal-event-toggle-map'
import { Initialisation } from '../features/settings/ui/initialisation'
import { Settings } from '../features/settings/ui/settings'
import { useWeather } from '../features/weather/hooks/use-weather'
import { Tile } from '../features/weather/ui/tile'
import { WeatherAlert } from '../features/weather/ui/weather-alert'
import { AsyncStatus } from '../shared/hooks/async-status'
import { usePeriodicLocationRefresh } from '../features/weather/hooks/use-periodic-location-refresh'
import { messages } from '../locales/en/messages'

i18n.load({
	en: messages,
})
i18n.activate('en')

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
	const { weatherData, alertData, status, hasData, isLoading, error, retry } =
		useWeather(
			config.lat,
			config.lon,
			changedLocation,
			config.useAirQualityUvOverride,
		)
	const isOnboarded = Boolean(config.lat && config.lon)
	const hemisphere = getHemisphereFromLatitude(config.lat)
	const isSoftwareRenderer = isLikelySoftwareRenderer()
	const canShowSeasonalEvents =
		config.showSeasonalEvents && isHydrated && isOnboarded
	const enabledSeasonalEvents = getEnabledSeasonalEvents(config)

	useSeasonalEvents({
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

	usePeriodicLocationRefresh({
		enabled: config.periodicLocationUpdate,
		lat: config.lat,
		lon: config.lon,
		onLocationChange: (coords) => {
			setChangedLocation(true)
			updateConfig(coords)
		},
	})

	const hasCachedData =
		typeof window !== 'undefined' && Boolean(localStorage.getItem('data'))

	const isSeasonalEventEnabled = (eventId: SeasonalEventId) =>
		input[SEASONAL_EVENT_TOGGLE_KEY_BY_ID[eventId]]

	const toggleSeasonalEvent = (eventId: SeasonalEventId, enabled: boolean) => {
		handleChange(SEASONAL_EVENT_TOGGLE_KEY_BY_ID[eventId], enabled)
	}

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
					showSeasonalTileGlow={
						config.showSeasonalTileGlow && !isSoftwareRenderer
					}
					enabledSeasonalEvents={enabledSeasonalEvents}
					hemisphere={hemisphere}
					isSeasonalEventEnabled={isSeasonalEventEnabled}
					onToggleSeasonalEvent={toggleSeasonalEvent}
				/>
			)
		})

	const shouldShowBlockingError = status === AsyncStatus.Error && !hasData
	const shouldShowInlineError = status === AsyncStatus.Error && hasData

	return (
		<>
			{config.showAlerts && (
				<AnimatePresence>
					<WeatherAlert
						{...alertData}
						useMetric={config.useMetric}
						useCompactAlerts={config.useCompactAlerts}
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
					<AnimatePresence>{isLoading ? <RingLoader /> : null}</AnimatePresence>
					<div
						className={`relative z-10 grid h-full w-full grid-cols-1 gap-5 ${GRID_COLS_CLASS[config.daysToRetrieve as keyof typeof GRID_COLS_CLASS] ?? ''}`}
					>
						<Initialisation
							setInput={setInput}
							input={input}
							handleChange={handleChange}
							pending={isHydrated && (!config?.lat || !config?.lon)}
						/>
						{shouldShowBlockingError ? (
							<div className="col-span-full flex flex-col items-center justify-center gap-4">
								<Alert icon={IconAlertTriangle} variant={AlertVariant.InfoRed}>
									<Trans>
										Unable to fetch weather data. Please check your internet
										connection and try again.
									</Trans>
								</Alert>
								<Button className="ml-auto" onClick={retry}>
									<Trans>Retry</Trans>
								</Button>
							</div>
						) : (
							<>
								{shouldShowInlineError && error && (
									<div className="col-span-full">
										<Alert
											icon={IconAlertTriangle}
											variant={AlertVariant.InfoRed}
										>
											<div className="flex items-center justify-between gap-3">
												<span>
													<Trans>
														Showing cached weather data. Retry to refresh the
														latest forecast.
													</Trans>
												</span>
												<Button className="ml-auto" onClick={retry}>
													<Trans>Retry</Trans>
												</Button>
											</div>
										</Alert>
									</div>
								)}
								{!isLoading ? <AnimatePresence>{tiles}</AnimatePresence> : null}
							</>
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

import { i18n } from '@lingui/core'
import { Trans } from '@lingui/react/macro'
import { IconAlertTriangle } from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { IdentifiedLocationIndicator } from '../features/location/ui/identified-location-indicator'
import { getEnabledSeasonalEvents } from '../features/seasonal-events/core/enabled-events'
import { SeasonalEventId } from '../features/seasonal-events/core/types'
import {
	getHemisphereFromLatitude,
	isLikelySoftwareRenderer,
} from '../features/seasonal-events/core/utils'
import { useSeasonalEvents } from '../features/seasonal-events/hooks/use-seasonal-events'
import { useConfig } from '../features/settings/hooks/use-config'
import { SEASONAL_EVENT_TOGGLE_KEY_BY_ID } from '../features/settings/model/seasonal-event-toggle-map'
import { Initialisation } from '../features/settings/ui/initialisation'
import { ReviewPrompt } from '../features/settings/ui/review-prompt'
import { Settings } from '../features/settings/ui/settings'
import { usePeriodicLocationRefresh } from '../features/weather/hooks/use-periodic-location-refresh'
import { useWeather } from '../features/weather/hooks/use-weather'
import { Tile } from '../features/weather/ui/tile'
import { WeatherAlert } from '../features/weather/ui/weather-alert'
import { messages } from '../locales/en/messages'
import { AsyncStatus } from '../shared/hooks/async-status'
import { Alert } from '../shared/ui/alert'
import { AlertVariant } from '../shared/ui/alert-variant'
import { Button } from '../shared/ui/button'
import { RingLoader } from '../shared/ui/loader'

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
	const [locationChangeToken, setLocationChangeToken] = useState(0)

	const { config, handleChange, input, isHydrated, setInput, updateConfig } =
		useConfig()
	const { alertData, error, hasData, isLoading, retry, status, weatherData } =
		useWeather(
			config.lat,
			config.lon,
			locationChangeToken,
			config.useAirQualityUvOverride,
		)
	const isOnboarded = Boolean(config.lat && config.lon)
	const hemisphere = getHemisphereFromLatitude(config.lat)
	const isSoftwareRenderer = isLikelySoftwareRenderer()
	const canShowSeasonalEvents =
		config.showSeasonalEvents && isHydrated && isOnboarded
	const enabledSeasonalEvents = getEnabledSeasonalEvents(config)

	useSeasonalEvents({
		enabledEvents: enabledSeasonalEvents,
		hemisphere,
		isEnabled: config.showSeasonalEvents,
		isHydrated,
		isOnboarded: isHydrated && isOnboarded,
	})

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
			setLocationChangeToken((current) => current + 1)
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
					delayBaseline={delayBaseline}
					enabledSeasonalEvents={enabledSeasonalEvents}
					hemisphere={hemisphere}
					identifier={config.identifier}
					index={index}
					isSeasonalEventEnabled={isSeasonalEventEnabled}
					key={day.day}
					onToggleSeasonalEvent={toggleSeasonalEvent}
					showSeasonalEvents={canShowSeasonalEvents}
					showSeasonalTileGlow={
						config.showSeasonalTileGlow && !isSoftwareRenderer
					}
					useMetric={config.useMetric}
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
						showPrecipitationAlerts={config.showPrecipitationAlerts}
						showUvAlerts={config.showUvAlerts}
						showVisibilityAlerts={config.showVisibilityAlerts}
						showWindAlerts={config.showWindAlerts}
						useCompactAlerts={config.useCompactAlerts}
						useMetric={config.useMetric}
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
							handleChange={handleChange}
							input={input}
							pending={isHydrated && (!config?.lat || !config?.lon)}
							setInput={setInput}
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

			<div className="fixed bottom-4 left-4">
				<IdentifiedLocationIndicator
					lat={config.lat}
					locale={config.lang}
					lon={config.lon}
				/>
			</div>

			<Settings handleChange={handleChange} input={input} />
		</>
	)
}

export default App

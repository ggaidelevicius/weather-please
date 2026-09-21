import { Trans } from '@lingui/react/macro'
import { IconAlertTriangle, IconX } from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { useViewNavigation } from '../features/dashboard/hooks/use-view-navigation'
import {
	FORECAST_VIEW_IDS,
	getViewBackgroundColor,
} from '../features/dashboard/model/view-navigation'
import { DetailFallbackGlow } from '../features/dashboard/ui/detail-fallback-glow'
import { DirectionalView } from '../features/dashboard/ui/directional-view'
import { ViewIndicator } from '../features/dashboard/ui/view-indicator'
import {
	getBlockingWeatherErrorMessage,
	getInlineWeatherErrorMessage,
} from '../features/dashboard/ui/weather-errors'
import { useCalendarConnection } from '../features/integrations/hooks/use-calendar-connection'
import {
	getHasDismissedCalendarPromo,
	getHasSeenIntegrationsTab,
	persistCalendarPromoDismissed,
	persistIntegrationsTabSeen,
} from '../features/integrations/lib/promo-state'
import { createSpoofedCalendarData } from '../features/integrations/model/spoofed-calendar'
import { UpcomingEvents } from '../features/integrations/ui/upcoming-events'
import { IdentifiedLocationIndicator } from '../features/location/ui/identified-location-indicator'
import {
	getEnabledSeasonalEventBackgrounds,
	getEnabledSeasonalEvents,
} from '../features/seasonal-events/core/enabled-events'
import { SeasonalEventId } from '../features/seasonal-events/core/types'
import {
	getHemisphereFromLatitude,
	isLikelySoftwareRenderer,
} from '../features/seasonal-events/core/utils'
import { useSeasonalEvents } from '../features/seasonal-events/hooks/use-seasonal-events'
import { useConfig } from '../features/settings/hooks/use-config'
import { hasValidCoordinates } from '../features/settings/model/config'
import {
	SEASONAL_EVENT_BACKGROUND_TOGGLE_KEY_BY_ID,
	SEASONAL_EVENT_TOGGLE_KEY_BY_ID,
} from '../features/settings/model/seasonal-event-toggle-map'
import { Initialisation } from '../features/settings/ui/initialisation'
import { ReviewPrompt } from '../features/settings/ui/review-prompt'
import { Settings } from '../features/settings/ui/settings'
import { usePeriodicLocationRefresh } from '../features/weather/hooks/use-periodic-location-refresh'
import { useWeather } from '../features/weather/hooks/use-weather'
import { hasCachedWeather } from '../features/weather/model/cache'
import { getTemperatureAccentColor } from '../features/weather/model/temperature-colour'
import {
	Next24HoursDetailView,
	NEXT_24_HOURS_DETAIL_VIEW_IDS,
} from '../features/weather/ui/next-24-hours-tile'
import { Tile } from '../features/weather/ui/tile'
import { useWeatherTileGrid } from '../features/weather/ui/use-weather-tile-grid'
import { WeatherAlert } from '../features/weather/ui/weather-alert'
import { AsyncStatus } from '../shared/hooks/async-status'
import { Alert } from '../shared/ui/alert'
import { AlertVariant } from '../shared/ui/alert-variant'
import { Button } from '../shared/ui/button'
import { RingLoader } from '../shared/ui/loader'

const TILE_STAGGER_DELAY_BASELINE = 0.75

const WeatherDashboard = () => {
	// Marks the document so the global stylesheet disables page scrolling,
	// which only the new tab app wants.
	useEffect(() => {
		document.documentElement.setAttribute('data-weather-please-app', '')

		return () => {
			document.documentElement.removeAttribute('data-weather-please-app')
		}
	}, [])

	const [locationChangeToken, setLocationChangeToken] = useState(0)

	const { config, handleChange, input, isHydrated, setInput, updateConfig } =
		useConfig()
	const calendarConnection = useCalendarConnection()
	const [spoofedCalendarData] = useState(createSpoofedCalendarData)
	const shouldSpoofCalendarEvents =
		process.env.NODE_ENV === 'development' && config.spoofCalendarEvents
	const calendarAccounts = shouldSpoofCalendarEvents
		? spoofedCalendarData.accounts
		: calendarConnection.accounts
	const calendarEvents = shouldSpoofCalendarEvents
		? spoofedCalendarData.events
		: calendarConnection.events
	const [hasDismissedCalendarPromo, setHasDismissedCalendarPromo] = useState(
		getHasDismissedCalendarPromo,
	)
	const [hasSeenIntegrationsTab, setHasSeenIntegrationsTab] = useState(
		getHasSeenIntegrationsTab,
	)
	const {
		alertData,
		degradedForecast,
		error,
		hasData,
		isLoading,
		next24HoursData,
		retry,
		status,
		weatherData,
		weatherMapData,
	} = useWeather(
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
	const enabledSeasonalEventBackgrounds =
		getEnabledSeasonalEventBackgrounds(config)
	const enabledSeasonalEvents = getEnabledSeasonalEvents(config)
	const canShowNext24HoursView = next24HoursData.length > 0
	const {
		activeAvailableViewId,
		handleViewIndicatorMouseEnter,
		handleViewIndicatorMouseLeave,
		handleViewIndicatorSelect,
		handleViewTouchEnd,
		handleViewTouchStart,
		isViewIndicatorHovered,
		isViewIndicatorVisible,
		previousTransitionViewId,
		shouldShowScrollHint,
		viewFrameRef,
	} = useViewNavigation({ canShowNext24HoursView })

	const temperatureAccentColor = getTemperatureAccentColor(
		next24HoursData[0]?.temperature ?? 0,
	)
	const shouldBlurSeasonalEffects = activeAvailableViewId !== 'forecast'

	const activeSeasonalEvent = useSeasonalEvents({
		enabledEvents: enabledSeasonalEventBackgrounds,
		hemisphere,
		isEnabled: config.showSeasonalEvents,
		isHydrated,
		isOnboarded: isHydrated && isOnboarded,
		seasonalEventOverride: config.seasonalEventOverride,
		shouldBlurEffects: shouldBlurSeasonalEffects,
	})
	const shouldShowDetailFallbackGlow =
		activeAvailableViewId !== 'forecast' && !activeSeasonalEvent

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

	const hasCachedData = hasCachedWeather()

	const dismissCalendarPromo = () => {
		setHasDismissedCalendarPromo(true)
		persistCalendarPromoDismissed()
	}

	const handleSettingsOpened = () => {
		if (!hasDismissedCalendarPromo) {
			dismissCalendarPromo()
		}
	}

	const handleIntegrationsViewed = () => {
		if (!hasSeenIntegrationsTab) {
			setHasSeenIntegrationsTab(true)
			persistIntegrationsTabSeen()
		}
	}

	// Only nudge users who can actually act on it: providers configured and
	// no calendar connected yet.
	const canPromoteCalendarConnections =
		calendarConnection.configuredProviders.length > 0 &&
		calendarConnection.accounts.length === 0 &&
		!hasSeenIntegrationsTab
	const shouldShowCalendarPromoPill =
		isHydrated &&
		isOnboarded &&
		canPromoteCalendarConnections &&
		!hasDismissedCalendarPromo

	const isSeasonalEventEnabled = (eventId: SeasonalEventId) =>
		input[SEASONAL_EVENT_TOGGLE_KEY_BY_ID[eventId]]
	const isSeasonalEventBackgroundEnabled = (eventId: SeasonalEventId) =>
		input[SEASONAL_EVENT_BACKGROUND_TOGGLE_KEY_BY_ID[eventId]]

	const toggleSeasonalEvent = (eventId: SeasonalEventId, enabled: boolean) => {
		handleChange(SEASONAL_EVENT_TOGGLE_KEY_BY_ID[eventId], enabled)
	}
	const toggleSeasonalEventBackground = (
		eventId: SeasonalEventId,
		enabled: boolean,
	) => {
		handleChange(SEASONAL_EVENT_BACKGROUND_TOGGLE_KEY_BY_ID[eventId], enabled)
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
					isSeasonalEventBackgroundEnabled={isSeasonalEventBackgroundEnabled}
					isSeasonalEventEnabled={isSeasonalEventEnabled}
					key={day.day}
					observingLocation={
						hasValidCoordinates(config)
							? { latitude: Number(config.lat), longitude: Number(config.lon) }
							: undefined
					}
					onToggleSeasonalEvent={toggleSeasonalEvent}
					onToggleSeasonalEventBackground={toggleSeasonalEventBackground}
					seasonalEventOverride={config.seasonalEventOverride}
					showSeasonalEvents={canShowSeasonalEvents}
					showSeasonalTileGlow={
						config.showSeasonalTileGlow && !isSoftwareRenderer
					}
					temperatureUnit={config.temperatureUnit}
					unitSystem={config.unitSystem}
				/>
			)
		})
	const { gridStyle } = useWeatherTileGrid({
		tileCount: tiles.length,
	})

	const shouldShowBlockingError = status === AsyncStatus.Error && !hasData
	const shouldShowInlineError = status === AsyncStatus.Error && hasData
	const blockingWeatherErrorMessage = shouldShowBlockingError
		? getBlockingWeatherErrorMessage(error)
		: null

	return (
		<>
			{config.showAlerts && (
				<AnimatePresence>
					<WeatherAlert
						{...alertData}
						shouldShowDegradedForecastAlert={Boolean(degradedForecast)}
						showPrecipitationAlerts={config.showPrecipitationAlerts}
						showUvAlerts={config.showUvAlerts}
						showVisibilityAlerts={config.showVisibilityAlerts}
						showWindAlerts={config.showWindAlerts}
						unitSystem={config.unitSystem}
						useCompactAlerts={config.useCompactAlerts}
					/>
				</AnimatePresence>
			)}
			<ReviewPrompt config={config} setInput={setInput} />
			<AnimatePresence>
				<motion.main
					animate={{
						backgroundColor: getViewBackgroundColor(activeAvailableViewId),
					}}
					className="relative h-screen min-h-21 w-screen min-w-21 overflow-hidden"
					initial={false}
					onTouchEnd={handleViewTouchEnd}
					onTouchStart={handleViewTouchStart}
					ref={viewFrameRef}
					transition={{ duration: 0.35, ease: 'easeOut' }}
				>
					<DetailFallbackGlow
						activeViewId={activeAvailableViewId}
						isVisible={shouldShowDetailFallbackGlow}
						temperatureAccentColor={temperatureAccentColor}
					/>
					<AnimatePresence>{isLoading ? <RingLoader /> : null}</AnimatePresence>
					<DirectionalView
						activeViewId={activeAvailableViewId}
						className="z-10 flex items-center justify-center p-5"
						previousTransitionViewId={previousTransitionViewId}
						viewId="forecast"
					>
						<div
							className="relative grid w-fit max-w-[calc(100vw-2.5rem)] auto-rows-max grid-cols-1 items-stretch gap-5"
							style={gridStyle}
						>
							<Initialisation
								handleChange={handleChange}
								input={input}
								pending={isHydrated && (!config?.lat || !config?.lon)}
								setInput={setInput}
							/>
							{shouldShowBlockingError ? (
								<div className="col-span-full mx-auto flex w-full max-w-[74ch] flex-col items-center justify-center gap-4">
									<Alert
										icon={IconAlertTriangle}
										variant={AlertVariant.InfoRed}
									>
										{blockingWeatherErrorMessage}
									</Alert>
									<Button className="ml-auto" onClick={retry}>
										<Trans>Retry</Trans>
									</Button>
								</div>
							) : (
								<>
									{shouldShowInlineError && error && (
										<div className="col-span-full mx-auto w-full max-w-[74ch]">
											<Alert
												icon={IconAlertTriangle}
												variant={AlertVariant.InfoRed}
											>
												<div className="flex items-center justify-between gap-3">
													<span>{getInlineWeatherErrorMessage(error)}</span>
													<Button className="ml-auto" onClick={retry}>
														<Trans>Retry</Trans>
													</Button>
												</div>
											</Alert>
										</div>
									)}
									{!isLoading ? (
										<AnimatePresence>{tiles}</AnimatePresence>
									) : null}
								</>
							)}
						</div>
					</DirectionalView>
					{config.showCalendarEvents && !isLoading ? (
						<motion.div
							animate={
								activeAvailableViewId === 'forecast'
									? { opacity: 1, x: 0 }
									: { opacity: 0, x: 24 }
							}
							aria-hidden={activeAvailableViewId !== 'forecast'}
							// An opacity compositing hint creates a backdrop root and prevents
							// descendant cards from blurring the forecast behind this overlay.
							className="absolute top-4 right-4 z-10 will-change-transform"
							initial={false}
							style={{
								pointerEvents:
									activeAvailableViewId === 'forecast' ? 'auto' : 'none',
							}}
							transition={{ duration: 0.25, ease: 'easeOut' }}
						>
							<UpcomingEvents
								accounts={calendarAccounts}
								events={calendarEvents}
								locale={config.lang}
							/>
						</motion.div>
					) : null}
					{canShowNext24HoursView
						? NEXT_24_HOURS_DETAIL_VIEW_IDS.map((viewId) => (
								<DirectionalView
									activeViewId={activeAvailableViewId}
									className="z-0"
									key={viewId}
									previousTransitionViewId={previousTransitionViewId}
									viewId={viewId}
								>
									<Next24HoursDetailView
										data={next24HoursData}
										isActive={activeAvailableViewId === viewId}
										temperatureUnit={config.temperatureUnit}
										unitSystem={config.unitSystem}
										viewId={viewId}
										weatherMapData={weatherMapData}
									/>
								</DirectionalView>
							))
						: null}
					{canShowNext24HoursView ? (
						<ViewIndicator
							activeViewId={activeAvailableViewId}
							isVisible={isViewIndicatorVisible || isViewIndicatorHovered}
							onMouseEnter={handleViewIndicatorMouseEnter}
							onMouseLeave={handleViewIndicatorMouseLeave}
							onSelectView={handleViewIndicatorSelect}
							viewIds={FORECAST_VIEW_IDS}
						/>
					) : null}
					<AnimatePresence>
						{shouldShowScrollHint ? (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-dark-950/78 px-3.5 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-md"
								exit={{ opacity: 0, y: 8 }}
								initial={{ opacity: 0, y: 8 }}
								transition={{ duration: 0.22 }}
							>
								<Trans>✨ NEW: Try scrolling down</Trans>
							</motion.div>
						) : null}
					</AnimatePresence>
				</motion.main>
			</AnimatePresence>

			<div className="fixed bottom-4 left-4 z-2">
				<IdentifiedLocationIndicator
					lat={config.lat}
					locale={config.lang}
					lon={config.lon}
				/>
			</div>

			<Settings
				calendarConnection={calendarConnection}
				handleChange={handleChange}
				input={input}
				integrationsPromo={{
					onIntegrationsViewed: handleIntegrationsViewed,
					onSettingsOpened: handleSettingsOpened,
					shouldHighlightIntegrations: canPromoteCalendarConnections,
				}}
			/>

			<AnimatePresence>
				{shouldShowCalendarPromoPill ? (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="fixed right-4 bottom-16 z-2 flex items-center gap-1.5 rounded-full border border-white/10 bg-dark-950/78 py-1.5 pr-1.5 pl-3.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md"
						exit={{ opacity: 0, y: 8 }}
						initial={{ opacity: 0, y: 8 }}
						transition={{ duration: 0.22 }}
					>
						<Trans>✨ NEW: Connect your Google or Microsoft calendar</Trans>
						<button
							className="cursor-pointer rounded-full p-1 text-dark-100 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
							onClick={dismissCalendarPromo}
							type="button"
						>
							<IconX aria-hidden size={14} />
							<span className="sr-only">
								<Trans>Dismiss</Trans>
							</span>
						</button>
					</motion.div>
				) : null}
			</AnimatePresence>
		</>
	)
}

export default WeatherDashboard

import { i18n } from '@lingui/core'
import { Trans } from '@lingui/react/macro'
import { IconAlertTriangle } from '@tabler/icons-react'
import {
	AnimatePresence,
	motion,
	type MotionValue,
	useMotionValue,
	useSpring,
	useTransform,
} from 'framer-motion'
import {
	type MouseEvent as ReactMouseEvent,
	type ReactNode,
	type TouchEvent,
	useEffect,
	useRef,
	useState,
} from 'react'
import { z } from 'zod'

import { useCalendarConnection } from '../features/integrations/hooks/use-calendar-connection'
import { createSpoofedCalendarData } from '../features/integrations/model/spoofed-calendar'
import { UpcomingEvents } from '../features/integrations/ui/upcoming-events'
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
import { hasCachedWeather } from '../features/weather/model/cache'
import { getTemperatureAccentColor } from '../features/weather/model/temperature-colour'
import {
	Next24HoursDetailView,
	type Next24HoursDetailViewId,
	NEXT_24_HOURS_DETAIL_VIEW_IDS,
} from '../features/weather/ui/next-24-hours-tile'
import { Tile } from '../features/weather/ui/tile'
import { useWeatherTileGrid } from '../features/weather/ui/use-weather-tile-grid'
import { WeatherAlert } from '../features/weather/ui/weather-alert'
import { messages } from '../locales/en/messages'
import { AsyncStatus } from '../shared/hooks/async-status'
import {
	getHttpErrorStatusCode,
	isServerErrorStatusCode,
} from '../shared/lib/http-error-status'
import { Alert } from '../shared/ui/alert'
import { AlertVariant } from '../shared/ui/alert-variant'
import { Button } from '../shared/ui/button'
import { RingLoader } from '../shared/ui/loader'

i18n.load({
	en: messages,
})
i18n.activate('en')

const TILE_STAGGER_DELAY_BASELINE = 0.75
const VIEW_SWITCH_SCROLL_DELTA_MIN = 1
const VIEW_SWITCH_TOUCH_THRESHOLD = 80
const VIEW_SWITCH_COOLDOWN_MS = 300
const VIEW_SWITCH_WHEEL_GESTURE_END_MS = 180
const VIEW_SWITCH_WHEEL_REIMPULSE_DELTA_MIN = 3
const VIEW_SWITCH_WHEEL_REIMPULSE_RATIO = 1.6
const VIEW_INDICATOR_VISIBLE_MS = 2500
const VIEW_TRANSITION_WILL_CHANGE_MS = 450
const VIEW_TRANSITION_DISTANCE = 120
const FORECAST_VIEW_BACKGROUND_COLOR = '#1a1b1e'
const DETAIL_VIEW_BACKGROUND_COLOR = '#101113'
const NEXT_24_HOURS_SCROLL_HINT_STORAGE_KEY =
	'weather-please:next-24-hours-scroll-hint-dismissed'
const scrollHintDismissedSchema = z.boolean()

type ForecastViewId = 'forecast' | Next24HoursDetailViewId
type ViewStepDirection = 'next' | 'previous'

const getInlineWeatherErrorMessage = (error: Error) => {
	const httpStatusCode = getHttpErrorStatusCode(error.message)

	if (isServerErrorStatusCode(httpStatusCode)) {
		return (
			<Trans>
				Weather data couldn&apos;t be loaded due to a service issue — showing
				cached data. Please try again in a moment.
			</Trans>
		)
	}

	return (
		<Trans>
			Showing cached weather data. Retry to refresh the latest forecast.
		</Trans>
	)
}

const getBlockingWeatherErrorMessage = (error: Error | null) => {
	const httpStatusCode = getHttpErrorStatusCode(error?.message)
	const isBrowserOffline =
		typeof navigator !== 'undefined' && navigator.onLine === false

	if (isServerErrorStatusCode(httpStatusCode)) {
		return (
			<Trans>
				Weather data couldn&apos;t be loaded because the weather service is
				having trouble. This isn&apos;t a problem with your device. Please try
				again in a moment.
			</Trans>
		)
	}

	if (httpStatusCode) {
		return (
			<Trans>
				Weather data couldn&apos;t be loaded for this location. Please check
				your location settings and try again.
			</Trans>
		)
	}

	if (!isBrowserOffline && error) {
		return (
			<Trans>
				Weather data couldn&apos;t be loaded because the weather service could
				not be reached. This usually isn&apos;t a problem with your device.
				Please try again in a moment.
			</Trans>
		)
	}

	return (
		<Trans>
			We couldn&apos;t reach the weather service. Please check your internet
			connection and try again.
		</Trans>
	)
}

const App = () => {
	const [activeViewId, setActiveViewId] = useState<ForecastViewId>('forecast')
	const [isViewIndicatorHovered, setIsViewIndicatorHovered] = useState(false)
	const [isViewIndicatorVisible, setIsViewIndicatorVisible] = useState(false)
	const [locationChangeToken, setLocationChangeToken] = useState(0)
	const [previousTransitionViewId, setPreviousTransitionViewId] =
		useState<ForecastViewId | null>(null)
	const [hasDismissedScrollHint, setHasDismissedScrollHint] = useState(
		getHasDismissedScrollHint,
	)
	const viewIndicatorTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(
		null,
	)
	const viewTransitionWillChangeTimeoutRef = useRef<null | ReturnType<
		typeof setTimeout
	>>(null)
	const viewSwitchCooldownUntilRef = useRef(0)
	const wheelGestureEndTimeoutRef = useRef<null | ReturnType<
		typeof setTimeout
	>>(null)
	const hasConsumedWheelGestureRef = useRef(false)
	const lastWheelDirectionRef = useRef<null | ViewStepDirection>(null)
	const lastWheelDeltaAbsRef = useRef(0)
	const touchStartYRef = useRef<null | number>(null)
	const viewFrameRef = useRef<HTMLElement | null>(null)
	const handleViewWheelRef = useRef<(event: WheelEvent) => void>(() => {})

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
	const enabledSeasonalEvents = getEnabledSeasonalEvents(config)
	const canShowNext24HoursView = next24HoursData.length > 0
	const activeAvailableViewId = canShowNext24HoursView
		? activeViewId
		: 'forecast'
	const temperatureAccentColor = getTemperatureAccentColor(
		next24HoursData[0]?.temperature ?? 0,
	)
	const shouldBlurSeasonalEffects = activeAvailableViewId !== 'forecast'

	const activeSeasonalEvent = useSeasonalEvents({
		enabledEvents: enabledSeasonalEvents,
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
	const shouldShowScrollHint =
		canShowNext24HoursView &&
		!hasDismissedScrollHint &&
		activeAvailableViewId === 'forecast'

	useEffect(
		() => () => {
			if (viewIndicatorTimeoutRef.current) {
				clearTimeout(viewIndicatorTimeoutRef.current)
			}
			if (wheelGestureEndTimeoutRef.current) {
				clearTimeout(wheelGestureEndTimeoutRef.current)
			}
			if (viewTransitionWillChangeTimeoutRef.current) {
				clearTimeout(viewTransitionWillChangeTimeoutRef.current)
			}
		},
		[],
	)

	const showViewIndicator = () => {
		setIsViewIndicatorVisible(true)
		if (viewIndicatorTimeoutRef.current) {
			clearTimeout(viewIndicatorTimeoutRef.current)
		}
		viewIndicatorTimeoutRef.current = setTimeout(() => {
			setIsViewIndicatorVisible(false)
		}, VIEW_INDICATOR_VISIBLE_MS)
	}

	const setActiveView = (nextViewId: ForecastViewId) => {
		if (nextViewId === activeAvailableViewId) {
			showViewIndicator()
			return
		}

		setPreviousTransitionViewId(activeAvailableViewId)
		setActiveViewId(nextViewId)
		if (viewTransitionWillChangeTimeoutRef.current) {
			clearTimeout(viewTransitionWillChangeTimeoutRef.current)
		}
		viewTransitionWillChangeTimeoutRef.current = setTimeout(() => {
			setPreviousTransitionViewId(null)
			viewTransitionWillChangeTimeoutRef.current = null
		}, VIEW_TRANSITION_WILL_CHANGE_MS)
		showViewIndicator()
	}

	const handleViewIndicatorMouseEnter = () => {
		setIsViewIndicatorHovered(true)
		setIsViewIndicatorVisible(true)
		if (viewIndicatorTimeoutRef.current) {
			clearTimeout(viewIndicatorTimeoutRef.current)
		}
	}

	const handleViewIndicatorMouseLeave = () => {
		setIsViewIndicatorHovered(false)
		showViewIndicator()
	}

	const handleViewIndicatorSelect = (viewId: ForecastViewId) => {
		setActiveView(viewId)
		viewSwitchCooldownUntilRef.current = Date.now() + VIEW_SWITCH_COOLDOWN_MS
	}

	const dismissScrollHint = () => {
		setHasDismissedScrollHint(true)
		persistScrollHintDismissed()
	}

	const switchActiveViewByStep = (direction: ViewStepDirection) => {
		if (Date.now() < viewSwitchCooldownUntilRef.current) {
			return
		}

		const nextViewId = getAdjacentViewId({
			activeViewId: activeAvailableViewId,
			canShowNext24HoursView,
			direction,
		})
		setActiveView(nextViewId)
		if (nextViewId !== activeAvailableViewId) {
			dismissScrollHint()
		}
		viewSwitchCooldownUntilRef.current = Date.now() + VIEW_SWITCH_COOLDOWN_MS
	}

	const handleViewWheel = (event: WheelEvent) => {
		if (
			!canShowNext24HoursView ||
			Math.abs(event.deltaY) < VIEW_SWITCH_SCROLL_DELTA_MIN ||
			Math.abs(event.deltaY) <= Math.abs(event.deltaX)
		) {
			return
		}

		event.preventDefault()
		if (wheelGestureEndTimeoutRef.current) {
			clearTimeout(wheelGestureEndTimeoutRef.current)
		}
		wheelGestureEndTimeoutRef.current = setTimeout(() => {
			hasConsumedWheelGestureRef.current = false
			lastWheelDeltaAbsRef.current = 0
			lastWheelDirectionRef.current = null
		}, VIEW_SWITCH_WHEEL_GESTURE_END_MS)

		const direction = event.deltaY > 0 ? 'next' : 'previous'
		const deltaAbs = Math.abs(event.deltaY)
		const hasNewImpulse =
			Date.now() >= viewSwitchCooldownUntilRef.current &&
			(direction !== lastWheelDirectionRef.current ||
				deltaAbs >=
					Math.max(
						VIEW_SWITCH_WHEEL_REIMPULSE_DELTA_MIN,
						lastWheelDeltaAbsRef.current * VIEW_SWITCH_WHEEL_REIMPULSE_RATIO,
					))
		const shouldIgnoreWheelEvent =
			hasConsumedWheelGestureRef.current && !hasNewImpulse

		lastWheelDeltaAbsRef.current = deltaAbs
		lastWheelDirectionRef.current = direction

		if (shouldIgnoreWheelEvent) {
			return
		}

		hasConsumedWheelGestureRef.current = true
		switchActiveViewByStep(direction)
	}

	useEffect(() => {
		handleViewWheelRef.current = handleViewWheel
	})

	useEffect(() => {
		const viewFrame = viewFrameRef.current
		if (!viewFrame) {
			return
		}

		const handleWheel = (event: WheelEvent) => {
			handleViewWheelRef.current(event)
		}

		viewFrame.addEventListener('wheel', handleWheel, { passive: false })

		return () => {
			viewFrame.removeEventListener('wheel', handleWheel)
		}
	}, [])

	const handleViewTouchStart = (event: TouchEvent<HTMLElement>) => {
		touchStartYRef.current = event.touches[0]?.clientY ?? null
	}

	const handleViewTouchEnd = (event: TouchEvent<HTMLElement>) => {
		if (!canShowNext24HoursView || touchStartYRef.current === null) {
			return
		}

		const touchEndY = event.changedTouches[0]?.clientY
		if (typeof touchEndY !== 'number') {
			return
		}

		const deltaY = touchStartYRef.current - touchEndY
		if (deltaY > VIEW_SWITCH_TOUCH_THRESHOLD) {
			switchActiveViewByStep('next')
		}

		if (deltaY < -VIEW_SWITCH_TOUCH_THRESHOLD) {
			switchActiveViewByStep('previous')
		}

		touchStartYRef.current = null
	}

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
							className="relative grid w-fit max-w-[calc(100vw-2.5rem)] auto-rows-max grid-cols-1 items-start gap-5"
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
							className="absolute top-4 right-4 z-10 will-change-[transform,opacity]"
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
			/>
		</>
	)
}

export default App

const VIEW_ORDER: Record<ForecastViewId, number> = {
	'air-quality': 4,
	conditions: 6,
	forecast: 0,
	map: 7,
	precipitation: 2,
	sun: 5,
	temperature: 1,
	wind: 3,
}

const FORECAST_ONLY_VIEW_IDS: readonly ForecastViewId[] = ['forecast']
const FORECAST_VIEW_IDS: readonly ForecastViewId[] = [
	'forecast',
	...NEXT_24_HOURS_DETAIL_VIEW_IDS,
]
const VIEW_INDICATOR_LABELS: Record<ForecastViewId, string> = {
	'air-quality': 'air quality',
	conditions: 'conditions',
	forecast: 'forecast',
	map: 'map',
	precipitation: 'precipitation',
	sun: 'sun',
	temperature: 'temperature',
	wind: 'wind',
}
const VIEW_INDICATOR_LABEL_NODES: Record<ForecastViewId, ReactNode> = {
	'air-quality': <Trans>air quality</Trans>,
	conditions: <Trans>conditions</Trans>,
	forecast: <Trans>forecast</Trans>,
	map: <Trans>map</Trans>,
	precipitation: <Trans>precipitation</Trans>,
	sun: <Trans>sun</Trans>,
	temperature: <Trans>temperature</Trans>,
	wind: <Trans>wind</Trans>,
}
const DETAIL_FALLBACK_AURORA_GRADIENTS: Record<ForecastViewId, string> = {
	'air-quality':
		'radial-gradient(120% 80% at 15% 0%, rgba(20, 184, 166, 0.21), rgba(13, 148, 136, 0.1) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(45, 212, 191, 0.15), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(34, 197, 94, 0.11), rgba(15, 23, 42, 0) 70%)',
	conditions:
		'radial-gradient(120% 80% at 15% 0%, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.09) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(52, 211, 153, 0.15), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(34, 197, 94, 0.11), rgba(15, 23, 42, 0) 70%)',
	forecast:
		'radial-gradient(120% 80% at 15% 0%, rgba(59, 130, 246, 0.24), rgba(14, 116, 144, 0.1) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(129, 140, 248, 0.17), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(52, 211, 153, 0.13), rgba(15, 23, 42, 0) 70%)',
	map: 'radial-gradient(120% 80% at 15% 0%, rgba(6, 182, 212, 0.22), rgba(14, 116, 144, 0.11) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(56, 189, 248, 0.15), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(34, 211, 238, 0.12), rgba(15, 23, 42, 0) 70%)',
	precipitation:
		'radial-gradient(120% 80% at 15% 0%, rgba(14, 165, 233, 0.22), rgba(8, 145, 178, 0.1) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(56, 189, 248, 0.16), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(45, 212, 191, 0.11), rgba(15, 23, 42, 0) 70%)',
	sun: 'radial-gradient(120% 80% at 15% 0%, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.09) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(251, 191, 36, 0.14), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(244, 114, 182, 0.1), rgba(15, 23, 42, 0) 70%)',
	temperature:
		'radial-gradient(120% 80% at 15% 0%, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.08) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(96, 165, 250, 0.13), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(244, 114, 182, 0.09), rgba(15, 23, 42, 0) 70%)',
	wind: 'radial-gradient(120% 80% at 15% 0%, rgba(56, 189, 248, 0.17), rgba(51, 65, 85, 0.1) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(217, 70, 239, 0.12), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(148, 163, 184, 0.12), rgba(15, 23, 42, 0) 70%)',
}

const getTemperatureDetailFallbackGradient = (accentColor: string) =>
	`radial-gradient(120% 80% at 15% 0%, ${toRgba(accentColor, 0.22)}, ${toRgba(accentColor, 0.09)} 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, ${toRgba(accentColor, 0.15)}, rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, ${toRgba(accentColor, 0.1)}, rgba(15, 23, 42, 0) 70%)`

const toRgba = (rgbColor: string, alpha: number) =>
	rgbColor.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)

const DetailFallbackGlow = ({
	activeViewId,
	isVisible,
	temperatureAccentColor,
}: Readonly<{
	activeViewId: ForecastViewId
	isVisible: boolean
	temperatureAccentColor: string
}>) => {
	const activeGradient =
		activeViewId === 'temperature'
			? getTemperatureDetailFallbackGradient(temperatureAccentColor)
			: DETAIL_FALLBACK_AURORA_GRADIENTS[activeViewId]

	return (
		<motion.div
			animate={{
				background: activeGradient,
				opacity: isVisible ? 0.68 : 0,
			}}
			aria-hidden="true"
			className="pointer-events-none absolute -top-[15%] right-[-10%] bottom-0 left-[-10%] z-1 mix-blend-screen"
			initial={false}
			style={{
				background: activeGradient,
				filter: 'blur(24px)',
				transform: 'translate3d(0, 0, 0)',
				willChange: 'background, opacity',
			}}
			transition={{ duration: 0.35, ease: 'easeOut' }}
		/>
	)
}

type DirectionalViewProps = {
	activeViewId: ForecastViewId
	children: ReactNode
	className: string
	previousTransitionViewId: ForecastViewId | null
	viewId: ForecastViewId
}

const DirectionalView = ({
	activeViewId,
	children,
	className,
	previousTransitionViewId,
	viewId,
}: Readonly<DirectionalViewProps>) => {
	const isActive = activeViewId === viewId
	const relativePosition = getViewRelativePosition({ activeViewId, viewId })
	const shouldWillChange =
		isActive ||
		Math.abs(relativePosition) === 1 ||
		previousTransitionViewId === viewId
	const y = relativePosition * VIEW_TRANSITION_DISTANCE

	return (
		<motion.div
			animate={{
				opacity: isActive ? 1 : 0,
				scale: isActive ? 1 : 0.92,
				y,
			}}
			aria-hidden={!isActive}
			className={`absolute inset-0 ${
				shouldWillChange ? 'will-change-[transform,opacity]' : ''
			} ${className}`}
			initial={false}
			style={{
				pointerEvents: isActive ? 'auto' : 'none',
				zIndex: isActive ? 2 : 1,
			}}
			transition={{ damping: 32, stiffness: 280, type: 'spring' }}
		>
			{children}
		</motion.div>
	)
}

type DirectionalViewYParams = {
	activeViewId: ForecastViewId
	viewId: ForecastViewId
}

const getViewRelativePosition = ({
	activeViewId,
	viewId,
}: DirectionalViewYParams) => {
	return VIEW_ORDER[viewId] - VIEW_ORDER[activeViewId]
}

const getViewBackgroundColor = (activeViewId: ForecastViewId) =>
	activeViewId === 'forecast'
		? FORECAST_VIEW_BACKGROUND_COLOR
		: DETAIL_VIEW_BACKGROUND_COLOR

const getHasDismissedScrollHint = () => {
	if (typeof window === 'undefined') {
		return true
	}

	try {
		const storedValue = localStorage.getItem(
			NEXT_24_HOURS_SCROLL_HINT_STORAGE_KEY,
		)
		if (!storedValue) {
			return false
		}

		const parsedValue = JSON.parse(storedValue)
		const dismissed = scrollHintDismissedSchema.safeParse(parsedValue)
		return dismissed.success ? dismissed.data : false
	} catch {
		return false
	}
}

const persistScrollHintDismissed = () => {
	if (typeof window === 'undefined') {
		return
	}

	try {
		localStorage.setItem(
			NEXT_24_HOURS_SCROLL_HINT_STORAGE_KEY,
			JSON.stringify(true),
		)
	} catch {
		// The hint is non-critical; failing to persist should not affect navigation.
	}
}

type AdjacentViewIdParams = {
	activeViewId: ForecastViewId
	canShowNext24HoursView: boolean
	direction: ViewStepDirection
}

const getAdjacentViewId = ({
	activeViewId,
	canShowNext24HoursView,
	direction,
}: AdjacentViewIdParams): ForecastViewId => {
	const viewIds = canShowNext24HoursView
		? FORECAST_VIEW_IDS
		: FORECAST_ONLY_VIEW_IDS
	const currentIndex = Math.max(0, viewIds.indexOf(activeViewId))
	const nextIndex =
		direction === 'next'
			? Math.min(currentIndex + 1, viewIds.length - 1)
			: Math.max(currentIndex - 1, 0)

	return viewIds[nextIndex] ?? 'forecast'
}

// Dock-style magnification tuning. `RADIUS` is how far (px) from the cursor a
// dot starts to grow; sizes are the dot diameter in px at rest and at the
// cursor's exact position.
const VIEW_INDICATOR_MAGNIFY_RADIUS = 55
const VIEW_INDICATOR_REST_SIZE = 10
const VIEW_INDICATOR_MAX_SIZE = 32

const ViewIndicator = ({
	activeViewId,
	isVisible,
	onMouseEnter,
	onMouseLeave,
	onSelectView,
	viewIds,
}: Readonly<{
	activeViewId: ForecastViewId
	isVisible: boolean
	onMouseEnter: () => void
	onMouseLeave: () => void
	onSelectView: (viewId: ForecastViewId) => void
	viewIds: readonly ForecastViewId[]
}>) => {
	const pointerY = useMotionValue(Number.POSITIVE_INFINITY)

	const handleMouseMove = (event: ReactMouseEvent) => {
		pointerY.set(event.clientY)
	}

	const handleMouseLeave = () => {
		pointerY.set(Number.POSITIVE_INFINITY)
		onMouseLeave()
	}

	return (
		<motion.div
			animate={{ opacity: isVisible ? 1 : 0 }}
			aria-hidden={!isVisible}
			aria-label="Weather view navigation"
			className="absolute inset-y-0 left-0 z-30 flex w-8 flex-col items-center justify-center"
			initial={false}
			onMouseEnter={onMouseEnter}
			onMouseLeave={handleMouseLeave}
			onMouseMove={handleMouseMove}
			role="navigation"
			transition={{ duration: 0.25 }}
		>
			{viewIds.map((viewId) => (
				<ViewIndicatorDot
					isActive={activeViewId === viewId}
					isVisible={isVisible}
					key={viewId}
					onSelect={() => onSelectView(viewId)}
					pointerY={pointerY}
					viewId={viewId}
				/>
			))}
		</motion.div>
	)
}

const ViewIndicatorDot = ({
	isActive,
	isVisible,
	onSelect,
	pointerY,
	viewId,
}: Readonly<{
	isActive: boolean
	isVisible: boolean
	onSelect: () => void
	pointerY: MotionValue<number>
	viewId: ForecastViewId
}>) => {
	const dotRef = useRef<HTMLSpanElement>(null)

	// Signed distance from the cursor to this dot's vertical center. Reading the
	// bounding box on each frame keeps the effect correct as dots resize.
	const distance = useTransform(pointerY, (y) => {
		const bounds = dotRef.current?.getBoundingClientRect()
		if (!bounds) return Number.POSITIVE_INFINITY
		return y - (bounds.y + bounds.height / 2)
	})

	const sizeTarget = useTransform(
		distance,
		[-VIEW_INDICATOR_MAGNIFY_RADIUS, 0, VIEW_INDICATOR_MAGNIFY_RADIUS],
		[
			VIEW_INDICATOR_REST_SIZE,
			VIEW_INDICATOR_MAX_SIZE,
			VIEW_INDICATOR_REST_SIZE,
		],
		{ clamp: true },
	)
	const size = useSpring(sizeTarget, {
		damping: 18,
		mass: 0.1,
		stiffness: 260,
	})

	const [isHovered, setIsHovered] = useState(false)

	const handleMouseEnter = () => setIsHovered(true)
	const handleMouseLeave = () => setIsHovered(false)

	// The button fills its full slot (vertical padding, no gaps between slots) so
	// the strip is one continuous hit target — like the macOS dock, the cursor is
	// always over exactly one option and that option's label always shows.
	return (
		<button
			aria-current={isActive ? 'page' : undefined}
			aria-label={`Show ${VIEW_INDICATOR_LABELS[viewId]} view`}
			className="group relative flex w-full cursor-pointer items-center justify-center py-1 focus:outline-none"
			onBlur={handleMouseLeave}
			onClick={onSelect}
			onFocus={handleMouseEnter}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			tabIndex={isVisible ? 0 : -1}
			type="button"
		>
			<motion.span
				animate={{ opacity: isActive ? 1 : 0.45, scale: isActive ? 1 : 0.6 }}
				className="rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.45)] group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-white"
				initial={false}
				ref={dotRef}
				style={{ height: size, width: size }}
				transition={{ damping: 24, stiffness: 420, type: 'spring' }}
			/>
			<AnimatePresence>
				{isHovered ? (
					<motion.span
						animate={{ opacity: 1, x: 0 }}
						className="pointer-events-none absolute top-1/2 left-full ml-1 -translate-y-1/2 rounded-md bg-black/55 px-2 py-1 text-xs whitespace-nowrap text-white capitalize backdrop-blur-sm before:absolute before:top-1/2 before:right-full before:-translate-y-1/2 before:border-6 before:border-transparent before:border-r-black/55 before:content-['']"
						exit={{ opacity: 0, x: -4 }}
						initial={{ opacity: 0, x: -4 }}
						transition={{ duration: 0.15 }}
					>
						{VIEW_INDICATOR_LABEL_NODES[viewId]}
					</motion.span>
				) : null}
			</AnimatePresence>
		</button>
	)
}

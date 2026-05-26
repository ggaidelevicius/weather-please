import { i18n } from '@lingui/core'
import { Trans } from '@lingui/react/macro'
import { IconAlertTriangle } from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import {
	type ReactNode,
	type TouchEvent,
	useEffect,
	useRef,
	useState,
	type WheelEvent,
} from 'react'
import { z } from 'zod'

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

	const { config, handleChange, input, isHydrated, setInput, updateConfig } =
		useConfig()
	const {
		alertData,
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

	const handleViewWheel = (event: WheelEvent<HTMLElement>) => {
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
					onWheel={handleViewWheel}
					transition={{ duration: 0.35, ease: 'easeOut' }}
				>
					<DetailFallbackGlow
						activeViewId={activeAvailableViewId}
						isVisible={shouldShowDetailFallbackGlow}
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
								<div className="col-span-full flex flex-col items-center justify-center gap-4">
									<Alert
										icon={IconAlertTriangle}
										variant={AlertVariant.InfoRed}
									>
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

			<Settings handleChange={handleChange} input={input} />
		</>
	)
}

export default App

const VIEW_ORDER: Record<ForecastViewId, number> = {
	conditions: 4,
	forecast: 0,
	map: 5,
	precipitation: 2,
	temperature: 1,
	wind: 3,
}

const FORECAST_ONLY_VIEW_IDS: readonly ForecastViewId[] = ['forecast']
const FORECAST_VIEW_IDS: readonly ForecastViewId[] = [
	'forecast',
	...NEXT_24_HOURS_DETAIL_VIEW_IDS,
]
const VIEW_INDICATOR_LABELS: Record<ForecastViewId, string> = {
	conditions: 'conditions',
	forecast: 'forecast',
	map: 'map',
	precipitation: 'precipitation',
	temperature: 'temperature',
	wind: 'wind',
}
const DETAIL_FALLBACK_AURORA_GRADIENTS: Record<ForecastViewId, string> = {
	conditions:
		'radial-gradient(120% 80% at 15% 0%, rgba(139, 92, 246, 0.22), rgba(76, 29, 149, 0.08) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(52, 211, 153, 0.16), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(129, 140, 248, 0.13), rgba(15, 23, 42, 0) 70%)',
	forecast:
		'radial-gradient(120% 80% at 15% 0%, rgba(59, 130, 246, 0.24), rgba(14, 116, 144, 0.1) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(129, 140, 248, 0.17), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(52, 211, 153, 0.13), rgba(15, 23, 42, 0) 70%)',
	map: 'radial-gradient(120% 80% at 15% 0%, rgba(6, 182, 212, 0.22), rgba(14, 116, 144, 0.11) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(56, 189, 248, 0.15), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(34, 211, 238, 0.12), rgba(15, 23, 42, 0) 70%)',
	precipitation:
		'radial-gradient(120% 80% at 15% 0%, rgba(37, 99, 235, 0.24), rgba(14, 116, 144, 0.12) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(56, 189, 248, 0.16), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(45, 212, 191, 0.12), rgba(15, 23, 42, 0) 70%)',
	temperature:
		'radial-gradient(120% 80% at 15% 0%, rgba(59, 130, 246, 0.24), rgba(14, 116, 144, 0.1) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(129, 140, 248, 0.17), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(52, 211, 153, 0.13), rgba(15, 23, 42, 0) 70%)',
	wind: 'radial-gradient(120% 80% at 15% 0%, rgba(14, 165, 233, 0.23), rgba(8, 145, 178, 0.1) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(103, 232, 249, 0.16), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(59, 130, 246, 0.12), rgba(15, 23, 42, 0) 70%)',
}

const DetailFallbackGlow = ({
	activeViewId,
	isVisible,
}: Readonly<{ activeViewId: ForecastViewId; isVisible: boolean }>) => {
	const activeGradient = DETAIL_FALLBACK_AURORA_GRADIENTS[activeViewId]

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
}>) => (
	<motion.div
		animate={{ opacity: isVisible ? 1 : 0 }}
		aria-hidden={!isVisible}
		aria-label="Weather view navigation"
		className="absolute inset-y-0 left-0 z-30 flex w-8 flex-col items-center justify-center gap-2"
		initial={false}
		onMouseEnter={onMouseEnter}
		onMouseLeave={onMouseLeave}
		role="navigation"
		transition={{ duration: 0.25 }}
	>
		{viewIds.map((viewId) => (
			<ViewIndicatorDot
				isActive={activeViewId === viewId}
				isVisible={isVisible}
				key={viewId}
				onSelect={() => onSelectView(viewId)}
				viewId={viewId}
			/>
		))}
	</motion.div>
)

const ViewIndicatorDot = ({
	isActive,
	isVisible,
	onSelect,
	viewId,
}: Readonly<{
	isActive: boolean
	isVisible: boolean
	onSelect: () => void
	viewId: ForecastViewId
}>) => (
	<motion.button
		animate={{
			opacity: isActive ? 1 : 0.45,
			scale: isActive ? 1 : 0.6,
		}}
		aria-current={isActive ? 'page' : undefined}
		aria-label={`Show ${VIEW_INDICATOR_LABELS[viewId]} view`}
		className="size-2.5 cursor-pointer rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.45)] transition-shadow hover:shadow-[0_0_14px_rgba(255,255,255,0.7)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
		initial={false}
		onClick={onSelect}
		tabIndex={isVisible ? 0 : -1}
		transition={{ damping: 24, stiffness: 420, type: 'spring' }}
	/>
)

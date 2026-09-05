import type { TouchEvent } from 'react'
import { useState, useRef, useEffect } from 'react'
import type {
	ForecastViewId,
	ViewStepDirection,
} from '../model/view-navigation'
import { getAdjacentViewId } from '../model/view-navigation'
import {
	getHasDismissedScrollHint,
	persistScrollHintDismissed,
} from '../model/scroll-hint'

const VIEW_SWITCH_SCROLL_DELTA_MIN = 1

const VIEW_SWITCH_TOUCH_THRESHOLD = 80

const VIEW_SWITCH_COOLDOWN_MS = 300

const VIEW_SWITCH_WHEEL_GESTURE_END_MS = 180

const VIEW_SWITCH_WHEEL_REIMPULSE_DELTA_MIN = 3

const VIEW_SWITCH_WHEEL_REIMPULSE_RATIO = 1.6

const VIEW_INDICATOR_VISIBLE_MS = 2500

const VIEW_TRANSITION_WILL_CHANGE_MS = 450

export const useViewNavigation = ({
	canShowNext24HoursView,
}: {
	canShowNext24HoursView: boolean
}) => {
	const [activeViewId, setActiveViewId] = useState<ForecastViewId>('forecast')
	const [isViewIndicatorHovered, setIsViewIndicatorHovered] = useState(false)
	const [isViewIndicatorVisible, setIsViewIndicatorVisible] = useState(false)
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

	const activeAvailableViewId = canShowNext24HoursView
		? activeViewId
		: 'forecast'
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

	return {
		activeAvailableViewId,
		previousTransitionViewId,
		isViewIndicatorHovered,
		isViewIndicatorVisible,
		handleViewIndicatorMouseEnter,
		handleViewIndicatorMouseLeave,
		handleViewIndicatorSelect,
		handleViewTouchStart,
		handleViewTouchEnd,
		viewFrameRef,
		shouldShowScrollHint,
	}
}

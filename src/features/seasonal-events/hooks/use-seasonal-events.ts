import { useEffect, useRef, useState } from 'react'

import type { SeasonalEventOverride } from '../core/types'

import { applySeasonalEventEffectBlur } from '../core/effect-blur'
import {
	Hemisphere,
	SEASONAL_EVENT_OVERRIDE_NONE,
	SeasonalEventId,
} from '../core/types'
import { isLikelySoftwareRenderer } from '../core/utils'

type SeasonalEventsModule = typeof import('../core/seasonal-events-module')

type UseSeasonalEventsOptions = {
	enabledEvents?: Set<SeasonalEventId>
	hemisphere?: Hemisphere
	isEnabled: boolean
	isHydrated?: boolean
	isOnboarded?: boolean
	seasonalEventOverride?: SeasonalEventOverride
	shouldBlurEffects?: boolean
}

let seasonalEventsModulePromise: null | Promise<SeasonalEventsModule> = null

const loadSeasonalEventsModule = () => {
	if (!seasonalEventsModulePromise) {
		seasonalEventsModulePromise = import('../core/seasonal-events-module')
	}

	return seasonalEventsModulePromise
}

export const useSeasonalEvents = ({
	enabledEvents,
	hemisphere,
	isEnabled,
	isHydrated = true,
	isOnboarded = true,
	seasonalEventOverride = SEASONAL_EVENT_OVERRIDE_NONE,
	shouldBlurEffects = false,
}: Readonly<UseSeasonalEventsOptions>) => {
	const triggeredEvents = useRef<Map<SeasonalEventId, Hemisphere | undefined>>(
		new Map(),
	)
	const [dateKey, setDateKey] = useState(() => getDateKey(new Date()))
	const activeDate = getDateFromKey(dateKey)
	const [activeEvent, setActiveEvent] = useState<null | SeasonalEventId>(null)
	const shouldResolveActiveEvent = isHydrated && isEnabled && isOnboarded
	const effectiveActiveEvent = shouldResolveActiveEvent ? activeEvent : null
	const effectHemisphere =
		effectiveActiveEvent === SeasonalEventId.ChristmasDay
			? (hemisphere ?? Hemisphere.Northern)
			: undefined
	const hasSeasonalEventOverride =
		seasonalEventOverride !== SEASONAL_EVENT_OVERRIDE_NONE

	useEffect(() => {
		if (!enabledEvents) {
			return
		}

		for (const triggeredEvent of triggeredEvents.current.keys()) {
			if (!enabledEvents.has(triggeredEvent)) {
				triggeredEvents.current.delete(triggeredEvent)
			}
		}
	}, [enabledEvents])

	useEffect(() => {
		if (!shouldResolveActiveEvent) {
			return
		}

		let hasCanceled = false

		const resolveActiveEvent = async () => {
			try {
				const seasonalEvents = await loadSeasonalEventsModule()
				if (hasCanceled) {
					return
				}
				const nextActiveEvent = seasonalEvents.getActiveSeasonalEvent({
					date: activeDate,
					enabledEvents,
					hemisphere,
					seasonalEventOverride,
				})
				setActiveEvent(nextActiveEvent)
			} catch (error) {
				console.error('Failed to load seasonal events module', error)
				setActiveEvent(null)
			}
		}

		void resolveActiveEvent()

		return () => {
			hasCanceled = true
		}
	}, [
		activeDate,
		enabledEvents,
		hemisphere,
		seasonalEventOverride,
		shouldResolveActiveEvent,
	])

	useEffect(() => {
		if (!shouldResolveActiveEvent) {
			return
		}

		let timeoutId: null | ReturnType<typeof setTimeout> = null

		const scheduleNextTick = () => {
			const now = new Date()
			const nextMidnight = new Date(now)
			nextMidnight.setHours(24, 0, 0, 0)
			const delay = Math.max(nextMidnight.getTime() - now.getTime(), 0)

			timeoutId = setTimeout(() => {
				setDateKey(getDateKey(new Date()))
				scheduleNextTick()
			}, delay)
		}

		scheduleNextTick()

		return () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId)
			}
		}
	}, [shouldResolveActiveEvent])

	useEffect(() => {
		if (isLikelySoftwareRenderer()) {
			return
		}
		if (!effectiveActiveEvent) {
			return
		}
		if (
			!hasSeasonalEventOverride &&
			triggeredEvents.current.has(effectiveActiveEvent) &&
			triggeredEvents.current.get(effectiveActiveEvent) === effectHemisphere
		) {
			return
		}

		if (!hasSeasonalEventOverride) {
			triggeredEvents.current.set(effectiveActiveEvent, effectHemisphere)
		}

		let cleanup = () => {}
		let hasCanceled = false

		const runEvent = async () => {
			try {
				const seasonalEvents = await loadSeasonalEventsModule()
				if (hasCanceled) {
					return
				}
				const nextCleanup = await seasonalEvents.runSeasonalEvent({
					eventId: effectiveActiveEvent,
					hemisphere: effectHemisphere,
				})

				if (hasCanceled) {
					nextCleanup()
					return
				}

				cleanup = nextCleanup
			} catch (error) {
				console.error('Failed to load seasonal event', error)
			}
		}

		void runEvent()

		return () => {
			hasCanceled = true
			cleanup()
		}
	}, [effectiveActiveEvent, effectHemisphere, hasSeasonalEventOverride])

	useEffect(() => {
		if (!effectiveActiveEvent || typeof document === 'undefined') {
			return
		}

		const applyCurrentBlurState = () => {
			applySeasonalEventEffectBlur({ shouldBlurEffects })
		}
		const mutationObserver = new MutationObserver(applyCurrentBlurState)

		applyCurrentBlurState()
		mutationObserver.observe(document.body, { childList: true })

		return () => {
			mutationObserver.disconnect()
			applySeasonalEventEffectBlur({ shouldBlurEffects: false })
		}
	}, [effectiveActiveEvent, shouldBlurEffects])

	return effectiveActiveEvent
}

const getDateKey = (date: Date) =>
	`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

const getDateFromKey = (dateKey: string) => {
	const [year, month, day] = dateKey.split('-').map(Number)
	return new Date(year, month, day)
}

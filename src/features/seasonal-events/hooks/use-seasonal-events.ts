import { useEffect, useState } from 'react'

import type { SeasonalBackground, SeasonalEventOverride } from '../core/types'

import { getCurrentDate, getCurrentDateTime } from '../../../shared/lib/time'
import { applySeasonalEventEffectBlur } from '../core/effect-blur'
import {
	Hemisphere,
	SEASONAL_BACKGROUND_AUTOMATIC,
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
	seasonalBackground?: SeasonalBackground
	seasonalEventOverride?: SeasonalEventOverride
	shouldBlurEffects?: boolean
	shouldPreferSeasonalBackgrounds?: boolean
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
	seasonalBackground = SEASONAL_BACKGROUND_AUTOMATIC,
	seasonalEventOverride = SEASONAL_EVENT_OVERRIDE_NONE,
	shouldBlurEffects = false,
	shouldPreferSeasonalBackgrounds = false,
}: Readonly<UseSeasonalEventsOptions>) => {
	const [dateKey, setDateKey] = useState(() => getCurrentDate().toString())
	const [activeEvent, setActiveEvent] = useState<null | SeasonalEventId>()
	const shouldResolveActiveEvent = isHydrated && isEnabled && isOnboarded
	if (!shouldResolveActiveEvent && activeEvent !== undefined) {
		setActiveEvent(undefined)
	}
	const hasPermanentBackground =
		seasonalBackground !== SEASONAL_BACKGROUND_AUTOMATIC
	const shouldUseSeasonalBackground =
		isEnabled && (!hasPermanentBackground || shouldPreferSeasonalBackgrounds)
	const canShowBackground =
		isHydrated &&
		isOnboarded &&
		(!shouldUseSeasonalBackground || activeEvent !== undefined)
	const fallbackBackground = hasPermanentBackground ? seasonalBackground : null
	const effectiveActiveEvent = canShowBackground
		? ((shouldUseSeasonalBackground ? activeEvent : null) ?? fallbackBackground)
		: null
	const effectHemisphere =
		effectiveActiveEvent === SeasonalEventId.ChristmasDay
			? (hemisphere ?? Hemisphere.Northern)
			: undefined

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
					date: getCurrentDate(),
					enabledEvents,
					hemisphere,
					seasonalEventOverride,
				})
				setActiveEvent(nextActiveEvent)
			} catch (error) {
				if (hasCanceled) {
					return
				}
				console.error('Failed to load seasonal events module', error)
				setActiveEvent(null)
			}
		}

		void resolveActiveEvent()

		return () => {
			hasCanceled = true
		}
	}, [
		dateKey,
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
			const now = getCurrentDateTime()
			const nextMidnight = now.add({ days: 1 }).startOfDay()
			const delay = Math.max(
				nextMidnight.epochMilliseconds - now.epochMilliseconds,
				0,
			)

			timeoutId = setTimeout(() => {
				setDateKey(getCurrentDate().toString())
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
	}, [effectiveActiveEvent, effectHemisphere])

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

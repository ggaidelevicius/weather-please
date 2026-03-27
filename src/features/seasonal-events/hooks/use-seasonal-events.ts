import { useEffect, useRef, useState } from 'react'

import type { Hemisphere, SeasonalEventId } from '../core/types'

import { isLikelySoftwareRenderer } from '../core/utils'

type SeasonalEventsModule = typeof import('../core/seasonal-events-module')

type UseSeasonalEventsOptions = {
	enabledEvents?: Set<SeasonalEventId>
	hemisphere?: Hemisphere
	isEnabled: boolean
	isHydrated?: boolean
	isOnboarded?: boolean
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
}: Readonly<UseSeasonalEventsOptions>) => {
	const triggeredEvents = useRef<Set<SeasonalEventId>>(new Set())
	const [dateKey, setDateKey] = useState(() => getDateKey(new Date()))
	const activeDate = getDateFromKey(dateKey)
	const [activeEvent, setActiveEvent] = useState<null | SeasonalEventId>(null)
	const shouldResolveActiveEvent = isHydrated && isEnabled && isOnboarded
	const effectiveActiveEvent = shouldResolveActiveEvent ? activeEvent : null

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
	}, [activeDate, enabledEvents, hemisphere, shouldResolveActiveEvent])

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
		if (triggeredEvents.current.has(effectiveActiveEvent)) {
			return
		}

		triggeredEvents.current.add(effectiveActiveEvent)

		let cleanup = () => {}
		let hasCanceled = false

		const runEvent = async () => {
			try {
				const seasonalEvents = await loadSeasonalEventsModule()
				const nextCleanup =
					await seasonalEvents.runSeasonalEvent(effectiveActiveEvent)

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
	}, [effectiveActiveEvent])

	return effectiveActiveEvent
}

const getDateKey = (date: Date) =>
	`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

const getDateFromKey = (dateKey: string) => {
	const [year, month, day] = dateKey.split('-').map(Number)
	return new Date(year, month, day)
}

import { useEffect, useRef, useState } from 'react'
import { isLikelySoftwareRenderer } from '../model/utils'
import type { Hemisphere, SeasonalEventId } from '../model/types'

type UseSeasonalEventsOptions = {
	isEnabled: boolean
	isHydrated?: boolean
	isOnboarded?: boolean
	enabledEvents?: Set<SeasonalEventId>
	hemisphere?: Hemisphere
}

type SeasonalEventsModule = typeof import('../model/seasonal-events-module')

let seasonalEventsModulePromise: Promise<SeasonalEventsModule> | null = null

const loadSeasonalEventsModule = () => {
	if (!seasonalEventsModulePromise) {
		seasonalEventsModulePromise = import('../model/seasonal-events-module')
	}

	return seasonalEventsModulePromise
}

export const useSeasonalEvents = ({
	isEnabled,
	isHydrated = true,
	isOnboarded = true,
	enabledEvents,
	hemisphere,
}: Readonly<UseSeasonalEventsOptions>) => {
	const triggeredEvents = useRef<Set<SeasonalEventId>>(new Set())
	const [dateKey, setDateKey] = useState(() => getDateKey(new Date()))
	const activeDate = getDateFromKey(dateKey)
	const [activeEvent, setActiveEvent] = useState<SeasonalEventId | null>(null)

	useEffect(() => {
		if (!isHydrated || !isEnabled || !isOnboarded) {
			setActiveEvent(null)
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
	}, [
		activeDate,
		enabledEvents,
		hemisphere,
		isEnabled,
		isHydrated,
		isOnboarded,
	])

	useEffect(() => {
		if (!isHydrated || !isEnabled || !isOnboarded) {
			return
		}

		setDateKey(getDateKey(new Date()))

		let timeoutId: ReturnType<typeof setTimeout> | null = null

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
	}, [isEnabled, isHydrated, isOnboarded])

	useEffect(() => {
		if (isLikelySoftwareRenderer()) {
			return
		}
		if (!activeEvent) {
			return
		}
		if (triggeredEvents.current.has(activeEvent)) {
			return
		}

		triggeredEvents.current.add(activeEvent)

		let cleanup = () => {}
		let hasCanceled = false

		const runEvent = async () => {
			try {
				const seasonalEvents = await loadSeasonalEventsModule()
				const nextCleanup = await seasonalEvents.runSeasonalEvent(activeEvent)

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
	}, [activeEvent])

	return activeEvent
}

const getDateKey = (date: Date) =>
	`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

const getDateFromKey = (dateKey: string) => {
	const [year, month, day] = dateKey.split('-').map(Number)
	return new Date(year, month, day)
}

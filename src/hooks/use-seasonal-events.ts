import { useEffect, useRef } from 'react'
import { getActiveSeasonalEvent, runSeasonalEvent } from './seasonal-events'
import type { SeasonalEventId } from './seasonal-events'

type UseSeasonalEventsOptions = {
	isEnabled: boolean
	isHydrated?: boolean
	isOnboarded?: boolean
	enabledEvents?: Set<SeasonalEventId>
}

export const useSeasonalEvents = ({
	isEnabled,
	isHydrated = true,
	isOnboarded = true,
	enabledEvents,
}: Readonly<UseSeasonalEventsOptions>) => {
	const triggeredEvents = useRef<Set<SeasonalEventId>>(new Set())
	const activeEvent =
		isHydrated && isEnabled && isOnboarded
			? getActiveSeasonalEvent(new Date(), enabledEvents)
			: null

	useEffect(() => {
		if (!activeEvent) return
		if (triggeredEvents.current.has(activeEvent)) return

		triggeredEvents.current.add(activeEvent)

		let cleanup = () => {}
		let hasCanceled = false

		const runEvent = async () => {
			try {
				const nextCleanup = await runSeasonalEvent(activeEvent)

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

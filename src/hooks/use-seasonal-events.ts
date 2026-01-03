import { useEffect, useRef, useState } from 'react'
import { getActiveSeasonalEvent, runSeasonalEvent } from './seasonal-events'
import { isLikelySoftwareRenderer } from './seasonal-events/utils'
import type { Hemisphere, SeasonalEventId } from './seasonal-events'

type UseSeasonalEventsOptions = {
	isEnabled: boolean
	isHydrated?: boolean
	isOnboarded?: boolean
	enabledEvents?: Set<SeasonalEventId>
	hemisphere?: Hemisphere
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
	const activeEvent =
		isHydrated && isEnabled && isOnboarded
			? getActiveSeasonalEvent({
					date: activeDate,
					enabledEvents,
					hemisphere,
				})
			: null

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

const getDateKey = (date: Date) =>
	`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

const getDateFromKey = (dateKey: string) => {
	const [year, month, day] = dateKey.split('-').map(Number)
	return new Date(year, month, day)
}

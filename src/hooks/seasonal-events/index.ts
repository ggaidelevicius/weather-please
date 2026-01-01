import { lunarNewYearEvent } from './lunar-new-year'
import { newYearsEvent } from './new-years'
import { springEquinoxEvent } from './spring-equinox'
import { valentinesEvent } from './valentines'
import { earthDayEvent } from './earth-day'
import type {
	SeasonalEvent,
	SeasonalEventId,
	SeasonalEventTileAccent,
} from './types'

const seasonalEvents: SeasonalEvent[] = [
	newYearsEvent,
	valentinesEvent,
	lunarNewYearEvent,
	springEquinoxEvent,
	earthDayEvent,
]
const seasonalEventMap = new Map<SeasonalEventId, SeasonalEvent>(
	seasonalEvents.map((event) => [event.id, event]),
)

export type { SeasonalEventId } from './types'
export type { SeasonalEventTileAccent } from './types'

export const getSeasonalEventForDate = (
	date: Date,
	enabledEvents?: Set<SeasonalEventId>,
): SeasonalEvent | null => {
	for (const event of seasonalEvents) {
		if (enabledEvents && !enabledEvents.has(event.id)) {
			continue
		}
		if (event.isActive(date)) {
			return event
		}
	}

	return null
}

export const getActiveSeasonalEvent = (
	date: Date,
	enabledEvents?: Set<SeasonalEventId>,
): SeasonalEventId | null => {
	const event = getSeasonalEventForDate(date, enabledEvents)
	return event ? event.id : null
}

export const runSeasonalEvent = (eventId: SeasonalEventId) => {
	const event = seasonalEventMap.get(eventId)

	if (!event) {
		return Promise.resolve(() => {})
	}

	return event.run()
}

export const getSeasonalTileAccent = (
	date: Date,
	enabledEvents?: Set<SeasonalEventId>,
): SeasonalEventTileAccent | null => {
	const event = getSeasonalEventForDate(date, enabledEvents)
	return event?.tileAccent ?? null
}

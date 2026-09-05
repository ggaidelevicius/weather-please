import { autumnEquinoxEvent } from '../definitions/autumn-equinox'
import { blackHoleEvent } from '../definitions/black-hole'
import { christmasEvent } from '../definitions/christmas'
import { dayOfTheDeadEvent } from '../definitions/day-of-the-dead'
import { diwaliEvent } from '../definitions/diwali'
import { earthDayEvent } from '../definitions/earth-day'
import { easterEvent } from '../definitions/easter'
import { eidAlAdhaEvent } from '../definitions/eid-al-adha'
import { eidAlFitrEvent } from '../definitions/eid-al-fitr'
import { etaAquariidsEvent } from '../definitions/eta-aquariids'
import { geminidsEvent } from '../definitions/geminids'
import { halloweenEvent } from '../definitions/halloween'
import { hanukkahEvent } from '../definitions/hanukkah'
import { holiEvent } from '../definitions/holi'
import { leonidsEvent } from '../definitions/leonids'
import { lunarNewYearEvent } from '../definitions/lunar-new-year'
import { lyridsEvent } from '../definitions/lyrids'
import { newYearsEvent } from '../definitions/new-years'
import { orionidsEvent } from '../definitions/orionids'
import { perseidsEvent } from '../definitions/perseids'
import { quadrantidsEvent } from '../definitions/quadrantids'
import { springEquinoxEvent } from '../definitions/spring-equinox'
import { summerSolsticeEvent } from '../definitions/summer-solstice'
import { totalLunarEclipseEvent } from '../definitions/total-lunar-eclipse'
import { totalSolarEclipseEvent } from '../definitions/total-solar-eclipse'
import { valentinesEvent } from '../definitions/valentines'
import { winterSolsticeEvent } from '../definitions/winter-solstice'
import {
	Hemisphere,
	SEASONAL_EVENT_OVERRIDE_NONE,
	type SeasonalEvent,
	SeasonalEventId,
	type SeasonalEventOverride,
	type SeasonalEventTileAccent,
} from './types'

const seasonalEvents: SeasonalEvent[] = [
	newYearsEvent,
	valentinesEvent,
	lunarNewYearEvent,
	easterEvent,
	springEquinoxEvent,
	autumnEquinoxEvent,
	diwaliEvent,
	eidAlFitrEvent,
	eidAlAdhaEvent,
	hanukkahEvent,
	christmasEvent,
	holiEvent,
	summerSolsticeEvent,
	winterSolsticeEvent,
	earthDayEvent,
	halloweenEvent,
	dayOfTheDeadEvent,
	lyridsEvent,
	etaAquariidsEvent,
	orionidsEvent,
	leonidsEvent,
	totalSolarEclipseEvent,
	totalLunarEclipseEvent,
	perseidsEvent,
	quadrantidsEvent,
	geminidsEvent,
	blackHoleEvent,
]
const seasonalEventMap = new Map<SeasonalEventId, SeasonalEvent>(
	seasonalEvents.map((event) => [event.id, event]),
)

export type { SeasonalEventTileAccent } from './types'
export {
	Hemisphere,
	SEASONAL_EVENT_OVERRIDE_NONE,
	SeasonalEventId,
} from './types'

export const getSeasonalEventById = (
	eventId: SeasonalEventId,
): null | SeasonalEvent => seasonalEventMap.get(eventId) ?? null

const getOverriddenSeasonalEvent = (
	seasonalEventOverride?: SeasonalEventOverride,
) => {
	if (
		!seasonalEventOverride ||
		seasonalEventOverride === SEASONAL_EVENT_OVERRIDE_NONE
	) {
		return null
	}

	return getSeasonalEventById(seasonalEventOverride)
}

export const getSeasonalEventForDate = (params: {
	date: Date
	enabledEvents?: Set<SeasonalEventId>
	hemisphere?: Hemisphere
	seasonalEventOverride?: SeasonalEventOverride
}): null | SeasonalEvent => {
	const {
		date,
		enabledEvents,
		hemisphere = Hemisphere.Northern,
		seasonalEventOverride,
	} = params
	const overriddenEvent = getOverriddenSeasonalEvent(seasonalEventOverride)
	if (overriddenEvent) {
		return overriddenEvent
	}

	for (const event of seasonalEvents) {
		if (enabledEvents && !enabledEvents.has(event.id)) {
			continue
		}
		if (event.isActive({ date, hemisphere })) {
			return event
		}
	}

	return null
}

export const getActiveSeasonalEvent = (params: {
	date: Date
	enabledEvents?: Set<SeasonalEventId>
	hemisphere?: Hemisphere
	seasonalEventOverride?: SeasonalEventOverride
}): null | SeasonalEventId => {
	const event = getSeasonalEventForDate(params)
	return event ? event.id : null
}

export const runSeasonalEvent = (eventId: SeasonalEventId) => {
	const event = seasonalEventMap.get(eventId)

	if (!event) {
		return Promise.resolve(() => {})
	}

	return event.run()
}

export const getSeasonalTileAccent = (params: {
	date: Date
	enabledEvents?: Set<SeasonalEventId>
	hemisphere?: Hemisphere
	seasonalEventOverride?: SeasonalEventOverride
}): null | SeasonalEventTileAccent => {
	const event = getSeasonalEventForDate(params)
	return event?.tileAccent ?? null
}

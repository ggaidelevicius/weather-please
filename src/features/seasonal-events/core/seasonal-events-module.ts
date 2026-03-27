import { autumnEquinoxEvent } from '../events/autumn-equinox'
import { blackHoleEvent } from '../events/black-hole'
import { christmasEvent } from '../events/christmas'
import { dayOfTheDeadEvent } from '../events/day-of-the-dead'
import { diwaliEvent } from '../events/diwali'
import { earthDayEvent } from '../events/earth-day'
import { easterEvent } from '../events/easter'
import { eidAlAdhaEvent } from '../events/eid-al-adha'
import { eidAlFitrEvent } from '../events/eid-al-fitr'
import { etaAquariidsEvent } from '../events/eta-aquariids'
import { geminidsEvent } from '../events/geminids'
import { halloweenEvent } from '../events/halloween'
import { hanukkahEvent } from '../events/hanukkah'
import { holiEvent } from '../events/holi'
import { leonidsEvent } from '../events/leonids'
import { lunarNewYearEvent } from '../events/lunar-new-year'
import { lyridsEvent } from '../events/lyrids'
import { newYearsEvent } from '../events/new-years'
import { orionidsEvent } from '../events/orionids'
import { perseidsEvent } from '../events/perseids'
import { quadrantidsEvent } from '../events/quadrantids'
import { springEquinoxEvent } from '../events/spring-equinox'
import { summerSolsticeEvent } from '../events/summer-solstice'
import { totalLunarEclipseEvent } from '../events/total-lunar-eclipse'
import { totalSolarEclipseEvent } from '../events/total-solar-eclipse'
import { valentinesEvent } from '../events/valentines'
import { winterSolsticeEvent } from '../events/winter-solstice'
import {
	Hemisphere,
	type SeasonalEvent,
	SeasonalEventId,
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
export { Hemisphere, SeasonalEventId } from './types'

export const getSeasonalEventForDate = (params: {
	date: Date
	enabledEvents?: Set<SeasonalEventId>
	hemisphere?: Hemisphere
}): null | SeasonalEvent => {
	const { date, enabledEvents, hemisphere = Hemisphere.Northern } = params

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
}): null | SeasonalEventTileAccent => {
	const event = getSeasonalEventForDate(params)
	return event?.tileAccent ?? null
}

import { lunarNewYearEvent } from '../events/lunar-new-year'
import { newYearsEvent } from '../events/new-years'
import { springEquinoxEvent } from '../events/spring-equinox'
import { autumnEquinoxEvent } from '../events/autumn-equinox'
import { diwaliEvent } from '../events/diwali'
import { holiEvent } from '../events/holi'
import { summerSolsticeEvent } from '../events/summer-solstice'
import { winterSolsticeEvent } from '../events/winter-solstice'
import { valentinesEvent } from '../events/valentines'
import { earthDayEvent } from '../events/earth-day'
import { halloweenEvent } from '../events/halloween'
import { dayOfTheDeadEvent } from '../events/day-of-the-dead'
import { lyridsEvent } from '../events/lyrids'
import { etaAquariidsEvent } from '../events/eta-aquariids'
import { orionidsEvent } from '../events/orionids'
import { leonidsEvent } from '../events/leonids'
import { totalSolarEclipseEvent } from '../events/total-solar-eclipse'
import { totalLunarEclipseEvent } from '../events/total-lunar-eclipse'
import { perseidsEvent } from '../events/perseids'
import { quadrantidsEvent } from '../events/quadrantids'
import { geminidsEvent } from '../events/geminids'
import { eidAlFitrEvent } from '../events/eid-al-fitr'
import { eidAlAdhaEvent } from '../events/eid-al-adha'
import { hanukkahEvent } from '../events/hanukkah'
import { christmasEvent } from '../events/christmas'
import { easterEvent } from '../events/easter'
import { blackHoleEvent } from '../events/black-hole'
import {
	Hemisphere,
	SeasonalEventId,
	type SeasonalEvent,
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
}): SeasonalEvent | null => {
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
}): SeasonalEventId | null => {
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
}): SeasonalEventTileAccent | null => {
	const event = getSeasonalEventForDate(params)
	return event?.tileAccent ?? null
}

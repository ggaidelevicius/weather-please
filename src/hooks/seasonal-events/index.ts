import { lunarNewYearEvent } from './lunar-new-year'
import { newYearsEvent } from './new-years'
import { springEquinoxEvent } from './spring-equinox'
import { autumnEquinoxEvent } from './autumn-equinox'
import { diwaliEvent } from './diwali'
import { holiEvent } from './holi'
import { summerSolsticeEvent } from './summer-solstice'
import { winterSolsticeEvent } from './winter-solstice'
import { valentinesEvent } from './valentines'
import { earthDayEvent } from './earth-day'
import { halloweenEvent } from './halloween'
import { lyridsEvent } from './lyrids'
import { etaAquariidsEvent } from './eta-aquariids'
import { orionidsEvent } from './orionids'
import { perseidsEvent } from './perseids'
import { quadrantidsEvent } from './quadrantids'
import { geminidsEvent } from './geminids'
import { eidAlFitrEvent } from './eid-al-fitr'
import { eidAlAdhaEvent } from './eid-al-adha'
import { hanukkahEvent } from './hanukkah'
import { christmasEvent } from './christmas'
import type {
	Hemisphere,
	SeasonalEvent,
	SeasonalEventId,
	SeasonalEventTileAccent,
} from './types'

const seasonalEvents: SeasonalEvent[] = [
	newYearsEvent,
	valentinesEvent,
	lunarNewYearEvent,
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
	lyridsEvent,
	etaAquariidsEvent,
	orionidsEvent,
	perseidsEvent,
	quadrantidsEvent,
	geminidsEvent,
]
const seasonalEventMap = new Map<SeasonalEventId, SeasonalEvent>(
	seasonalEvents.map((event) => [event.id, event]),
)

export type { Hemisphere, SeasonalEventId } from './types'
export type { SeasonalEventTileAccent } from './types'

export const getSeasonalEventForDate = (params: {
	date: Date
	enabledEvents?: Set<SeasonalEventId>
	hemisphere?: Hemisphere
}): SeasonalEvent | null => {
	const { date, enabledEvents, hemisphere = 'northern' } = params

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

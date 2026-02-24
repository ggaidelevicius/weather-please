import type { Config } from '../use-config'
import type { SeasonalEventId } from '.'

const SEASONAL_EVENT_FLAG_MAP = [
	['showNewYearsEvent', 'new-years-day'],
	['showValentinesEvent', 'valentines-day'],
	['showLunarNewYearEvent', 'lunar-new-year'],
	['showEasterEvent', 'easter'],
	['showSpringEquinoxEvent', 'spring-equinox'],
	['showAutumnEquinoxEvent', 'autumn-equinox'],
	['showDiwaliEvent', 'diwali'],
	['showHoliEvent', 'holi'],
	['showEarthDayEvent', 'earth-day'],
	['showSummerSolsticeEvent', 'summer-solstice'],
	['showWinterSolsticeEvent', 'winter-solstice'],
	['showHalloweenEvent', 'halloween'],
	['showDayOfTheDeadEvent', 'day-of-the-dead'],
	['showPerseidsEvent', 'perseids'],
	['showQuadrantidsEvent', 'quadrantids'],
	['showLyridsEvent', 'lyrids'],
	['showEtaAquariidsEvent', 'eta-aquariids'],
	['showOrionidsEvent', 'orionids'],
	['showLeonidsEvent', 'leonids'],
	['showTotalSolarEclipseEvent', 'total-solar-eclipse'],
	['showTotalLunarEclipseEvent', 'total-lunar-eclipse'],
	['showGeminidsEvent', 'geminids'],
	['showEidAlFitrEvent', 'eid-al-fitr'],
	['showEidAlAdhaEvent', 'eid-al-adha'],
	['showHanukkahEvent', 'hanukkah'],
	['showChristmasEvent', 'christmas-day'],
] as const satisfies ReadonlyArray<readonly [keyof Config, SeasonalEventId]>

type SeasonalEventToggleKey = (typeof SEASONAL_EVENT_FLAG_MAP)[number][0]

export type SeasonalEventSettings = Pick<
	Config,
	'showSeasonalEvents' | SeasonalEventToggleKey
>

export const getEnabledSeasonalEvents = (
	config: SeasonalEventSettings,
): Set<SeasonalEventId> => {
	if (!config.showSeasonalEvents) {
		return new Set()
	}

	return new Set(
		SEASONAL_EVENT_FLAG_MAP.filter(([flag]) => config[flag]).map(
			([, eventId]) => eventId,
		),
	)
}

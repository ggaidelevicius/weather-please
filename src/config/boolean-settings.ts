import { z } from 'zod'
import type { SeasonalEventId } from '../hooks/seasonal-events'

type BooleanSettingCategory =
	| 'general'
	| 'weather'
	| 'alerts'
	| 'seasonal'
	| 'seasonal-event'
	| 'internal'

type BooleanSettingDefinition = {
	key: string
	defaultValue: boolean
	category: BooleanSettingCategory
	seasonalEventId?: SeasonalEventId
}

export const BOOLEAN_SETTINGS = [
	{ key: 'displayedReviewPrompt', defaultValue: false, category: 'internal' },
	{ key: 'periodicLocationUpdate', defaultValue: false, category: 'weather' },
	{ key: 'useMetric', defaultValue: true, category: 'general' },
	{ key: 'showAlerts', defaultValue: true, category: 'alerts' },
	{ key: 'showUvAlerts', defaultValue: true, category: 'alerts' },
	{ key: 'showWindAlerts', defaultValue: true, category: 'alerts' },
	{ key: 'showVisibilityAlerts', defaultValue: true, category: 'alerts' },
	{
		key: 'showPrecipitationAlerts',
		defaultValue: true,
		category: 'alerts',
	},
	{ key: 'useCompactAlerts', defaultValue: true, category: 'alerts' },
	{
		key: 'useAirQualityUvOverride',
		defaultValue: false,
		category: 'weather',
	},
	{ key: 'showSeasonalEvents', defaultValue: true, category: 'seasonal' },
	{ key: 'showSeasonalTileGlow', defaultValue: true, category: 'seasonal' },
	{
		key: 'showNewYearsEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'new-years-day',
	},
	{
		key: 'showValentinesEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'valentines-day',
	},
	{
		key: 'showLunarNewYearEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'lunar-new-year',
	},
	{
		key: 'showEasterEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'easter',
	},
	{
		key: 'showSpringEquinoxEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'spring-equinox',
	},
	{
		key: 'showAutumnEquinoxEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'autumn-equinox',
	},
	{
		key: 'showDiwaliEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'diwali',
	},
	{
		key: 'showHoliEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'holi',
	},
	{
		key: 'showEarthDayEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'earth-day',
	},
	{
		key: 'showSummerSolsticeEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'summer-solstice',
	},
	{
		key: 'showWinterSolsticeEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'winter-solstice',
	},
	{
		key: 'showHalloweenEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'halloween',
	},
	{
		key: 'showDayOfTheDeadEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'day-of-the-dead',
	},
	{
		key: 'showPerseidsEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'perseids',
	},
	{
		key: 'showQuadrantidsEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'quadrantids',
	},
	{
		key: 'showLyridsEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'lyrids',
	},
	{
		key: 'showEtaAquariidsEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'eta-aquariids',
	},
	{
		key: 'showOrionidsEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'orionids',
	},
	{
		key: 'showLeonidsEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'leonids',
	},
	{
		key: 'showTotalSolarEclipseEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'total-solar-eclipse',
	},
	{
		key: 'showTotalLunarEclipseEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'total-lunar-eclipse',
	},
	{
		key: 'showGeminidsEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'geminids',
	},
	{
		key: 'showEidAlFitrEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'eid-al-fitr',
	},
	{
		key: 'showEidAlAdhaEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'eid-al-adha',
	},
	{
		key: 'showHanukkahEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'hanukkah',
	},
	{
		key: 'showChristmasEvent',
		defaultValue: true,
		category: 'seasonal-event',
		seasonalEventId: 'christmas-day',
	},
] as const satisfies ReadonlyArray<BooleanSettingDefinition>

type ObjectFromEntries<
	T extends ReadonlyArray<readonly [PropertyKey, unknown]>,
> = {
	[K in T[number] as K[0]]: Extract<T[number], readonly [K[0], unknown]>[1]
}

const fromEntries = <T extends ReadonlyArray<readonly [PropertyKey, unknown]>>(
	entries: T,
) => Object.fromEntries(entries) as ObjectFromEntries<T>

export type BooleanConfigKey = (typeof BOOLEAN_SETTINGS)[number]['key']

export const BOOLEAN_CONFIG_DEFAULTS = fromEntries(
	BOOLEAN_SETTINGS.map(
		(setting) => [setting.key, setting.defaultValue] as const,
	),
) as Record<BooleanConfigKey, boolean>

export const BOOLEAN_CONFIG_SCHEMA_SHAPE = fromEntries(
	BOOLEAN_SETTINGS.map((setting) => [setting.key, z.boolean()] as const),
) as Record<BooleanConfigKey, z.ZodBoolean>

export const SEASONAL_EVENT_BOOLEAN_SETTINGS = BOOLEAN_SETTINGS.filter(
	(
		setting,
	): setting is Extract<
		(typeof BOOLEAN_SETTINGS)[number],
		{ seasonalEventId: SeasonalEventId }
	> => 'seasonalEventId' in setting,
) as ReadonlyArray<
	Extract<
		(typeof BOOLEAN_SETTINGS)[number],
		{ seasonalEventId: SeasonalEventId }
	>
>

import { z } from 'zod'
import { SeasonalEventId } from '../../seasonal-events/model/types'

enum BooleanSettingCategory {
	General = 'general',
	Weather = 'weather',
	Alerts = 'alerts',
	Seasonal = 'seasonal',
	SeasonalEvent = 'seasonal-event',
	Internal = 'internal',
}

type BooleanSettingDefinition = {
	key: string
	defaultValue: boolean
	category: BooleanSettingCategory
	seasonalEventId?: SeasonalEventId
}

export const BOOLEAN_SETTINGS = [
	{
		key: 'displayedReviewPrompt',
		defaultValue: false,
		category: BooleanSettingCategory.Internal,
	},
	{
		key: 'periodicLocationUpdate',
		defaultValue: false,
		category: BooleanSettingCategory.Weather,
	},
	{
		key: 'useMetric',
		defaultValue: true,
		category: BooleanSettingCategory.General,
	},
	{
		key: 'showAlerts',
		defaultValue: true,
		category: BooleanSettingCategory.Alerts,
	},
	{
		key: 'showUvAlerts',
		defaultValue: true,
		category: BooleanSettingCategory.Alerts,
	},
	{
		key: 'showWindAlerts',
		defaultValue: true,
		category: BooleanSettingCategory.Alerts,
	},
	{
		key: 'showVisibilityAlerts',
		defaultValue: true,
		category: BooleanSettingCategory.Alerts,
	},
	{
		key: 'showPrecipitationAlerts',
		defaultValue: true,
		category: BooleanSettingCategory.Alerts,
	},
	{
		key: 'useCompactAlerts',
		defaultValue: true,
		category: BooleanSettingCategory.Alerts,
	},
	{
		key: 'useAirQualityUvOverride',
		defaultValue: false,
		category: BooleanSettingCategory.Weather,
	},
	{
		key: 'showSeasonalEvents',
		defaultValue: true,
		category: BooleanSettingCategory.Seasonal,
	},
	{
		key: 'showSeasonalTileGlow',
		defaultValue: true,
		category: BooleanSettingCategory.Seasonal,
	},
	{
		key: 'showNewYearsEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.NewYearsDay,
	},
	{
		key: 'showValentinesEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.ValentinesDay,
	},
	{
		key: 'showLunarNewYearEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.LunarNewYear,
	},
	{
		key: 'showEasterEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.Easter,
	},
	{
		key: 'showSpringEquinoxEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.SpringEquinox,
	},
	{
		key: 'showAutumnEquinoxEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.AutumnEquinox,
	},
	{
		key: 'showDiwaliEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.Diwali,
	},
	{
		key: 'showHoliEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.Holi,
	},
	{
		key: 'showEarthDayEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.EarthDay,
	},
	{
		key: 'showSummerSolsticeEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.SummerSolstice,
	},
	{
		key: 'showWinterSolsticeEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.WinterSolstice,
	},
	{
		key: 'showHalloweenEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.Halloween,
	},
	{
		key: 'showDayOfTheDeadEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.DayOfTheDead,
	},
	{
		key: 'showPerseidsEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.Perseids,
	},
	{
		key: 'showQuadrantidsEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.Quadrantids,
	},
	{
		key: 'showLyridsEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.Lyrids,
	},
	{
		key: 'showEtaAquariidsEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.EtaAquariids,
	},
	{
		key: 'showOrionidsEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.Orionids,
	},
	{
		key: 'showLeonidsEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.Leonids,
	},
	{
		key: 'showTotalSolarEclipseEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.TotalSolarEclipse,
	},
	{
		key: 'showTotalLunarEclipseEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.TotalLunarEclipse,
	},
	{
		key: 'showGeminidsEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.Geminids,
	},
	{
		key: 'showEidAlFitrEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.EidAlFitr,
	},
	{
		key: 'showEidAlAdhaEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.EidAlAdha,
	},
	{
		key: 'showHanukkahEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.Hanukkah,
	},
	{
		key: 'showChristmasEvent',
		defaultValue: true,
		category: BooleanSettingCategory.SeasonalEvent,
		seasonalEventId: SeasonalEventId.ChristmasDay,
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

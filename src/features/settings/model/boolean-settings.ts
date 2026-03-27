import { z } from 'zod'

import { SeasonalEventId } from '../../seasonal-events/core/types'

enum BooleanSettingCategory {
	Alerts = 'alerts',
	General = 'general',
	Internal = 'internal',
	Seasonal = 'seasonal',
	SeasonalEvent = 'seasonal-event',
	Weather = 'weather',
}

type BooleanSettingDefinition = {
	category: BooleanSettingCategory
	defaultValue: boolean
	key: string
	seasonalEventId?: SeasonalEventId
}

export const BOOLEAN_SETTINGS = [
	{
		category: BooleanSettingCategory.Internal,
		defaultValue: false,
		key: 'displayedReviewPrompt',
	},
	{
		category: BooleanSettingCategory.Weather,
		defaultValue: false,
		key: 'periodicLocationUpdate',
	},
	{
		category: BooleanSettingCategory.General,
		defaultValue: true,
		key: 'useMetric',
	},
	{
		category: BooleanSettingCategory.Alerts,
		defaultValue: true,
		key: 'showAlerts',
	},
	{
		category: BooleanSettingCategory.Alerts,
		defaultValue: true,
		key: 'showUvAlerts',
	},
	{
		category: BooleanSettingCategory.Alerts,
		defaultValue: true,
		key: 'showWindAlerts',
	},
	{
		category: BooleanSettingCategory.Alerts,
		defaultValue: true,
		key: 'showVisibilityAlerts',
	},
	{
		category: BooleanSettingCategory.Alerts,
		defaultValue: true,
		key: 'showPrecipitationAlerts',
	},
	{
		category: BooleanSettingCategory.Alerts,
		defaultValue: true,
		key: 'useCompactAlerts',
	},
	{
		category: BooleanSettingCategory.Weather,
		defaultValue: false,
		key: 'useAirQualityUvOverride',
	},
	{
		category: BooleanSettingCategory.Seasonal,
		defaultValue: true,
		key: 'showSeasonalEvents',
	},
	{
		category: BooleanSettingCategory.Seasonal,
		defaultValue: true,
		key: 'showSeasonalTileGlow',
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showNewYearsEvent',
		seasonalEventId: SeasonalEventId.NewYearsDay,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showValentinesEvent',
		seasonalEventId: SeasonalEventId.ValentinesDay,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showLunarNewYearEvent',
		seasonalEventId: SeasonalEventId.LunarNewYear,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showEasterEvent',
		seasonalEventId: SeasonalEventId.Easter,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showSpringEquinoxEvent',
		seasonalEventId: SeasonalEventId.SpringEquinox,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showAutumnEquinoxEvent',
		seasonalEventId: SeasonalEventId.AutumnEquinox,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showDiwaliEvent',
		seasonalEventId: SeasonalEventId.Diwali,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showHoliEvent',
		seasonalEventId: SeasonalEventId.Holi,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showEarthDayEvent',
		seasonalEventId: SeasonalEventId.EarthDay,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showSummerSolsticeEvent',
		seasonalEventId: SeasonalEventId.SummerSolstice,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showWinterSolsticeEvent',
		seasonalEventId: SeasonalEventId.WinterSolstice,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showHalloweenEvent',
		seasonalEventId: SeasonalEventId.Halloween,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showDayOfTheDeadEvent',
		seasonalEventId: SeasonalEventId.DayOfTheDead,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showPerseidsEvent',
		seasonalEventId: SeasonalEventId.Perseids,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showQuadrantidsEvent',
		seasonalEventId: SeasonalEventId.Quadrantids,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showLyridsEvent',
		seasonalEventId: SeasonalEventId.Lyrids,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showEtaAquariidsEvent',
		seasonalEventId: SeasonalEventId.EtaAquariids,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showOrionidsEvent',
		seasonalEventId: SeasonalEventId.Orionids,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showLeonidsEvent',
		seasonalEventId: SeasonalEventId.Leonids,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showTotalSolarEclipseEvent',
		seasonalEventId: SeasonalEventId.TotalSolarEclipse,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showTotalLunarEclipseEvent',
		seasonalEventId: SeasonalEventId.TotalLunarEclipse,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showGeminidsEvent',
		seasonalEventId: SeasonalEventId.Geminids,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showEidAlFitrEvent',
		seasonalEventId: SeasonalEventId.EidAlFitr,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showEidAlAdhaEvent',
		seasonalEventId: SeasonalEventId.EidAlAdha,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showHanukkahEvent',
		seasonalEventId: SeasonalEventId.Hanukkah,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showChristmasEvent',
		seasonalEventId: SeasonalEventId.ChristmasDay,
	},
	{
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: 'showEventHorizonDayEvent',
		seasonalEventId: SeasonalEventId.EventHorizonDay,
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

import { z } from 'zod'

import { SeasonalEventId } from '../../seasonal-events/core/types'

enum BooleanSettingCategory {
	Alerts = 'alerts',
	Developer = 'developer',
	General = 'general',
	Integrations = 'integrations',
	Internal = 'internal',
	Seasonal = 'seasonal',
	SeasonalEvent = 'seasonal-event',
	SeasonalEventBackground = 'seasonal-event-background',
	Weather = 'weather',
}

type BooleanSettingDefinition = {
	category: BooleanSettingCategory
	defaultValue: boolean
	key: string
	seasonalEventId?: SeasonalEventId
}

const SEASONAL_EVENT_SETTING_DEFINITIONS = [
	{
		backgroundKey: 'showNewYearsEventBackground',
		eventKey: 'showNewYearsEvent',
		seasonalEventId: SeasonalEventId.NewYearsDay,
	},
	{
		backgroundKey: 'showValentinesEventBackground',
		eventKey: 'showValentinesEvent',
		seasonalEventId: SeasonalEventId.ValentinesDay,
	},
	{
		backgroundKey: 'showLunarNewYearEventBackground',
		eventKey: 'showLunarNewYearEvent',
		seasonalEventId: SeasonalEventId.LunarNewYear,
	},
	{
		backgroundKey: 'showEasterEventBackground',
		eventKey: 'showEasterEvent',
		seasonalEventId: SeasonalEventId.Easter,
	},
	{
		backgroundKey: 'showSpringEquinoxEventBackground',
		eventKey: 'showSpringEquinoxEvent',
		seasonalEventId: SeasonalEventId.SpringEquinox,
	},
	{
		backgroundKey: 'showAutumnEquinoxEventBackground',
		eventKey: 'showAutumnEquinoxEvent',
		seasonalEventId: SeasonalEventId.AutumnEquinox,
	},
	{
		backgroundKey: 'showDiwaliEventBackground',
		eventKey: 'showDiwaliEvent',
		seasonalEventId: SeasonalEventId.Diwali,
	},
	{
		backgroundKey: 'showHoliEventBackground',
		eventKey: 'showHoliEvent',
		seasonalEventId: SeasonalEventId.Holi,
	},
	{
		backgroundKey: 'showEarthDayEventBackground',
		eventKey: 'showEarthDayEvent',
		seasonalEventId: SeasonalEventId.EarthDay,
	},
	{
		backgroundKey: 'showSummerSolsticeEventBackground',
		eventKey: 'showSummerSolsticeEvent',
		seasonalEventId: SeasonalEventId.SummerSolstice,
	},
	{
		backgroundKey: 'showWinterSolsticeEventBackground',
		eventKey: 'showWinterSolsticeEvent',
		seasonalEventId: SeasonalEventId.WinterSolstice,
	},
	{
		backgroundKey: 'showHalloweenEventBackground',
		eventKey: 'showHalloweenEvent',
		seasonalEventId: SeasonalEventId.Halloween,
	},
	{
		backgroundKey: 'showDayOfTheDeadEventBackground',
		eventKey: 'showDayOfTheDeadEvent',
		seasonalEventId: SeasonalEventId.DayOfTheDead,
	},
	{
		backgroundKey: 'showPerseidsEventBackground',
		eventKey: 'showPerseidsEvent',
		seasonalEventId: SeasonalEventId.Perseids,
	},
	{
		backgroundKey: 'showQuadrantidsEventBackground',
		eventKey: 'showQuadrantidsEvent',
		seasonalEventId: SeasonalEventId.Quadrantids,
	},
	{
		backgroundKey: 'showLyridsEventBackground',
		eventKey: 'showLyridsEvent',
		seasonalEventId: SeasonalEventId.Lyrids,
	},
	{
		backgroundKey: 'showEtaAquariidsEventBackground',
		eventKey: 'showEtaAquariidsEvent',
		seasonalEventId: SeasonalEventId.EtaAquariids,
	},
	{
		backgroundKey: 'showOrionidsEventBackground',
		eventKey: 'showOrionidsEvent',
		seasonalEventId: SeasonalEventId.Orionids,
	},
	{
		backgroundKey: 'showLeonidsEventBackground',
		eventKey: 'showLeonidsEvent',
		seasonalEventId: SeasonalEventId.Leonids,
	},
	{
		backgroundKey: 'showTotalSolarEclipseEventBackground',
		eventKey: 'showTotalSolarEclipseEvent',
		seasonalEventId: SeasonalEventId.TotalSolarEclipse,
	},
	{
		backgroundKey: 'showTotalLunarEclipseEventBackground',
		eventKey: 'showTotalLunarEclipseEvent',
		seasonalEventId: SeasonalEventId.TotalLunarEclipse,
	},
	{
		backgroundKey: 'showGeminidsEventBackground',
		eventKey: 'showGeminidsEvent',
		seasonalEventId: SeasonalEventId.Geminids,
	},
	{
		backgroundKey: 'showEidAlFitrEventBackground',
		eventKey: 'showEidAlFitrEvent',
		seasonalEventId: SeasonalEventId.EidAlFitr,
	},
	{
		backgroundKey: 'showEidAlAdhaEventBackground',
		eventKey: 'showEidAlAdhaEvent',
		seasonalEventId: SeasonalEventId.EidAlAdha,
	},
	{
		backgroundKey: 'showHanukkahEventBackground',
		eventKey: 'showHanukkahEvent',
		seasonalEventId: SeasonalEventId.Hanukkah,
	},
	{
		backgroundKey: 'showChristmasEventBackground',
		eventKey: 'showChristmasEvent',
		seasonalEventId: SeasonalEventId.ChristmasDay,
	},
	{
		backgroundKey: 'showEventHorizonDayEventBackground',
		eventKey: 'showEventHorizonDayEvent',
		seasonalEventId: SeasonalEventId.EventHorizonDay,
	},
] as const

export const SEASONAL_EVENT_BOOLEAN_SETTINGS =
	SEASONAL_EVENT_SETTING_DEFINITIONS.map((setting) => ({
		category: BooleanSettingCategory.SeasonalEvent,
		defaultValue: true,
		key: setting.eventKey,
		seasonalEventId: setting.seasonalEventId,
	}))

export const SEASONAL_EVENT_BACKGROUND_BOOLEAN_SETTINGS =
	SEASONAL_EVENT_SETTING_DEFINITIONS.map((setting) => ({
		category: BooleanSettingCategory.SeasonalEventBackground,
		defaultValue: true,
		key: setting.backgroundKey,
		seasonalEventId: setting.seasonalEventId,
	}))

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
		key: 'showAlerts',
	},
	{
		category: BooleanSettingCategory.Integrations,
		defaultValue: true,
		key: 'showCalendarEvents',
	},
	{
		category: BooleanSettingCategory.Developer,
		defaultValue: false,
		key: 'spoofCalendarEvents',
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
	...SEASONAL_EVENT_BOOLEAN_SETTINGS,
	...SEASONAL_EVENT_BACKGROUND_BOOLEAN_SETTINGS,
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

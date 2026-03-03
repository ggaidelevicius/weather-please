import { SeasonalEventId } from '../../seasonal-events/core/types'
import { SEASONAL_EVENT_BOOLEAN_SETTINGS } from './boolean-settings'

export type SeasonalEventToggleKey =
	(typeof SEASONAL_EVENT_BOOLEAN_SETTINGS)[number]['key']

export const SEASONAL_EVENT_TOGGLE_KEY_BY_ID = Object.fromEntries(
	SEASONAL_EVENT_BOOLEAN_SETTINGS.map((setting) => [
		setting.seasonalEventId,
		setting.key,
	]),
) as Record<SeasonalEventId, SeasonalEventToggleKey>

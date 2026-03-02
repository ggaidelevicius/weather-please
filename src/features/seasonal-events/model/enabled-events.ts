import { SEASONAL_EVENT_BOOLEAN_SETTINGS } from '../../settings/model/boolean-settings'
import type { Config } from '../../settings/hooks/use-config'
import type { SeasonalEventId } from './types'

type SeasonalEventToggleKey =
	(typeof SEASONAL_EVENT_BOOLEAN_SETTINGS)[number]['key']

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
		SEASONAL_EVENT_BOOLEAN_SETTINGS.filter(
			(setting) => config[setting.key],
		).map((setting) => setting.seasonalEventId) as SeasonalEventId[],
	)
}

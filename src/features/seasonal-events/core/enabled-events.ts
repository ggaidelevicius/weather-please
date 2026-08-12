import type { Config } from '../../settings/hooks/use-config'
import type { SeasonalEventId } from './types'

import {
	SEASONAL_EVENT_BACKGROUND_BOOLEAN_SETTINGS,
	SEASONAL_EVENT_BOOLEAN_SETTINGS,
} from '../../settings/model/boolean-settings'

type SeasonalEventBackgroundToggleKey =
	(typeof SEASONAL_EVENT_BACKGROUND_BOOLEAN_SETTINGS)[number]['key']

export type SeasonalEventSettings = Pick<
	Config,
	| 'showSeasonalEvents'
	| SeasonalEventBackgroundToggleKey
	| SeasonalEventToggleKey
>

type SeasonalEventToggleKey =
	(typeof SEASONAL_EVENT_BOOLEAN_SETTINGS)[number]['key']

const getEnabledSeasonalEventIds = ({
	config,
	settings,
}: Readonly<{
	config: SeasonalEventSettings
	settings: ReadonlyArray<{
		key: SeasonalEventBackgroundToggleKey | SeasonalEventToggleKey
		seasonalEventId: SeasonalEventId
	}>
}>): Set<SeasonalEventId> => {
	if (!config.showSeasonalEvents) {
		return new Set()
	}

	return new Set(
		settings
			.filter((setting) => config[setting.key])
			.map((setting) => setting.seasonalEventId),
	)
}

export const getEnabledSeasonalEvents = (
	config: SeasonalEventSettings,
): Set<SeasonalEventId> =>
	getEnabledSeasonalEventIds({
		config,
		settings: SEASONAL_EVENT_BOOLEAN_SETTINGS,
	})

export const getEnabledSeasonalEventBackgrounds = (
	config: SeasonalEventSettings,
): Set<SeasonalEventId> =>
	getEnabledSeasonalEventIds({
		config,
		settings: SEASONAL_EVENT_BACKGROUND_BOOLEAN_SETTINGS,
	})

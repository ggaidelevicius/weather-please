import type { Next24HoursDetailViewId } from '../../weather/model/detail-types'

import { NEXT_24_HOURS_DETAIL_VIEW_IDS } from '../../weather/model/detail-types'

export const FORECAST_VIEW_BACKGROUND_COLOR = '#1a1b1e'

export const DETAIL_VIEW_BACKGROUND_COLOR = '#101113'

export type ForecastViewId = 'forecast' | Next24HoursDetailViewId

export type ViewStepDirection = 'next' | 'previous'

export const VIEW_ORDER: Record<ForecastViewId, number> = {
	'air-quality': 4,
	conditions: 6,
	forecast: 0,
	map: 7,
	precipitation: 2,
	sun: 5,
	temperature: 1,
	wind: 3,
}

export const FORECAST_ONLY_VIEW_IDS: readonly ForecastViewId[] = ['forecast']

export const FORECAST_VIEW_IDS: readonly ForecastViewId[] = [
	'forecast',
	...NEXT_24_HOURS_DETAIL_VIEW_IDS,
]

export type DirectionalViewYParams = {
	activeViewId: ForecastViewId
	viewId: ForecastViewId
}

export const getViewRelativePosition = ({
	activeViewId,
	viewId,
}: DirectionalViewYParams) => {
	return VIEW_ORDER[viewId] - VIEW_ORDER[activeViewId]
}

export const getViewBackgroundColor = (activeViewId: ForecastViewId) =>
	activeViewId === 'forecast'
		? FORECAST_VIEW_BACKGROUND_COLOR
		: DETAIL_VIEW_BACKGROUND_COLOR

export type AdjacentViewIdParams = {
	activeViewId: ForecastViewId
	canShowNext24HoursView: boolean
	direction: ViewStepDirection
}

export const getAdjacentViewId = ({
	activeViewId,
	canShowNext24HoursView,
	direction,
}: AdjacentViewIdParams): ForecastViewId => {
	const viewIds = canShowNext24HoursView
		? FORECAST_VIEW_IDS
		: FORECAST_ONLY_VIEW_IDS
	const currentIndex = Math.max(0, viewIds.indexOf(activeViewId))
	const nextIndex =
		direction === 'next'
			? Math.min(currentIndex + 1, viewIds.length - 1)
			: Math.max(currentIndex - 1, 0)

	return viewIds[nextIndex] ?? 'forecast'
}

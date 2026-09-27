import { useState } from 'react'

import type {
	Next24HoursDetailViewProps,
	WeatherDetailSeriesId,
} from '../model/detail-types'

import { AirQualityDetail } from './details/air-quality-detail'
import { ConditionsDetail } from './details/conditions-detail'
import { MapDetail } from './details/map-detail'
import { PrecipitationDetail } from './details/precipitation-detail'
import { SunDetail } from './details/sun-detail'
import { TemperatureDetail } from './details/temperature-detail'
import { WindDetail } from './details/wind-detail'

export { NEXT_24_HOURS_DETAIL_VIEW_IDS } from '../model/detail-types'

export const Next24HoursDetailView = ({
	viewId,
	...props
}: Readonly<Next24HoursDetailViewProps>) => {
	const [activeSeriesId, setActiveSeriesId] =
		useState<null | WeatherDetailSeriesId>(null)
	if (props.data.length === 0) return null
	const View = DETAIL_VIEWS[viewId]
	return (
		<View
			{...props}
			activeSeriesId={activeSeriesId}
			setActiveSeriesId={setActiveSeriesId}
		/>
	)
}
const DETAIL_VIEWS = {
	'air-quality': AirQualityDetail,
	conditions: ConditionsDetail,
	map: MapDetail,
	precipitation: PrecipitationDetail,
	sun: SunDetail,
	temperature: TemperatureDetail,
	wind: WindDetail,
}

export type { Next24HoursDetailViewId } from '../model/detail-types'

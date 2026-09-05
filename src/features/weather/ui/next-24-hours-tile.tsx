import type {
	Next24HoursDetailViewProps,
	WeatherDetailSeriesId,
} from '../model/detail-types'
import { TemperatureDetail } from './details/temperature-detail'
import { PrecipitationDetail } from './details/precipitation-detail'
import { SunDetail } from './details/sun-detail'
import { AirQualityDetail } from './details/air-quality-detail'
import { MapDetail } from './details/map-detail'
import { WindDetail } from './details/wind-detail'
import { ConditionsDetail } from './details/conditions-detail'
import { useState } from 'react'

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
	temperature: TemperatureDetail,
	precipitation: PrecipitationDetail,
	sun: SunDetail,
	'air-quality': AirQualityDetail,
	map: MapDetail,
	wind: WindDetail,
	conditions: ConditionsDetail,
}

export type { Next24HoursDetailViewId } from '../model/detail-types'

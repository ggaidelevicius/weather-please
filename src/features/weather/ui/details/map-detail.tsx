import type { DetailViewProps } from './detail-data'

import { WeatherMapDetail } from '../weather-map/weather-map'
import { getDetailViewData } from './detail-data'

export const MapDetail = (props: Readonly<DetailViewProps>) => {
	const { isActive, usesMetricUnits, weatherMapData, windUnitLabel } =
		getDetailViewData(props)

	return (
		<WeatherMapDetail
			isActive={isActive}
			usesMetricUnits={usesMetricUnits}
			weatherMapData={weatherMapData}
			windUnitLabel={windUnitLabel}
		/>
	)
}

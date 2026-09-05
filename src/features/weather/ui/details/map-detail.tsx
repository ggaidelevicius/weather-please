import type { DetailViewProps } from './detail-data'
import { getDetailViewData } from './detail-data'
import { WeatherMapDetail } from '../weather-map/weather-map'

export const MapDetail = (props: Readonly<DetailViewProps>) => {
	const { isActive, weatherMapData, usesMetricUnits, windUnitLabel } =
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

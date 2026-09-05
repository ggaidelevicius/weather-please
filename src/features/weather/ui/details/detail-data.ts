import type { Dispatch, SetStateAction } from 'react'
import type {
	WeatherDetailSeriesId,
	Next24HoursDetailViewProps,
} from '../../model/detail-types'
import {
	TemperatureUnit,
	UnitSystem,
} from '../../../settings/model/unit-system'
import {
	convertTemperature,
	convertPrecipitation,
	convertWind,
	convertVisibility,
	formatHour,
} from '../../model/detail-formatting'

export type DetailViewProps = Omit<Next24HoursDetailViewProps, 'viewId'> & {
	activeSeriesId: null | WeatherDetailSeriesId
	setActiveSeriesId: Dispatch<SetStateAction<null | WeatherDetailSeriesId>>
}
export const getDetailViewData = ({
	data,
	isActive,
	temperatureUnit,
	unitSystem,
	weatherMapData,
	activeSeriesId,
	setActiveSeriesId,
}: DetailViewProps) => {
	const usesMetricTemperature = temperatureUnit === TemperatureUnit.Celsius
	const usesMetricUnits = unitSystem === UnitSystem.Metric
	const temperatures = data.map(({ temperature }) =>
		convertTemperature({ temperature, usesMetricTemperature }),
	)
	const apparentTemperatures = data.map(({ apparentTemperature }) =>
		convertTemperature({
			temperature: apparentTemperature,
			usesMetricTemperature,
		}),
	)
	const precipitation = data.map(({ precipitation }) =>
		convertPrecipitation({ precipitation, usesMetricUnits }),
	)
	const precipitationProbability = data.map(
		({ precipitationProbability }) => precipitationProbability,
	)
	const wind = data.map(({ wind }) => convertWind({ usesMetricUnits, wind }))
	const windGust = data.map(({ windGust }) =>
		convertWind({ usesMetricUnits, wind: windGust }),
	)
	const uv = data.map(({ uv }) => uv)
	const visibility = data.map(({ visibility }) =>
		convertVisibility({ usesMetricUnits, visibility }),
	)
	const times = data.map(({ time }) => time)
	const airQualityAqi = data.map(({ airQualityAqi }) => airQualityAqi)
	const airQualityPm25 = data.map(({ airQualityPm25 }) => airQualityPm25)
	const airQualityPm10 = data.map(({ airQualityPm10 }) => airQualityPm10)
	const airQualityOzone = data.map(({ airQualityOzone }) => airQualityOzone)
	const airQualityNitrogenDioxide = data.map(
		({ airQualityNitrogenDioxide }) => airQualityNitrogenDioxide,
	)
	const temperatureUnitLabel = usesMetricTemperature ? '°C' : '°F'
	const precipitationUnitLabel = usesMetricUnits ? 'mm' : 'in'
	const windUnitLabel = usesMetricUnits ? 'km/h' : 'mph'
	const visibilityUnitLabel = usesMetricUnits ? 'km' : 'mi'
	const startLabel = formatHour(data[0]?.time)
	const middleLabel = formatHour(data[Math.floor(data.length / 2)]?.time)
	const endLabel = formatHour(data[data.length - 1]?.time)
	const referenceTime = times[0]
	return {
		data,
		isActive,
		temperatureUnit,
		unitSystem,
		weatherMapData,
		activeSeriesId,
		setActiveSeriesId,
		usesMetricTemperature,
		usesMetricUnits,
		temperatures,
		apparentTemperatures,
		precipitation,
		precipitationProbability,
		wind,
		windGust,
		uv,
		visibility,
		times,
		airQualityAqi,
		airQualityPm25,
		airQualityPm10,
		airQualityOzone,
		airQualityNitrogenDioxide,
		temperatureUnitLabel,
		precipitationUnitLabel,
		windUnitLabel,
		visibilityUnitLabel,
		startLabel,
		middleLabel,
		endLabel,
		referenceTime,
	}
}

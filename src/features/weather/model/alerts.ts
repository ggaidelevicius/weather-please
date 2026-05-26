import type { WeatherResponse } from '../api/weather-api'

import {
	ALERT_CONDITIONS,
	processPrecipitationAlert,
	processPrecipitationDuration,
	processSimpleAlert,
} from './alert-processor'
import {
	ALERT_HOURS_GENERAL,
	ALERT_HOURS_UV,
	type Alerts,
	type Next24HoursData,
} from './types'

export const createEmptyAlerts = (): Alerts => ({
	hoursOfExtremeUv: Array(ALERT_HOURS_UV).fill(false),
	hoursOfLowVisibility: Array(ALERT_HOURS_GENERAL).fill(false),
	hoursOfStrongWind: Array(ALERT_HOURS_GENERAL).fill(false),
	hoursOfStrongWindGusts: Array(ALERT_HOURS_GENERAL).fill(false),
	totalPrecipitation: {
		duration: Array(ALERT_HOURS_GENERAL).fill(false),
		precipitation: {
			flag: false,
			value: 0,
			zeroCount: 0,
		},
	},
})

export const deriveAlertsFromWeather = (
	data: WeatherResponse,
	currentHour: number,
): Alerts => ({
	hoursOfExtremeUv: processSimpleAlert(
		data.hourly.uv_index
			.slice(currentHour, currentHour + ALERT_HOURS_UV)
			.map(normalizeUvValue),
		ALERT_CONDITIONS.extremeUv,
	),
	hoursOfLowVisibility: processSimpleAlert(
		data.hourly.visibility
			.slice(currentHour, currentHour + ALERT_HOURS_GENERAL)
			.map(normalizeNumber),
		ALERT_CONDITIONS.lowVisibility,
	),
	hoursOfStrongWind: processSimpleAlert(
		data.hourly.windspeed_10m
			.slice(currentHour, currentHour + ALERT_HOURS_GENERAL)
			.map(normalizeNumber),
		ALERT_CONDITIONS.strongWind,
	),
	hoursOfStrongWindGusts: processSimpleAlert(
		data.hourly.windgusts_10m
			.slice(currentHour, currentHour + ALERT_HOURS_GENERAL)
			.map(normalizeNumber),
		ALERT_CONDITIONS.strongWindGusts,
	),
	totalPrecipitation: {
		duration: processPrecipitationDuration(
			data.hourly.precipitation
				.slice(currentHour, currentHour + ALERT_HOURS_GENERAL)
				.map(normalizeNumber),
		),
		precipitation: processPrecipitationAlert(
			data.hourly.precipitation
				.slice(currentHour, currentHour + ALERT_HOURS_GENERAL)
				.map(normalizeNumber),
		),
	},
})

const normalizeNumber = (value: null | number | undefined) =>
	typeof value === 'number' && Number.isFinite(value) ? value : 0

export const deriveAlertsFromNext24HoursData = (
	data: Next24HoursData,
): Alerts => {
	const precipitation = data.map(({ precipitation }) => precipitation)

	return {
		hoursOfExtremeUv: padBooleanArray({
			length: ALERT_HOURS_UV,
			values: processSimpleAlert(
				data.map(({ uv }) => uv),
				ALERT_CONDITIONS.extremeUv,
			),
		}),
		hoursOfLowVisibility: padBooleanArray({
			length: ALERT_HOURS_GENERAL,
			values: processSimpleAlert(
				data.map(({ visibility }) => visibility),
				ALERT_CONDITIONS.lowVisibility,
			),
		}),
		hoursOfStrongWind: padBooleanArray({
			length: ALERT_HOURS_GENERAL,
			values: processSimpleAlert(
				data.map(({ wind }) => wind),
				ALERT_CONDITIONS.strongWind,
			),
		}),
		hoursOfStrongWindGusts: padBooleanArray({
			length: ALERT_HOURS_GENERAL,
			values: processSimpleAlert(
				data.map(({ windGust }) => windGust),
				ALERT_CONDITIONS.strongWindGusts,
			),
		}),
		totalPrecipitation: {
			duration: padBooleanArray({
				length: ALERT_HOURS_GENERAL,
				values: processPrecipitationDuration(precipitation),
			}),
			precipitation: processPrecipitationAlert(precipitation),
		},
	}
}

const padBooleanArray = ({
	length,
	values,
}: {
	length: number
	values: boolean[]
}) => [...values, ...Array(length).fill(false)].slice(0, length)

const normalizeUvValue = (uv: null | number | undefined) => normalizeNumber(uv)

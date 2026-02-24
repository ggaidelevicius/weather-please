import {
	ALERT_CONDITIONS,
	processPrecipitationAlert,
	processPrecipitationDuration,
	processSimpleAlert,
} from '../alert-processor'
import { ALERT_HOURS_GENERAL, ALERT_HOURS_UV, type Alerts } from './types'
import type { WeatherResponse } from './api'

export const createEmptyAlerts = (): Alerts => ({
	totalPrecipitation: {
		precipitation: {
			value: 0,
			flag: false,
			zeroCount: 0,
		},
		duration: Array(ALERT_HOURS_GENERAL).fill(false),
	},
	hoursOfExtremeUv: Array(ALERT_HOURS_UV).fill(false),
	hoursOfStrongWind: Array(ALERT_HOURS_GENERAL).fill(false),
	hoursOfLowVisibility: Array(ALERT_HOURS_GENERAL).fill(false),
	hoursOfStrongWindGusts: Array(ALERT_HOURS_GENERAL).fill(false),
})

export const deriveAlertsFromWeather = (
	data: WeatherResponse,
	currentHour: number,
): Alerts => ({
	totalPrecipitation: {
		precipitation: processPrecipitationAlert(
			data.hourly.precipitation.slice(
				currentHour,
				currentHour + ALERT_HOURS_GENERAL,
			),
		),
		duration: processPrecipitationDuration(
			data.hourly.precipitation.slice(
				currentHour,
				currentHour + ALERT_HOURS_GENERAL,
			),
		),
	},
	hoursOfExtremeUv: processSimpleAlert(
		data.hourly.uv_index.slice(currentHour, currentHour + ALERT_HOURS_UV),
		ALERT_CONDITIONS.extremeUv,
	),
	hoursOfStrongWind: processSimpleAlert(
		data.hourly.windspeed_10m.slice(
			currentHour,
			currentHour + ALERT_HOURS_GENERAL,
		),
		ALERT_CONDITIONS.strongWind,
	),
	hoursOfStrongWindGusts: processSimpleAlert(
		data.hourly.windgusts_10m.slice(
			currentHour,
			currentHour + ALERT_HOURS_GENERAL,
		),
		ALERT_CONDITIONS.strongWindGusts,
	),
	hoursOfLowVisibility: processSimpleAlert(
		data.hourly.visibility.slice(
			currentHour,
			currentHour + ALERT_HOURS_GENERAL,
		),
		ALERT_CONDITIONS.lowVisibility,
	),
})

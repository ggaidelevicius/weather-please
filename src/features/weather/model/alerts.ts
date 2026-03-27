import type { WeatherResponse } from '../api/weather-api'

import {
	ALERT_CONDITIONS,
	processPrecipitationAlert,
	processPrecipitationDuration,
	processSimpleAlert,
} from './alert-processor'
import { ALERT_HOURS_GENERAL, ALERT_HOURS_UV, type Alerts } from './types'

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
		data.hourly.uv_index.slice(currentHour, currentHour + ALERT_HOURS_UV),
		ALERT_CONDITIONS.extremeUv,
	),
	hoursOfLowVisibility: processSimpleAlert(
		data.hourly.visibility.slice(
			currentHour,
			currentHour + ALERT_HOURS_GENERAL,
		),
		ALERT_CONDITIONS.lowVisibility,
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
	totalPrecipitation: {
		duration: processPrecipitationDuration(
			data.hourly.precipitation.slice(
				currentHour,
				currentHour + ALERT_HOURS_GENERAL,
			),
		),
		precipitation: processPrecipitationAlert(
			data.hourly.precipitation.slice(
				currentHour,
				currentHour + ALERT_HOURS_GENERAL,
			),
		),
	},
})

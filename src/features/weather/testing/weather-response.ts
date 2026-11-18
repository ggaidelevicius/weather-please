import type { WeatherResponse } from '../api/weather-api'

import { getCurrentDateTime } from '../../../shared/lib/time'

export const createWeatherResponse = (
	startTime = getCurrentDateTime().startOfDay().epochMilliseconds / 1000,
): WeatherResponse => ({
	daily: {
		daylight_duration: [43_200],
		precipitation_probability_max: [10],
		sunrise: [startTime + 21_600],
		sunset: [startTime + 64_800],
		sunshine_duration: [36_000],
		temperature_2m_max: [30],
		temperature_2m_min: [20],
		time: [startTime],
		uv_index_max: [8],
		weathercode: [1],
		windspeed_10m_max: [15],
	},
	hourly: {
		apparent_temperature: Array.from({ length: 30 }, (_, index) => index + 10),
		dew_point_2m: Array.from({ length: 30 }, (_, index) => index + 5),
		precipitation: Array.from({ length: 30 }, (_, index) => index),
		precipitation_probability: Array.from(
			{ length: 30 },
			(_, index) => index * 2,
		),
		relative_humidity_2m: Array.from({ length: 30 }, (_, index) => index + 50),
		shortwave_radiation_instant: Array.from(
			{ length: 30 },
			(_, index) => index * 10 + 100,
		),
		temperature_2m: Array.from({ length: 30 }, (_, index) => index + 20),
		time: Array.from({ length: 30 }, (_, index) => startTime + index * 3600),
		uv_index: Array.from({ length: 30 }, (_, index) => index),
		visibility: Array.from({ length: 30 }, (_, index) => 1000 - index),
		weathercode: Array.from({ length: 30 }, (_, index) => index),
		windgusts_10m: Array.from({ length: 30 }, (_, index) => index + 20),
		windspeed_10m: Array.from({ length: 30 }, (_, index) => index + 10),
	},
})

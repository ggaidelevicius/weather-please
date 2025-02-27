/* eslint-disable no-unused-vars */
import type { Config } from '@/pages'

/**
 * Manages updates to the "input" state.
 *
 * Takes in a key and a value. Existing attributes of the "input" state are retained,
 * while the provided attribute (key-value pair) will either be added or, if the key already exists,
 * its value will be overwritten with the new one.
 */
export type HandleChange = (
	key: keyof Config,
	value: Config[keyof Config],
) => void

/**
 * Determines the number of grid columns based on the number of days of weather data to be retrieved.
 *
 * The number of grid columns represents how many columns of weather data can be displayed
 * in a single row on the UI. The column count is determined by both the number of days
 * specified and the constraints of the UI, aiming to ensure that the data is displayed
 * in an aesthetically pleasing and legible manner.
 *
 * @param {string} daysToRetrieve - The number of days of weather data to be retrieved.
 * @returns {number} The number of grid columns to display.
 *
 * @example
 * determineGridColumns('5') // returns 5
 * determineGridColumns('7') // returns 3
 */
export type DetermineGridColumns = (daysToRetrieve: string) => number

export interface WeatherData {
	latitude: number
	longitude: number
	generationtime_ms: number
	utc_offset_seconds: number
	timezone: string
	timezone_abbreviation: string
	elevation: number
	hourly_units: HourlyUnits
	hourly: HourlyData
	daily_units: DailyUnits
	daily: DailyData
}

interface HourlyUnits {
	time: string
	precipitation: string
	uv_index: string
	windspeed_10m: string
	visibility: string
	windgusts_10m: string
}

interface HourlyData {
	time: number[]
	precipitation: number[]
	uv_index: number[]
	windspeed_10m: number[]
	visibility: number[]
	windgusts_10m: number[]
}

interface DailyUnits {
	time: string
	weathercode: string
	temperature_2m_max: string
	temperature_2m_min: string
	uv_index_max: string
	precipitation_probability_max: string
	windspeed_10m_max: string
}

interface DailyData {
	time: number[]
	weathercode: number[]
	temperature_2m_max: number[]
	temperature_2m_min: number[]
	uv_index_max: number[]
	precipitation_probability_max: number[]
	windspeed_10m_max: number[]
}

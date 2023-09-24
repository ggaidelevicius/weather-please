import type { ReactElement } from 'react'

/**
 * Represents the properties required for rendering a weather tile.
 *
 * This interface defines the necessary properties to depict a comprehensive overview
 * of weather conditions for a specific day, including general weather data
 * (temperature, description, etc.) and specific measurements (wind speed, UV index, etc.).
 *
 * @property {number} day - The day for which the weather data applies in the form of a unix timestamp.
 * @property {number} max - The maximum temperature expected for the day in degrees celsius.
 * @property {number} min - The minimum temperature expected for the day in degrees celsius.
 * @property {string} description - Weather condition as a numeric code. Follows WMO weather interpretation codes.
 * @property {string} icon - Weather condition as a numeric code. Follows WMO weather interpretation codes.
 * @property {number} wind - The wind speed for the day in kph.
 * @property {number} rain - The percentage chance of precipitation.
 * @property {number} uv - The UV index for the day.
 * @property {boolean} useMetric - A flag to determine if metrics (e.g., Celsius, km/h) or imperial (e.g., Fahrenheit, mph) units should be used.
 * @property {number} index - The index or position of the tile in a list or grid.
 * @property {'day' | 'date'} identifier - Specifies whether to represent the day using a weekday name (e.g., "Monday") or a specific date.
 */
export interface TileProps {
	readonly day: number
	readonly max: number
	readonly min: number
	readonly description: string
	readonly icon: string
	readonly wind: number
	readonly rain: number
	readonly uv: number
	readonly useMetric: boolean
	readonly index: number
	readonly identifier: 'day' | 'date'
}

/**
 * Represents the days of the week in English.
 *
 * This type defines each day of the week as a distinct value. Note that
 * as the application scales or is internationalized, additional language
 * support or localized naming may be needed.
 */
export type Day = ReactElement[]

/**
 * Represents the months of the year in English.
 *
 * This type defines each month of the year as a distinct value. As with the
 * days of the week, be aware that in the future, to accommodate more languages
 * or localized naming conventions, adaptations may be necessary.
 */
export type Month = any[]

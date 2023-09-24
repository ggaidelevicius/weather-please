/**
 * Properties defining the current weather status.
 *
 * This interface captures the essential conditions of the current weather,
 * mainly focusing on extreme UV levels, high winds, and low visibility periods.
 *
 * @property {TotalPrecipitation} totalPrecipitation - Details about the total expected precipitation.
 * @property {boolean[]} hoursOfExtremeUv - Array indicating hours with extreme UV levels.
 * @property {boolean[]} hoursOfStrongWind - Array indicating hours with strong wind conditions.
 * @property {boolean[]} hoursOfStrongWindGusts - Array indicating hours with strong wind gust conditions.
 * @property {boolean[]} hoursOfLowVisibility - Array indicating hours with low visibility conditions.
 */
export interface CurrentWeatherProps {
	readonly totalPrecipitation: TotalPrecipitation
	readonly hoursOfExtremeUv: boolean[]
	readonly hoursOfStrongWind: boolean[]
	readonly hoursOfLowVisibility: boolean[]
	readonly hoursOfStrongWindGusts: boolean[]
}

/**
 * Properties required for generating weather alerts.
 *
 * Extends `CurrentWeatherProps` to include preferences and conditions under which
 * alerts should be displayed to the user, as well as utility properties like UI width.
 *
 * @property {boolean} useMetric - Indicates if metric system should be used.
 * @property {boolean} showUvAlerts - Flag to indicate if UV alerts should be displayed.
 * @property {boolean} showWindAlerts - Flag to indicate if wind alerts should be displayed.
 * @property {boolean} showVisibilityAlerts - Flag to indicate if visibility alerts should be displayed.
 * @property {boolean} showPrecipitationAlerts - Flag to indicate if precipitation alerts should be displayed.
 * @property {number} width - Width of the alert UI component.
 */
export interface AlertProps extends CurrentWeatherProps {
	readonly useMetric: boolean
	readonly showUvAlerts: boolean
	readonly showWindAlerts: boolean
	readonly showVisibilityAlerts: boolean
	readonly showPrecipitationAlerts: boolean
	readonly width: number
}

/**
 * Structure defining the total precipitation details.
 *
 * This interface gives detailed information about the expected precipitation
 * over a specified duration.
 *
 * @property {object} precipitation - Contains the value of the precipitation and a flag.
 *   @property {number} value - The quantity of precipitation.
 *   @property {boolean} flag - A flag indicating the source array has ceased being reduced.
 * @property {boolean[]} duration - Array indicating hours in which precipitation is expected.
 */
interface TotalPrecipitation {
	readonly precipitation: {
		readonly value: number
		readonly flag: boolean
	}
	readonly duration: boolean[]
}

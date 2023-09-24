/**
 * Represents the basic properties required for rendering general weather conditions.
 *
 * This interface focuses on the primary weather data that gives a general overview
 * of conditions, including temperature, description, and the icon representation.
 *
 * @property {number} max - The maximum temperature expected for the day in degrees celsius.
 * @property {number} min - The minimum temperature expected for the day in degrees celsius.
 * @property {string} description - Weather condition as a numeric code. Follows WMO weather interpretation codes.
 * @property {string} icon - Weather condition as a numeric code. Follow WMO weather interpretation codes.
 * @property {boolean} useMetric - A flag to determine if metrics (e.g., Celsius) or imperial (e.g., Fahrenheit) units should be used.
 */
export interface BasicWeatherProps {
	readonly max: number
	readonly min: number
	readonly description: string
	readonly icon: string
	readonly useMetric: boolean
}

/**
 * Represents properties for specific weather measurements.
 *
 * This interface provides detailed weather measurements including the UV index, wind speed,
 * and chance of precipitation. It also includes properties to assist in rendering within a list or grid.
 *
 * @property {number} uv - The UV index for the day.
 * @property {number} wind - The wind speed for the day in kph.
 * @property {number} rain - The percentage chance of precipitation.
 * @property {boolean} useMetric - A flag to determine if metrics (e.g., km/h) or imperial (e.g., mph) units should be used.
 * @property {number} index - The index or position of the tile in a list or grid.
 */
export interface WeatherDetailProps {
	readonly uv: number
	readonly wind: number
	readonly rain: number
	readonly useMetric: boolean
}

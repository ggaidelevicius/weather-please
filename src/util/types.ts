/* eslint-disable no-unused-vars */
import type { ReactElement } from 'react'

/**
 * Configuration properties for the weather application.
 *
 * @property {string} lang - Language of the application
 * @property {string} lat - Latitude of the location.
 * @property {string} lon - Longitude of the location.
 * @property {boolean} periodicLocationUpdate - Flag to determine if the application should periodically update the user's location.
 * @property {boolean} useMetric - Determines if metric units (e.g., Celsius, km/h) should be used.
 * @property {boolean} showAlerts - Flag to determine if general weather alerts should be shown.
 * @property {boolean} showUvAlerts - Flag to determine if UV index alerts should be shown.
 * @property {boolean} showWindAlerts - Flag to determine if wind speed alerts should be shown.
 * @property {boolean} showVisibilityAlerts - Flag to determine if visibility alerts should be shown.
 * @property {boolean} showPrecipitationAlerts - Flag to determine if precipitation alerts should be shown.
 * @property {string} daysToRetrieve - Number of days for which to retrieve weather data.
 * @property {('day' | 'date')} identifier - Determines if the day of the week or the date should be displayed.
 * @property {boolean} shareCrashesAndErrors - Flag to determine if crash and error reports should be shared.
 * @property {number} installed - The unix time that the extension was first installed.
 * @property {boolean} displayedReviewPrompt - Flag to determine if review prompt has been shown before
 */
export interface ConfigProps {
	lang: string
	lat: string
	lon: string
	periodicLocationUpdate: boolean
	useMetric: boolean
	showAlerts: boolean
	showUvAlerts: boolean
	showWindAlerts: boolean
	showVisibilityAlerts: boolean
	showPrecipitationAlerts: boolean
	daysToRetrieve: string
	identifier: 'day' | 'date'
	shareCrashesAndErrors: boolean
	installed: number
	displayedReviewPrompt: boolean
}

/**
 * Defines the allowed keys for the "input" state.
 * These keys represent configurable settings and preferences for the application.
 */
export type HandleChangeKey =
	| 'lang'
	| 'lat'
	| 'lon'
	| 'periodicLocationUpdate'
	| 'showAlerts'
	| 'showUvAlerts'
	| 'showPrecipitationAlerts'
	| 'showWindAlerts'
	| 'showVisibilityAlerts'
	| 'useMetric'
	| 'daysToRetrieve'
	| 'identifier'
	| 'shareCrashesAndErrors'

/**
 * Manages updates to the "input" state.
 *
 * Takes in a key and a value. Existing attributes of the "input" state are retained,
 * while the provided attribute (key-value pair) will either be added or, if the key already exists,
 * its value will be overwritten with the new one.
 */
export type HandleChange = (k: HandleChangeKey, v: string | boolean) => void

/**
 * Manages the "saved" button click action during initialization.
 *
 * - If browser geolocation permissions are granted, it attempts to fetch location using the browser API.
 * - For Safari browsers, due to their daily permission prompts, a third-party service is used for location retrieval.
 * - If automatic methods don't succeed, the user is prompted to manually enter their latitude and longitude.
 *
 * @param method Specifies whether the location should be fetched automatically ('auto') or manually ('manual').
 */
export type HandleClick = (method: 'auto' | 'manual') => void

/**
 * Recursively compares the shape of two objects to determine if they have the same set of keys at all levels.
 * Primarily used to compare the 'config' object in localStorage against 'initialState'.
 *
 * @param obj1 First object to be compared.
 * @param obj2 Second object to be compared.
 * @returns True if both objects have the same keys (including nested keys), otherwise false.
 */
export type CompareObjects = (
	obj1: Record<keyof any, any>,
	obj2: Record<keyof any, any>,
) => boolean

/**
 * Merges two objects together.
 *
 * In case of overlapping keys, values from the `targetObj` are preserved, and those from the `sourceObj` are ignored.
 * Primarily used to merge the 'config' object in localStorage with a default or provided object.
 *
 * @param targetObj The primary object whose values should be preserved in case of key conflicts.
 * @param sourceObj The secondary object whose values will be used if no conflict exists.
 * @returns A new object resulting from the merge of the two input objects.
 */
export type MergeObjects = (
	targetObj: Record<keyof any, any>,
	sourceObj: Record<keyof any, any>,
) => Record<keyof any, any>

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

/**
 * Maps over futureWeatherData to create a list of motion-animated tiles.
 *
 * Each tile represents weather data for a particular day. Tiles are motion
 * components with specific initial, animate, and exit states.
 *
 * The animation delay is influenced by the presence of data in the localStorage.
 * If data exists, tiles are immediately animated without the baseline delay.
 */
export type TileComponent = ReactElement[] | []

/* eslint-disable no-unused-vars */
/**
 * Configuration properties for the weather application.
 *
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
 */
export interface ConfigProps {
  lat: string;
  lon: string;
  periodicLocationUpdate: boolean;
  useMetric: boolean;
  showAlerts: boolean;
  showUvAlerts: boolean;
  showWindAlerts: boolean;
  showVisibilityAlerts: boolean;
  showPrecipitationAlerts: boolean;
  daysToRetrieve: string;
  identifier: 'day' | 'date';
  shareCrashesAndErrors: boolean;
}

/**
 * Defines the allowed keys for the "input" state.
 * These keys represent configurable settings and preferences for the application.
 */
export type HandleChangeKey =
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
  | 'shareCrashesAndErrors';

/**
 * Manages updates to the "input" state.
 *
 * Takes in a key and a value. Existing attributes of the "input" state are retained,
 * while the provided attribute (key-value pair) will either be added or, if the key already exists,
 * its value will be overwritten with the new one.
 */
export type HandleChange = (k: HandleChangeKey, v: string | boolean) => void;

/**
 * Manages the "saved" button click action during initialization.
 *
 * - If browser geolocation permissions are granted, it attempts to fetch location using the browser API.
 * - For Safari browsers, due to their daily permission prompts, a third-party service is used for location retrieval.
 * - If automatic methods don't succeed, the user is prompted to manually enter their latitude and longitude.
 *
 * @param method Specifies whether the location should be fetched automatically ('auto') or manually ('manual').
 */
export type HandleClick = (method: 'auto' | 'manual') => void;

/**
 * Compares the shape of two objects to determine if they have the same set of keys.
 * Primarily used to compare the 'config' object in localStorage against 'initialState'.
 *
 * @param obj1 First object to be compared.
 * @param obj2 Second object to be compared.
 * @returns True if both objects have the same keys, otherwise false.
 */
export type CompareObjects = (
  obj1: Record<keyof any, any>,
  obj2: Record<keyof any, any>
) => boolean;

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
  sourceObj: Record<keyof any, any>
) => Record<keyof any, any>;


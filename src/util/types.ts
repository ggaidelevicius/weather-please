/* eslint-disable no-unused-vars */
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
 * Handles changes for "input" state.
 *
 * Previous attributes are spread, then new ones are merged in, overwriting old ones if they exist.
 */
export type HandleChange = (k: HandleChangeKey, v: string | boolean) => void;

/**
 * Handles the click of the "saved" button in initialisation.
 *
 * If browser geolocation permissions are given, we first try to automatically get location via browser API.
 *
 * On safari, we instead use a third-party service as safari prompts for browser permissions on a daily basis.
 *
 * If these automatic methods fail, we instead prompt the user to manually input their latitude and longitude.
 */
export type HandleClick = (method: 'auto' | 'manual') => void;

/**
 * Compares the shape of the two objects, in this case the config object in localStorage against initialState.
 */
export type CompareObjects = (
  obj1: Record<keyof any, any>,
  obj2: Record<keyof any, any>
) => boolean;

/**
 * Merges two objects together.
 *
 * Preserves the values of the target object keys (in this case the config object in localStorage) if they exist.
 */
export type MergeObjects = (
  targetObj: Record<keyof any, any>,
  sourceObj: Record<keyof any, any>
) => ConfigProps;

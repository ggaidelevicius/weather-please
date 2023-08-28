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
  | 'identifier';

// eslint-disable-next-line no-unused-vars
export type HandleChange = (k: HandleChangeKey, v: string | boolean) => void;

// eslint-disable-next-line no-unused-vars
export type HandleClick = (method: 'auto' | 'manual') => void;

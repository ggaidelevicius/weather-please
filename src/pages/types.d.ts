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
}

export type HandleChangeKey = 'lat' | 'lon' | 'periodicLocationUpdate' | 'showAlerts' | 'showUvAlerts' | 'showPrecipitationAlerts' | 'showWindAlerts' | 'showVisibilityAlerts' | 'useMetric'

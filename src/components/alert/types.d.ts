export interface CurrentWeatherProps {
  totalPrecipitation: number;
  hoursOfExtremeUv: boolean[];
  hoursOfHighWind: boolean[];
  hoursOfLowVisibility: boolean[];
}

export interface AlertProps extends CurrentWeatherProps {
  useMetric: boolean;
  showUvAlerts: boolean;
  showWindAlerts: boolean;
  showVisibilityAlerts: boolean;
  showPrecipitationAlerts: boolean;
}

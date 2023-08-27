export interface CurrentWeatherProps {
  totalPrecipitation: TotalPrecipitation;
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
  width: number;
}

interface TotalPrecipitation {
  precipitation: {
    value: number;
    flag: boolean;
  };
  duration: boolean[];
}

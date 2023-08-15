export interface CurrentWeatherProps {
  totalPrecipitation: number;
  hoursOfExtremeUv: boolean[];
  hoursOfHighWind: boolean[];
  hoursOfLowVisibility: boolean[];
}

export interface AlertProps extends CurrentWeatherProps {
  useMetric: boolean;
}

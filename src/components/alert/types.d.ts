export interface CurrentWeatherProps {
  totalPrecipitation: number;
  hoursOfExtremeUv: boolean[];
}

export interface AlertProps extends CurrentWeatherProps {
  useMetric: boolean;
}

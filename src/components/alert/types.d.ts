export interface CurrentWeatherProps {
  readonly totalPrecipitation: TotalPrecipitation;
  readonly hoursOfExtremeUv: boolean[];
  readonly hoursOfHighWind: boolean[];
  readonly hoursOfLowVisibility: boolean[];
}

export interface AlertProps extends CurrentWeatherProps {
  readonly useMetric: boolean;
  readonly showUvAlerts: boolean;
  readonly showWindAlerts: boolean;
  readonly showVisibilityAlerts: boolean;
  readonly showPrecipitationAlerts: boolean;
  readonly width: number;
}

interface TotalPrecipitation {
  readonly precipitation: {
    readonly value: number;
    readonly flag: boolean;
  };
  readonly duration: boolean[];
}

export interface BasicWeatherProps {
  readonly max: number;
  readonly min: number;
  readonly description: string;
  readonly icon: string;
  readonly useMetric: boolean;
}

export interface WeatherDetailProps {
  readonly uv: number;
  readonly wind: number;
  readonly rain: number;
  readonly useMetric: boolean;
  readonly index: number;
}

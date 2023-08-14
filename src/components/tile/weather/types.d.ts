export interface BasicWeatherProps {
  max: number
  min: number
  description: string
  icon: string
  useMetric: boolean
}

export interface WeatherDetailProps {
  uv: number
  wind: number
  rain: number
  useMetric: boolean
  index: number
}

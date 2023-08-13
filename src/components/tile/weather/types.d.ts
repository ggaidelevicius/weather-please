export interface BasicWeatherProps {
  max: number
  min: number
  description: string
  icon: string
}

export interface WeatherDetailProps {
  uv: number
  wind: number
  rain: number
}

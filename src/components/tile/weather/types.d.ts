export interface BasicWeatherProps {
  max: number
  min: number
  description: string
  icon: string
}

export interface WeatherDetailProps {
  humidity: number
  wind: number
  rain: number
}

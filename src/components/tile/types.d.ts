export interface TileProps {
  day: number
  max: number
  min: number
  description: string
  icon: string
  wind: number
  rain: number
  uv: number
  useMetric: boolean
  index: number
}

export type Days = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'

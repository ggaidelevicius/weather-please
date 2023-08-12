import Tile from '@/components/tile'
import type { TileProps } from '@/components/tile/types'
import { useEffect, useState } from 'react'
import styles from './styles.module.css'

const WeatherPlease = () => {
  const [weatherData, setWeatherData] = useState<[] | TileProps[]>([])
  const [currentHour, setCurrentHour] = useState(new Date().getHours())

  useEffect(() => {
    const fetchData = async () => {
      const req = await fetch('https://api.openweathermap.org/data/2.5/onecall?lat=-31.96944933916474&lon=115.81565373202407&exclude=minutely,alerts&units=metric&appid=43f0866f05bae986f738a40d62beaa35')
      const res = await req.json()
      const data = res.daily.slice(0, 3).map((day: any) => {
        return (
          {
            day: day.dt,
            max: day.temp.max,
            min: day.temp.min,
            description: day.weather[0].description,
            icon: day.weather[0].icon,
            humidity: day.humidity,
            wind: day.wind_speed,
            rain: day.pop,
          }
        )
      })
      setWeatherData(data)
    }
    fetchData()

    setInterval(() => {
      if (new Date().getHours() !== currentHour) {
        setCurrentHour(new Date().getHours())
      }
    }, 6e4)

    return () => { }
  }, [currentHour])

  const tiles = weatherData.map((day) => <Tile key={day.day} {...day} />)

  return (
    <main className={styles.main}>
      {tiles}
    </main>
  )
}

export default WeatherPlease

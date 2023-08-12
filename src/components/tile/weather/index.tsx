/* eslint-disable @next/next/no-img-element */
import {
  BrokenClouds,
  ClearSky,
  FewClouds,
  // eslint-disable-next-line no-unused-vars
  LightDrizzle,
  LightRain,
  Mist,
  OvercastClouds,
  // eslint-disable-next-line no-unused-vars
  ShowerDrizzle,
  ShowerRain,
  Snow,
  Thunderstorm,
} from '@/assets/images'
import { IconCloudRain, IconDroplet, IconWind } from '@tabler/icons-react'
import styles from './styles.module.css'
import type { BasicWeatherProps, WeatherDetailProps } from './types'

export const BasicWeather = (props: BasicWeatherProps) => {
  const { max, min, description, icon } = props
  const iconMap = {
    '01d': ClearSky,
    '01n': ClearSky,
    '02d': FewClouds,
    '02n': FewClouds,
    '03d': OvercastClouds, // where is scattered?
    '03n': OvercastClouds, // where is scattered?
    '04d': BrokenClouds,
    '04n': BrokenClouds,
    '09d': LightRain,
    '09n': LightRain,
    '10d': ShowerRain,
    '10n': ShowerRain,
    '11d': Thunderstorm,
    '11n': Thunderstorm,
    '13d': Snow,
    '13n': Snow,
    '50d': Mist,
    '50n': Mist,
  }

  return (
    <div className={styles.container}>
      <div className={styles.textContainer}>
        <div className={styles.temperatureContainer}>
          <div>
            {Math.round(max)}
          </div>
          <div>
            {Math.round(min)}
          </div>
        </div>
        <div>
          {description}
        </div>
      </div>
      {icon &&
        <img src={iconMap[icon as keyof typeof iconMap].src} alt="" className={styles.image} />
      }
    </div>
  )
}

export const WeatherDetail = (props: WeatherDetailProps) => {
  const { humidity, wind, rain } = props

  return (
    <div className={styles.detailContainer}>
      <div className={styles.detail}>
        <IconDroplet size='1.1rem' />
        <span>
          {`${Math.round(humidity)}%`}
        </span>
      </div>
      <div className={styles.detail}>
        <IconWind size='1.1rem' />
        <span>
          {`${Math.round(wind)} m/s`}
        </span>
      </div>
      <div className={styles.detail}>
        <IconCloudRain size='1.1rem' />
        <span>
          {`${Math.round(rain * 100)}%`}
        </span>
      </div>
    </div>
  )
}

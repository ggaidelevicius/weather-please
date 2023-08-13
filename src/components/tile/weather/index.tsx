/* eslint-disable @next/next/no-img-element */
import {
  BrokenClouds,
  ClearSky,
  FewClouds,
  LightDrizzle,
  LightRain,
  Mist,
  OvercastClouds,
  ShowerDrizzle,
  ShowerRain,
  Snow,
  Thunderstorm,
} from '@/assets/images'
import { IconCloudRain, IconUvIndex, IconWind } from '@tabler/icons-react'
import styles from './styles.module.css'
import type { BasicWeatherProps, WeatherDetailProps } from './types'

export const BasicWeather = (props: BasicWeatherProps) => {
  const { max, min, description } = props
  const descriptionMap = {
    '0': 'clear sky',
    '1': 'mainly clear',
    '2': 'partly cloudy',
    '3': 'overcast',
    '45': 'fog',
    '48': 'depositing rime fog',
    '51': 'light drizzle',
    '53': 'moderate drizzle',
    '55': 'dense drizzle',
    '56': 'light freezing drizzle',
    '57': 'dense freezing drizzle',
    '61': 'slight rain',
    '63': 'moderate rain',
    '65': 'heavy rain',
    '66': 'light freezing rain',
    '67': 'heavy freezing rain',
    '71': 'slight snow fall',
    '73': 'moderate snow fall',
    '75': 'heavy snow fall',
    '77': 'snow grains',
    '80': 'slight rain showers',
    '81': 'moderate rain showers',
    '82': 'violent rain showers',
    '85': 'slight snow showers',
    '86': 'heavy snow showers',
    '95': 'thunderstorm',
    '96': 'thunderstorm with slight hail',
    '99': 'thunderstorm with heavy hail',
  }
  const iconMap = {
    '0': ClearSky,
    '1': FewClouds,
    '2': OvercastClouds,
    '3': BrokenClouds,
    '45': Mist,
    '48': Mist,
    '51': LightDrizzle,
    '53': ShowerDrizzle,
    '55': ShowerDrizzle,
    '56': ShowerDrizzle,
    '57': ShowerDrizzle,
    '61': LightRain,
    '63': ShowerRain,
    '65': ShowerRain,
    '66': LightRain,
    '67': ShowerRain,
    '71': Snow,
    '73': Snow,
    '75': Snow,
    '77': Snow,
    '80': ShowerRain,
    '81': ShowerRain,
    '82': ShowerRain,
    '85': Snow,
    '86': Snow,
    '95': Thunderstorm,
    '96': Thunderstorm,
    '99': Thunderstorm,
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
          {descriptionMap[description as keyof typeof descriptionMap]}
        </div>
      </div>
      <img src={iconMap[description as keyof typeof iconMap].src} alt="" className={styles.image} />
    </div>
  )
}

export const WeatherDetail = (props: WeatherDetailProps) => {
  const { uv, wind, rain, useMetric } = props

  return (
    <div className={styles.detailContainer}>
      <div className={styles.detail}>
        <IconUvIndex size='1.1rem' />
        <span>
          {`${Math.round(uv)}`}
        </span>
      </div>
      <div className={styles.detail}>
        <IconWind size='1.1rem' />
        <span>
          {`${Math.round(wind)} ${useMetric ? 'km/h' : 'mph'}`}
        </span>
      </div>
      <div className={styles.detail}>
        <IconCloudRain size='1.1rem' />
        <span>
          {`${Math.round(rain)}%`}
        </span>
      </div>
    </div>
  )
}

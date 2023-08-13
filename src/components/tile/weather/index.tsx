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
import { IconCloudRain, IconUvIndex, IconWind } from '@tabler/icons-react'
import styles from './styles.module.css'
import type { BasicWeatherProps, WeatherDetailProps } from './types'

export const BasicWeather = (props: BasicWeatherProps) => {
  const { max, min, description, icon } = props
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
          {descriptionMap[description as keyof typeof descriptionMap]}
        </div>
      </div>
      {icon &&
        <img src={iconMap[icon as keyof typeof iconMap].src} alt="" className={styles.image} />
      }
    </div>
  )
}

export const WeatherDetail = (props: WeatherDetailProps) => {
  const { uv, wind, rain } = props

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
          {`${Math.round(wind)} m/s`}
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

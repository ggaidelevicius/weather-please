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
import type { FC } from 'react'
import styles from './styles.module.css'
import type { BasicWeatherProps, WeatherDetailProps } from './types'

export const BasicWeather: FC<BasicWeatherProps> = (props) => {
  const { max, min, description, useMetric } = props
  const descriptionMap = {
    '0': 'clear sky',
    '1': 'mainly clear',
    '2': 'partly cloudy',
    '3': 'overcast',
    '45': 'mainly clear', // though this should be fog, fog appears way too often and is not at all accurate
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
    '45': FewClouds, // though this should be fog/mist, fog appears way too often and is not at all accurate
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
          <div aria-hidden>
            {useMetric ? Math.round(max) : Math.round((max * 9 / 5) + 32)}
          </div>
          <span className='visuallyHidden'>
            {`The maximum temperature will be ${useMetric ? Math.round(max) : Math.round((max * 9/5) + 32)} degrees ${useMetric ? 'celsius' : 'fahrenheit'}.`}
          </span>
          <div aria-hidden>
            {useMetric ? Math.round(min) : Math.round((min * 9 / 5) + 32)}
          </div>
          <span className='visuallyHidden'>
            {`The minimum temperature will be ${useMetric ? Math.round(min) : Math.round((min * 9 / 5) + 32)} degrees ${useMetric ? 'celsius' : 'fahrenheit'}.`}
          </span>
        </div>
        <div aria-hidden>
          {descriptionMap[description as keyof typeof descriptionMap]}
        </div>
        <span className='visuallyHidden'>
          {`The expected type of weather is ${descriptionMap[description as keyof typeof descriptionMap]}.`}
        </span>
      </div>
      <img src={iconMap[description as keyof typeof iconMap].src} alt='' className={styles.image} />
    </div>
  )
}

export const WeatherDetail: FC<WeatherDetailProps> = (props) => {
  const { uv, wind, rain, useMetric, index } = props

  return (
    <div className={styles.detailContainer}>
      <div className={styles.detail}>
        <IconUvIndex size='1.1rem' aria-hidden />
        <span aria-hidden>
          {`${Math.round(uv)}`}
        </span>
        <span className='visuallyHidden'>
          {`${index === 0 ? 'Today\'s maximum UV index is' : 'The maximum UV index will be'} ${Math.round(uv)}`}
        </span>
      </div>
      <div className={styles.detail}>
        <IconWind size='1.1rem' aria-hidden />
        <span aria-hidden>
          {`${useMetric ? Math.round(wind) : Math.round(wind / 1.609344)} ${useMetric ? 'km/h' : 'mph'}`}
        </span>
        <span className='visuallyHidden'>
          {`${index === 0 ? 'Today\'s maximum wind speed is' : 'The maximum wind speed will be'} ${useMetric ? Math.round(wind) : Math.round(wind / 1.609344)} ${useMetric ? 'kilometers per hour' : 'miles per hour'}`}
        </span>
      </div>
      <div className={styles.detail}>
        <IconCloudRain size='1.1rem' aria-hidden />
        <span aria-hidden>
          {`${Math.round(rain)}%`}
        </span>
        <span className='visuallyHidden'>
          {`${index === 0 ? 'Today there is a' : 'There will be'} a ${Math.round(rain)}% chance of precipitation`}
        </span>
      </div>
    </div>
  )
}

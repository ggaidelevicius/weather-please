/* eslint-disable @next/next/no-img-element */
import Alert from '@/components/alert'
import type { CurrentWeatherProps } from '@/components/alert/types'
import Initialisation from '@/components/intialisation'
import Settings from '@/components/settings'
import Tile from '@/components/tile'
import type { TileProps } from '@/components/tile/types'
import { Loader } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { AnimatePresence, motion } from 'framer-motion'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import styles from './styles.module.css'
import type { ConfigProps } from './types'

const WeatherPlease: FC<any> = () => {
  const [currentWeatherData, setCurrentWeatherData] = useState<CurrentWeatherProps>({
    totalPrecipitation: 0,
    hoursOfExtremeUv: [false],
    hoursOfHighWind: [false],
    hoursOfLowVisibility: [false],
  })
  const [futureWeatherData, setFutureWeatherData] = useState<[] | TileProps[]>([])
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours())
  const [currentDate, setCurrentDate] = useState<number>(new Date().getDate())
  const [loading, setLoading] = useState<boolean>(false)
  const [geolocationError, setGeolocationError] = useState<boolean>(false)
  const [opened, { open, close }] = useDisclosure(false)
  const [config, setConfig] = useState<ConfigProps>({
    lat: '',
    lon: '',
    periodicLocationUpdate: false,
    useMetric: true,
    showAlerts: true,
    showUvAlerts: true,
    showWindAlerts: true,
    showVisibilityAlerts: true,
    showPrecipitationAlerts: true,
  })
  const [input, setInput] = useState<ConfigProps>({
    lat: '',
    lon: '',
    periodicLocationUpdate: false,
    useMetric: true,
    showAlerts: true,
    showUvAlerts: true,
    showWindAlerts: true,
    showVisibilityAlerts: true,
    showPrecipitationAlerts: true,
  })

  const compareObjects = (obj1: any, obj2: any): boolean => {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    return keys1.length === keys2.length && keys1.every(key => keys2.includes(key))
  }

  const mergeObjects = (targetObj: any, sourceObj: any) => {
    const mergedObject = { ...targetObj }

    Object.keys(sourceObj).forEach(key => {
      if (!mergedObject.hasOwnProperty(key)) {
        mergedObject[key] = sourceObj[key]
      }
    })

    return mergedObject
  }

  useEffect(() => {
    const storedData = localStorage?.config ? JSON.parse(localStorage.config) : null
    if (storedData) {
      const objectShapesMatch = compareObjects(storedData, config)
      if (objectShapesMatch) {
        setConfig(storedData)
        setInput(storedData)
      } else {
        const mergedObject = mergeObjects(storedData, config)
        setConfig(mergedObject)
        setInput(mergedObject)
      }
    }
    else {
      open()
    }
    return () => { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const req = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${config.lat}&longitude=${config.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,windspeed_10m_max&timeformat=unixtime&timezone=auto&hourly=precipitation,uv_index,windspeed_10m,visibility&forecast_days=3${config.useMetric ? '' : '&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch'}`)
        const res = await req.json()
        const futureData = res.daily.time.map((day: unknown, i: number) => {
          return (
            {
              day,
              max: res.daily.temperature_2m_max[i],
              min: res.daily.temperature_2m_min[i],
              description: res.daily.weathercode[i],
              uv: res.daily.uv_index_max[i],
              wind: res.daily.windspeed_10m_max[i],
              rain: res.daily.precipitation_probability_max[i],
            }
          )
        })
        setFutureWeatherData(futureData)
        setCurrentWeatherData({
          totalPrecipitation: res.hourly.precipitation.slice(0, 6).reduce((p: number, c: number) => p + c),
          hoursOfExtremeUv: res.hourly.uv_index.slice(0, 12).map((val: number) => val >= 11),
          hoursOfHighWind: res.hourly.windspeed_10m.slice(0, 12).map((val: number) => val >= (config.useMetric ? 60 : 37)),
          hoursOfLowVisibility: res.hourly.visibility.slice(0, 12).map((val: number) => val <= 200),
        })
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn(e)
        // why can't i pass the value of state into message here?
        // why are these errors sometimes being shown + a console warning occurring despite data seemingly being fetched just fine?
        notifications.show({
          title: 'Error',
          message: 'An error has occurred while fetching weather data. Please check the console for more details.',
          color: 'red',
        })
      }
    }

    if (config.lat && config.lon) {
      fetchData()
    }

    setInterval(() => {
      if (new Date().getHours() !== currentHour) {
        setCurrentHour(new Date().getHours())
      }
    }, 6e4)

    return () => { }
  }, [currentHour, config])

  const handleChange = (k: 'lat' | 'lon' | 'periodicLocationUpdate', v: string | boolean): void => {
    setInput((prev: ConfigProps) => {
      return ({
        ...prev,
        [k]: v,
      })
    })
  }

  const handleClick = (method: 'auto' | 'manual'): void => {
    if (method === 'auto') {
      navigator.geolocation.getCurrentPosition((pos) => {
        setConfig((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toString(),
          lon: pos.coords.longitude.toString(),
        }))
        setInput((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toString(),
          lon: pos.coords.longitude.toString(),
        }))
      })
      setTimeout(() => { setGeolocationError(true) }, 5e3)
    } else {
      setConfig(input)
    }
  }

  useEffect(() => {
    if (config.lat && config.lon) {
      close()
    }
    return () => { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  useEffect(() => {
    setTimeout(() => {
      if (config.lat && config.lon) {
        localStorage.config = JSON.stringify(config)
      }
    }, 1e3)
    return () => { }
  }, [config])

  useEffect(() => {
    setTimeout(() => {
      if (new Date().getDate() !== currentDate) {
        setCurrentDate(new Date().getDate())
      }
    }, 6e4)

    if (config.periodicLocationUpdate) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setConfig((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toString(),
          lon: pos.coords.longitude.toString(),
        }))
      })
    }
    return () => { }
  }, [currentDate, config.periodicLocationUpdate])

  const tiles = () => (
    <AnimatePresence>
      {(futureWeatherData.map((day, i: number) => (
        <motion.div
          key={day.day}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { type: 'spring', duration: 2, delay: (i * .075) + 0.75 } }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <Tile {...day} useMetric={config.useMetric} index={i} />
        </motion.div>
      )))
      }
    </AnimatePresence>
  )

  return (
    <>
      <AnimatePresence>
        {futureWeatherData.length === 0 && config.lat && config.lon &&
          <motion.div
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            style={{ position: 'absolute', width: '100%', margin: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Loader variant="dots" size="lg" />
          </motion.div>
        }
      </AnimatePresence>

      <main className={styles.main}>
        {tiles()}
        {config.showAlerts &&
          <Alert
            {...currentWeatherData}
            useMetric={config.useMetric}
            showUvAlerts={config.showUvAlerts}
            showWindAlerts={config.showWindAlerts}
            showVisibilityAlerts={config.showVisibilityAlerts}
            showPrecipitationAlerts={config.showPrecipitationAlerts}
          />
        }
      </main>

      <Settings
        input={input}
        handleChange={handleChange}
        handleClick={handleClick}
        config={config}
      />

      <Initialisation
        geolocationError={geolocationError}
        handleClick={handleClick}
        setLoading={setLoading}
        loading={loading}
        input={input}
        handleChange={handleChange}
        opened={opened}
        close={close}
      />
    </>
  )
}

export default WeatherPlease

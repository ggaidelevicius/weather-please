/* eslint-disable @next/next/no-img-element */
import Initialisation from '@/components/intialisation'
import Settings from '@/components/settings'
import Tile from '@/components/tile'
import type { TileProps } from '@/components/tile/types'
import { Loader } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import styles from './styles.module.css'
import type { ConfigProps } from './types'

const WeatherPlease = () => {
  const [weatherData, setWeatherData] = useState<[] | TileProps[]>([])
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
  })
  const [input, setInput] = useState<ConfigProps>({
    lat: '',
    lon: '',
    periodicLocationUpdate: false,
    useMetric: true,
  })

  const compareObjects = (obj1: any, obj2: any) => {
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
    const fetchData = async () => {
      try {
        const req = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${config.lat}&longitude=${config.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,windspeed_10m_max&timeformat=unixtime&timezone=auto&forecast_days=3${config.useMetric ? '' : '&temperature_unit=fahrenheit&windspeed_unit=mph'}`)
        const res = await req.json()
        const data = res.daily.time.map((day: any, i: number) => {
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
        setWeatherData(data)
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn(e)
        // why can't i pass the value of state into message here?
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

  const handleChange = (k: 'lat' | 'lon' | 'periodicLocationUpdate', v: string | boolean) => {
    setInput((prev: ConfigProps) => {
      return ({
        ...prev,
        [k]: v,
      })
    })
  }

  const handleClick = (method: 'auto' | 'manual') => {
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
      {(weatherData.map((day, i: number) => (
        <motion.div
          key={day.day}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { type: 'spring', duration: 2, delay: (i * .075) + 1 } }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <Tile {...day} useMetric={config.useMetric} />
        </motion.div>
      )))
      }
    </AnimatePresence>
  )

  return (
    <>
      <AnimatePresence>
        {weatherData.length === 0 && config.lat && config.lon &&
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

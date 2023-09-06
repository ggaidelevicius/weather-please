/* eslint-disable @next/next/no-img-element */
import Alert from '@/components/alert'
import type { CurrentWeatherProps } from '@/components/alert/types'
import Initialisation from '@/components/intialisation'
import Settings from '@/components/settings'
import Tile from '@/components/tile'
import type { TileProps } from '@/components/tile/types'
import styles from '@/styles/styles.module.css'
import type { CompareObjects, ConfigProps, DetermineGridColumns, HandleChange, HandleClick, MergeObjects, TileComponent } from '@/util/types'
import { Loader } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import * as Sentry from '@sentry/nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import type { FC } from 'react'
import { useEffect, useState } from 'react'

const WeatherPlease: FC = () => {
  const [currentWeatherData, setCurrentWeatherData] = useState<CurrentWeatherProps>({
    totalPrecipitation: {
      precipitation: {
        value: 0,
        flag: false,
      },
      duration: [false],
    },
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
  const initialState: ConfigProps = {
    lat: '',
    lon: '',
    periodicLocationUpdate: false,
    useMetric: true,
    showAlerts: true,
    showUvAlerts: true,
    showWindAlerts: true,
    showVisibilityAlerts: true,
    showPrecipitationAlerts: true,
    daysToRetrieve: '3',
    identifier: 'day',
    shareCrashesAndErrors: false,
  }
  const [config, setConfig] = useState<ConfigProps>(initialState)
  const [input, setInput] = useState<ConfigProps>(initialState)
  const [usingFreshData, setUsingFreshData] = useState<boolean>(false)
  const [changedLocation, setChangedLocation] = useState<boolean>(false)
  const [completedFirstLoad, setCompletedFirstLoad] = useState<boolean>(false)

  /**
   * Initializes or closes the Sentry error reporting based on user permissions.
   *
   * When the `config.shareCrashesAndErrors` value changes (either read from localStorage or
   * updated in the app), this effect hook checks its value. If the user has granted permission,
   * Sentry is initialized to capture and report crashes and errors. If the permission is not given,
   * Sentry is closed to stop any error reporting.
   */
  useEffect(() => {
    if (config.shareCrashesAndErrors) {
      Sentry.init({
        dsn: 'https://f3641aec69a23937c89259888e252f19@o4505788641771520.ingest.sentry.io/4505788646817792',
        tracesSampleRate: 1,
        debug: false,
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: 0,
        beforeSend: (event) => event,
      })
    } else {
      Sentry.close()
    }
    return () => {
      Sentry.close()
    }
  }, [config.shareCrashesAndErrors])

  const compareObjects: CompareObjects = (obj1, obj2) => {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) {
      return false
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false
      }

      const val1 = obj1[key]
      const val2 = obj2[key]

      // Check if both values are objects (but not arrays or null)
      if (
        val1 && typeof val1 === 'object' &&
        !Array.isArray(val1) &&
        val2 && typeof val2 === 'object' &&
        !Array.isArray(val2)
      ) {
        if (!compareObjects(val1, val2)) {
          return false
        }
      } else if (val1 !== val2) {
        return false
      }
    }

    return true
  }

  const mergeObjects: MergeObjects = (targetObj, sourceObj) => {
    const mergedObject = { ...targetObj }

    Object.keys(sourceObj).forEach(key => {
      if (!mergedObject.hasOwnProperty(key)) {
        mergedObject[key] = sourceObj[key]
      }
    })

    return mergedObject as ConfigProps
  }

  /**
  * On component mount, this effect hook checks the localStorage for a saved "config".
  *
  * - If "config" exists in localStorage, it is parsed and the states of both "config" and "input" are set.
  *   - If the object shape of the stored data matches the current "config", both states are directly set to the stored value.
  *   - If they don't match, the stored data is merged with the current "config" and the merged result is set to both states.
  *
  * - If "config" does not exist in localStorage, the <Initialisation /> modal is opened to prompt the user for initial configuration.
  */
  useEffect(() => {
    const storedData = localStorage?.config ? JSON.parse(localStorage.config) : null
    if (storedData) {
      const objectShapesMatch = compareObjects(storedData, config) // should we be comparing against initialState here instead?
      if (objectShapesMatch) {
        setConfig(storedData)
        setInput(storedData)
      } else {
        const mergedObject = mergeObjects(storedData, config) // should we be comparing against initialState here instead?
        setConfig(mergedObject as ConfigProps)
        setInput(mergedObject as ConfigProps) // we lose the generic capability of the function here
      }
    }
    else {
      open()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
  * This effect hook manages fetching and updating weather data.
  *
  * - Initially, it checks localStorage to determine if we can use cached weather data. For cached data to be used:
  *   - The current hour should match when the data was last updated.
  *   - The user location and data retrieval preferences in "config" shouldn't have changed since the last fetch.
  *
  * - If the criteria for cached data are met, it sets the weather states using data from localStorage.
  *
  * - Otherwise, it fetches fresh weather data, saves it to the state and localStorage, and updates the time of the last update.
  *
  * - To ensure data freshness, every minute the hook checks if the hour has changed. If it has, the effect reruns to potentially fetch fresh data.
  *
  * TODO:
  * - "totalPrecipitation" logic needs refinement to ensure correct precipitation alerting under certain conditions.
  */
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const req = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${config.lat}&longitude=${config.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,windspeed_10m_max&timeformat=unixtime&timezone=auto&hourly=precipitation,uv_index,windspeed_10m,visibility&forecast_days=${config.daysToRetrieve}`)
        const res = await req.json()
        const futureData = res.daily.time.map((day: unknown, i: number) => ({
          day,
          max: res.daily.temperature_2m_max[i],
          min: res.daily.temperature_2m_min[i],
          description: res.daily.weathercode[i],
          uv: res.daily.uv_index_max[i],
          wind: res.daily.windspeed_10m_max[i],
          rain: res.daily.precipitation_probability_max[i],
        }))
        setFutureWeatherData(futureData)
        localStorage.data = JSON.stringify(futureData)
        const alerts = {
          totalPrecipitation: {
            precipitation: res.hourly.precipitation.slice(currentHour, currentHour + 25).reduce((p: { value: number, flag: boolean }, c: number) => {
              if (p.flag || c === 0) {
                return { value: p.value, flag: true }
              }
              return { value: p.value + c, flag: false }
            }, { value: 0, flag: false }),
            duration: res.hourly.precipitation.slice(currentHour, currentHour + 25).map((val: number) => val > 0),
          },
          hoursOfExtremeUv: res.hourly.uv_index.slice(currentHour, currentHour + 13).map((val: number) => val >= 11),
          hoursOfHighWind: res.hourly.windspeed_10m.slice(currentHour, currentHour + 25).map((val: number) => val >= 60),
          hoursOfLowVisibility: res.hourly.visibility.slice(currentHour, currentHour + 25).map((val: number) => val <= 200),
        }
        setCurrentWeatherData(alerts)
        localStorage.alerts = JSON.stringify(alerts)
        const now = new Date()
        localStorage.lastUpdated = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`
        setChangedLocation(false)
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

    if (
      localStorage.data
      && localStorage.lastUpdated
      && new Date().getFullYear() === parseInt(localStorage.lastUpdated.split('-')[0])
      && new Date().getMonth() === parseInt(localStorage.lastUpdated.split('-')[1])
      && new Date().getDate() === parseInt(localStorage.lastUpdated.split('-')[2])
      && new Date().getHours() === parseInt(localStorage.lastUpdated.split('-')[3])
      && JSON.parse(localStorage.data).length === parseInt(config.daysToRetrieve)
      && !changedLocation
    ) {
      const data = JSON.parse(localStorage.data)
      const alerts = JSON.parse(localStorage.alerts)
      setFutureWeatherData(data)
      setCurrentWeatherData(alerts)
    } else {
      if (config.lat && config.lon) {
        fetchData()
      }
    }

    const checkHour = setInterval(() => {
      if (new Date().getHours() !== currentHour) {
        setCurrentHour(new Date().getHours())
      }
    }, 6e4)

    return () => {
      clearInterval(checkHour)
    }
  }, [currentHour, config.lat, config.lon, config.daysToRetrieve, config.useMetric, changedLocation])

  const handleChange: HandleChange = (k, v) => {
    setInput((prev) => {
      return ({
        ...prev,
        [k]: v,
      })
    })
  }

  const handleClick: HandleClick = async (method) => {
    const userAgent = navigator.userAgent.toLowerCase()

    if (method === 'auto' && (!(userAgent.indexOf('safari') !== -1 && userAgent.indexOf('chrome') === -1))) {
      navigator.geolocation.getCurrentPosition((pos) => {
        if ((config.lat !== pos.coords.latitude.toString()) || (config.lon !== pos.coords.longitude.toString())) {
          setChangedLocation(true)
        }
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
    } else if (method === 'auto' && ((userAgent.indexOf('safari') !== -1) && userAgent.indexOf('chrome') === -1)) {
      try {
        const req = await fetch('http://ip-api.com/json/', {
          method: 'GET',
          mode: 'cors',
        })
        const res = await req.json()
        const { lat, lon } = res
        if ((config.lat !== lat) || (config.lon !== lon)) {
          setChangedLocation(true)
        }
        setConfig((prev) => ({
          ...prev,
          lat: lat,
          lon: lon,
        }))
        setInput((prev) => ({
          ...prev,
          lat: lat,
          lon: lon,
        }))
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e)
        setGeolocationError(true)
      }
      setTimeout(() => { setGeolocationError(true) }, 5e3)
    } else { // todo: warning on exiting without saving changes
      if ((config.lat !== input.lat) || config.lon !== input.lon) {
        setChangedLocation(true)
      }
      setConfig(input)
    }
  }

  /**
  * Closes the <Initialisation /> modal if it's opened and both "lat" and "lon" are configured in the "config".
  */
  useEffect(() => {
    if (opened && config.lat && config.lon) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, config.lat, config.lon])

  /**
    * Commits the "config" to localStorage if "config.lat" and "config.lon" are valid latitude and longitude values, respectively.
    * Latitude: -90 to +90, Longitude: -180 to +180.
    * If the geolocation has been updated, it sets "usingFreshData" to true, indicating the need to fetch fresh data.
    */
  useEffect(() => {
    if (
      config.lat
      && config.lon
      && (/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(config.lat)
      && (/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(config.lon)
    ) {
      localStorage.config = JSON.stringify(config)
      if (changedLocation) {
        setUsingFreshData(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  /**
  * Periodically (every minute) checks if the current date has changed.
  * If it's a new day and the user has opted-in for periodic location updates,
  * the user's geolocation is checked:
  * - For non-Safari browsers, the built-in Geolocation API is utilized.
  * - For Safari, an external service (ip-api.com) is used to fetch geolocation data.
  *
  * If the geolocation has changed from what's saved in "config", the "changedLocation" flag is set to true.
  *
  * TODO:
  *  - Consider abstracting the geolocation identifying techniques for code reusability and maintainability.
  */
  useEffect(() => {
    const checkDate = setInterval(() => {
      if (new Date().getDate() !== currentDate) {
        setCurrentDate(new Date().getDate())
      }
    }, 6e4)

    if (config.periodicLocationUpdate) {
      const userAgent = navigator.userAgent.toLowerCase()

      if (!(userAgent.indexOf('safari') !== -1) && userAgent.indexOf('chrome') === -1) {
        try {
          navigator.geolocation.getCurrentPosition((pos) => {
            if ((config.lat !== pos.coords.latitude.toString()) || (config.lon !== pos.coords.longitude.toString())) {
              setChangedLocation(true)
            }
            setConfig((prev) => ({
              ...prev,
              lat: pos.coords.latitude.toString(),
              lon: pos.coords.longitude.toString(),
            }))
          })
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(e)
          notifications.show({
            title: 'Error',
            message: 'An error has occurred while periodically updating location. Please check the console for more details.',
            color: 'red',
          })
        }
      } else {
        const fetchSafariGeoData = async () => {
          try {
            const req = await fetch('http://ip-api.com/json/', {
              method: 'GET',
              mode: 'cors',
            })
            const res = await req.json()
            const { latitude, longitude } = res
            if (latitude && longitude) {
              if ((config.lat !== latitude) || (config.lon !== longitude)) {
                setChangedLocation(true)
              }
              setConfig((prev) => ({
                ...prev,
                lat: latitude,
                lon: longitude,
              }))
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn(e)
            notifications.show({
              title: 'Error',
              message: 'An error has occurred while fetching location data. Please check the console for more details.',
              color: 'red',
            })
          }
        }
        fetchSafariGeoData()
      }
    }
    return () => {
      clearInterval(checkDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, config.periodicLocationUpdate])

  const tiles: TileComponent = (futureWeatherData.map((day, i: number) => {
    let delayBaseline = 0.75
    if (localStorage.data) {
      delayBaseline = 0
    }
    return (
      <motion.div
        key={day.day}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, transition: { type: 'spring', duration: 2, delay: (i * .075) + delayBaseline } }}
        exit={{ scale: 0.95, opacity: 0 }}
        layout={completedFirstLoad}
        style={{ background: 'none' }}
      >
        <Tile {...day} useMetric={config.useMetric} identifier={config.identifier} index={i} />
      </motion.div>
    )
  })
  )

  /**
   * Delays setting `completedFirstLoad` to mitigate layout shifts during initial render.
   *
   * The effect sets a delay of 1.9 seconds before marking the first load as complete. This
   * ensures that weather tiles render smoothly without abrupt layout shifts due to
   * alerts being mounted separately.
   */
  useEffect(() => {
    setTimeout(() => {
      setCompletedFirstLoad(true)
    }, 1.9)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const determineGridColumns: DetermineGridColumns = (daysToRetrieve) => {
    const value = parseInt(daysToRetrieve)

    switch (value) {
      case 1:
        return 1
      case 2:
        return 2
      case 3:
        return 3
      case 4:
        return 4
      case 5:
        return 5
      case 6:
        return 3
      case 7:
        return 3
      case 8:
        return 4
      case 9:
        return 3
      default:
        return 3
    }
  }

  return (
    <>
      <AnimatePresence>
        {futureWeatherData.length === 0 && config.lat && config.lon &&
          <motion.div
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            style={{ position: 'absolute', width: '100%', margin: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none' }}
          >
            <Loader variant='dots' size='lg' />
          </motion.div>
        }
      </AnimatePresence>

      <AnimatePresence>
        <motion.main
          layout={usingFreshData}
          className={styles.main}
          style={{
            gridTemplateColumns: `repeat(${determineGridColumns(config.daysToRetrieve)}, 1fr)`,
          }}
        >
          {tiles}
          {config.showAlerts &&
            <Alert
              {...currentWeatherData}
              useMetric={config.useMetric}
              showUvAlerts={config.showUvAlerts}
              showWindAlerts={config.showWindAlerts}
              showVisibilityAlerts={config.showVisibilityAlerts}
              showPrecipitationAlerts={config.showPrecipitationAlerts}
              width={determineGridColumns(config.daysToRetrieve)}
            />
          }
        </motion.main>
      </AnimatePresence>

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

      <a
        href='https://open-meteo.com/'
        target='_blank'
        className={styles.link}
        style={{ position: 'fixed', bottom: '1rem', left: '1rem', fontSize: '0.75rem', color: 'hsl(220deg 2.78% 57.65%)', lineHeight: 1, textDecoration: 'none' }}
      >
        weather data provided by open-meteo
      </a>
    </>
  )
}

export default WeatherPlease

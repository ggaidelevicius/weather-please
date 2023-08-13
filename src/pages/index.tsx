/* eslint-disable @next/next/no-img-element */
import Settings from '@/components/settings'
import Tile from '@/components/tile'
import type { TileProps } from '@/components/tile/types'
import { Button, Loader, Modal, Text, TextInput, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import styles from './styles.module.css'
import type { ConfigProps } from './types'

const WeatherPlease = () => {
  const [weatherData, setWeatherData] = useState<[] | TileProps[]>([])
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours())
  const [loading, setLoading] = useState<boolean>(false)
  const [geolocationError, setGeolocationError] = useState<boolean>(false)
  const [opened, { open, close }] = useDisclosure(false)
  const [config, setConfig] = useState<ConfigProps>({
    lat: '',
    lon: '',
  })
  const [input, setInput] = useState<ConfigProps>({
    lat: '',
    lon: '',
  })

  useEffect(() => {
    const storedData = localStorage?.config ? JSON.parse(localStorage.config) : null
    if (storedData) {
      setConfig(storedData)
      setInput(storedData)
    }
    else {
      open()
    }
    return () => { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const req = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${config.lat}&longitude=${config.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,windspeed_10m_max&timeformat=unixtime&timezone=auto&forecast_days=3`)
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

  const handleChange = (k: 'lat' | 'lon', v: string) => {
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
        setConfig({
          lat: pos.coords.latitude.toString(),
          lon: pos.coords.longitude.toString(),
        })
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

  const tiles = () => (
    <AnimatePresence>
      {(weatherData.map((day, i: number) => (
        <motion.div
          key={day.day}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { type: 'spring', duration: 2, delay: (i * .075) + 1 } }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <Tile {...day} />
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

      <Modal
        opened={opened}
        onClose={close}
        centered
        size="auto"
        padding="lg"
        radius="md"
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        trapFocus={false}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '2rem', justifyContent: 'center' }}>
          <img src="/favicon.png" alt="Weather Please logo" style={{ maxWidth: '4rem' }} />
          <Title order={1}>Weather <span style={{ color: '#ea5e57' }}>Please</span></Title>
        </div>
        <Text sx={{ fontSize: '1.05rem' }}>
          To get started, let&apos;s set your location.
        </Text>
        {!geolocationError &&
          <>
            <Text
              color="dimmed"
              size="sm"
            >
              If your browser prompts you for location permissions, please select &quot;allow&quot;.
            </Text>
            <Button
              onClick={() => { handleClick('auto'); setLoading(true) }}
              mt="md"
              fullWidth
              loading={loading}
            >
              Set my location
            </Button>
          </>
        }
        {geolocationError &&
          <>
            <Text color="dimmed" size="sm">
              Looks like we can&apos;t grab your location info automatically.
            </Text>
            <Text color="dimmed" size="sm">
              Please enter it manually below.
            </Text>
            <TextInput
              mt="md"
              label="Latitude"
              withAsterisk
              value={input.lat}
              onChange={(e) => { handleChange('lat', e.target.value.trim()) }}
              error={(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(input.lat) || input.lat === '' ? undefined : 'Invalid latitude value'}
            />
            <TextInput
              mt="xs"
              label="Longitude"
              withAsterisk
              value={input.lon}
              onChange={(e) => { handleChange('lon', e.target.value.trim()) }}
              error={(/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(input.lon) || input.lon === '' ? undefined : 'Invalid longitude value'}
            />
            <Text
              component="a"
              href="https://support.google.com/maps/answer/18539?hl=en&co=GENIE.Platform%3DDesktop#:~:text=Get%20the%20coordinates,latitude%20and%20longitude."
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              color="blue"
              sx={{ '&:hover': { textDecoration: 'underline' } }}
            >
              Unsure how to find these? Click here.
            </Text>
            <Button
              onClick={() => { handleClick('manual') }}
              mt="md"
              fullWidth
              disabled={!(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(input.lat) || !(/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(input.lon)}
            >
              Set my location
            </Button>
          </>
        }
      </Modal>
    </>
  )
}

export default WeatherPlease

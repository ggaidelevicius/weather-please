/* eslint-disable @next/next/no-img-element */
import Tile from '@/components/tile'
import type { TileProps } from '@/components/tile/types'
import { Button, Modal, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from 'react'
import styles from './styles.module.css'
import type { ConfigProps } from './types'


const WeatherPlease = () => {
  const [weatherData, setWeatherData] = useState<[] | TileProps[]>([])
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours())
  const [opened, { open, close }] = useDisclosure(false)
  const [tooManyRequests, setTooManyRequests] = useState<boolean>(false)
  const [config, setConfig] = useState<ConfigProps>({
    // api: '',
    api: '43f0866f05bae986f738a40d62beaa35',
    lat: '',
    lon: '',
  })

  useEffect(() => {
    let storedData = null
    if (localStorage.config) {
      storedData = JSON.parse(localStorage.config)
    }
    if (storedData && storedData.api && storedData.lat && storedData.lon) {
      setConfig(JSON.parse(localStorage.config))
    } else {
      open()
    }
    return () => { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const req = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${config.lat}&lon=${config.lon}&exclude=minutely,alerts&units=metric&appid=${config.api}`)
      const res = await req.json()
      if (res?.cod === 429) {
        setTooManyRequests(true)
      } else {
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
    }

    if (config.api && config.lat && config.lon) {
      fetchData()
    }

    setInterval(() => {
      if (new Date().getHours() !== currentHour) {
        setCurrentHour(new Date().getHours())
      }
    }, 6e4)

    return () => { }
  }, [currentHour, config])

  const handleClick = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setConfig((prev: ConfigProps) => {
        return ({
          ...prev,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        })
      })
    })
  }

  useEffect(() => {
    localStorage.config = JSON.stringify(config)
    return () => { }
  }, [config])

  const tiles = weatherData.map((day) => <Tile key={day.day} {...day} />)

  return (
    <>
      <main className={styles.main}>
        {tiles}
        <AnimatePresence>
          {tooManyRequests &&
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
              <Title color="white" sx={{ textAlign: 'center', textWrap: 'balance' }}>
                Too many requests have been made using the shared API key
              </Title>
              <Text>
                It will take up to 24 hours for new data to be received.
              </Text>
              <Button>
                Get my own free private key
              </Button>
            </motion.div>
          }
        </AnimatePresence>
      </main>

      {/* <Modal
        opened={opened}
        onClose={close}
        centered
        size="auto"
        padding="lg"
        radius="md"
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
      >
        {!config.lat && !config.lon &&
          <>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem', justifyContent: 'center' }}>
              <img src="/favicon.png" alt="Weather Please logo" style={{ maxWidth: '4rem' }} />
              <Title order={1}>Weather <span style={{ color: '#ea5e57' }}>Please</span></Title>
            </div>
            <Text>
              To get started, let&apos;s set your location.
            </Text>
            <Text
              color="dimmed"
              size="sm"
            >
              If your browser prompts you for location permissions, please select &quot;allow&quot;.
            </Text>

            <Button
              onClick={handleClick}
              mt="xs"
              fullWidth
            >
              Set my location
            </Button>
          </>
        }
        {config.lat && config.lon && !config.api &&
          <>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem', justifyContent: 'center' }}>
              <img src="/favicon.png" alt="Weather Please logo" style={{ maxWidth: '4rem' }} />
              <Title order={1}>Weather <span style={{ color: '#ea5e57' }}>Please</span></Title>
            </div>
            <Text>
              Next, let&apos;s configure your API key.
            </Text>
            <Text
              color="dimmed"
              size="sm"
            >
              Click here to register for an API key.
            </Text>

            <Button
              onClick={handleClick}
              mt="xs"
              fullWidth
            >
              Set my location
            </Button>
          </>
        }
      </Modal> */}
    </>
  )
}

export default WeatherPlease

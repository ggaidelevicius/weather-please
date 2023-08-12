/* eslint-disable @next/next/no-img-element */
import Tile from '@/components/tile'
import type { TileProps } from '@/components/tile/types'
import { Button, Modal, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import styles from './styles.module.css'
import type { ConfigProps } from './types'

const WeatherPlease = () => {
  const [weatherData, setWeatherData] = useState<[] | TileProps[]>([])
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours())
  const [opened, { open, close }] = useDisclosure(false)
  const [config, setConfig] = useState<ConfigProps>({
    api: '43f0866f05bae986f738a40d62beaa35',
    lat: '',
    lon: '',
  })

  useEffect(() => {
    if (localStorage.config && localStorage.config.api && localStorage.config.lat && localStorage.config.lon) {
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
      </main>

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
      >
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
      </Modal>
    </>
  )
}

export default WeatherPlease

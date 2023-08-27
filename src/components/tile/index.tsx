import { Card, Title } from '@mantine/core'
import classnames from 'classnames'
import type { FC } from 'react'
import { useState } from 'react'
import styles from './styles.module.css'
import type { Days, Months, TileProps } from './types'
import { BasicWeather, WeatherDetail } from './weather'

const Tile: FC<TileProps> = (props: TileProps) => {
  const { day } = props
  const [hovering, setHovering] = useState<boolean>(false)
  const days: Days[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months: Months[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <Card
      component="article"
      padding="lg"
      radius="md"
      sx={{ userSelect: 'none' }}
      onMouseEnter={() => { setHovering(true) }}
      onMouseLeave={() => { setHovering(false) }}
    >
      <Title
        order={2}
        className={styles.title}
      >
        <span className={classnames(styles.day, hovering ? styles.dayHover : undefined)}>
          {days[new Date(day * 1000).getDay()]}
        </span>
        <span className={classnames(styles.date, hovering ? styles.dateHover : undefined)}>
          {`${new Date(day * 1000).getDate()} ${months[new Date(day * 1000).getMonth()]}`}
        </span>
      </Title>
      <BasicWeather {...props} />
      <WeatherDetail {...props} />
    </Card>
  )
}

export default Tile

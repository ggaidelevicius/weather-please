import { Card, Title } from '@mantine/core'
import classnames from 'classnames'
import type { FC } from 'react'
import { useState } from 'react'
import styles from './styles.module.css'
import type { Day, Month, TileProps } from './types'
import { BasicWeather, WeatherDetail } from './weather'

const Tile: FC<TileProps> = (props) => {
  const { day, identifier } = props
  const [hovering, setHovering] = useState<boolean>(false)
  const days: Day[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months: Month[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const tileDay = days[new Date(day * 1000).getDay()]
  const tileDate = `${new Date(day * 1000).getDate()} ${months[new Date(day * 1000).getMonth()]}`

  return (
    <Card
      component='article'
      padding='lg'
      radius='md'
      sx={{ userSelect: 'none', cursor: 'default' }}
      onMouseEnter={() => { setHovering(true) }}
      onMouseLeave={() => { setHovering(false) }}
    >
      <Title
        order={2}
        className={styles.title}
      >
        <span className={classnames(styles.day, hovering ? styles.dayHover : undefined)}>
          {identifier === 'day' ? tileDay : tileDate}
        </span>
        <span className={classnames(styles.date, hovering ? styles.dateHover : undefined)}>
          {identifier === 'day' ? tileDate : tileDay}
        </span>
      </Title>
      <BasicWeather {...props} />
      <WeatherDetail {...props} />
    </Card>
  )
}

export default Tile

import { Trans } from '@lingui/macro'
import { Card, Title } from '@mantine/core'
import classnames from 'classnames'
import type { FC, ReactElement } from 'react'
import { useState } from 'react'
import styles from './styles.module.css'
import type { Day, Month, TileProps } from './types'
import { BasicWeather, WeatherDetail } from './weather'

const Tile: FC<TileProps> = (props) => {
	const { day, identifier } = props
	const [hovering, setHovering] = useState<boolean>(false)

	const tileDay: ReactElement = days[new Date(day * 1000).getDay()]
	const tileDate: ReactElement = (
		<>
			{new Date(day * 1000).getDate()} {months[new Date(day * 1000).getMonth()]}
		</>
	)

	return (
		<Card
			component="article"
			padding="lg"
			radius="md"
			style={{ userSelect: 'none', cursor: 'default' }}
			onMouseEnter={() => {
				setHovering(true)
			}}
			onMouseLeave={() => {
				setHovering(false)
			}}
		>
			<Title order={2} className={styles.title}>
				<span
					className={classnames({
						[styles.day]: true,
						[styles.dayHover]: hovering,
					})}
				>
					{identifier === 'day' ? tileDay : tileDate}
				</span>
				<span
					className={classnames({
						[styles.date]: true,
						[styles.dateHover]: hovering,
					})}
				>
					{identifier === 'day' ? tileDate : tileDay}
				</span>
			</Title>
			<BasicWeather {...props} />
			<WeatherDetail {...props} />
		</Card>
	)
}

const days: Day = [
	<Trans key="sunday">Sunday</Trans>,
	<Trans key="monday">Monday</Trans>,
	<Trans key="tuesday">Tuesday</Trans>,
	<Trans key="wednesday">Wednesday</Trans>,
	<Trans key="thursday">Thursday</Trans>,
	<Trans key="friday">Friday</Trans>,
	<Trans key="saturday">Saturday</Trans>,
]
const months: Month = [
	<Trans key="january">January</Trans>,
	<Trans key="february">February</Trans>,
	<Trans key="march">March</Trans>,
	<Trans key="april">April</Trans>,
	<Trans key="may">May</Trans>,
	<Trans key="june">June</Trans>,
	<Trans key="july">July</Trans>,
	<Trans key="august">August</Trans>,
	<Trans key="september">September</Trans>,
	<Trans key="october">October</Trans>,
	<Trans key="november">November</Trans>,
	<Trans key="december">December</Trans>,
]

export default Tile

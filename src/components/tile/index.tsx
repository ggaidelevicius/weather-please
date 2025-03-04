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
import { Trans } from '@lingui/react/macro'
import { IconCloudRain, IconUvIndex, IconWind } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import type { StaticImageData } from 'next/image'
import Image from 'next/image'
import type { ReactElement } from 'react'

const iconMap: Record<number, StaticImageData> = {
	0: ClearSky,
	1: FewClouds,
	2: OvercastClouds,
	3: BrokenClouds,
	45: FewClouds, // though this should be fog/mist, fog appears way too often and is not at all accurate
	48: Mist,
	51: LightDrizzle,
	53: ShowerDrizzle,
	55: ShowerDrizzle,
	56: ShowerDrizzle,
	57: ShowerDrizzle,
	61: LightRain,
	63: ShowerRain,
	65: ShowerRain,
	66: LightRain,
	67: ShowerRain,
	71: Snow,
	73: Snow,
	75: Snow,
	77: Snow,
	80: ShowerRain,
	81: ShowerRain,
	82: ShowerRain,
	85: Snow,
	86: Snow,
	95: Thunderstorm,
	96: Thunderstorm,
	99: Thunderstorm,
}

const descriptionMap: Record<number, ReactElement> = {
	0: <Trans>clear sky</Trans>,
	1: <Trans>mainly clear</Trans>,
	2: <Trans>partly cloudy</Trans>,
	3: <Trans>overcast</Trans>,
	45: <Trans>mainly clear</Trans>, // though this should be fog, fog appears way too often and is not at all accurate
	48: <Trans>depositing rime fog</Trans>,
	51: <Trans>light drizzle</Trans>,
	53: <Trans>moderate drizzle</Trans>,
	55: <Trans>dense drizzle</Trans>,
	56: <Trans>light freezing drizzle</Trans>,
	57: <Trans>dense freezing drizzle</Trans>,
	61: <Trans>slight rain</Trans>,
	63: <Trans>moderate rain</Trans>,
	65: <Trans>heavy rain</Trans>,
	66: <Trans>light freezing rain</Trans>,
	67: <Trans>heavy freezing rain</Trans>,
	71: <Trans>slight snowfall</Trans>,
	73: <Trans>moderate snowfall</Trans>,
	75: <Trans>heavy snowfall</Trans>,
	77: <Trans>snow grains</Trans>,
	80: <Trans>slight rain showers</Trans>,
	81: <Trans>moderate rain showers</Trans>,
	82: <Trans>violent rain showers</Trans>,
	85: <Trans>slight snow showers</Trans>,
	86: <Trans>heavy snow showers</Trans>,
	95: <Trans>thunderstorm</Trans>,
	96: <Trans>thunderstorm with slight hail</Trans>,
	99: <Trans>thunderstorm with heavy hail</Trans>,
}

const days = [
	<Trans key="sunday">Sunday</Trans>,
	<Trans key="monday">Monday</Trans>,
	<Trans key="tuesday">Tuesday</Trans>,
	<Trans key="wednesday">Wednesday</Trans>,
	<Trans key="thursday">Thursday</Trans>,
	<Trans key="friday">Friday</Trans>,
	<Trans key="saturday">Saturday</Trans>,
]

const months = [
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

interface TileProps {
	day: number
	max: number
	min: number
	description: number
	wind: number
	rain: number
	uv: number
	useMetric: boolean
	identifier: 'day' | 'date'
	index: number
	delayBaseline: number
}

export const Tile = ({
	day,
	max,
	min,
	description,
	wind,
	rain,
	uv,
	useMetric,
	identifier,
	index,
	delayBaseline,
}: TileProps) => {
	const dayDescriptor = days[new Date(day * 1000).getDay()]
	const dateDescriptor = (
		<>
			{new Date(day * 1000).getDate()} {months[new Date(day * 1000).getMonth()]}
		</>
	)

	const displayedIdentifier =
		identifier === 'day' ? dayDescriptor : dateDescriptor

	const hiddenIdentifier = identifier === 'day' ? dateDescriptor : dayDescriptor

	return (
		<motion.div
			initial={{ scale: 0.95, opacity: 0 }}
			animate={{
				scale: 1,
				opacity: 1,
				transition: {
					type: 'spring',
					duration: 2,
					delay: index * 0.1 + delayBaseline,
				},
			}}
			exit={{ scale: 0.95, opacity: 0 }}
			className="group relative flex flex-col rounded-lg bg-dark-700 p-5 will-change-[transform,opacity] select-none"
		>
			<span className="scale-100 text-2xl font-bold text-white opacity-100 transition-[scale,opacity] delay-150 duration-300 will-change-[opacity,scale] group-hover:scale-95 group-hover:opacity-0">
				{displayedIdentifier}
			</span>
			<span className="absolute scale-95 text-2xl font-bold text-white opacity-0 transition-[scale,opacity] duration-300 will-change-[opacity,scale] group-hover:scale-100 group-hover:opacity-100 group-hover:delay-300">
				{hiddenIdentifier}
			</span>
			<div className="mt-2.5 flex items-center justify-between gap-4">
				<div className="flex flex-col">
					<div className="flex items-baseline gap-2">
						<span className="text-3xl text-dark-100" aria-hidden>
							{useMetric ? Math.round(max) : Math.round((max * 9) / 5 + 32)}
						</span>
						<span className="sr-only">
							{useMetric && (
								<Trans>
									The maximum temperature will be {Math.round(max)} degrees
									celsius.
								</Trans>
							)}
							{!useMetric && (
								<Trans>
									The maximum temperature will be{' '}
									{Math.round((max * 9) / 5 + 32)} degrees fahrenheit.
								</Trans>
							)}
						</span>
						<span className="text-lg text-dark-300" aria-hidden>
							{useMetric ? Math.round(min) : Math.round((min * 9) / 5 + 32)}
						</span>
						<span className="sr-only">
							{useMetric && (
								<Trans>
									The minimum temperature will be {Math.round(min)} degrees
									celsius.
								</Trans>
							)}
							{!useMetric && (
								<Trans>
									The minimum temperature will be{' '}
									{Math.round((min * 9) / 5 + 32)} degrees fahrenheit.
								</Trans>
							)}
						</span>
					</div>
					<span className="text-dark-100" aria-hidden>
						{descriptionMap[description as keyof typeof descriptionMap]}
					</span>
					<span className="sr-only">
						<Trans>
							The expected type of weather is{' '}
							{descriptionMap[description as keyof typeof descriptionMap]}.
						</Trans>
					</span>
				</div>
				<Image
					quality={100}
					priority
					src={iconMap[description as keyof typeof iconMap]}
					alt=""
					width={56}
					height={56}
					className="h-[56px] w-[56px]"
				/>
			</div>
			<div className="mt-4 flex flex-row justify-between gap-3">
				<div className="flex flex-row items-center gap-1">
					<IconUvIndex size={18} className="text-dark-100" aria-hidden />
					<span aria-hidden className="text-sm text-dark-100">
						{Math.round(uv)}
					</span>
					<span className="sr-only">
						<Trans>The maximum UV index will be {Math.round(uv)}.</Trans>
					</span>
				</div>
				<div className="flex flex-row items-center gap-1">
					<IconWind size={18} className="text-dark-100" aria-hidden />
					<span aria-hidden className="text-sm text-dark-100">
						{useMetric && <Trans>{Math.round(wind)} km/h</Trans>}
						{!useMetric && <Trans>{Math.round(wind / 1.609344)} mph</Trans>}
					</span>
					<span className="sr-only">
						{useMetric && (
							<Trans>
								The maximum wind speed will be {Math.round(wind)} kilometers per
								hour.
							</Trans>
						)}
						{!useMetric && (
							<Trans>
								The maximum wind speed will be {Math.round(wind / 1.609344)}{' '}
								miles per hour.
							</Trans>
						)}
					</span>
				</div>
				<div className="flex flex-row items-center gap-1">
					<IconCloudRain size={18} className="text-dark-100" aria-hidden />
					<span
						aria-hidden
						className="text-sm text-dark-100"
					>{`${Math.round(rain)}%`}</span>
					<span className="sr-only">
						<Trans>
							There is a {Math.round(rain)}% chance of precipitation.
						</Trans>
					</span>
				</div>
			</div>
		</motion.div>
	)
}

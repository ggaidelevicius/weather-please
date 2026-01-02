import { Trans } from '@lingui/react/macro'
import { IconCloudRain, IconUvIndex, IconWind } from '@tabler/icons-react'
import {
	animate,
	motion,
	useMotionTemplate,
	useMotionValue,
} from 'framer-motion'
import Image from 'next/image'
import { useEffect } from 'react'
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
} from '../images'
import { getSeasonalEventForDate } from '../hooks/seasonal-events'
import type { StaticImageData } from 'next/image'
import type { ReactElement } from 'react'
import type { Hemisphere, SeasonalEventId } from '../hooks/seasonal-events'

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

const getSeasonalEmoji = (eventId: SeasonalEventId) => {
	if (eventId === 'new-years-day') {
		return '🎆'
	}

	if (eventId === 'lunar-new-year') {
		return '🧧'
	}

	if (eventId === 'spring-equinox') {
		return '🌸'
	}

	if (eventId === 'autumn-equinox') {
		return '🍂'
	}

	if (eventId === 'diwali') {
		return '🪔'
	}

	if (eventId === 'holi') {
		return '🎨'
	}

	if (eventId === 'summer-solstice') {
		return '🌞'
	}

	if (eventId === 'winter-solstice') {
		return '❄️'
	}

	if (eventId === 'halloween') {
		return '🎃'
	}

	if (eventId === 'earth-day') {
		return '🌍'
	}

	if (eventId === 'perseids') {
		return '☄️'
	}

	if (eventId === 'geminids') {
		return '🌠'
	}

	if (eventId === 'eid-al-fitr') {
		return '🌙'
	}

	if (eventId === 'eid-al-adha') {
		return '🕋'
	}

	if (eventId === 'hanukkah') {
		return '🕎'
	}

	if (eventId === 'christmas-day') {
		return '🎄'
	}

	return '❤'
}

const renderSeasonalLabel = (eventId: SeasonalEventId) => {
	if (eventId === 'new-years-day') {
		return <Trans>New Year&apos;s Day</Trans>
	}

	if (eventId === 'lunar-new-year') {
		return <Trans>Lunar New Year</Trans>
	}

	if (eventId === 'spring-equinox') {
		return <Trans>Spring Equinox</Trans>
	}

	if (eventId === 'autumn-equinox') {
		return <Trans>Autumn Equinox</Trans>
	}

	if (eventId === 'diwali') {
		return <Trans>Diwali</Trans>
	}

	if (eventId === 'holi') {
		return <Trans>Holi</Trans>
	}

	if (eventId === 'summer-solstice') {
		return <Trans>Summer Solstice</Trans>
	}

	if (eventId === 'winter-solstice') {
		return <Trans>Winter Solstice</Trans>
	}

	if (eventId === 'halloween') {
		return <Trans>Halloween</Trans>
	}

	if (eventId === 'earth-day') {
		return <Trans>Earth Day</Trans>
	}

	if (eventId === 'perseids') {
		return <Trans>Perseids Meteor Shower</Trans>
	}

	if (eventId === 'geminids') {
		return <Trans>Geminids Meteor Shower</Trans>
	}

	if (eventId === 'eid-al-fitr') {
		return <Trans>Eid al-Fitr</Trans>
	}

	if (eventId === 'eid-al-adha') {
		return <Trans>Eid al-Adha</Trans>
	}

	if (eventId === 'hanukkah') {
		return <Trans>Hanukkah</Trans>
	}

	if (eventId === 'christmas-day') {
		return <Trans>Christmas Day</Trans>
	}

	return <Trans>Valentine&apos;s Day</Trans>
}

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
	showSeasonalEvents: boolean
	showSeasonalTileGlow: boolean
	enabledSeasonalEvents?: Set<SeasonalEventId>
	hemisphere: Hemisphere
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
	showSeasonalEvents,
	showSeasonalTileGlow,
	enabledSeasonalEvents,
	hemisphere,
}: Readonly<TileProps>) => {
	const tileDate = new Date(day * 1000)
	const dayDescriptor = days[tileDate.getDay()]
	const dateDescriptor = (
		<>
			{tileDate.getDate()} {months[tileDate.getMonth()]}
		</>
	)

	const displayedIdentifier =
		identifier === 'day' ? dayDescriptor : dateDescriptor

	const hiddenIdentifier = identifier === 'day' ? dateDescriptor : dayDescriptor

	const seasonalEvent = showSeasonalEvents
		? getSeasonalEventForDate({
				date: tileDate,
				enabledEvents: enabledSeasonalEvents,
				hemisphere,
			})
		: null
	const seasonalAccent =
		showSeasonalTileGlow && seasonalEvent
			? (seasonalEvent.tileAccent ?? null)
			: null
	const seasonalBadgeId = seasonalEvent ? seasonalEvent.id : null
	const borderAngle = useMotionValue(0)
	const borderStops = seasonalAccent?.colors.join(', ') ?? 'transparent'
	const borderGradient = useMotionTemplate`conic-gradient(from ${borderAngle}deg, ${borderStops})`

	useEffect(() => {
		if (!seasonalAccent) return
		const controls = animate(borderAngle, 360, {
			duration: 12,
			ease: 'linear',
			repeat: Infinity,
		})

		return () => {
			controls.stop()
		}
	}, [borderAngle, seasonalAccent])

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
			className="group relative will-change-[transform,opacity]"
		>
			{seasonalAccent && (
				<>
					<motion.div
						aria-hidden="true"
						className="pointer-events-none absolute -inset-1.5 rounded-3xl opacity-60 blur-sm saturate-200 transition duration-300 group-hover:opacity-70"
						style={{ background: borderGradient }}
					/>
					<motion.div
						aria-hidden="true"
						className="pointer-events-none absolute -inset-0.5 rounded-2xl"
						style={{ background: borderGradient }}
					/>
				</>
			)}
			<div className="relative z-10 flex flex-col rounded-2xl border border-white/3 bg-[#24252b] p-5.5 shadow-md select-none">
				{seasonalBadgeId && (
					<div className="absolute top-3 right-3">
						<div className="group/seasonal relative">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-dark-800/80 text-sm text-white/90 shadow-sm ring-1 ring-white/10 backdrop-blur-sm">
								<span aria-hidden="true">
									{getSeasonalEmoji(seasonalBadgeId)}
								</span>
								<span className="sr-only">
									{renderSeasonalLabel(seasonalBadgeId)}
								</span>
							</span>
							<span
								aria-hidden="true"
								className="pointer-events-none absolute right-0 bottom-full mb-2 rounded-full border border-white/10 bg-dark-900/95 px-2 py-1 text-xs whitespace-nowrap text-dark-100 opacity-0 shadow-md transition duration-200 group-hover/seasonal:opacity-100"
							>
								{renderSeasonalLabel(seasonalBadgeId)}
							</span>
						</div>
					</div>
				)}
				<span className="origin-left scale-100 text-2xl font-bold text-white opacity-100 transition-[scale,opacity] delay-150 duration-300 will-change-[opacity,scale] group-hover:scale-95 group-hover:opacity-0">
					{displayedIdentifier}
				</span>
				<span className="absolute origin-left scale-95 text-2xl font-bold text-white opacity-0 transition-[scale,opacity] duration-300 will-change-[opacity,scale] group-hover:scale-100 group-hover:opacity-100 group-hover:delay-300">
					{hiddenIdentifier}
				</span>
				<div className="mt-3 flex items-center justify-between gap-4">
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
							{descriptionMap[description as keyof typeof descriptionMap] ?? (
								<Trans>unknown conditions</Trans>
							)}
						</span>
						<span className="sr-only">
							<Trans>
								The expected type of weather is{' '}
								{descriptionMap[description as keyof typeof descriptionMap] ?? (
									<Trans>unknown conditions</Trans>
								)}
								.
							</Trans>
						</span>
					</div>
					<Image
						quality={100}
						priority
						src={iconMap[description as keyof typeof iconMap] ?? FewClouds}
						alt=""
						width={56}
						height={56}
						className="h-14 w-14"
					/>
				</div>
				<div className="mt-4.5 flex flex-row justify-between gap-3">
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
									The maximum wind speed will be {Math.round(wind)} kilometers
									per hour.
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
			</div>
		</motion.div>
	)
}

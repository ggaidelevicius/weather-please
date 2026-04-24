import type { StaticImageData } from 'next/image'
import type { ReactElement } from 'react'

import { Switch as HeadlessSwitch } from '@headlessui/react'
import { Trans } from '@lingui/react/macro'
import { IconCloudRain, IconUvIndex, IconWind } from '@tabler/icons-react'
import {
	animate,
	motion,
	useMotionTemplate,
	useMotionValue,
} from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import type {
	SeasonalEvent,
	SeasonalEventOverride,
} from '../../seasonal-events/core/types'

import { SeasonalEventModal } from '../../../shared/ui/seasonal-event-modal'
import { Hemisphere, SeasonalEventId } from '../../seasonal-events/core/types'
import { TileIdentifier } from '../../settings/model/tile-identifier'
import { TemperatureUnit, UnitSystem } from '../../settings/model/unit-system'
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
} from '../images/weather-icons'

type SeasonalEventsModule =
	typeof import('../../seasonal-events/core/seasonal-events-module')

let seasonalEventsModulePromise: null | Promise<SeasonalEventsModule> = null

const loadSeasonalEventsModule = () => {
	if (!seasonalEventsModulePromise) {
		seasonalEventsModulePromise =
			import('../../seasonal-events/core/seasonal-events-module')
	}

	return seasonalEventsModulePromise
}

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

const SEASONAL_EMOJI_BY_EVENT: Record<SeasonalEventId, string> = {
	[SeasonalEventId.AutumnEquinox]: '🍂',
	[SeasonalEventId.ChristmasDay]: '🎄',
	[SeasonalEventId.DayOfTheDead]: '💀',
	[SeasonalEventId.Diwali]: '🪔',
	[SeasonalEventId.EarthDay]: '🌍',
	[SeasonalEventId.Easter]: '🐣',
	[SeasonalEventId.EidAlAdha]: '🕋',
	[SeasonalEventId.EidAlFitr]: '🌙',
	[SeasonalEventId.EtaAquariids]: '💧',
	[SeasonalEventId.EventHorizonDay]: '🕳️',
	[SeasonalEventId.Geminids]: '🌠',
	[SeasonalEventId.Halloween]: '🎃',
	[SeasonalEventId.Hanukkah]: '🕎',
	[SeasonalEventId.Holi]: '🎨',
	[SeasonalEventId.Leonids]: '🦁',
	[SeasonalEventId.LunarNewYear]: '🧧',
	[SeasonalEventId.Lyrids]: '✨',
	[SeasonalEventId.NewYearsDay]: '🎆',
	[SeasonalEventId.Orionids]: '🔥',
	[SeasonalEventId.Perseids]: '☄️',
	[SeasonalEventId.Quadrantids]: '💫',
	[SeasonalEventId.SpringEquinox]: '🌸',
	[SeasonalEventId.SummerSolstice]: '🌞',
	[SeasonalEventId.TotalLunarEclipse]: '🌕',
	[SeasonalEventId.TotalSolarEclipse]: '🌑',
	[SeasonalEventId.ValentinesDay]: '❤',
	[SeasonalEventId.WinterSolstice]: '❄️',
}

const SEASONAL_LABEL_BY_EVENT: Record<SeasonalEventId, ReactElement> = {
	[SeasonalEventId.AutumnEquinox]: <Trans>Autumn Equinox</Trans>,
	[SeasonalEventId.ChristmasDay]: <Trans>Christmas Day</Trans>,
	[SeasonalEventId.DayOfTheDead]: <Trans>Day of the Dead</Trans>,
	[SeasonalEventId.Diwali]: <Trans>Diwali</Trans>,
	[SeasonalEventId.EarthDay]: <Trans>Earth Day</Trans>,
	[SeasonalEventId.Easter]: <Trans>Easter</Trans>,
	[SeasonalEventId.EidAlAdha]: <Trans>Eid al-Adha</Trans>,
	[SeasonalEventId.EidAlFitr]: <Trans>Eid al-Fitr</Trans>,
	[SeasonalEventId.EtaAquariids]: <Trans>Eta Aquariids Meteor Shower</Trans>,
	[SeasonalEventId.EventHorizonDay]: <Trans>Event Horizon Day</Trans>,
	[SeasonalEventId.Geminids]: <Trans>Geminids Meteor Shower</Trans>,
	[SeasonalEventId.Halloween]: <Trans>Halloween</Trans>,
	[SeasonalEventId.Hanukkah]: <Trans>Hanukkah</Trans>,
	[SeasonalEventId.Holi]: <Trans>Holi</Trans>,
	[SeasonalEventId.Leonids]: <Trans>Leonids Meteor Shower</Trans>,
	[SeasonalEventId.LunarNewYear]: <Trans>Lunar New Year</Trans>,
	[SeasonalEventId.Lyrids]: <Trans>Lyrids Meteor Shower</Trans>,
	[SeasonalEventId.NewYearsDay]: <Trans>New Year&apos;s Day</Trans>,
	[SeasonalEventId.Orionids]: <Trans>Orionids Meteor Shower</Trans>,
	[SeasonalEventId.Perseids]: <Trans>Perseids Meteor Shower</Trans>,
	[SeasonalEventId.Quadrantids]: <Trans>Quadrantids Meteor Shower</Trans>,
	[SeasonalEventId.SpringEquinox]: <Trans>Spring Equinox</Trans>,
	[SeasonalEventId.SummerSolstice]: <Trans>Summer Solstice</Trans>,
	[SeasonalEventId.TotalLunarEclipse]: <Trans>Total Lunar Eclipse</Trans>,
	[SeasonalEventId.TotalSolarEclipse]: <Trans>Total Solar Eclipse</Trans>,
	[SeasonalEventId.ValentinesDay]: <Trans>Valentine&apos;s Day</Trans>,
	[SeasonalEventId.WinterSolstice]: <Trans>Winter Solstice</Trans>,
}

const getSeasonalEmoji = (eventId: SeasonalEventId) =>
	SEASONAL_EMOJI_BY_EVENT[eventId]

const renderSeasonalLabel = (eventId: SeasonalEventId) =>
	SEASONAL_LABEL_BY_EVENT[eventId]

const DefaultSeasonalEventDetails = () => (
	<p>Details for this event are coming soon.</p>
)

interface HeaderSwitchProps {
	isEnabled: boolean
	label: ReactElement
	onToggle: (enabled: boolean) => void
}

interface TileProps {
	day: number
	delayBaseline: number
	description: number
	enabledSeasonalEvents?: Set<SeasonalEventId>
	hemisphere: Hemisphere
	identifier: TileIdentifier
	index: number
	isSeasonalEventEnabled: (eventId: SeasonalEventId) => boolean
	max: number
	min: number
	onToggleSeasonalEvent: (eventId: SeasonalEventId, enabled: boolean) => void
	rain: number
	seasonalEventOverride?: SeasonalEventOverride
	showSeasonalEvents: boolean
	showSeasonalTileGlow: boolean
	temperatureUnit: TemperatureUnit
	unitSystem: UnitSystem
	uv: number
	wind: number
}

const HeaderSwitch = ({
	isEnabled,
	label,
	onToggle,
}: Readonly<HeaderSwitchProps>) => (
	<div className="flex items-center gap-1.5">
		<span className="text-xs font-medium whitespace-nowrap text-dark-300">
			{label}
		</span>
		<HeadlessSwitch
			checked={isEnabled}
			className="group inline-flex h-5 w-9 items-center rounded-full bg-dark-500/80 transition-[background-color] select-none focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 data-checked:bg-blue-600/85"
			onChange={onToggle}
		>
			<span className="size-3 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-5" />
		</HeadlessSwitch>
	</div>
)

export const Tile = ({
	day,
	delayBaseline,
	description,
	enabledSeasonalEvents,
	hemisphere,
	identifier,
	index,
	isSeasonalEventEnabled,
	max,
	min,
	onToggleSeasonalEvent,
	rain,
	seasonalEventOverride,
	showSeasonalEvents,
	showSeasonalTileGlow,
	temperatureUnit,
	unitSystem,
	uv,
	wind,
}: Readonly<TileProps>) => {
	const usesMetricTemperature = temperatureUnit === TemperatureUnit.Celsius
	const usesMetricUnits = unitSystem === UnitSystem.Metric
	const tileDate = new Date(day * 1000)
	const dayDescriptor = days[tileDate.getDay()]
	const dateDescriptor = (
		<>
			{tileDate.getDate()} {months[tileDate.getMonth()]}
		</>
	)

	const displayedIdentifier =
		identifier === TileIdentifier.Day ? dayDescriptor : dateDescriptor

	const hiddenIdentifier =
		identifier === TileIdentifier.Day ? dateDescriptor : dayDescriptor

	const [seasonalEvent, setSeasonalEvent] = useState<null | SeasonalEvent>(null)

	useEffect(() => {
		if (!showSeasonalEvents) {
			setSeasonalEvent(null)
			return
		}

		let hasCanceled = false

		const resolveSeasonalEvent = async () => {
			try {
				const seasonalEvents = await loadSeasonalEventsModule()
				if (hasCanceled) {
					return
				}
				const nextSeasonalEvent = seasonalEvents.getSeasonalEventForDate({
					date: new Date(day * 1000),
					enabledEvents: enabledSeasonalEvents,
					hemisphere,
					seasonalEventOverride,
				})
				setSeasonalEvent(nextSeasonalEvent)
			} catch (error) {
				console.error('Failed to resolve seasonal event details', error)
				setSeasonalEvent(null)
			}
		}

		void resolveSeasonalEvent()

		return () => {
			hasCanceled = true
		}
	}, [
		day,
		enabledSeasonalEvents,
		hemisphere,
		seasonalEventOverride,
		showSeasonalEvents,
	])

	const seasonalAccent =
		showSeasonalTileGlow && seasonalEvent
			? (seasonalEvent.tileAccent ?? null)
			: null
	const seasonalBadgeId = seasonalEvent ? seasonalEvent.id : null
	const isCurrentSeasonalEventEnabled = seasonalBadgeId
		? isSeasonalEventEnabled(seasonalBadgeId)
		: false
	const EventDetails = seasonalEvent?.details ?? DefaultSeasonalEventDetails
	const [isEventOpen, setIsEventOpen] = useState(false)
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

	useEffect(() => {
		if (!seasonalBadgeId && isEventOpen) {
			setIsEventOpen(false)
		}
	}, [isEventOpen, seasonalBadgeId])

	return (
		<motion.div
			animate={{
				opacity: 1,
				scale: 1,
				transition: {
					delay: index * 0.1 + delayBaseline,
					duration: 2,
					type: 'spring',
				},
			}}
			className="group relative will-change-[transform,opacity]"
			exit={{ opacity: 0, scale: 0.95 }}
			initial={{ opacity: 0, scale: 0.95 }}
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
							<button
								aria-expanded={isEventOpen}
								aria-haspopup="dialog"
								className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-dark-800/80 text-sm text-white/90 shadow-sm ring-1 ring-white/10 backdrop-blur-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
								onClick={() => setIsEventOpen(true)}
								type="button"
							>
								<span aria-hidden="true">
									{getSeasonalEmoji(seasonalBadgeId)}
								</span>
								<span className="sr-only">
									{renderSeasonalLabel(seasonalBadgeId)}
								</span>
							</button>
							<span
								aria-hidden="true"
								className="pointer-events-none absolute right-0 bottom-full mb-2 rounded-full border border-white/10 bg-dark-900/95 px-2 py-1 text-xs whitespace-nowrap text-dark-100 opacity-0 shadow-md transition duration-200 group-hover/seasonal:opacity-100 group-focus-visible/seasonal:opacity-100"
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
							<span aria-hidden className="text-3xl text-dark-100">
								{usesMetricTemperature
									? Math.round(max)
									: Math.round((max * 9) / 5 + 32)}
							</span>
							<span className="sr-only">
								{usesMetricTemperature && (
									<Trans>
										The maximum temperature will be {Math.round(max)} degrees
										celsius.
									</Trans>
								)}
								{!usesMetricTemperature && (
									<Trans>
										The maximum temperature will be{' '}
										{Math.round((max * 9) / 5 + 32)} degrees fahrenheit.
									</Trans>
								)}
							</span>
							<span aria-hidden className="text-lg text-dark-300">
								{usesMetricTemperature
									? Math.round(min)
									: Math.round((min * 9) / 5 + 32)}
							</span>
							<span className="sr-only">
								{usesMetricTemperature && (
									<Trans>
										The minimum temperature will be {Math.round(min)} degrees
										celsius.
									</Trans>
								)}
								{!usesMetricTemperature && (
									<Trans>
										The minimum temperature will be{' '}
										{Math.round((min * 9) / 5 + 32)} degrees fahrenheit.
									</Trans>
								)}
							</span>
						</div>
						<span aria-hidden className="text-dark-100">
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
						alt=""
						className="h-14 w-14"
						height={56}
						priority
						quality={100}
						src={iconMap[description as keyof typeof iconMap] ?? FewClouds}
						width={56}
					/>
				</div>
				<div className="mt-4.5 flex flex-row justify-between gap-3">
					<div className="flex flex-row items-center gap-1">
						<IconUvIndex aria-hidden className="text-dark-100" size={18} />
						<span aria-hidden className="text-sm text-dark-100">
							{Math.round(uv)}
						</span>
						<span className="sr-only">
							<Trans>The maximum UV index will be {Math.round(uv)}.</Trans>
						</span>
					</div>
					<div className="flex flex-row items-center gap-1">
						<IconWind aria-hidden className="text-dark-100" size={18} />
						<span aria-hidden className="text-sm text-dark-100">
							{usesMetricUnits && <Trans>{Math.round(wind)} km/h</Trans>}
							{!usesMetricUnits && (
								<Trans>{Math.round(wind / 1.609344)} mph</Trans>
							)}
						</span>
						<span className="sr-only">
							{usesMetricUnits && (
								<Trans>
									The maximum wind speed will be {Math.round(wind)} kilometers
									per hour.
								</Trans>
							)}
							{!usesMetricUnits && (
								<Trans>
									The maximum wind speed will be {Math.round(wind / 1.609344)}{' '}
									miles per hour.
								</Trans>
							)}
						</span>
					</div>
					<div className="flex flex-row items-center gap-1">
						<IconCloudRain aria-hidden className="text-dark-100" size={18} />
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
			{seasonalBadgeId && (
				<SeasonalEventModal
					isOpen={isEventOpen}
					onClose={() => setIsEventOpen(false)}
					quickHeaderActions={
						<div className="flex flex-wrap justify-end gap-1.5">
							<HeaderSwitch
								isEnabled={isCurrentSeasonalEventEnabled}
								label={<Trans>Show this event</Trans>}
								onToggle={(enabled) =>
									onToggleSeasonalEvent(seasonalBadgeId, enabled)
								}
							/>
						</div>
					}
					title={renderSeasonalLabel(seasonalBadgeId)}
				>
					<EventDetails />
				</SeasonalEventModal>
			)}
		</motion.div>
	)
}

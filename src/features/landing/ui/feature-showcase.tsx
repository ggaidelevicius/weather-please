import type { ReactNode } from 'react'

import {
	IconCalendarEvent,
	IconCloudRain,
	IconLock,
	IconSparkles,
} from '@tabler/icons-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { createSpoofedCalendarData } from '../../integrations/model/spoofed-calendar'
import { UpcomingEvents } from '../../integrations/ui/upcoming-events'
import { Hemisphere } from '../../seasonal-events/core/types'
import { TileIdentifier } from '../../settings/model/tile-identifier'
import { TemperatureUnit, UnitSystem } from '../../settings/model/unit-system'
import { Tile } from '../../weather/ui/tile'

type SceneId = 'calendar' | 'forecast' | 'privacy' | 'seasonal'

export const FeatureShowcase = () => (
	<div className="py-4 sm:py-8">
		{SCENES.map((scene) => (
			<ShowcaseScene key={scene.id} scene={scene} />
		))}
	</div>
)

type Scene = {
	description: string
	eyebrow: string
	icon: typeof IconLock
	id: SceneId
	title: string
	visual: ReactNode
}

const ShowcaseScene = ({
	scene,
}: Readonly<{
	scene: Scene
}>) => {
	const shouldReduceMotion = useReducedMotion()

	return (
		<motion.section
			className="mx-auto grid max-w-7xl items-center gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14 lg:px-8 lg:py-16"
			initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
			transition={{ duration: 0.6, ease: 'easeOut' }}
			viewport={{ amount: 0.25, once: true }}
			whileInView={{ opacity: 1, y: 0 }}
		>
			<div className="relative z-10">
				<h3 className="text-2xl font-medium tracking-tight text-pretty text-white sm:text-3xl">
					{scene.title}
				</h3>
				<p className="mt-4 max-w-md text-pretty text-dark-100">
					{scene.description}
				</p>
				<div className="mt-10 inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-300">
					<scene.icon className="shrink-0" size={14} />
					{scene.eyebrow}
				</div>
			</div>
			<div className="flex min-h-0 items-center justify-center overflow-hidden">
				{scene.visual}
			</div>
		</motion.section>
	)
}

type LandingWeatherTileData = {
	day: number
	description: number
	max: number
	min: number
	rain: number
	uv: number
	wind: number
}

const FORECAST_TILES = [
	{
		day: getUnixTimestamp({ day: 19, monthIndex: 5, year: 2026 }),
		description: 2,
		max: 17,
		min: 9,
		rain: 18,
		uv: 2,
		wind: 12,
	},
	{
		day: getUnixTimestamp({ day: 20, monthIndex: 5, year: 2026 }),
		description: 61,
		max: 15,
		min: 8,
		rain: 52,
		uv: 1,
		wind: 18,
	},
] as const

const WINTER_SOLSTICE_TILE = {
	day: getUnixTimestamp({ day: 21, monthIndex: 5, year: 2026 }),
	description: 2,
	max: 11,
	min: 4,
	rain: 12,
	uv: 1,
	wind: 9,
} as const satisfies LandingWeatherTileData

const ForecastVisual = () => (
	<div className="w-full py-6 sm:py-10">
		<div className="flex items-start justify-center gap-4">
			<LandingWeatherTile index={0} tile={FORECAST_TILES[0]} />
			<div className="hidden translate-y-6 sm:block">
				<LandingWeatherTile index={1} tile={FORECAST_TILES[1]} />
			</div>
		</div>
	</div>
)

const LandingWeatherTile = ({
	index,
	tile,
}: Readonly<{
	index: number
	tile: LandingWeatherTileData
}>) => (
	<div className="relative w-64 shrink-0">
		<Tile
			{...tile}
			delayBaseline={0}
			hemisphere={Hemisphere.Southern}
			identifier={TileIdentifier.Day}
			index={index}
			isSeasonalEventEnabled={isSeasonalEventDisabled}
			onToggleSeasonalEvent={ignoreSeasonalEventToggle}
			showSeasonalEvents={false}
			showSeasonalTileGlow={false}
			temperatureUnit={TemperatureUnit.Celsius}
			unitSystem={UnitSystem.Metric}
		/>
	</div>
)

const isSeasonalEventDisabled = () => false
const ignoreSeasonalEventToggle = () => undefined

// Mirrors every seasonal event the app ships, in the same order as the
// seasonal-events module.
const SEASONAL_EVENT_BADGES = [
	{ emoji: '🎆', label: "New Year's Day" },
	{ emoji: '❤', label: "Valentine's Day" },
	{ emoji: '🧧', label: 'Lunar New Year' },
	{ emoji: '🐣', label: 'Easter' },
	{ emoji: '🌸', label: 'Spring Equinox' },
	{ emoji: '🍂', label: 'Autumn Equinox' },
	{ emoji: '🪔', label: 'Diwali' },
	{ emoji: '🌙', label: 'Eid al-Fitr' },
	{ emoji: '🕋', label: 'Eid al-Adha' },
	{ emoji: '🕎', label: 'Hanukkah' },
	{ emoji: '🎄', label: 'Christmas Day' },
	{ emoji: '🎨', label: 'Holi' },
	{ emoji: '🌞', label: 'Summer Solstice' },
	{ emoji: '❄️', label: 'Winter Solstice' },
	{ emoji: '🌍', label: 'Earth Day' },
	{ emoji: '🎃', label: 'Halloween' },
	{ emoji: '💀', label: 'Day of the Dead' },
	{ emoji: '✨', label: 'Lyrids Meteor Shower' },
	{ emoji: '💧', label: 'Eta Aquariids Meteor Shower' },
	{ emoji: '🔥', label: 'Orionids Meteor Shower' },
	{ emoji: '🦁', label: 'Leonids Meteor Shower' },
	{ emoji: '🌑', label: 'Total Solar Eclipse' },
	{ emoji: '🌕', label: 'Total Lunar Eclipse' },
	{ emoji: '☄️', label: 'Perseids Meteor Shower' },
	{ emoji: '💫', label: 'Quadrantids Meteor Shower' },
	{ emoji: '🌠', label: 'Geminids Meteor Shower' },
	{ emoji: '🕳️', label: 'Event Horizon Day' },
] as const

const SEASONAL_BACKGROUNDS = [
	{
		background:
			'radial-gradient(120% 80% at 15% 0%, rgba(59, 130, 246, 0.22), rgba(14, 116, 144, 0.1) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(129, 140, 248, 0.18), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(52, 211, 153, 0.13), rgba(15, 23, 42, 0) 70%)',
		glowColors: ['#e2e8f0', '#c7d2fe', '#bae6fd', '#e0f2fe', '#e2e8f0'],
		id: 'winter-solstice',
		particles: {
			animationName: 'landing-winter-drift',
			background: 'rgba(224, 242, 254, 0.9)',
			borderRadius: '9999px',
			boxShadow: '0 0 7px rgba(125, 211, 252, 0.55)',
			durationScale: 1,
			heightScale: 1,
			widthScale: 1,
		},
	},
	{
		background:
			'radial-gradient(120% 90% at 50% 100%, rgba(187, 247, 208, 0.3), rgba(52, 211, 153, 0.14) 40%, rgba(15, 23, 42, 0) 75%), radial-gradient(90% 80% at 20% 90%, rgba(251, 207, 232, 0.26), rgba(15, 23, 42, 0) 70%)',
		glowColors: ['#f7c9df', '#f3a6c8', '#b7e4c7', '#95d5b2', '#f7c9df'],
		id: 'spring-equinox',
		particles: {
			animationName: 'landing-spring-flutter',
			background: 'rgba(251, 207, 232, 0.88)',
			borderRadius: '70% 30% 65% 35%',
			boxShadow: '0 0 6px rgba(244, 114, 182, 0.35)',
			durationScale: 0.9,
			heightScale: 0.8,
			widthScale: 1.7,
		},
	},
	{
		background:
			'radial-gradient(circle at 18% 18%, rgba(251, 191, 36, 0.24), rgba(251, 191, 36, 0.06) 35%, rgba(251, 191, 36, 0) 70%), radial-gradient(circle at 85% 90%, rgba(253, 186, 116, 0.18), rgba(253, 186, 116, 0) 65%)',
		glowColors: ['#fef3c7', '#fde68a', '#fdba74', '#f59e0b', '#fef3c7'],
		id: 'summer-solstice',
		particles: {
			animationName: 'landing-summer-mote',
			background: 'rgba(254, 240, 138, 0.82)',
			borderRadius: '9999px',
			boxShadow: '0 0 9px rgba(250, 204, 21, 0.5)',
			durationScale: 1.1,
			heightScale: 1.2,
			widthScale: 1.2,
		},
	},
	{
		background:
			'radial-gradient(120% 90% at 18% 70%, rgba(251, 191, 36, 0.28), rgba(249, 115, 22, 0.14) 50%, rgba(15, 23, 42, 0) 80%), radial-gradient(85% 70% at 85% 25%, rgba(244, 114, 182, 0.18), rgba(15, 23, 42, 0) 70%)',
		glowColors: ['#fde68a', '#f59e0b', '#fb7185', '#f97316', '#fde68a'],
		id: 'diwali',
		particles: {
			animationName: 'landing-diwali-spark',
			background: 'rgba(253, 224, 71, 0.95)',
			borderRadius: '1px',
			boxShadow: '0 0 8px rgba(249, 115, 22, 0.75)',
			durationScale: 0.7,
			heightScale: 1.7,
			widthScale: 0.7,
		},
	},
] as const

const SEASONAL_BACKGROUND_INTERVAL_MS = 12_000
const SEASONAL_BACKGROUND_TRANSITION_MS = 3_500

const SeasonalVisual = () => {
	const shouldReduceMotion = useReducedMotion()
	const [activeBackgroundIndex, setActiveBackgroundIndex] = useState(0)
	const displayedBackgroundIndex = shouldReduceMotion
		? 0
		: activeBackgroundIndex

	useEffect(() => {
		if (shouldReduceMotion) return

		const intervalId = window.setInterval(() => {
			setActiveBackgroundIndex(
				(currentIndex) => (currentIndex + 1) % SEASONAL_BACKGROUNDS.length,
			)
		}, SEASONAL_BACKGROUND_INTERVAL_MS)

		return () => window.clearInterval(intervalId)
	}, [shouldReduceMotion])

	return (
		<div className="relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10">
			{SEASONAL_BACKGROUNDS.map((seasonalBackground, index) => (
				<div
					aria-hidden
					className="absolute inset-0 transition-opacity ease-in-out will-change-[opacity]"
					data-seasonal-background={seasonalBackground.id}
					key={seasonalBackground.id}
					style={{
						background: seasonalBackground.background,
						opacity: index === displayedBackgroundIndex ? 1 : 0,
						transitionDuration: `${SEASONAL_BACKGROUND_TRANSITION_MS}ms`,
					}}
				>
					{!shouldReduceMotion
						? SOLSTICE_PARTICLES.map((particle) => (
								<span
									className="absolute opacity-0"
									key={particle.id}
									style={{
										animation: `${seasonalBackground.particles.animationName} ${particle.durationSeconds * seasonalBackground.particles.durationScale}s ease-in-out ${particle.delaySeconds}s infinite`,
										background: seasonalBackground.particles.background,
										borderRadius: seasonalBackground.particles.borderRadius,
										boxShadow: seasonalBackground.particles.boxShadow,
										height:
											particle.sizePixels *
											seasonalBackground.particles.heightScale,
										left: `${(particle.leftPercent + index * 19) % 100}%`,
										top: `${(particle.topPercent + index * 13) % 88}%`,
										width:
											particle.sizePixels *
											seasonalBackground.particles.widthScale,
									}}
								/>
							))
						: null}
				</div>
			))}
			<div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
				<div className="relative w-64 shrink-0">
					{SEASONAL_BACKGROUNDS.map((seasonalBackground, index) => (
						<div
							aria-hidden
							className="pointer-events-none absolute inset-0 transition-opacity ease-in-out will-change-[opacity]"
							data-seasonal-tile-glow={seasonalBackground.id}
							key={seasonalBackground.id}
							style={{
								opacity: index === displayedBackgroundIndex ? 1 : 0,
								transitionDuration: `${SEASONAL_BACKGROUND_TRANSITION_MS}ms`,
							}}
						>
							{[-1.5, -0.5].map((inset) => (
								<div
									className={
										inset === -1.5
											? 'absolute rounded-3xl opacity-60 blur-sm saturate-200'
											: 'absolute rounded-2xl'
									}
									key={inset}
									style={{
										animation: shouldReduceMotion
											? undefined
											: 'landing-seasonal-border-spin 12s linear infinite',
										background: `conic-gradient(from var(--landing-seasonal-border-angle), ${seasonalBackground.glowColors.join(', ')})`,
										inset,
									}}
								/>
							))}
						</div>
					))}
					<LandingWeatherTile index={0} tile={WINTER_SOLSTICE_TILE} />
				</div>
				<div
					aria-hidden
					className="h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]"
				>
					<div
						className={
							shouldReduceMotion
								? undefined
								: 'animate-landing-seasonal-marquee'
						}
					>
						{(shouldReduceMotion ? [0] : [0, 1]).map((copyIndex) => (
							<ul className="flex flex-col gap-2.5 pb-2.5" key={copyIndex}>
								{SEASONAL_EVENT_BADGES.map((badge) => (
									<li
										className="flex items-center gap-2 rounded-full border border-white/10 bg-dark-900/80 px-3 py-1.5 text-xs text-dark-100 shadow-md"
										key={badge.label}
									>
										<span>{badge.emoji}</span>
										{badge.label}
									</li>
								))}
							</ul>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

const CalendarVisual = () => {
	const [spoofedCalendarData] = useState(createSpoofedCalendarData)

	return (
		<div
			aria-hidden
			className="pointer-events-none max-h-[40vh] overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent)] lg:max-h-[26rem]"
		>
			<UpcomingEvents
				accounts={spoofedCalendarData.accounts}
				events={spoofedCalendarData.events}
				locale="en"
			/>
		</div>
	)
}

const PRIVACY_PROVIDERS = [
	{ detail: 'Weather', name: 'Open-Meteo' },
	{ detail: 'Calendar', name: 'Google' },
	{ detail: 'Outlook', name: 'Microsoft' },
] as const

// Endpoints line up with the vertical centers of the three provider nodes.
const PRIVACY_LINK_PATHS = [
	'M 0 88 C 40 88, 40 24, 80 24',
	'M 0 88 L 80 88',
	'M 0 88 C 40 88, 40 152, 80 152',
] as const

const PRIVACY_BEAM_CYCLE_SECONDS = 5.4

// Each path is normalised to length 100 with a "25 125" dash pattern. The
// streak parks past the provider end at offset -105 and before the browser
// end at 30 (5 units of clearance so the round line cap never peeks onto the
// path), and slides provider-to-browser during its slot of the shared
// timeline, so exactly one beam travels at a time.
const getPrivacyBeamTiming = (index: number) => {
	const total = PRIVACY_LINK_PATHS.length
	const slotStart = Math.max(index / total, 0.001)
	const slotEnd = Math.min((index + 1) / total, 0.999)

	return {
		keyTimes: `0;${slotStart};${slotEnd};1`,
		values: '-105;-105;30;30',
	}
}

const PRIVACY_BEAM_LAYERS = [
	{ opacity: 0.3, width: 4 },
	{ opacity: 0.9, width: 1.75 },
] as const

const PrivacyVisual = () => {
	const shouldReduceMotion = useReducedMotion()

	return (
		<div aria-hidden className="w-full max-w-md">
			<div className="flex items-center justify-center">
				<span className="shrink-0 rounded-xl bg-dark-700 px-3 py-3 text-xs font-medium text-white shadow-md ring-1 ring-white/10 sm:px-4 sm:text-sm">
					Your browser
				</span>
				<svg
					className="h-44 w-14 shrink-0 text-white/15 sm:w-24"
					fill="none"
					preserveAspectRatio="none"
					viewBox="0 0 80 176"
				>
					{PRIVACY_LINK_PATHS.map((path) => (
						<path
							d={path}
							key={path}
							stroke="currentColor"
							strokeWidth="1"
							vectorEffect="non-scaling-stroke"
						/>
					))}
					{!shouldReduceMotion
						? PRIVACY_LINK_PATHS.map((path, index) => {
								const { keyTimes, values } = getPrivacyBeamTiming(index)

								return (
									<g className="text-sky-400" key={path}>
										{PRIVACY_BEAM_LAYERS.map((layer) => (
											<path
												d={path}
												key={layer.width}
												pathLength={100}
												stroke="currentColor"
												strokeDasharray="25 125"
												strokeDashoffset={-105}
												strokeLinecap="round"
												strokeOpacity={layer.opacity}
												strokeWidth={layer.width}
											>
												<animate
													attributeName="stroke-dashoffset"
													calcMode="linear"
													dur={`${PRIVACY_BEAM_CYCLE_SECONDS}s`}
													keyTimes={keyTimes}
													repeatCount="indefinite"
													values={values}
												/>
											</path>
										))}
									</g>
								)
							})
						: null}
				</svg>
				<div className="flex shrink-0 flex-col gap-2.5">
					{PRIVACY_PROVIDERS.map((provider) => (
						<div
							className="rounded-xl bg-dark-700 px-3 py-2 shadow-md ring-1 ring-white/10 sm:px-4"
							key={provider.name}
						>
							<p className="text-xs font-medium text-white sm:text-sm">
								{provider.name}
							</p>
							<p className="text-[10px] text-dark-300 sm:text-xs">
								{provider.detail}
							</p>
						</div>
					))}
				</div>
			</div>
			<p className="mx-auto mt-6 flex max-w-sm items-start justify-center gap-2 text-sm text-pretty text-dark-300">
				<IconLock className="mt-0.5 shrink-0" size={15} />
				Your weather and calendar data arrive straight from each provider —
				nothing passes through our servers.
			</p>
		</div>
	)
}

// Deterministic particle layout so server and client render identically.
const SOLSTICE_PARTICLES = Array.from({ length: 18 }, (_, index) => ({
	delaySeconds: (index % 6) * 1.1,
	durationSeconds: 7 + (index % 5),
	id: index,
	leftPercent: (index * 53) % 97,
	sizePixels: 2 + (index % 3),
	topPercent: 8 + ((index * 37) % 78),
}))

const SCENES = [
	{
		description:
			'A multi-day local forecast with hourly detail views and severe weather alerts, powered by Open-Meteo.',
		eyebrow: 'Temperature, rain, wind, and more.',
		icon: IconCloudRain,
		id: 'forecast',
		title: 'Your local forecast',
		visual: <ForecastVisual />,
	},
	{
		description:
			'Optionally connect Google Calendar or Microsoft Outlook to see your upcoming events beside the forecast.',
		eyebrow: 'Personal, work, and everything in between.',
		icon: IconCalendarEvent,
		id: 'calendar',
		title: 'Your day at a glance',
		visual: <CalendarVisual />,
	},
	{
		description:
			'Your location and calendar data travel directly from your browser to the weather and calendar providers.',
		eyebrow: 'Open source, no accounts, no ads, no tracking.',
		icon: IconLock,
		id: 'privacy',
		title: 'Private by design',
		visual: <PrivacyVisual />,
	},
	{
		description:
			'Subtle seasonal effects for solstices, meteor showers, holidays, and more - all of which can be turned off.',
		eyebrow: 'Backgrounds that mark special occasions.',
		icon: IconSparkles,
		id: 'seasonal',
		title: 'Seasonal touches',
		visual: <SeasonalVisual />,
	},
] as const satisfies ReadonlyArray<Scene>

type UnixTimestampParams = {
	day: number
	monthIndex: number
	year: number
}

function getUnixTimestamp({ day, monthIndex, year }: UnixTimestampParams) {
	return Math.round(Date.UTC(year, monthIndex, day, 12) / 1000)
}

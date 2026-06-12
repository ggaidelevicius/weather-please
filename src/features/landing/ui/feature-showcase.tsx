import type { ReactNode } from 'react'

import { clsx } from 'clsx'
import {
	motion,
	useMotionValueEvent,
	useReducedMotion,
	useScroll,
} from 'framer-motion'
import { useRef, useState } from 'react'

import { createSpoofedCalendarData } from '../../integrations/model/spoofed-calendar'
import { UpcomingEvents } from '../../integrations/ui/upcoming-events'
import { Hemisphere, SeasonalEventId } from '../../seasonal-events/core/types'
import { TileIdentifier } from '../../settings/model/tile-identifier'
import { TemperatureUnit, UnitSystem } from '../../settings/model/unit-system'
import { Tile } from '../../weather/ui/tile'

// One viewport of scroll distance per scene; the stage stays pinned while
// scroll progress drives the scene cross-fades. Native scrolling only — no
// snapping or scroll hijacking.
export const FeatureShowcase = () => {
	const sectionRef = useRef<HTMLDivElement>(null)
	const [progress, setProgress] = useState(0)
	const { scrollYProgress } = useScroll({
		offset: ['start start', 'end end'],
		target: sectionRef,
	})

	useMotionValueEvent(scrollYProgress, 'change', setProgress)

	return (
		<div
			className="relative"
			ref={sectionRef}
			style={{ height: `${SCENES.length * 100}vh` }}
		>
			<div className="sticky top-0 flex h-screen items-center overflow-hidden py-8">
				<div className="relative mx-auto h-full max-h-[44rem] w-full max-w-7xl px-4 sm:px-6 lg:px-8">
					{SCENES.map((scene, index) => (
						<ShowcaseScene
							index={index}
							key={scene.id}
							progress={progress}
							scene={scene}
							total={SCENES.length}
						/>
					))}
				</div>
				<div className="absolute inset-y-0 right-6 z-20 hidden flex-col items-center justify-center gap-2.5 lg:flex">
					{SCENES.map((scene, index) => (
						<SceneIndicatorDot
							index={index}
							key={scene.id}
							progress={progress}
							total={SCENES.length}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

type Scene = {
	description: string
	eyebrow: string
	id: string
	title: string
	visual: ReactNode
}

const ShowcaseScene = ({
	index,
	progress,
	scene,
	total,
}: Readonly<{
	index: number
	progress: number
	scene: Scene
	total: number
}>) => {
	const visibility = getSceneVisibility({ index, progress, total })

	return (
		<motion.div
			aria-hidden={!visibility.isInteractive}
			className="absolute inset-0 grid grid-rows-[auto_1fr] items-center gap-7 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:grid-rows-1 lg:gap-14 lg:px-8"
			inert={!visibility.isInteractive}
			style={{
				opacity: visibility.opacity,
				pointerEvents: visibility.isInteractive ? 'auto' : 'none',
				scale: visibility.scale,
				y: visibility.y,
			}}
		>
			<div className="relative z-10">
				<p className="font-mono text-sm tracking-wide text-dark-300">
					{String(index + 1).padStart(2, '0')} /{' '}
					{String(total).padStart(2, '0')}
				</p>
				<h3 className="mt-3 text-2xl font-medium tracking-tight text-pretty text-white sm:text-3xl">
					{scene.title}
				</h3>
				<p className="mt-4 max-w-md text-pretty text-dark-100">
					{scene.description}
				</p>
				<p className="mt-2 text-sm text-dark-300">{scene.eyebrow}</p>
			</div>
			<div className="flex min-h-0 items-center justify-center overflow-hidden">
				{scene.visual}
			</div>
		</motion.div>
	)
}

const SceneIndicatorDot = ({
	index,
	progress,
	total,
}: Readonly<{
	index: number
	progress: number
	total: number
}>) => {
	const visibility = getSceneVisibility({ index, progress, total })

	return (
		<span
			aria-hidden
			className="size-1.5 rounded-full bg-white transition-opacity duration-150"
			style={{ opacity: Math.max(0.25, visibility.opacity) }}
		/>
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

const WINTER_SOLSTICE_EVENTS = new Set([SeasonalEventId.WinterSolstice])

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
	{
		day: getUnixTimestamp({ day: 21, monthIndex: 5, year: 2026 }),
		description: 3,
		max: 13,
		min: 6,
		rain: 24,
		uv: 1,
		wind: 10,
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
	<div className="relative h-72 w-full max-w-xl sm:h-80 lg:h-88">
		<div className="absolute inset-x-8 top-16 h-40 rounded-full bg-blue-500/8 blur-3xl" />
		<div className="absolute inset-0 flex items-center justify-center sm:hidden">
			<LandingWeatherTile index={0} tile={FORECAST_TILES[0]} />
		</div>
		<div className="absolute top-1/2 left-1/2 hidden h-80 w-[32rem] -translate-x-1/2 -translate-y-1/2 sm:block lg:left-0 lg:translate-x-0 2xl:w-[48rem]">
			{FORECAST_TILES.map((tile, index) => (
				<div className={FORECAST_TILE_CLASS_NAMES[index]} key={tile.day}>
					<LandingWeatherTile index={index} tile={tile} />
				</div>
			))}
		</div>
	</div>
)

const FORECAST_TILE_CLASS_NAMES = [
	'absolute top-16 left-0 z-30',
	'absolute top-0 left-24 z-20 opacity-90',
	'absolute top-20 left-48 z-10 hidden opacity-70 2xl:block',
] as const

const LandingWeatherTile = ({
	hasSeasonalEvent = false,
	index,
	tile,
}: Readonly<{
	hasSeasonalEvent?: boolean
	index: number
	tile: LandingWeatherTileData
}>) => (
	<div className={clsx('relative w-64 shrink-0', hasSeasonalEvent && 'w-62')}>
		<Tile
			{...tile}
			delayBaseline={0}
			enabledSeasonalEvents={
				hasSeasonalEvent ? WINTER_SOLSTICE_EVENTS : undefined
			}
			hemisphere={Hemisphere.Southern}
			identifier={TileIdentifier.Day}
			index={index}
			isSeasonalEventEnabled={isWinterSolsticeEnabled}
			onToggleSeasonalEvent={ignoreSeasonalEventToggle}
			seasonalEventOverride={
				hasSeasonalEvent ? SeasonalEventId.WinterSolstice : undefined
			}
			showSeasonalEvents={hasSeasonalEvent}
			showSeasonalTileGlow={hasSeasonalEvent}
			temperatureUnit={TemperatureUnit.Celsius}
			unitSystem={UnitSystem.Metric}
		/>
	</div>
)

const isWinterSolsticeEnabled = (eventId: SeasonalEventId) =>
	eventId === SeasonalEventId.WinterSolstice

const ignoreSeasonalEventToggle = () => undefined

const SeasonalVisual = () => {
	const shouldReduceMotion = useReducedMotion()

	return (
		<div className="relative flex w-full justify-center overflow-hidden py-6 sm:py-10 lg:justify-start lg:overflow-visible">
			<div className="absolute inset-x-3 top-2 bottom-2 rounded-[2rem] bg-[radial-gradient(120%_80%_at_15%_0%,rgba(59,130,246,0.22),rgba(14,116,144,0.1)_45%,rgba(15,23,42,0)_72%),radial-gradient(90%_60%_at_80%_8%,rgba(129,140,248,0.18),rgba(15,23,42,0)_70%),radial-gradient(70%_50%_at_45%_0%,rgba(52,211,153,0.13),rgba(15,23,42,0)_70%)]" />
			{!shouldReduceMotion
				? SOLSTICE_PARTICLES.map((particle) => (
						<span
							aria-hidden
							className="absolute rounded-full bg-sky-100 opacity-0"
							key={particle.id}
							style={{
								animation: `landing-solstice-drift ${particle.durationSeconds}s ease-in-out ${particle.delaySeconds}s infinite`,
								height: particle.sizePixels,
								left: `${particle.leftPercent}%`,
								top: `${particle.topPercent}%`,
								width: particle.sizePixels,
							}}
						/>
					))
				: null}
			<div className="relative grid w-[18rem] shrink-0 origin-center scale-[0.58] grid-cols-1 items-center gap-4 sm:scale-75 md:scale-[0.82] lg:origin-left lg:scale-[0.82] xl:scale-90 2xl:w-[40rem] 2xl:scale-95 2xl:grid-cols-[14.5rem_18rem] 2xl:gap-6">
				<LandingWeatherTile
					hasSeasonalEvent
					index={0}
					tile={WINTER_SOLSTICE_TILE}
				/>
				<div className="rounded-2xl border border-white/10 bg-dark-950/70 p-5 shadow-xl shadow-dark-950/25 backdrop-blur-md">
					<p className="text-sm font-medium text-dark-200">21 June</p>
					<p className="mt-2 text-2xl font-medium tracking-tight text-white">
						Winter Solstice
					</p>
					<p className="mt-3 text-sm leading-6 text-dark-100">
						The shortest day and longest night of the year, marked on the same
						forecast tile people use every day.
					</p>
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

const PrivacyVisual = () => {
	const shouldReduceMotion = useReducedMotion()

	return (
		<div
			aria-hidden
			className="w-full max-w-md rounded-3xl bg-dark-900/60 p-8 ring-1 ring-white/10"
		>
			<div className="flex items-center gap-4">
				<span className="shrink-0 rounded-xl bg-dark-700 px-4 py-3 text-sm font-medium text-white ring-1 ring-white/10">
					Your browser
				</span>
				<span className="relative h-px flex-1 bg-white/15">
					{!shouldReduceMotion ? (
						<span
							className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-blue-400"
							style={{
								animation: 'landing-packet 2.2s ease-in-out infinite',
							}}
						/>
					) : null}
				</span>
				<span className="shrink-0 rounded-xl bg-dark-700 px-4 py-3 text-sm font-medium text-white ring-1 ring-white/10">
					Your providers
				</span>
			</div>
			<p className="mt-4 text-center text-xs text-dark-300">
				Google · Microsoft · Open-Meteo
			</p>
			<div className="mt-8 flex items-center gap-3 rounded-xl bg-dark-950/60 p-4 ring-1 ring-white/5">
				<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-dark-700 text-xs text-dark-200">
					✕
				</span>
				<p className="text-sm text-dark-200">
					No servers in between. Your location and events never pass through us.
				</p>
			</div>
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
		eyebrow:
			'Scroll through detail views for temperature, rain, wind and more.',
		id: 'forecast',
		title: 'Your local forecast',
		visual: <ForecastVisual />,
	},
	{
		description:
			'Optionally connect Google Calendar or Microsoft Outlook to see your upcoming events beside the forecast.',
		eyebrow: 'Colour-coded by account — personal, work, school, and more.',
		id: 'calendar',
		title: 'Your day at a glance',
		visual: <CalendarVisual />,
	},
	{
		description:
			'Your location and calendar data travel directly from your browser to the weather and calendar providers.',
		eyebrow: 'Open source, no accounts, no ads, no tracking.',
		id: 'privacy',
		title: 'Private by design',
		visual: <PrivacyVisual />,
	},
	{
		description:
			'Subtle seasonal effects for solstices, meteor showers, holidays, and more — all of which can be turned off.',
		eyebrow: 'A little delight, never a distraction.',
		id: 'seasonal',
		title: 'Seasonal touches',
		visual: <SeasonalVisual />,
	},
] as const satisfies ReadonlyArray<Scene>

type SceneVisibilityParams = {
	index: number
	progress: number
	total: number
}

const getSceneVisibility = ({
	index,
	progress,
	total,
}: SceneVisibilityParams) => {
	const scenePosition = progress * (total - 1)
	const distance = Math.abs(scenePosition - index)
	const opacity =
		1 - smoothStep({ edgeEnd: 0.82, edgeStart: 0.08, value: distance })

	return {
		isInteractive: distance < 0.42,
		opacity,
		scale: 0.98 + opacity * 0.02,
		y: (index - scenePosition) * 36,
	}
}

type SmoothStepParams = {
	edgeEnd: number
	edgeStart: number
	value: number
}

const smoothStep = ({ edgeEnd, edgeStart, value }: SmoothStepParams) => {
	const t = clamp((value - edgeStart) / (edgeEnd - edgeStart))

	return t * t * (3 - 2 * t)
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))

type UnixTimestampParams = {
	day: number
	monthIndex: number
	year: number
}

function getUnixTimestamp({ day, monthIndex, year }: UnixTimestampParams) {
	return Math.round(Date.UTC(year, monthIndex, day, 12) / 1000)
}

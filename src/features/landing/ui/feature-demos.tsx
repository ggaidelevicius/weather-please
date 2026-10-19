'use client'

import { IconTemperature } from '@tabler/icons-react'
import { useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

import type { HeroHourlyForecast } from '../model/hero-forecast'

import { Hemisphere } from '../../seasonal-events/core/types'
import { TileIdentifier } from '../../settings/model/tile-identifier'
import { TemperatureUnit, UnitSystem } from '../../settings/model/unit-system'
import {
	getChartScale,
	getScaleLabels,
} from '../../weather/model/chart-geometry'
import { getTemperatureAccentColor } from '../../weather/model/temperature-colour'
import { ChartFrame, LineChart } from '../../weather/ui/charts/chart'
import { Metric } from '../../weather/ui/details/detail-shell'
import { Tile } from '../../weather/ui/tile'
import { LandingI18nProvider } from './landing-i18n-provider'

export const HourlyDetailVisual = ({
	hourly,
}: Readonly<{ hourly: HeroHourlyForecast }>) => (
	<LandingI18nProvider>
		<HourlyDetailChart hourly={hourly} />
	</LandingI18nProvider>
)

export const SeasonalVisual = () => (
	<LandingI18nProvider>
		<SeasonalBackground />
	</LandingI18nProvider>
)

type LandingWeatherTileData = {
	day: number
	description: number
	max: number
	min: number
	rain: number
	uv: number
	wind: number
}

const WINTER_SOLSTICE_TILE = {
	day: getUnixTimestamp({ day: 21, monthIndex: 5, year: 2026 }),
	description: 2,
	max: 11,
	min: 4,
	rain: 12,
	uv: 1,
	wind: 9,
} as const satisfies LandingWeatherTileData

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
			isSeasonalEventBackgroundEnabled={isSeasonalEventDisabled}
			isSeasonalEventEnabled={isSeasonalEventDisabled}
			onToggleSeasonalEvent={ignoreSeasonalEventToggle}
			onToggleSeasonalEventBackground={ignoreSeasonalEventToggle}
			showSeasonalEvents={false}
			showSeasonalTileGlow={false}
			temperatureUnit={TemperatureUnit.Celsius}
			timeZone="UTC"
			unitSystem={UnitSystem.Metric}
		/>
	</div>
)

const isSeasonalEventDisabled = () => false
const ignoreSeasonalEventToggle = () => undefined

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

const SeasonalBackground = () => {
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
		<div className="relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10">
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
					{SOLSTICE_PARTICLES.map((particle) => (
						<span
							className="absolute opacity-0 motion-reduce:hidden"
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
									particle.sizePixels * seasonalBackground.particles.widthScale,
							}}
						/>
					))}
				</div>
			))}
			<div className="relative flex justify-center">
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
											? 'absolute rounded-3xl opacity-60 blur-sm saturate-200 motion-reduce:animate-none!'
											: 'absolute rounded-2xl motion-reduce:animate-none!'
									}
									key={inset}
									style={{
										animation:
											'landing-seasonal-border-spin 12s linear infinite',
										background: `conic-gradient(from var(--landing-seasonal-border-angle), ${seasonalBackground.glowColors.join(', ')})`,
										inset,
									}}
								/>
							))}
						</div>
					))}
					<LandingWeatherTile index={0} tile={WINTER_SOLSTICE_TILE} />
				</div>
			</div>
		</div>
	)
}

// Perth's next 24 hours, fetched with the hero forecast.
const HourlyDetailChart = ({
	hourly: { apparentTemperatures, labels, temperatures, times },
}: Readonly<{ hourly: HeroHourlyForecast }>) => {
	const scale = getChartScale(temperatures)
	const accentColor = getTemperatureAccentColor(temperatures[0] ?? 0)

	return (
		<div
			aria-hidden
			className="pointer-events-none w-full max-w-2xl rounded-3xl bg-dark-900 p-6 ring-1 ring-white/6 sm:p-8"
		>
			<div className="flex items-center gap-3">
				<span style={{ color: accentColor }}>
					<IconTemperature size={22} />
				</span>
				<div>
					<p className="text-xs font-semibold tracking-[0.18em] text-dark-300 uppercase">
						Next 24 hours
					</p>
					<p className="text-3xl font-bold text-white">Temperature</p>
				</div>
			</div>
			<div className="mt-6 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_10rem]">
				<ChartFrame
					endLabel={labels.end}
					leftLabels={getScaleLabels({ scale, unitLabel: '°C' })}
					middleLabel={labels.middle}
					startLabel={labels.start}
				>
					<LineChart
						accentClassName=""
						accentStyle={{ stroke: accentColor }}
						points={temperatures}
						primarySeriesId="temperature"
						primarySeriesLabel="Temperature"
						primaryValueFormatter={(value) => `${Math.round(value)}°C`}
						scale={scale}
						times={times}
					/>
				</ChartFrame>
				<div className="grid">
					<Metric
						accentStyle={{ color: accentColor }}
						icon={<IconTemperature size={18} />}
						label="Temperature now"
						value={`${Math.round(temperatures[0] ?? 0)}°C`}
					/>
					<Metric
						icon={<IconTemperature size={18} />}
						label="Feels like now"
						value={`${Math.round(apparentTemperatures[0] ?? 0)}°C`}
					/>
				</div>
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

type UnixTimestampParams = {
	day: number
	monthIndex: number
	year: number
}

function getUnixTimestamp({ day, monthIndex, year }: UnixTimestampParams) {
	return Math.round(
		Temporal.ZonedDateTime.from({
			day,
			hour: 12,
			month: monthIndex + 1,
			timeZone: 'UTC',
			year,
		}).epochMilliseconds / 1000,
	)
}

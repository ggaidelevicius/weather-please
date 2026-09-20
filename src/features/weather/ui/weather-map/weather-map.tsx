import type { WeatherMapData } from '../../model/types'
import type { PointerEvent } from 'react'
import { useState, useEffect, useRef } from 'react'
import type {
	WeatherMapViewport,
	WeatherMapPlaybackState,
	WeatherMapDisplaySize,
	WeatherMapPointerPoint,
} from '../../model/detail-types'
import { IconMap2, IconCloudRain, IconWind } from '@tabler/icons-react'
import { Trans } from '@lingui/react/macro'
import {
	getWeatherMapPlaybackState,
	getWeatherMapFrame,
	getWeatherMapDimensions,
	getWeatherMapTiles,
	getWeatherMapViewport,
	getWeatherMapOverlayScale,
	projectWeatherMapPoint,
} from '../../model/weather-map/geometry'
import {
	DetailViewShell,
	WeekdayHourLabel,
	Metric,
} from '../details/detail-shell'
import {
	WEATHER_MAP_TILE_SIZE,
	WEATHER_MAP_PRECIPITATION_BANDS,
} from '../../model/weather-map/constants'
import { WeatherMapPrecipitationCanvas } from './precipitation-canvas'
import { WeatherMapWindParticleCanvas } from './wind-canvas'
import { WeatherMapTooltip } from './tooltip'
import {
	getWeatherMapPrecipitationBandColor,
	formatWeatherMapPrecipitationBandLabel,
} from '../../model/weather-map/precipitation'
import { formatHour, convertWind, average } from '../../model/detail-formatting'
import { getInterpolatedWeatherMapMetricPoints } from '../../model/weather-map/wind'
import { getPeakPoint } from '../../model/chart-geometry'
import { AnimatedNumber } from '../charts/chart'

export const WeatherMapDetail = ({
	isActive,
	usesMetricUnits,
	weatherMapData,
	windUnitLabel,
}: Readonly<{
	isActive: boolean
	usesMetricUnits: boolean
	weatherMapData: null | WeatherMapData
	windUnitLabel: string
}>) => {
	const [playback, setPlayback] = useState<WeatherMapPlaybackState>(() =>
		getWeatherMapPlaybackState({
			frames: weatherMapData?.frames ?? [],
			startedAt: 0,
			time: 0,
		}),
	)
	const frameCount = weatherMapData?.frames.length ?? 0

	useEffect(() => {
		if (!isActive || frameCount <= 1) {
			return
		}

		const startedAt = performance.now()
		let animationFrame = 0

		const updatePlayback = (time: number) => {
			setPlayback(
				getWeatherMapPlaybackState({
					frames: weatherMapData?.frames ?? [],
					startedAt,
					time,
				}),
			)
			animationFrame = window.requestAnimationFrame(updatePlayback)
		}

		animationFrame = window.requestAnimationFrame(updatePlayback)

		return () => {
			window.cancelAnimationFrame(animationFrame)
		}
	}, [frameCount, isActive, weatherMapData?.frames])

	return (
		<DetailViewShell
			accentClassName="text-cyan-200"
			icon={<IconMap2 aria-hidden size={22} />}
			isActive={isActive}
			kicker={<Trans>Next 6 hours</Trans>}
			metrics={
				<WeatherMapMetrics
					playbackPosition={playback.framePosition}
					usesMetricUnits={usesMetricUnits}
					weatherMapData={weatherMapData}
					windUnitLabel={windUnitLabel}
				/>
			}
			title={<Trans>Local map</Trans>}
		>
			<WeatherMap
				isActive={isActive}
				playback={playback}
				usesMetricUnits={usesMetricUnits}
				weatherMapData={weatherMapData}
				windUnitLabel={windUnitLabel}
			/>
		</DetailViewShell>
	)
}

export const WeatherMap = ({
	isActive,
	playback,
	usesMetricUnits,
	weatherMapData,
	windUnitLabel,
}: Readonly<{
	isActive: boolean
	playback: WeatherMapPlaybackState
	usesMetricUnits: boolean
	weatherMapData: null | WeatherMapData
	windUnitLabel: string
}>) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const [displaySize, setDisplaySize] = useState<null | WeatherMapDisplaySize>(
		null,
	)
	const [hoverPoint, setHoverPoint] = useState<null | WeatherMapPointerPoint>(
		null,
	)
	const selectedFrame = getWeatherMapFrame({
		frameIndex: playback.frameIndex,
		weatherMapData,
	})
	const canRenderWeatherMap = Boolean(weatherMapData && selectedFrame)

	useEffect(() => {
		const element = containerRef.current
		if (!element) {
			return
		}

		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0]
			if (!entry) {
				return
			}

			const { height, width } = entry.contentRect
			const nextDisplaySize = {
				height: Math.max(1, height),
				width: Math.max(1, width),
			}

			setDisplaySize((currentDisplaySize) => {
				if (
					currentDisplaySize?.height === nextDisplaySize.height &&
					currentDisplaySize.width === nextDisplaySize.width
				) {
					return currentDisplaySize
				}

				return nextDisplaySize
			})
		})
		resizeObserver.observe(element)

		return () => {
			resizeObserver.disconnect()
		}
	}, [canRenderWeatherMap])

	if (!weatherMapData || !selectedFrame) {
		return (
			<div className="flex h-96 items-center justify-center rounded-lg border border-white/8 bg-white/3 text-sm text-dark-200">
				<Trans>Map data unavailable</Trans>
			</div>
		)
	}

	const dimensions = displaySize ? getWeatherMapDimensions(displaySize) : null
	const tiles =
		isActive && dimensions
			? getWeatherMapTiles({
					center: weatherMapData.center,
					dimensions,
				})
			: []
	const viewport = dimensions
		? getWeatherMapViewport({
				center: weatherMapData.center,
				dimensions,
			})
		: null

	const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
		if (!dimensions) {
			return
		}

		const rect = event.currentTarget.getBoundingClientRect()
		setHoverPoint({
			x: ((event.clientX - rect.left) / rect.width) * dimensions.width,
			y: ((event.clientY - rect.top) / rect.height) * dimensions.height,
		})
	}

	const handlePointerLeave = () => {
		setHoverPoint(null)
	}

	return (
		<div className="space-y-4">
			<div
				className="relative h-96 overflow-hidden rounded-lg border border-white/8 bg-cyan-950/20"
				onPointerLeave={handlePointerLeave}
				onPointerMove={handlePointerMove}
				ref={containerRef}
			>
				{dimensions && viewport ? (
					<>
						<svg
							aria-label="Local precipitation and wind direction map"
							className="h-full w-full"
							preserveAspectRatio="none"
							viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
						>
							<rect
								fill="#0f172a"
								height={dimensions.height}
								width={dimensions.width}
							/>
							{tiles.map((tile) => (
								<image
									height={WEATHER_MAP_TILE_SIZE}
									href={tile.url}
									key={tile.key}
									opacity="0.58"
									preserveAspectRatio="none"
									width={WEATHER_MAP_TILE_SIZE}
									x={tile.x}
									y={tile.y}
								/>
							))}
							<rect
								fill="rgba(8, 47, 73, 0.42)"
								height={dimensions.height}
								width={dimensions.width}
							/>
						</svg>
						<WeatherMapPrecipitationCanvas
							dimensions={dimensions}
							frames={weatherMapData.frames}
							isActive={isActive}
							playbackPosition={playback.framePosition}
							viewport={viewport}
						/>
						<WeatherMapWindParticleCanvas
							dimensions={dimensions}
							frames={weatherMapData.frames}
							isActive={isActive}
							playbackPosition={playback.framePosition}
							viewport={viewport}
						/>
						<svg
							aria-hidden
							className="pointer-events-none absolute inset-0 h-full w-full"
							preserveAspectRatio="none"
							viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
						>
							<WeatherMapCenterMarker
								center={weatherMapData.center}
								viewport={viewport}
							/>
						</svg>
						<div className="pointer-events-none absolute top-3 left-3 rounded-full border border-white/10 bg-dark-950/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
							<WeekdayHourLabel time={playback.time ?? selectedFrame.time} />
						</div>
						<WeatherMapTooltip
							dimensions={dimensions}
							frames={weatherMapData.frames}
							isActive={isActive}
							playbackPosition={playback.framePosition}
							point={hoverPoint}
							usesMetricUnits={usesMetricUnits}
							viewport={viewport}
							windUnitLabel={windUnitLabel}
						/>
						<WeatherMapPrecipitationLegend usesMetricUnits={usesMetricUnits} />
						<a
							className="absolute right-2 bottom-2 rounded bg-dark-950/60 px-1.5 py-0.5 text-[10px] font-medium text-white/70 backdrop-blur-md transition hover:text-white"
							href="https://www.openstreetmap.org/copyright"
							rel="noreferrer"
							target="_blank"
						>
							© OpenStreetMap contributors
						</a>
					</>
				) : null}
			</div>
			<WeatherMapTimeline frames={weatherMapData.frames} playback={playback} />
		</div>
	)
}

export const WeatherMapCenterMarker = ({
	center,
	viewport,
}: Readonly<{
	center: WeatherMapData['center']
	viewport: WeatherMapViewport
}>) => {
	const overlayScale = getWeatherMapOverlayScale(viewport.dimensions)
	const { x, y } = projectWeatherMapPoint({
		point: {
			lat: center.lat,
			lon: center.lon,
			precipitation: 0,
			precipitationProbability: 0,
			windDirection: 0,
			windSpeed: 0,
		},
		viewport,
	})

	return (
		<g>
			<circle className="fill-white" cx={x} cy={y} r={3 * overlayScale} />
			<circle
				className="fill-none stroke-white/50"
				cx={x}
				cy={y}
				r={9 * overlayScale}
				strokeWidth={1.5 * overlayScale}
			/>
		</g>
	)
}

export const WeatherMapPrecipitationLegend = ({
	usesMetricUnits,
}: Readonly<{ usesMetricUnits: boolean }>) => (
	<div className="pointer-events-none absolute bottom-2 left-2 rounded-lg border border-white/10 bg-dark-950/60 px-2.5 py-2 text-[10px] font-semibold text-white/80 backdrop-blur-md">
		<div className="mb-1 text-white/60">
			<Trans>Precipitation</Trans>
		</div>
		<div className="flex items-center gap-1.5">
			{WEATHER_MAP_PRECIPITATION_BANDS.slice(1).map((band) => (
				<div className="flex flex-col items-center gap-1" key={band.label}>
					<span
						className="h-2 w-5 rounded-full border border-white/20"
						style={{
							backgroundColor: getWeatherMapPrecipitationBandColor(band),
						}}
					/>
					<span>
						{formatWeatherMapPrecipitationBandLabel({
							band,
							usesMetricUnits,
						})}
					</span>
				</div>
			))}
			<span className="ml-1 text-white/50">
				{usesMetricUnits ? 'mm/h' : 'in/h'}
			</span>
		</div>
	</div>
)

export const WeatherMapTimeline = ({
	frames,
	playback,
}: Readonly<{
	frames: WeatherMapData['frames']
	playback: WeatherMapPlaybackState
}>) => {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between text-xs font-semibold text-dark-300">
				<span>{formatHour(frames[0]?.time ?? 0)}</span>
				<span>{formatHour(frames.at(-1)?.time ?? 0)}</span>
			</div>
			<div className="h-1.5 overflow-hidden rounded-full bg-white/12">
				<div
					className="h-full origin-left rounded-full bg-cyan-100/80"
					style={{
						transform: `scaleX(${playback.totalProgress})`,
					}}
				/>
			</div>
		</div>
	)
}

export const WeatherMapMetrics = ({
	playbackPosition,
	usesMetricUnits,
	weatherMapData,
	windUnitLabel,
}: Readonly<{
	playbackPosition: number
	usesMetricUnits: boolean
	weatherMapData: null | WeatherMapData
	windUnitLabel: string
}>) => {
	const interpolatedPoints = weatherMapData
		? getInterpolatedWeatherMapMetricPoints({
				framePosition: playbackPosition,
				frames: weatherMapData.frames,
			})
		: []

	if (!weatherMapData || interpolatedPoints.length === 0) {
		return (
			<Metric
				icon={<IconMap2 aria-hidden size={18} />}
				label={<Trans>Map</Trans>}
				value={<Trans>Waiting for map data</Trans>}
			/>
		)
	}

	const windSpeeds = interpolatedPoints.map(({ windSpeed }) =>
		convertWind({ usesMetricUnits, wind: windSpeed }),
	)
	const averageWind = average(windSpeeds)
	const peakChance = getPeakPoint(
		interpolatedPoints.map(
			({ precipitationProbability }) => precipitationProbability,
		),
	)
	const peakWind = getPeakPoint(windSpeeds)

	return (
		<>
			<Metric
				icon={<IconCloudRain aria-hidden size={18} />}
				label={<Trans>Peak precipitation chance</Trans>}
				value={
					<>
						<AnimatedNumber value={peakChance.value} />%
					</>
				}
			/>
			<Metric
				icon={<IconWind aria-hidden size={18} />}
				label={<Trans>Average wind</Trans>}
				value={
					<>
						<AnimatedNumber value={averageWind} /> {windUnitLabel}
					</>
				}
			/>
			<Metric
				icon={<IconWind aria-hidden size={18} />}
				label={<Trans>Peak wind</Trans>}
				value={
					<>
						<AnimatedNumber value={peakWind.value} /> {windUnitLabel}
					</>
				}
			/>
		</>
	)
}

import { Trans } from '@lingui/react/macro'
import {
	IconCloudRain,
	IconEye,
	IconTemperature,
	IconUvIndex,
	IconWind,
} from '@tabler/icons-react'
import { type PointerEvent, type ReactNode, useState } from 'react'

import type { Next24HoursData } from '../model/types'

import { TemperatureUnit, UnitSystem } from '../../settings/model/unit-system'

const CHART_HEIGHT = 150
const CHART_WIDTH = 360
const CHART_PADDING = 10
const CHART_SPLINE_TENSION = 0.16

export const NEXT_24_HOURS_DETAIL_VIEW_IDS = [
	'temperature',
	'precipitation',
	'wind',
	'conditions',
] as const

export type Next24HoursDetailViewId =
	(typeof NEXT_24_HOURS_DETAIL_VIEW_IDS)[number]

type ChartFrameProps = {
	children: ReactNode
	endLabel: ReactNode
	leftLabels: string[]
	rightLabels?: string[]
	startLabel: ReactNode
}

type ChartScale = {
	maxValue?: number
	minValue?: number
}

type ChartTooltipState = {
	seriesLabel: string
	time: number
	value: string
	x: number
	y: number
}

type DetailViewShellProps = {
	accentClassName: string
	children: ReactNode
	icon: ReactNode
	isActive: boolean
	kicker: ReactNode
	metrics: ReactNode
	title: ReactNode
}

type LineChartProps = {
	accentClassName: string
	activeSeriesId?: null | WeatherDetailSeriesId
	onSeriesFocus?: (seriesId: null | WeatherDetailSeriesId) => void
	points: number[]
	primarySeriesId?: WeatherDetailSeriesId
	primarySeriesLabel: string
	primaryValueFormatter: (value: number) => string
	scale: Required<ChartScale>
	secondaryAccentClassName?: string
	secondaryPoints?: number[]
	secondaryScale?: Required<ChartScale>
	secondarySeriesId?: WeatherDetailSeriesId
	secondarySeriesLabel?: string
	secondaryValueFormatter?: (value: number) => string
	times: number[]
}

type MetricProps = {
	activeSeriesId?: null | WeatherDetailSeriesId
	icon: ReactNode
	label: ReactNode
	onSeriesFocus?: (seriesId: null | WeatherDetailSeriesId) => void
	seriesId?: WeatherDetailSeriesId
	value: ReactNode
}

type Next24HoursDetailViewProps = {
	data: Next24HoursData
	isActive: boolean
	temperatureUnit: TemperatureUnit
	unitSystem: UnitSystem
	viewId: Next24HoursDetailViewId
}

type PointSummary = {
	index: number
	value: number
}

type PrecipitationChartProps = {
	amountPoints: number[]
	probabilityPoints: number[]
	times: number[]
}

type WeatherDetailSeriesId =
	| 'precipitationProbability'
	| 'temperature'
	| 'uv'
	| 'visibility'
	| 'wind'
	| 'windGust'

export const Next24HoursDetailView = ({
	data,
	isActive,
	temperatureUnit,
	unitSystem,
	viewId,
}: Readonly<Next24HoursDetailViewProps>) => {
	const [activeSeriesId, setActiveSeriesId] =
		useState<null | WeatherDetailSeriesId>(null)

	if (data.length === 0) {
		return null
	}

	const usesMetricTemperature = temperatureUnit === TemperatureUnit.Celsius
	const usesMetricUnits = unitSystem === UnitSystem.Metric
	const temperatures = data.map(({ temperature }) =>
		convertTemperature({ temperature, usesMetricTemperature }),
	)
	const apparentTemperatures = data.map(({ apparentTemperature }) =>
		convertTemperature({
			temperature: apparentTemperature,
			usesMetricTemperature,
		}),
	)
	const precipitation = data.map(({ precipitation }) => precipitation)
	const precipitationProbability = data.map(
		({ precipitationProbability }) => precipitationProbability,
	)
	const wind = data.map(({ wind }) => convertWind({ usesMetricUnits, wind }))
	const windGust = data.map(({ windGust }) =>
		convertWind({ usesMetricUnits, wind: windGust }),
	)
	const uv = data.map(({ uv }) => uv)
	const visibility = data.map(({ visibility }) =>
		convertVisibility({ usesMetricUnits, visibility }),
	)
	const times = data.map(({ time }) => time)
	const temperatureUnitLabel = usesMetricTemperature ? '°C' : '°F'
	const windUnitLabel = usesMetricUnits ? 'km/h' : 'mph'
	const visibilityUnitLabel = usesMetricUnits ? 'km' : 'mi'
	const startLabel = formatHour(data[0]?.time)
	const endLabel = formatHour(data[data.length - 1]?.time)

	if (viewId === 'temperature') {
		const scale = getChartScale(temperatures)
		const high = getPeakPoint(temperatures)
		const low = getLowPoint(temperatures)
		const currentApparentTemperature = apparentTemperatures[0] ?? 0

		return (
			<DetailViewShell
				accentClassName="text-blue-200"
				icon={<IconTemperature aria-hidden size={22} />}
				isActive={isActive}
				kicker={<Trans>Next 24 hours</Trans>}
				metrics={
					<>
						<Metric
							icon={<IconTemperature aria-hidden size={18} />}
							label={<Trans>High</Trans>}
							value={
								<Trans>
									{Math.round(high.value)}
									{temperatureUnitLabel} at {formatHour(data[high.index]?.time)}
								</Trans>
							}
						/>
						<Metric
							icon={<IconTemperature aria-hidden size={18} />}
							label={<Trans>Low</Trans>}
							value={
								<Trans>
									{Math.round(low.value)}
									{temperatureUnitLabel} at {formatHour(data[low.index]?.time)}
								</Trans>
							}
						/>
						<Metric
							icon={<IconTemperature aria-hidden size={18} />}
							label={<Trans>Feels like now</Trans>}
							value={`${Math.round(currentApparentTemperature)}${temperatureUnitLabel}`}
						/>
					</>
				}
				title={<Trans>Temperature</Trans>}
			>
				<ChartFrame
					endLabel={endLabel}
					leftLabels={getScaleLabels({
						scale,
						unitLabel: temperatureUnitLabel,
					})}
					startLabel={startLabel}
				>
					<LineChart
						accentClassName="stroke-blue-300"
						points={temperatures}
						primarySeriesId="temperature"
						primarySeriesLabel="Temperature"
						primaryValueFormatter={(value) =>
							`${formatDecimal(value)}${temperatureUnitLabel}`
						}
						scale={scale}
						times={times}
					/>
				</ChartFrame>
			</DetailViewShell>
		)
	}

	if (viewId === 'precipitation') {
		const probabilityScale = { maxValue: 100, minValue: 0 }
		const amountScale = getChartScale(precipitation, { minValue: 0 })
		const peakProbability = getPeakPoint(precipitationProbability)
		const peakAmount = getPeakPoint(precipitation)

		return (
			<DetailViewShell
				accentClassName="text-blue-200"
				icon={<IconCloudRain aria-hidden size={22} />}
				isActive={isActive}
				kicker={<Trans>Next 24 hours</Trans>}
				metrics={
					<>
						<Metric
							icon={<IconCloudRain aria-hidden size={18} />}
							label={<Trans>Total rain</Trans>}
							value={<Trans>{formatDecimal(sum(precipitation))} mm</Trans>}
						/>
						<Metric
							icon={<IconCloudRain aria-hidden size={18} />}
							label={<Trans>Peak chance</Trans>}
							value={
								<Trans>
									{Math.round(peakProbability.value)}% at{' '}
									{formatHour(data[peakProbability.index]?.time)}
								</Trans>
							}
						/>
						<Metric
							icon={<IconCloudRain aria-hidden size={18} />}
							label={<Trans>Wettest hour</Trans>}
							value={
								<Trans>
									{formatDecimal(peakAmount.value)} mm at{' '}
									{formatHour(data[peakAmount.index]?.time)}
								</Trans>
							}
						/>
					</>
				}
				title={<Trans>Precipitation</Trans>}
			>
				<ChartFrame
					endLabel={endLabel}
					leftLabels={getScaleLabels({ scale: amountScale, unitLabel: 'mm' })}
					rightLabels={getScaleLabels({
						scale: probabilityScale,
						unitLabel: '%',
					})}
					startLabel={startLabel}
				>
					<PrecipitationChart
						amountPoints={precipitation}
						probabilityPoints={precipitationProbability}
						times={times}
					/>
				</ChartFrame>
			</DetailViewShell>
		)
	}

	if (viewId === 'wind') {
		const scale = getChartScale([...wind, ...windGust], { minValue: 0 })
		const peakWind = getPeakPoint(wind)
		const peakGust = getPeakPoint(windGust)

		return (
			<DetailViewShell
				accentClassName="text-sky-200"
				icon={<IconWind aria-hidden size={22} />}
				isActive={isActive}
				kicker={<Trans>Next 24 hours</Trans>}
				metrics={
					<>
						<Metric
							activeSeriesId={activeSeriesId}
							icon={<IconWind aria-hidden size={18} />}
							label={<Trans>Peak wind</Trans>}
							onSeriesFocus={setActiveSeriesId}
							seriesId="wind"
							value={
								<Trans>
									{Math.round(peakWind.value)} {windUnitLabel} at{' '}
									{formatHour(data[peakWind.index]?.time)}
								</Trans>
							}
						/>
						<Metric
							activeSeriesId={activeSeriesId}
							icon={<IconWind aria-hidden size={18} />}
							label={<Trans>Peak gust</Trans>}
							onSeriesFocus={setActiveSeriesId}
							seriesId="windGust"
							value={
								<Trans>
									{Math.round(peakGust.value)} {windUnitLabel} at{' '}
									{formatHour(data[peakGust.index]?.time)}
								</Trans>
							}
						/>
						<Metric
							activeSeriesId={activeSeriesId}
							icon={<IconWind aria-hidden size={18} />}
							label={<Trans>Gust spread</Trans>}
							value={
								<Trans>
									{Math.round(peakGust.value - peakWind.value)} {windUnitLabel}
								</Trans>
							}
						/>
					</>
				}
				title={<Trans>Wind</Trans>}
			>
				<ChartFrame
					endLabel={endLabel}
					leftLabels={getScaleLabels({ scale, unitLabel: windUnitLabel })}
					startLabel={startLabel}
				>
					<LineChart
						accentClassName="stroke-sky-300"
						activeSeriesId={activeSeriesId}
						onSeriesFocus={setActiveSeriesId}
						points={wind}
						primarySeriesId="wind"
						primarySeriesLabel="Wind"
						primaryValueFormatter={(value) =>
							`${formatDecimal(value)} ${windUnitLabel}`
						}
						scale={scale}
						secondaryAccentClassName="stroke-cyan-100"
						secondaryPoints={windGust}
						secondarySeriesId="windGust"
						secondarySeriesLabel="Gust"
						secondaryValueFormatter={(value) =>
							`${formatDecimal(value)} ${windUnitLabel}`
						}
						times={times}
					/>
				</ChartFrame>
			</DetailViewShell>
		)
	}

	const uvScale = getChartScale(uv, { minValue: 0 })
	const visibilityScale = getChartScale(visibility, { minValue: 0 })
	const peakUv = getPeakPoint(uv)
	const lowestVisibility = getLowPoint(visibility)
	const bestVisibility = getPeakPoint(visibility)

	return (
		<DetailViewShell
			accentClassName="text-violet-200"
			icon={<IconUvIndex aria-hidden size={22} />}
			isActive={isActive}
			kicker={<Trans>Next 24 hours</Trans>}
			metrics={
				<>
					<Metric
						activeSeriesId={activeSeriesId}
						icon={<IconUvIndex aria-hidden size={18} />}
						label={<Trans>Peak UV</Trans>}
						onSeriesFocus={setActiveSeriesId}
						seriesId="uv"
						value={
							<Trans>
								{Math.round(peakUv.value)} at{' '}
								{formatHour(data[peakUv.index]?.time)}
							</Trans>
						}
					/>
					<Metric
						activeSeriesId={activeSeriesId}
						icon={<IconEye aria-hidden size={18} />}
						label={<Trans>Lowest visibility</Trans>}
						onSeriesFocus={setActiveSeriesId}
						seriesId="visibility"
						value={
							<Trans>
								{formatDecimal(lowestVisibility.value)} {visibilityUnitLabel} at{' '}
								{formatHour(data[lowestVisibility.index]?.time)}
							</Trans>
						}
					/>
					<Metric
						activeSeriesId={activeSeriesId}
						icon={<IconEye aria-hidden size={18} />}
						label={<Trans>Clearest hour</Trans>}
						onSeriesFocus={setActiveSeriesId}
						seriesId="visibility"
						value={
							<Trans>
								{formatDecimal(bestVisibility.value)} {visibilityUnitLabel} at{' '}
								{formatHour(data[bestVisibility.index]?.time)}
							</Trans>
						}
					/>
				</>
			}
			title={<Trans>Conditions</Trans>}
		>
			<ChartFrame
				endLabel={endLabel}
				leftLabels={getScaleLabels({ scale: uvScale, unitLabel: '' })}
				rightLabels={getScaleLabels({
					scale: visibilityScale,
					unitLabel: visibilityUnitLabel,
				})}
				startLabel={startLabel}
			>
				<LineChart
					accentClassName="stroke-violet-300"
					activeSeriesId={activeSeriesId}
					onSeriesFocus={setActiveSeriesId}
					points={uv}
					primarySeriesId="uv"
					primarySeriesLabel="UV"
					primaryValueFormatter={formatDecimal}
					scale={uvScale}
					secondaryAccentClassName="stroke-emerald-300"
					secondaryPoints={visibility}
					secondaryScale={visibilityScale}
					secondarySeriesId="visibility"
					secondarySeriesLabel="Visibility"
					secondaryValueFormatter={(value) =>
						`${formatDecimal(value)} ${visibilityUnitLabel}`
					}
					times={times}
				/>
			</ChartFrame>
		</DetailViewShell>
	)
}

const DetailViewShell = ({
	accentClassName,
	children,
	icon,
	isActive,
	kicker,
	metrics,
	title,
}: Readonly<DetailViewShellProps>) => (
	<section
		aria-hidden={!isActive}
		className="flex h-full w-full flex-col justify-center overflow-hidden px-6 py-10 text-white md:px-12"
	>
		<div className="mx-auto grid h-full w-full max-w-6xl grid-rows-[auto_minmax(0,1fr)] gap-7">
			<div className="flex items-center gap-3">
				<span className={accentClassName}>{icon}</span>
				<div>
					<p className="text-xs font-semibold tracking-[0.18em] text-dark-300 uppercase">
						{kicker}
					</p>
					<h2 className="text-4xl font-bold text-white md:text-5xl">{title}</h2>
				</div>
			</div>
			<div className="grid min-h-0 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
				<div className="min-w-0">{children}</div>
				<div className="grid gap-4">{metrics}</div>
			</div>
		</div>
	</section>
)

const Metric = ({
	activeSeriesId = null,
	icon,
	label,
	onSeriesFocus,
	seriesId,
	value,
}: Readonly<MetricProps>) => {
	const isHighlighted = Boolean(seriesId) && activeSeriesId === seriesId
	const shouldDim = Boolean(activeSeriesId) && !isHighlighted

	const handleMouseEnter = () => {
		if (seriesId) {
			onSeriesFocus?.(seriesId)
		}
	}

	const handleMouseLeave = () => {
		if (seriesId) {
			onSeriesFocus?.(null)
		}
	}

	return (
		<div
			className={`grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-3 border-t border-white/8 pt-4 transition-opacity ${
				shouldDim ? 'opacity-40' : 'opacity-100'
			}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<span className={isHighlighted ? 'text-white' : 'text-dark-200'}>
				{icon}
			</span>
			<span className="min-w-0">
				<span
					className={`block text-xs font-medium ${
						isHighlighted ? 'text-white' : 'text-dark-300'
					}`}
				>
					{label}
				</span>
				<span
					className={`block text-lg font-semibold ${
						isHighlighted ? 'text-white' : 'text-dark-100'
					}`}
				>
					{value}
				</span>
			</span>
		</div>
	)
}

const ChartFrame = ({
	children,
	endLabel,
	leftLabels,
	rightLabels,
	startLabel,
}: Readonly<ChartFrameProps>) => (
	<div>
		<div
			className={
				rightLabels
					? 'grid grid-cols-[3.5rem_minmax(0,1fr)_3rem] gap-3'
					: 'grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3'
			}
		>
			<AxisLabels labels={leftLabels} />
			<div className="min-w-0">{children}</div>
			{rightLabels ? <AxisLabels labels={rightLabels} /> : null}
		</div>
		<div
			className={
				rightLabels
					? 'mt-2 grid grid-cols-[3.5rem_minmax(0,1fr)_3rem] gap-3 text-xs text-dark-300'
					: 'mt-2 grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 text-xs text-dark-300'
			}
		>
			<span />
			<div className="flex justify-between">
				<span>{startLabel}</span>
				<span>{endLabel}</span>
			</div>
			{rightLabels ? <span /> : null}
		</div>
	</div>
)

const AxisLabels = ({ labels }: Readonly<{ labels: string[] }>) => (
	<div className="flex h-48 flex-col justify-between py-1 text-right text-xs text-dark-300">
		{labels.map((label) => (
			<span key={label}>{label}</span>
		))}
	</div>
)

const LineChart = ({
	accentClassName,
	activeSeriesId = null,
	onSeriesFocus,
	points,
	primarySeriesId,
	primarySeriesLabel,
	primaryValueFormatter,
	scale,
	secondaryAccentClassName,
	secondaryPoints,
	secondaryScale,
	secondarySeriesId,
	secondarySeriesLabel,
	secondaryValueFormatter,
	times,
}: Readonly<LineChartProps>) => {
	const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null)

	return (
		<div className="relative h-48">
			<svg
				aria-hidden="true"
				className="h-full w-full overflow-visible"
				preserveAspectRatio="none"
				viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
			>
				<ChartGrid />
				{secondaryPoints ? (
					<ChartLine
						activeSeriesId={activeSeriesId}
						className={secondaryAccentClassName}
						onSeriesFocus={onSeriesFocus}
						onTooltipChange={setTooltip}
						points={secondaryPoints}
						scale={secondaryScale ?? scale}
						seriesId={secondarySeriesId}
						seriesLabel={secondarySeriesLabel ?? primarySeriesLabel}
						strokeWidth={2}
						times={times}
						valueFormatter={secondaryValueFormatter ?? primaryValueFormatter}
					/>
				) : null}
				<ChartLine
					activeSeriesId={activeSeriesId}
					className={accentClassName}
					onSeriesFocus={onSeriesFocus}
					onTooltipChange={setTooltip}
					points={points}
					scale={scale}
					seriesId={primarySeriesId}
					seriesLabel={primarySeriesLabel}
					strokeWidth={2.5}
					times={times}
					valueFormatter={primaryValueFormatter}
				/>
			</svg>
			<ChartTooltip tooltip={tooltip} />
		</div>
	)
}

type ChartLineProps = {
	activeSeriesId: null | WeatherDetailSeriesId
	className?: string
	onSeriesFocus?: (seriesId: null | WeatherDetailSeriesId) => void
	onTooltipChange: (tooltip: ChartTooltipState | null) => void
	points: number[]
	scale: Required<ChartScale>
	seriesId?: WeatherDetailSeriesId
	seriesLabel: string
	strokeWidth: number
	times: number[]
	valueFormatter: (value: number) => string
}

const ChartLine = ({
	activeSeriesId,
	className,
	onSeriesFocus,
	onTooltipChange,
	points,
	scale,
	seriesId,
	seriesLabel,
	strokeWidth,
	times,
	valueFormatter,
}: Readonly<ChartLineProps>) => {
	const isHighlighted = Boolean(seriesId) && activeSeriesId === seriesId
	const shouldDim = Boolean(activeSeriesId) && !isHighlighted
	const path = getLinePath(points, scale)

	const handleMouseEnter = () => {
		if (seriesId) {
			onSeriesFocus?.(seriesId)
		}
	}

	const handlePointerMove = (event: PointerEvent<SVGGElement>) => {
		const svg = event.currentTarget.ownerSVGElement
		if (!svg) {
			return
		}

		const rect = svg.getBoundingClientRect()
		const x = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH
		const index = getNearestPointIndex({ pointCount: points.length, x })
		const value = points[index]
		const time = times[index]

		if (typeof value !== 'number' || typeof time !== 'number') {
			onTooltipChange(null)
			return
		}

		onTooltipChange({
			seriesLabel,
			time,
			value: valueFormatter(value),
			x: getChartX(index, points.length),
			y: getChartY(value, scale),
		})
	}

	const handlePointerLeave = () => {
		if (seriesId) {
			onSeriesFocus?.(null)
		}
		onTooltipChange(null)
	}

	return (
		<g
			onMouseEnter={handleMouseEnter}
			onPointerLeave={handlePointerLeave}
			onPointerMove={handlePointerMove}
		>
			<path
				className="stroke-transparent"
				d={path}
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="12"
			/>
			<path
				className={`${className ?? ''} transition-opacity ${
					shouldDim ? 'opacity-30' : 'opacity-100'
				}`}
				d={path}
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={isHighlighted ? strokeWidth + 0.75 : strokeWidth}
			/>
		</g>
	)
}

const ChartTooltip = ({
	tooltip,
}: Readonly<{ tooltip: ChartTooltipState | null }>) => {
	if (!tooltip) {
		return null
	}

	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute z-10 rounded-md border border-white/10 bg-dark-950/90 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg backdrop-blur-md"
			style={{
				left: `${(tooltip.x / CHART_WIDTH) * 100}%`,
				top: `${(tooltip.y / CHART_HEIGHT) * 100}%`,
				transform: 'translate(-50%, calc(-100% - 0.5rem))',
			}}
		>
			<span className="block font-semibold text-white">{tooltip.value}</span>
			<span className="block text-dark-300">
				{tooltip.seriesLabel} · {formatTooltipTime(tooltip.time)}
			</span>
		</div>
	)
}

const PrecipitationChart = ({
	amountPoints,
	probabilityPoints,
	times,
}: Readonly<PrecipitationChartProps>) => {
	const amountScale = getChartScale(amountPoints, { minValue: 0 })
	const probabilityScale = { maxValue: 100, minValue: 0 }
	const barWidth = CHART_WIDTH / Math.max(1, amountPoints.length) - 2
	const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null)

	return (
		<div className="relative h-48">
			<svg
				aria-hidden="true"
				className="h-full w-full overflow-visible"
				preserveAspectRatio="none"
				viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
			>
				<ChartGrid />
				{amountPoints.map((point, index) => {
					const y = getChartY(point, amountScale)
					const x = getChartX(index, amountPoints.length) - barWidth / 2
					return (
						<rect
							className="fill-blue-300/45"
							height={CHART_HEIGHT - CHART_PADDING - y}
							key={`${index}-${point}`}
							rx="2"
							width={Math.max(2, barWidth)}
							x={x}
							y={y}
						/>
					)
				})}
				<ChartLine
					activeSeriesId={null}
					className="stroke-blue-100"
					onTooltipChange={setTooltip}
					points={probabilityPoints}
					scale={probabilityScale}
					seriesId="precipitationProbability"
					seriesLabel="Rain chance"
					strokeWidth={2.5}
					times={times}
					valueFormatter={(value) => `${Math.round(value)}%`}
				/>
			</svg>
			<ChartTooltip tooltip={tooltip} />
		</div>
	)
}

const ChartGrid = () => (
	<>
		<line
			className="stroke-white/8"
			x1="0"
			x2={CHART_WIDTH}
			y1={CHART_PADDING}
			y2={CHART_PADDING}
		/>
		<line
			className="stroke-white/8"
			x1="0"
			x2={CHART_WIDTH}
			y1={CHART_HEIGHT / 2}
			y2={CHART_HEIGHT / 2}
		/>
		<line
			className="stroke-white/8"
			x1="0"
			x2={CHART_WIDTH}
			y1={CHART_HEIGHT - CHART_PADDING}
			y2={CHART_HEIGHT - CHART_PADDING}
		/>
	</>
)

const getChartScale = (
	points: number[],
	{ maxValue, minValue }: ChartScale = {},
): Required<ChartScale> => {
	const pointMinValue = min(points)
	const pointMaxValue = max(points)
	const nextMinValue = minValue ?? pointMinValue
	const nextMaxValue = maxValue ?? pointMaxValue

	if (nextMinValue === nextMaxValue) {
		if (typeof minValue === 'number') {
			return {
				maxValue: nextMaxValue + 1,
				minValue,
			}
		}

		if (typeof maxValue === 'number') {
			return {
				maxValue,
				minValue: nextMinValue - 1,
			}
		}

		return {
			maxValue: nextMaxValue + 1,
			minValue: nextMinValue - 1,
		}
	}

	return {
		maxValue: nextMaxValue,
		minValue: nextMinValue,
	}
}

const getScaleLabels = ({
	scale,
	unitLabel,
}: {
	scale: Required<ChartScale>
	unitLabel: string
}) => {
	const middle = (scale.maxValue + scale.minValue) / 2
	return [scale.maxValue, middle, scale.minValue].map(
		(value) => `${formatAxisValue(value)}${unitLabel}`,
	)
}

const getLinePath = (points: number[], scale: Required<ChartScale>) => {
	if (points.length === 0) {
		return ''
	}

	const chartPoints = points.map((point, index) => ({
		x: getChartX(index, points.length),
		y: getChartY(point, scale),
	}))

	if (chartPoints.length === 1) {
		return `M ${chartPoints[0].x} ${chartPoints[0].y}`
	}

	return chartPoints.slice(1).reduce((path, point, index) => {
		const previousPoint = chartPoints[index]
		const pointBeforePrevious = chartPoints[index - 1] ?? previousPoint
		const nextPoint = chartPoints[index + 2] ?? point
		const firstControlPoint = {
			x:
				previousPoint.x +
				(point.x - pointBeforePrevious.x) * CHART_SPLINE_TENSION,
			y:
				previousPoint.y +
				(point.y - pointBeforePrevious.y) * CHART_SPLINE_TENSION,
		}
		const secondControlPoint = {
			x: point.x - (nextPoint.x - previousPoint.x) * CHART_SPLINE_TENSION,
			y: point.y - (nextPoint.y - previousPoint.y) * CHART_SPLINE_TENSION,
		}

		return `${path} C ${firstControlPoint.x} ${firstControlPoint.y}, ${secondControlPoint.x} ${secondControlPoint.y}, ${point.x} ${point.y}`
	}, `M ${chartPoints[0].x} ${chartPoints[0].y}`)
}

const getChartX = (index: number, pointCount: number) => {
	if (pointCount <= 1) {
		return CHART_WIDTH / 2
	}

	return (index / (pointCount - 1)) * CHART_WIDTH
}

const getNearestPointIndex = ({
	pointCount,
	x,
}: {
	pointCount: number
	x: number
}) => {
	if (pointCount <= 1) {
		return 0
	}

	const normalizedX = Math.min(Math.max(x, 0), CHART_WIDTH)
	return Math.round((normalizedX / CHART_WIDTH) * (pointCount - 1))
}

const getChartY = (
	point: number,
	{ maxValue, minValue }: Required<ChartScale>,
) => {
	if (maxValue === minValue) {
		return CHART_HEIGHT / 2
	}

	const normalized = (point - minValue) / (maxValue - minValue)
	return (
		CHART_HEIGHT -
		CHART_PADDING -
		normalized * (CHART_HEIGHT - CHART_PADDING * 2)
	)
}

const getPeakPoint = (points: number[]): PointSummary => {
	const value = max(points)
	return { index: points.indexOf(value), value }
}

const getLowPoint = (points: number[]): PointSummary => {
	const value = min(points)
	return { index: points.indexOf(value), value }
}

const convertTemperature = ({
	temperature,
	usesMetricTemperature,
}: {
	temperature: number
	usesMetricTemperature: boolean
}) => (usesMetricTemperature ? temperature : (temperature * 9) / 5 + 32)

const convertWind = ({
	usesMetricUnits,
	wind,
}: {
	usesMetricUnits: boolean
	wind: number
}) => (usesMetricUnits ? wind : wind / 1.609344)

const convertVisibility = ({
	usesMetricUnits,
	visibility,
}: {
	usesMetricUnits: boolean
	visibility: number
}) => (usesMetricUnits ? visibility / 1000 : visibility / 1609.344)

const formatAxisValue = (value: number) =>
	Math.abs(value) >= 10 ? Math.round(value).toString() : value.toFixed(1)

const formatDecimal = (value: number) =>
	value >= 10 ? Math.round(value).toString() : value.toFixed(1)

const formatHour = (time?: number) => {
	if (typeof time !== 'number') {
		return ''
	}

	return new Intl.DateTimeFormat('en', { hour: 'numeric' }).format(
		new Date(time * 1000),
	)
}

const formatTooltipTime = (time: number) =>
	new Intl.DateTimeFormat('en', {
		hour: 'numeric',
		weekday: 'short',
	}).format(new Date(time * 1000))

const max = (points: number[]) =>
	points.reduce((currentMax, point) => Math.max(currentMax, point), -Infinity)

const min = (points: number[]) =>
	points.reduce((currentMin, point) => Math.min(currentMin, point), Infinity)

const sum = (points: number[]) =>
	points.reduce((total, point) => total + point, 0)

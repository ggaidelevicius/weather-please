import type {
	ChartFrameProps,
	AnimatedNumberProps,
	LineChartProps,
	ChartLineProps,
	PrecipitationChartProps,
	ChartTooltipState,
} from '../../model/detail-types'
import type { ReactNode, PointerEvent } from 'react'
import { useState, useEffect } from 'react'
import {
	useMotionValue,
	useSpring,
	useReducedMotion,
	useMotionValueEvent,
} from 'framer-motion'
import { Trans } from '@lingui/react/macro'
import {
	CHART_HEIGHT,
	CHART_WIDTH,
	CHART_PADDING,
	getLinePath,
	getNearestPointIndex,
	getChartX,
	getChartY,
} from '../../model/chart-geometry'
import { WeekdayHourLabel } from '../details/detail-shell'

export const ChartFrame = ({
	children,
	endLabel,
	leftLabels,
	middleLabel,
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
				<span>{middleLabel}</span>
				<span>{endLabel}</span>
			</div>
			{rightLabels ? <span /> : null}
		</div>
	</div>
)

export const AxisLabels = ({ labels }: Readonly<{ labels: string[] }>) => (
	<div className="flex h-48 flex-col justify-between py-1 text-right text-xs text-dark-300">
		{labels.map((label) => (
			<span key={label}>{label}</span>
		))}
	</div>
)

export const EmptyChartState = ({ label }: Readonly<{ label: ReactNode }>) => (
	<div className="flex h-48 items-center justify-center border-y border-white/8 text-sm font-medium text-dark-300">
		{label}
	</div>
)

export const AnimatedNumber = ({
	maximumFractionDigits = 0,
	minimumFractionDigits = 0,
	value,
}: Readonly<AnimatedNumberProps>) => {
	const sourceValue = useMotionValue(value)
	const springValue = useSpring(sourceValue, {
		damping: 24,
		mass: 0.45,
		stiffness: 180,
	})
	const shouldReduceMotion = useReducedMotion()
	const displayedMotionValue = shouldReduceMotion ? sourceValue : springValue
	const [displayedValue, setDisplayedValue] = useState(() =>
		formatAnimatedNumber({
			maximumFractionDigits,
			minimumFractionDigits,
			value,
		}),
	)

	useMotionValueEvent(displayedMotionValue, 'change', (latestValue) => {
		setDisplayedValue(
			formatAnimatedNumber({
				maximumFractionDigits,
				minimumFractionDigits,
				value: latestValue,
			}),
		)
	})

	useEffect(() => {
		sourceValue.set(value)
	}, [sourceValue, value])

	return <span>{displayedValue}</span>
}

export const formatAnimatedNumber = ({
	maximumFractionDigits,
	minimumFractionDigits,
	value,
}: Required<AnimatedNumberProps>) =>
	new Intl.NumberFormat(undefined, {
		maximumFractionDigits,
		minimumFractionDigits,
	}).format(value)

export const LineChart = ({
	accentClassName,
	accentStyle,
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
					style={accentStyle}
					times={times}
					valueFormatter={primaryValueFormatter}
				/>
			</svg>
			<ChartTooltip tooltip={tooltip} />
		</div>
	)
}

export const ChartLine = ({
	activeSeriesId,
	className,
	onSeriesFocus,
	onTooltipChange,
	points,
	scale,
	seriesId,
	seriesLabel,
	strokeWidth,
	style,
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
				style={style}
			/>
		</g>
	)
}

export const ChartTooltip = ({
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
				{tooltip.seriesLabel} · <WeekdayHourLabel time={tooltip.time} />
			</span>
		</div>
	)
}

export const PrecipitationChart = ({
	activeSeriesId = null,
	amountPoints,
	amountScale,
	amountValueFormatter,
	onSeriesFocus,
	probabilityPoints,
	times,
}: Readonly<PrecipitationChartProps>) => {
	const probabilityScale = { maxValue: 100, minValue: 0 }
	const barWidth = CHART_WIDTH / Math.max(1, amountPoints.length) - 2
	const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null)
	const isAmountHighlighted = activeSeriesId === 'precipitationAmount'
	const shouldDimAmount = Boolean(activeSeriesId) && !isAmountHighlighted

	const handleAmountMouseEnter = () => {
		onSeriesFocus?.('precipitationAmount')
	}

	const handleAmountMouseLeave = () => {
		onSeriesFocus?.(null)
		setTooltip(null)
	}

	const handleAmountPointerMove = (event: PointerEvent<SVGGElement>) => {
		const svg = event.currentTarget.ownerSVGElement
		if (!svg) {
			return
		}

		const rect = svg.getBoundingClientRect()
		const x = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH
		const index = getNearestPointIndex({ pointCount: amountPoints.length, x })
		const value = amountPoints[index]
		const time = times[index]

		if (typeof value !== 'number' || typeof time !== 'number') {
			setTooltip(null)
			return
		}

		setTooltip({
			seriesLabel: <Trans>Total precipitation</Trans>,
			time,
			value: amountValueFormatter(value),
			x: getChartX(index, amountPoints.length),
			y: getChartY(value, amountScale),
		})
	}

	return (
		<div className="relative h-48">
			<svg
				aria-hidden="true"
				className="h-full w-full overflow-visible"
				preserveAspectRatio="none"
				viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
			>
				<ChartGrid />
				<g
					onMouseEnter={handleAmountMouseEnter}
					onMouseLeave={handleAmountMouseLeave}
					onPointerMove={handleAmountPointerMove}
				>
					{amountPoints.map((point, index) => {
						const y = getChartY(point, amountScale)
						const x = getChartX(index, amountPoints.length) - barWidth / 2
						return (
							<rect
								className={`fill-cyan-300/60 transition-opacity ${
									shouldDimAmount ? 'opacity-30' : 'opacity-100'
								}`}
								height={CHART_HEIGHT - CHART_PADDING - y}
								key={`${index}-${point}`}
								rx="2"
								width={Math.max(2, barWidth)}
								x={x}
								y={y}
							/>
						)
					})}
				</g>
				<ChartLine
					activeSeriesId={activeSeriesId}
					className="stroke-sky-300"
					onSeriesFocus={onSeriesFocus}
					onTooltipChange={setTooltip}
					points={probabilityPoints}
					scale={probabilityScale}
					seriesId="precipitationProbability"
					seriesLabel={<Trans>Precipitation chance</Trans>}
					strokeWidth={2.5}
					times={times}
					valueFormatter={(value) => `${Math.round(value)}%`}
				/>
			</svg>
			<ChartTooltip tooltip={tooltip} />
		</div>
	)
}

export const ChartGrid = () => (
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

import { Trans } from '@lingui/react/macro'
import {
	IconCloudRain,
	IconEye,
	IconMap2,
	IconTemperature,
	IconUvIndex,
	IconWind,
} from '@tabler/icons-react'
import {
	type PointerEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from 'react'

import type { Next24HoursData, WeatherMapData } from '../model/types'

import { TemperatureUnit, UnitSystem } from '../../settings/model/unit-system'

const CHART_HEIGHT = 150
const CHART_WIDTH = 360
const CHART_PADDING = 10
const CHART_SPLINE_TENSION = 0.16
const FEELS_LIKE_DEW_POINT_THRESHOLD_C = 16
const FEELS_LIKE_HUMIDITY_THRESHOLD = 65
const FEELS_LIKE_MIN_DELTA_C = 1.5
const FEELS_LIKE_SOLAR_RADIATION_THRESHOLD = 250
const FEELS_LIKE_WARM_TEMPERATURE_C = 20
const FEELS_LIKE_WIND_THRESHOLD_KMH = 12
const PRECIPITATION_CHART_DEFAULT_MAX_MM = 5
const UV_CHART_DEFAULT_MAX = 15
const VISIBILITY_CHART_DEFAULT_MAX_METERS = 10_000
const WIND_CHART_DEFAULT_MAX_KMH = 40
const WEATHER_MAP_BASE_HEIGHT = 260
const WEATHER_MAP_FRAME_DURATION_MS = 4200
const WEATHER_MAP_PARTICLE_DENSITY = 0.00011
const WEATHER_MAP_PARTICLE_FRAME_MS = 1000 / 60
const WEATHER_MAP_PARTICLE_MAX_FRAME_MULTIPLIER = 2
const WEATHER_MAP_PARTICLE_TRAIL_ALPHA = 0.9
const WEATHER_MAP_PRECIPITATION_FRAME_INTERVAL_MS = 66
const WEATHER_MAP_PRECIPITATION_MESH_CELL_SIZE = 8
const WEATHER_MAP_PRECIPITATION_MIN_VISIBLE = 0.08
const WEATHER_MAP_TOOLTIP_FRAME_INTERVAL_MS = 66
const WEATHER_MAP_RENDER_SCALE = 2
const WEATHER_MAP_TILE_SIZE = 256
const WEATHER_MAP_ZOOM = 9

const WEATHER_MAP_PRECIPITATION_BANDS = [
	{ blue: 0, green: 0, label: '', precipitation: 0, red: 0 },
	{ blue: 255, green: 247, label: '0.1', precipitation: 0.1, red: 224 },
	{ blue: 246, green: 223, label: '0.5', precipitation: 0.5, red: 137 },
	{ blue: 222, green: 183, label: '1', precipitation: 1, red: 68 },
	{ blue: 169, green: 111, label: '2', precipitation: 2, red: 17 },
	{ blue: 91, green: 48, label: '5', precipitation: 5, red: 5 },
	{ blue: 24, green: 9, label: '10+', precipitation: 10, red: 2 },
]

export const NEXT_24_HOURS_DETAIL_VIEW_IDS = [
	'temperature',
	'precipitation',
	'wind',
	'conditions',
	'map',
] as const

export type Next24HoursDetailViewId =
	(typeof NEXT_24_HOURS_DETAIL_VIEW_IDS)[number]

type ChartFrameProps = {
	children: ReactNode
	endLabel: ReactNode
	leftLabels: string[]
	middleLabel: ReactNode
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
	footer?: ReactNode
	icon: ReactNode
	isActive: boolean
	kicker: ReactNode
	metrics: ReactNode
	title: ReactNode
}

type FeelsLikeExplanationProps = {
	apparentTemperature?: number
	dewPoint?: number
	humidity?: number
	shortwaveRadiation?: number
	temperature?: number
	wind?: number
}

type HourIntervalLabelProps = {
	index: number
	referenceTime?: number
	times: number[]
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
	weatherMapData: null | WeatherMapData
}

type PointSummary = {
	index: number
	value: number
}

type PrecipitationChartProps = {
	activeSeriesId?: null | WeatherDetailSeriesId
	amountPoints: number[]
	amountScale: Required<ChartScale>
	amountValueFormatter: (value: number) => string
	onSeriesFocus?: (seriesId: null | WeatherDetailSeriesId) => void
	probabilityPoints: number[]
	times: number[]
}

type RelativeHourLabelProps = {
	referenceTime?: number
	time?: number
}

type WeatherDetailSeriesId =
	| 'precipitationAmount'
	| 'precipitationProbability'
	| 'temperature'
	| 'uv'
	| 'visibility'
	| 'wind'
	| 'windGust'

type WeatherMapDimensions = {
	height: number
	width: number
}

type WeatherMapDisplaySize = {
	height: number
	width: number
}

type WeatherMapParticle = {
	age: number
	x: number
	y: number
}

type WeatherMapPlaybackState = {
	frameIndex: number
	framePosition: number
	frameProgress: number
	time: number
	totalProgress: number
}

type WeatherMapPointerPoint = {
	x: number
	y: number
}

type WeatherMapPointerWeather = {
	precipitation: number
	probability: number
	windSpeed: number
}

type WeatherMapProjectedPrecipitationPoint = {
	precipitation: number
	probability: number
	x: number
	y: number
}

type WeatherMapProjectedWindPoint = {
	direction: number
	speed: number
	x: number
	y: number
}

type WeatherMapTile = {
	key: string
	url: string
	x: number
	y: number
}

type WeatherMapViewport = {
	centerX: number
	centerY: number
	dimensions: WeatherMapDimensions
}

export const Next24HoursDetailView = ({
	data,
	isActive,
	temperatureUnit,
	unitSystem,
	viewId,
	weatherMapData,
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
	const precipitation = data.map(({ precipitation }) =>
		convertPrecipitation({ precipitation, usesMetricUnits }),
	)
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
	const precipitationUnitLabel = usesMetricUnits ? 'mm' : 'in'
	const windUnitLabel = usesMetricUnits ? 'km/h' : 'mph'
	const visibilityUnitLabel = usesMetricUnits ? 'km' : 'mi'
	const startLabel = formatHour(data[0]?.time)
	const middleLabel = formatHour(data[Math.floor(data.length / 2)]?.time)
	const endLabel = formatHour(data[data.length - 1]?.time)
	const referenceTime = times[0]

	if (viewId === 'temperature') {
		const scale = getChartScale(temperatures)
		const high = getPeakPoint(temperatures)
		const low = getLowPoint(temperatures)
		const currentApparentTemperature = apparentTemperatures[0] ?? 0
		const feelsLikeExplanation = getFeelsLikeExplanation(data[0] ?? {})

		return (
			<DetailViewShell
				accentClassName="text-blue-200"
				footer={feelsLikeExplanation}
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
									{temperatureUnitLabel} at{' '}
									<RelativeHourLabel
										referenceTime={referenceTime}
										time={data[high.index]?.time}
									/>
								</Trans>
							}
						/>
						<Metric
							icon={<IconTemperature aria-hidden size={18} />}
							label={<Trans>Low</Trans>}
							value={
								<Trans>
									{Math.round(low.value)}
									{temperatureUnitLabel} at{' '}
									<RelativeHourLabel
										referenceTime={referenceTime}
										time={data[low.index]?.time}
									/>
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
					middleLabel={middleLabel}
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
		const peakProbability = getPeakPoint(precipitationProbability)
		const peakAmount = getPeakPoint(precipitation)
		const hasPrecipitationChance = peakProbability.value > 0
		const hasMeasurablePrecipitation = peakAmount.value > 0
		const precipitationDefaultMax = convertPrecipitation({
			precipitation: PRECIPITATION_CHART_DEFAULT_MAX_MM,
			usesMetricUnits,
		})
		const amountScale = getChartScale(precipitation, {
			maxValue: Math.max(precipitationDefaultMax, peakAmount.value),
			minValue: 0,
		})

		return (
			<DetailViewShell
				accentClassName="text-blue-200"
				footer={<Trans>Precipitation includes rain and snow.</Trans>}
				icon={<IconCloudRain aria-hidden size={22} />}
				isActive={isActive}
				kicker={<Trans>Next 24 hours</Trans>}
				metrics={
					<>
						<Metric
							activeSeriesId={activeSeriesId}
							icon={<IconCloudRain aria-hidden size={18} />}
							label={<Trans>Total precipitation</Trans>}
							onSeriesFocus={setActiveSeriesId}
							seriesId="precipitationAmount"
							value={
								<Trans>
									{formatPrecipitationValue({
										precipitation: sum(precipitation),
										usesMetricUnits,
									})}
								</Trans>
							}
						/>
						<Metric
							activeSeriesId={activeSeriesId}
							icon={<IconCloudRain aria-hidden size={18} />}
							label={
								hasPrecipitationChance ? (
									<Trans>Peak chance</Trans>
								) : (
									<Trans>Precipitation chance</Trans>
								)
							}
							onSeriesFocus={setActiveSeriesId}
							seriesId="precipitationProbability"
							value={
								hasPrecipitationChance ? (
									<Trans>
										{Math.round(peakProbability.value)}% at{' '}
										<RelativeHourLabel
											referenceTime={referenceTime}
											time={data[peakProbability.index]?.time}
										/>
									</Trans>
								) : (
									<Trans>No precipitation expected</Trans>
								)
							}
						/>
						<Metric
							activeSeriesId={activeSeriesId}
							icon={<IconCloudRain aria-hidden size={18} />}
							label={
								hasMeasurablePrecipitation ? (
									<Trans>Heaviest hour</Trans>
								) : (
									<Trans>Precipitation</Trans>
								)
							}
							onSeriesFocus={setActiveSeriesId}
							seriesId="precipitationAmount"
							value={
								hasMeasurablePrecipitation ? (
									<Trans>
										{formatPrecipitationValue({
											precipitation: peakAmount.value,
											usesMetricUnits,
										})}{' '}
										between{' '}
										<HourIntervalLabel
											index={peakAmount.index}
											referenceTime={referenceTime}
											times={times}
										/>
									</Trans>
								) : (
									<Trans>No measurable precipitation expected</Trans>
								)
							}
						/>
					</>
				}
				title={<Trans>Precipitation</Trans>}
			>
				<ChartFrame
					endLabel={endLabel}
					leftLabels={getScaleLabels({
						scale: amountScale,
						unitLabel: precipitationUnitLabel,
					})}
					middleLabel={middleLabel}
					rightLabels={getScaleLabels({
						scale: probabilityScale,
						unitLabel: '%',
					})}
					startLabel={startLabel}
				>
					<PrecipitationChart
						activeSeriesId={activeSeriesId}
						amountPoints={precipitation}
						amountScale={amountScale}
						amountValueFormatter={(value) =>
							formatPrecipitationValue({
								precipitation: value,
								usesMetricUnits,
							})
						}
						onSeriesFocus={setActiveSeriesId}
						probabilityPoints={precipitationProbability}
						times={times}
					/>
				</ChartFrame>
			</DetailViewShell>
		)
	}

	if (viewId === 'map') {
		return (
			<WeatherMapDetail
				isActive={isActive}
				usesMetricUnits={usesMetricUnits}
				weatherMapData={weatherMapData}
				windUnitLabel={windUnitLabel}
			/>
		)
	}

	if (viewId === 'wind') {
		const windDefaultMax = convertWind({
			usesMetricUnits,
			wind: WIND_CHART_DEFAULT_MAX_KMH,
		})
		const scale = getChartScale([...wind, ...windGust], {
			maxValue: Math.max(windDefaultMax, max([...wind, ...windGust])),
			minValue: 0,
		})
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
									<RelativeHourLabel
										referenceTime={referenceTime}
										time={data[peakWind.index]?.time}
									/>
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
									<RelativeHourLabel
										referenceTime={referenceTime}
										time={data[peakGust.index]?.time}
									/>
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
					middleLabel={middleLabel}
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

	const uvScale = getChartScale(uv, {
		maxValue: Math.max(UV_CHART_DEFAULT_MAX, max(uv)),
		minValue: 0,
	})
	const visibilityDefaultMax = convertVisibility({
		usesMetricUnits,
		visibility: VISIBILITY_CHART_DEFAULT_MAX_METERS,
	})
	const visibilityScale = getChartScale(visibility, {
		maxValue: Math.max(visibilityDefaultMax, max(visibility)),
		minValue: 0,
	})
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
								<RelativeHourLabel
									referenceTime={referenceTime}
									time={data[peakUv.index]?.time}
								/>
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
								<RelativeHourLabel
									referenceTime={referenceTime}
									time={data[lowestVisibility.index]?.time}
								/>
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
								<RelativeHourLabel
									referenceTime={referenceTime}
									time={data[bestVisibility.index]?.time}
								/>
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
				middleLabel={middleLabel}
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
	footer,
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
				<div className="grid">{metrics}</div>
			</div>
			<div className="flex min-h-16 items-start">
				{footer ? <p className="text-sm text-dark-300">{footer}</p> : null}
			</div>
		</div>
	</section>
)

const getFeelsLikeExplanation = ({
	apparentTemperature,
	dewPoint,
	humidity,
	shortwaveRadiation,
	temperature,
	wind,
}: Readonly<FeelsLikeExplanationProps>) => {
	if (
		typeof apparentTemperature !== 'number' ||
		typeof temperature !== 'number'
	) {
		return null
	}

	const delta = apparentTemperature - temperature
	if (Math.abs(delta) < FEELS_LIKE_MIN_DELTA_C) {
		return null
	}

	const isFeelingWarmer = delta > 0
	const isWarm = temperature >= FEELS_LIKE_WARM_TEMPERATURE_C
	const hasHumidAir =
		typeof dewPoint === 'number' &&
		dewPoint >= FEELS_LIKE_DEW_POINT_THRESHOLD_C &&
		typeof humidity === 'number' &&
		humidity >= FEELS_LIKE_HUMIDITY_THRESHOLD
	const hasStrongSun =
		typeof shortwaveRadiation === 'number' &&
		shortwaveRadiation >= FEELS_LIKE_SOLAR_RADIATION_THRESHOLD
	const hasCoolingWind =
		typeof wind === 'number' && wind >= FEELS_LIKE_WIND_THRESHOLD_KMH

	if (isFeelingWarmer && isWarm && hasHumidAir && hasStrongSun) {
		return (
			<Trans>
				Humid air and direct sunlight are making it feel warmer than the
				measured temperature right now.
			</Trans>
		)
	}

	if (isFeelingWarmer && isWarm && hasHumidAir) {
		return (
			<Trans>
				Humid air is making it feel warmer than the measured temperature right
				now.
			</Trans>
		)
	}

	if (isFeelingWarmer && hasStrongSun) {
		return (
			<Trans>
				Direct sunlight is making it feel warmer than the measured temperature
				right now.
			</Trans>
		)
	}

	if (!isFeelingWarmer && hasCoolingWind) {
		return (
			<Trans>
				Wind is making it feel cooler than the measured temperature right now.
			</Trans>
		)
	}

	return null
}

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
			className={`grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-3 border-t border-white/8 py-4 transition-opacity ${
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

const RelativeHourLabel = ({
	referenceTime,
	time,
}: Readonly<RelativeHourLabelProps>) => {
	if (typeof time !== 'number') {
		return null
	}

	if (typeof referenceTime !== 'number') {
		return formatHour(time)
	}

	const date = new Date(time * 1000)
	const referenceDate = new Date(referenceTime * 1000)
	const tomorrowDate = new Date(referenceDate)
	tomorrowDate.setDate(referenceDate.getDate() + 1)

	if (isSameLocalDate(date, referenceDate)) {
		return <Trans>{formatHour(time)} today</Trans>
	}

	if (isSameLocalDate(date, tomorrowDate)) {
		return <Trans>{formatHour(time)} tomorrow</Trans>
	}

	return formatWeekdayHour(time)
}

const HourIntervalLabel = ({
	index,
	referenceTime,
	times,
}: Readonly<HourIntervalLabelProps>) => {
	const hasNextTime = typeof times[index + 1] === 'number'
	const startTime = hasNextTime ? times[index] : times[index - 1]
	const endTime = hasNextTime ? times[index + 1] : times[index]
	if (typeof startTime !== 'number' || typeof endTime !== 'number') {
		return null
	}

	const startDate = new Date(startTime * 1000)
	const endDate = new Date(endTime * 1000)
	if (typeof referenceTime !== 'number') {
		return (
			<Trans>
				{formatHour(startTime)} and {formatHour(endTime)}
			</Trans>
		)
	}

	const referenceDate = new Date(referenceTime * 1000)
	const tomorrowDate = new Date(referenceDate)
	tomorrowDate.setDate(referenceDate.getDate() + 1)

	if (isSameLocalDate(startDate, endDate)) {
		if (isSameLocalDate(endDate, referenceDate)) {
			return (
				<Trans>
					{formatHour(startTime)} and {formatHour(endTime)} today
				</Trans>
			)
		}

		if (isSameLocalDate(endDate, tomorrowDate)) {
			return (
				<Trans>
					{formatHour(startTime)} and {formatHour(endTime)} tomorrow
				</Trans>
			)
		}
	}

	return (
		<>
			<RelativeHourLabel referenceTime={referenceTime} time={startTime} />{' '}
			<Trans>and</Trans>{' '}
			<RelativeHourLabel referenceTime={referenceTime} time={endTime} />
		</>
	)
}

const ChartFrame = ({
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

const AxisLabels = ({ labels }: Readonly<{ labels: string[] }>) => (
	<div className="flex h-48 flex-col justify-between py-1 text-right text-xs text-dark-300">
		{labels.map((label) => (
			<span key={label}>{label}</span>
		))}
	</div>
)

const WeatherMapDetail = ({
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
	const selectedFrame = getWeatherMapFrame({
		frameIndex: playback.frameIndex,
		weatherMapData,
	})
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
					frame={selectedFrame}
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

const WeatherMap = ({
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
			<div className="flex h-96 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-sm text-dark-200">
				<Trans>Map data unavailable</Trans>
			</div>
		)
	}

	const dimensions = displaySize ? getWeatherMapDimensions(displaySize) : null
	const tiles = dimensions
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
							{formatTooltipTime(playback.time ?? selectedFrame.time)}
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
							© OpenStreetMap
						</a>
					</>
				) : null}
			</div>
			<WeatherMapTimeline frames={weatherMapData.frames} playback={playback} />
		</div>
	)
}

const WeatherMapWindParticleCanvas = ({
	dimensions,
	frames,
	isActive,
	playbackPosition,
	viewport,
}: Readonly<{
	dimensions: WeatherMapDimensions
	frames: WeatherMapData['frames']
	isActive: boolean
	playbackPosition: number
	viewport: WeatherMapViewport
}>) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const framesRef = useRef(frames)
	const playbackPositionRef = useRef(playbackPosition)
	const mapHeight = dimensions.height
	const mapWidth = dimensions.width
	const viewportCenterX = viewport.centerX
	const viewportCenterY = viewport.centerY

	useEffect(() => {
		framesRef.current = frames
	}, [frames])

	useEffect(() => {
		playbackPositionRef.current = playbackPosition
	}, [playbackPosition])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas || !isActive) {
			return
		}

		const context = canvas.getContext('2d')
		if (!context) {
			return
		}

		const animationDimensions = {
			height: mapHeight,
			width: mapWidth,
		}
		const animationViewport = {
			centerX: viewportCenterX,
			centerY: viewportCenterY,
			dimensions: animationDimensions,
		}

		canvas.width = mapWidth
		canvas.height = mapHeight
		context.setTransform(1, 0, 0, 1, 0, 0)

		const overlayScale = getWeatherMapOverlayScale(animationDimensions)
		const particles = createWeatherMapParticles(animationDimensions)
		let animationFrame = 0
		let lastFrameTime = 0

		const draw = (time: number) => {
			const frameMultiplier =
				lastFrameTime === 0
					? 1
					: Math.min(
							WEATHER_MAP_PARTICLE_MAX_FRAME_MULTIPLIER,
							(time - lastFrameTime) / WEATHER_MAP_PARTICLE_FRAME_MS,
						)
			lastFrameTime = time
			const projectedPoints = getInterpolatedWeatherMapWindPoints({
				framePosition: playbackPositionRef.current,
				frames: framesRef.current,
				viewport: animationViewport,
			})
			const maxWind = Math.max(
				1,
				max(projectedPoints.map(({ speed }) => speed)),
			)
			const trailAlpha = Math.pow(
				WEATHER_MAP_PARTICLE_TRAIL_ALPHA,
				frameMultiplier,
			)
			context.globalCompositeOperation = 'destination-in'
			context.fillStyle = `rgba(0, 0, 0, ${trailAlpha})`
			context.fillRect(0, 0, mapWidth, mapHeight)
			context.globalCompositeOperation = 'source-over'
			context.lineCap = 'round'

			for (const particle of particles) {
				const nearestPoint = getNearestWeatherMapWindPoint({
					particle,
					projectedPoints,
				})
				if (!nearestPoint) {
					resetWeatherMapParticle({
						dimensions: animationDimensions,
						particle,
					})
					continue
				}

				const windRatio = nearestPoint.speed / maxWind
				const radians = ((nearestPoint.direction + 180 - 90) * Math.PI) / 180
				const speed = (0.05 + Math.pow(windRatio, 1.85) * 0.74) * overlayScale
				const frameSpeed = speed * frameMultiplier
				const nextX = particle.x + Math.cos(radians) * frameSpeed
				const nextY = particle.y + Math.sin(radians) * frameSpeed

				context.lineWidth = (0.85 + windRatio * 1.25) * overlayScale
				context.strokeStyle = `rgba(236, 254, 255, ${0.18 + windRatio * 0.42})`
				context.beginPath()
				context.moveTo(particle.x, particle.y)
				context.lineTo(nextX, nextY)
				context.stroke()

				particle.x = nextX
				particle.y = nextY
				particle.age += frameMultiplier

				if (
					particle.age > 180 ||
					particle.x < -12 ||
					particle.x > mapWidth + 12 ||
					particle.y < -12 ||
					particle.y > mapHeight + 12
				) {
					resetWeatherMapParticle({
						dimensions: animationDimensions,
						particle,
					})
				}
			}

			animationFrame = window.requestAnimationFrame(draw)
		}

		context.clearRect(0, 0, mapWidth, mapHeight)
		animationFrame = window.requestAnimationFrame(draw)

		return () => {
			window.cancelAnimationFrame(animationFrame)
		}
	}, [isActive, mapHeight, mapWidth, viewportCenterX, viewportCenterY])

	return (
		<canvas
			aria-hidden
			className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen"
			ref={canvasRef}
		/>
	)
}

const WeatherMapPrecipitationCanvas = ({
	dimensions,
	frames,
	isActive,
	playbackPosition,
	viewport,
}: Readonly<{
	dimensions: WeatherMapDimensions
	frames: WeatherMapData['frames']
	isActive: boolean
	playbackPosition: number
	viewport: WeatherMapViewport
}>) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const framesRef = useRef(frames)
	const playbackPositionRef = useRef(playbackPosition)
	const mapHeight = dimensions.height
	const mapWidth = dimensions.width
	const viewportCenterX = viewport.centerX
	const viewportCenterY = viewport.centerY

	useEffect(() => {
		framesRef.current = frames
	}, [frames])

	useEffect(() => {
		playbackPositionRef.current = playbackPosition
	}, [playbackPosition])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas || !isActive) {
			return
		}

		const context = canvas.getContext('2d')
		if (!context) {
			return
		}

		const animationDimensions = {
			height: mapHeight,
			width: mapWidth,
		}
		const animationViewport = {
			centerX: viewportCenterX,
			centerY: viewportCenterY,
			dimensions: animationDimensions,
		}
		const meshDimensions =
			getWeatherMapPrecipitationMeshDimensions(animationDimensions)
		const meshCanvas = document.createElement('canvas')
		const meshContext = meshCanvas.getContext('2d')
		if (!meshContext) {
			return
		}

		let animationFrame = 0

		canvas.width = mapWidth
		canvas.height = mapHeight
		meshCanvas.width = meshDimensions.width
		meshCanvas.height = meshDimensions.height
		context.setTransform(1, 0, 0, 1, 0, 0)

		let lastDrawTime = 0

		const draw = (time: number) => {
			if (time - lastDrawTime < WEATHER_MAP_PRECIPITATION_FRAME_INTERVAL_MS) {
				animationFrame = window.requestAnimationFrame(draw)
				return
			}

			lastDrawTime = time
			const precipitationPoints = getInterpolatedWeatherMapPrecipitationPoints({
				framePosition: playbackPositionRef.current,
				frames: framesRef.current,
				viewport: animationViewport,
			})
			const precipitationImageData = createWeatherMapPrecipitationMeshImageData(
				{
					context: meshContext,
					dimensions: animationDimensions,
					meshDimensions,
					points: precipitationPoints,
				},
			)

			context.clearRect(0, 0, mapWidth, mapHeight)
			context.globalCompositeOperation = 'source-over'
			context.filter = 'none'
			context.imageSmoothingEnabled = true
			meshContext.putImageData(precipitationImageData, 0, 0)
			context.drawImage(meshCanvas, 0, 0, mapWidth, mapHeight)
			animationFrame = window.requestAnimationFrame(draw)
		}

		animationFrame = window.requestAnimationFrame(draw)

		return () => {
			window.cancelAnimationFrame(animationFrame)
		}
	}, [isActive, mapHeight, mapWidth, viewportCenterX, viewportCenterY])

	return (
		<canvas
			aria-hidden
			className="pointer-events-none absolute inset-0 h-full w-full"
			ref={canvasRef}
		/>
	)
}

const WeatherMapTooltip = ({
	dimensions,
	frames,
	isActive,
	playbackPosition,
	point,
	usesMetricUnits,
	viewport,
	windUnitLabel,
}: Readonly<{
	dimensions: WeatherMapDimensions
	frames: WeatherMapData['frames']
	isActive: boolean
	playbackPosition: number
	point: null | WeatherMapPointerPoint
	usesMetricUnits: boolean
	viewport: WeatherMapViewport
	windUnitLabel: string
}>) => {
	const framesRef = useRef(frames)
	const playbackPositionRef = useRef(playbackPosition)
	const [weather, setWeather] = useState<null | WeatherMapPointerWeather>(null)
	const pointX = point?.x ?? 0
	const pointY = point?.y ?? 0

	useEffect(() => {
		framesRef.current = frames
	}, [frames])

	useEffect(() => {
		playbackPositionRef.current = playbackPosition
	}, [playbackPosition])

	useEffect(() => {
		if (!isActive || !point) {
			return
		}

		const animationViewport = {
			centerX: viewport.centerX,
			centerY: viewport.centerY,
			dimensions,
		}
		let animationFrame = 0
		let lastDrawTime = 0

		const updateTooltip = (time: number) => {
			if (time - lastDrawTime >= WEATHER_MAP_TOOLTIP_FRAME_INTERVAL_MS) {
				lastDrawTime = time
				const projectedPoints = getInterpolatedWeatherMapWindPoints({
					framePosition: playbackPositionRef.current,
					frames: framesRef.current,
					viewport: animationViewport,
				})
				const speed = getWeatherMapWindSpeedAtPoint({
					point,
					projectedPoints,
				})
				const precipitation = getWeatherMapPrecipitationAtPoint({
					point,
					projectedPoints: getInterpolatedWeatherMapPrecipitationPoints({
						framePosition: playbackPositionRef.current,
						frames: framesRef.current,
						viewport: animationViewport,
					}),
				})

				if (typeof speed === 'number' && precipitation) {
					setWeather({
						precipitation: convertPrecipitation({
							precipitation: precipitation.precipitation,
							usesMetricUnits,
						}),
						probability: precipitation.probability,
						windSpeed: convertWind({ usesMetricUnits, wind: speed }),
					})
				}
			}

			animationFrame = window.requestAnimationFrame(updateTooltip)
		}

		animationFrame = window.requestAnimationFrame(updateTooltip)

		return () => {
			window.cancelAnimationFrame(animationFrame)
		}
	}, [
		dimensions,
		isActive,
		point,
		usesMetricUnits,
		viewport.centerX,
		viewport.centerY,
	])

	if (!point || !weather) {
		return null
	}

	return (
		<div
			className="pointer-events-none absolute z-10 rounded-md border border-white/10 bg-dark-950/85 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg backdrop-blur-md"
			style={{
				left: `${(pointX / dimensions.width) * 100}%`,
				top: `${(pointY / dimensions.height) * 100}%`,
				transform: 'translate(0.75rem, calc(-100% - 0.75rem))',
			}}
		>
			<dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1">
				<dt className="text-white/55">
					<Trans>Wind</Trans>
				</dt>
				<dd className="text-right font-semibold text-white">
					{Math.round(weather.windSpeed)} {windUnitLabel}
				</dd>
				<dt className="text-white/55">
					<Trans>Chance</Trans>
				</dt>
				<dd className="text-right font-semibold text-white">
					{Math.round(weather.probability)}%
				</dd>
				<dt className="text-white/55">
					<Trans>Depth</Trans>
				</dt>
				<dd className="text-right font-semibold text-white">
					{formatWeatherMapTooltipPrecipitationDepth({
						precipitation: weather.precipitation,
						usesMetricUnits,
					})}
				</dd>
			</dl>
		</div>
	)
}

const WeatherMapCenterMarker = ({
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

const WeatherMapPrecipitationLegend = ({
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

const WeatherMapTimeline = ({
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

const WeatherMapMetrics = ({
	frame,
	usesMetricUnits,
	weatherMapData,
	windUnitLabel,
}: Readonly<{
	frame: null | WeatherMapData['frames'][number]
	usesMetricUnits: boolean
	weatherMapData: null | WeatherMapData
	windUnitLabel: string
}>) => {
	if (!weatherMapData || !frame) {
		return (
			<Metric
				icon={<IconMap2 aria-hidden size={18} />}
				label={<Trans>Map</Trans>}
				value={<Trans>Waiting for map data</Trans>}
			/>
		)
	}

	const windSpeeds = frame.points.map(({ windSpeed }) =>
		convertWind({ usesMetricUnits, wind: windSpeed }),
	)
	const averageWind = average(windSpeeds)
	const peakChance = getPeakPoint(
		frame.points.map(
			({ precipitationProbability }) => precipitationProbability,
		),
	)
	const peakWind = getPeakPoint(windSpeeds)

	return (
		<>
			<Metric
				icon={<IconCloudRain aria-hidden size={18} />}
				label={<Trans>Peak precipitation chance</Trans>}
				value={<Trans>{Math.round(peakChance.value)}%</Trans>}
			/>
			<Metric
				icon={<IconWind aria-hidden size={18} />}
				label={<Trans>Average wind</Trans>}
				value={
					<Trans>
						{Math.round(averageWind)} {windUnitLabel}
					</Trans>
				}
			/>
			<Metric
				icon={<IconWind aria-hidden size={18} />}
				label={<Trans>Peak wind</Trans>}
				value={
					<Trans>
						{Math.round(peakWind.value)} {windUnitLabel}
					</Trans>
				}
			/>
		</>
	)
}

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
			seriesLabel: 'Total precipitation',
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
								className={`fill-blue-300/45 transition-opacity ${
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
					className="stroke-blue-100"
					onSeriesFocus={onSeriesFocus}
					onTooltipChange={setTooltip}
					points={probabilityPoints}
					scale={probabilityScale}
					seriesId="precipitationProbability"
					seriesLabel="Precipitation chance"
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

const convertPrecipitation = ({
	precipitation,
	usesMetricUnits,
}: {
	precipitation: number
	usesMetricUnits: boolean
}) => (usesMetricUnits ? precipitation : precipitation / 25.4)

const convertVisibility = ({
	usesMetricUnits,
	visibility,
}: {
	usesMetricUnits: boolean
	visibility: number
}) => (usesMetricUnits ? visibility / 1000 : visibility / 1609.344)

const formatAxisValue = (value: number) => {
	const absoluteValue = Math.abs(value)

	if (absoluteValue >= 10) {
		return Math.round(value).toString()
	}

	if (absoluteValue > 0 && absoluteValue < 0.1) {
		return value.toFixed(2)
	}

	return value.toFixed(1)
}

const formatDecimal = (value: number) =>
	value >= 10 ? Math.round(value).toString() : value.toFixed(1)

const formatPrecipitationValue = ({
	precipitation,
	usesMetricUnits,
}: {
	precipitation: number
	usesMetricUnits: boolean
}) => {
	if (usesMetricUnits) {
		return `${formatDecimal(precipitation)} mm`
	}

	if (precipitation === 0) {
		return '0.0 in'
	}

	if (precipitation < 0.01) {
		return '<0.01 in'
	}

	return `${precipitation >= 1 ? precipitation.toFixed(1) : precipitation.toFixed(2)} in`
}

const formatHour = (time?: number) => {
	if (typeof time !== 'number') {
		return ''
	}

	return new Intl.DateTimeFormat('en', { hour: 'numeric' }).format(
		new Date(time * 1000),
	)
}

const formatWeekdayHour = (time: number) =>
	new Intl.DateTimeFormat('en', {
		hour: 'numeric',
		weekday: 'short',
	}).format(new Date(time * 1000))

const formatTooltipTime = formatWeekdayHour

const isSameLocalDate = (date: Date, comparisonDate: Date) =>
	date.getFullYear() === comparisonDate.getFullYear() &&
	date.getMonth() === comparisonDate.getMonth() &&
	date.getDate() === comparisonDate.getDate()

const getWeatherMapFrame = ({
	frameIndex,
	weatherMapData,
}: {
	frameIndex: number
	weatherMapData: null | WeatherMapData
}) => {
	if (!weatherMapData || weatherMapData.frames.length === 0) {
		return null
	}

	return (
		weatherMapData.frames[
			Math.min(Math.max(frameIndex, 0), weatherMapData.frames.length - 1)
		] ?? null
	)
}

const projectWeatherMapPoint = ({
	point,
	viewport,
}: {
	point: WeatherMapData['frames'][number]['points'][number]
	viewport: WeatherMapViewport
}) => {
	const { x, y } = coordinateToWeatherMapWorld(point)

	return {
		x: x - viewport.centerX + viewport.dimensions.width / 2,
		y: y - viewport.centerY + viewport.dimensions.height / 2,
	}
}

const getWeatherMapDimensions = ({
	height,
	width,
}: WeatherMapDisplaySize): WeatherMapDimensions => ({
	height: Math.max(1, Math.round(height * WEATHER_MAP_RENDER_SCALE)),
	width: Math.max(1, Math.round(width * WEATHER_MAP_RENDER_SCALE)),
})

const getWeatherMapTiles = ({
	center,
	dimensions,
}: {
	center: WeatherMapData['center']
	dimensions: WeatherMapDimensions
}): WeatherMapTile[] => {
	const viewport = getWeatherMapViewport({ center, dimensions })
	const minTileX = Math.floor(
		(viewport.centerX - dimensions.width / 2) / WEATHER_MAP_TILE_SIZE,
	)
	const maxTileX = Math.floor(
		(viewport.centerX + dimensions.width / 2) / WEATHER_MAP_TILE_SIZE,
	)
	const minTileY = Math.floor(
		(viewport.centerY - dimensions.height / 2) / WEATHER_MAP_TILE_SIZE,
	)
	const maxTileY = Math.floor(
		(viewport.centerY + dimensions.height / 2) / WEATHER_MAP_TILE_SIZE,
	)
	const tiles: WeatherMapTile[] = []

	for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
		for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
			const wrappedTileX = wrapWeatherMapTileX(tileX)
			const clampedTileY = clampWeatherMapTileY(tileY)
			tiles.push({
				key: `${wrappedTileX}-${clampedTileY}`,
				url: `https://tile.openstreetmap.org/${WEATHER_MAP_ZOOM}/${wrappedTileX}/${clampedTileY}.png`,
				x:
					tileX * WEATHER_MAP_TILE_SIZE -
					viewport.centerX +
					dimensions.width / 2,
				y:
					tileY * WEATHER_MAP_TILE_SIZE -
					viewport.centerY +
					dimensions.height / 2,
			})
		}
	}

	return tiles
}

const getWeatherMapViewport = ({
	center,
	dimensions,
}: {
	center: WeatherMapData['center']
	dimensions: WeatherMapDimensions
}): WeatherMapViewport => {
	const { x, y } = coordinateToWeatherMapWorld(center)
	return { centerX: x, centerY: y, dimensions }
}

const getWeatherMapOverlayScale = ({ height }: WeatherMapDimensions) =>
	height / WEATHER_MAP_BASE_HEIGHT

const createWeatherMapParticles = (
	dimensions: WeatherMapDimensions,
): WeatherMapParticle[] =>
	Array.from({ length: getWeatherMapParticleCount(dimensions) }, () =>
		resetWeatherMapParticle({
			dimensions,
			particle: {
				age: 0,
				x: 0,
				y: 0,
			},
		}),
	)

const getWeatherMapParticleCount = ({ height, width }: WeatherMapDimensions) =>
	Math.min(
		240,
		Math.max(150, Math.round(width * height * WEATHER_MAP_PARTICLE_DENSITY)),
	)

const resetWeatherMapParticle = ({
	dimensions,
	particle,
}: {
	dimensions: WeatherMapDimensions
	particle: WeatherMapParticle
}): WeatherMapParticle => {
	particle.age = Math.floor(Math.random() * 140)
	particle.x = Math.random() * dimensions.width
	particle.y = Math.random() * dimensions.height
	return particle
}

const getInterpolatedWeatherMapPrecipitationPoints = ({
	framePosition,
	frames,
	viewport,
}: {
	framePosition: number
	frames: WeatherMapData['frames']
	viewport: WeatherMapViewport
}) => {
	const interpolation = getWeatherMapFrameInterpolation({
		framePosition,
		frames,
	})

	if (!interpolation) {
		return []
	}

	const { fromFrame, progress, toFrame } = interpolation

	return fromFrame.points.flatMap((fromPoint, pointIndex) => {
		const toPoint = toFrame.points[pointIndex]
		if (!toPoint) {
			return []
		}

		const projectedPoint = projectWeatherMapPoint({
			point: fromPoint,
			viewport,
		})

		return {
			precipitation:
				fromPoint.precipitation +
				(toPoint.precipitation - fromPoint.precipitation) * progress,
			probability:
				fromPoint.precipitationProbability +
				(toPoint.precipitationProbability -
					fromPoint.precipitationProbability) *
					progress,
			x: projectedPoint.x,
			y: projectedPoint.y,
		}
	})
}

const getWeatherMapPrecipitationMeshDimensions = ({
	height,
	width,
}: WeatherMapDimensions): WeatherMapDimensions => ({
	height: Math.max(
		24,
		Math.round(height / WEATHER_MAP_PRECIPITATION_MESH_CELL_SIZE),
	),
	width: Math.max(
		48,
		Math.round(width / WEATHER_MAP_PRECIPITATION_MESH_CELL_SIZE),
	),
})

const createWeatherMapPrecipitationMeshImageData = ({
	context,
	dimensions,
	meshDimensions,
	points,
}: {
	context: CanvasRenderingContext2D
	dimensions: WeatherMapDimensions
	meshDimensions: WeatherMapDimensions
	points: WeatherMapProjectedPrecipitationPoint[]
}) => {
	const imageData = context.createImageData(
		meshDimensions.width,
		meshDimensions.height,
	)
	const bands = new Uint8Array(meshDimensions.width * meshDimensions.height)
	const values = new Float32Array(meshDimensions.width * meshDimensions.height)
	const influenceRadius = getWeatherMapPrecipitationInfluenceRadius(points)

	for (let y = 0; y < meshDimensions.height; y += 1) {
		for (let x = 0; x < meshDimensions.width; x += 1) {
			const index = y * meshDimensions.width + x
			const canvasPoint = getWeatherMapPrecipitationMeshPoint({
				dimensions,
				meshDimensions,
				x,
				y,
			})
			const precipitation = getWeatherMapInterpolatedPrecipitation({
				influenceRadius,
				point: canvasPoint,
				points,
			})
			const band = getWeatherMapPrecipitationBand(precipitation)

			bands[index] = band
			values[index] = precipitation
		}
	}

	for (let y = 0; y < meshDimensions.height; y += 1) {
		for (let x = 0; x < meshDimensions.width; x += 1) {
			const index = y * meshDimensions.width + x
			const band = bands[index] ?? 0
			if (band === 0) {
				continue
			}

			const dataIndex = index * 4
			const color = WEATHER_MAP_PRECIPITATION_BANDS[band]
			const precipitation = values[index] ?? 0
			const isEdge = isWeatherMapPrecipitationMeshEdge({
				band,
				bands,
				height: meshDimensions.height,
				width: meshDimensions.width,
				x,
				y,
			})
			if (!color) {
				continue
			}

			imageData.data[dataIndex] = color.red
			imageData.data[dataIndex + 1] = color.green
			imageData.data[dataIndex + 2] = color.blue
			imageData.data[dataIndex + 3] = getWeatherMapPrecipitationMeshAlpha({
				isEdge,
				precipitation,
			})
		}
	}

	return imageData
}

const getWeatherMapPrecipitationMeshPoint = ({
	dimensions,
	meshDimensions,
	x,
	y,
}: {
	dimensions: WeatherMapDimensions
	meshDimensions: WeatherMapDimensions
	x: number
	y: number
}) => {
	const canvasX = ((x + 0.5) / meshDimensions.width) * dimensions.width
	const canvasY = ((y + 0.5) / meshDimensions.height) * dimensions.height
	const warp = WEATHER_MAP_PRECIPITATION_MESH_CELL_SIZE * 1.75
	const warpX =
		(getWeatherMapNoise(canvasX * 0.021 + canvasY * 0.013) - 0.5) * warp
	const warpY =
		(getWeatherMapNoise(canvasX * 0.015 - canvasY * 0.019 + 17.3) - 0.5) * warp

	return {
		x: canvasX + warpX,
		y: canvasY + warpY,
	}
}

const getWeatherMapInterpolatedPrecipitation = ({
	influenceRadius,
	point,
	points,
}: {
	influenceRadius: number
	point: { x: number; y: number }
	points: WeatherMapProjectedPrecipitationPoint[]
}) => {
	let totalWeight = 0
	let weightedPrecipitation = 0
	const influenceRadiusSquared = influenceRadius * influenceRadius

	for (const precipitationPoint of points) {
		const dx = point.x - precipitationPoint.x
		const dy = point.y - precipitationPoint.y
		const distanceSquared = dx * dx + dy * dy
		const weight = Math.exp(-distanceSquared / (2 * influenceRadiusSquared))

		totalWeight += weight
		weightedPrecipitation += precipitationPoint.precipitation * weight
	}

	if (totalWeight === 0) {
		return 0
	}

	return weightedPrecipitation / totalWeight
}

const getWeatherMapPrecipitationAtPoint = ({
	point,
	projectedPoints,
}: {
	point: WeatherMapPointerPoint
	projectedPoints: WeatherMapProjectedPrecipitationPoint[]
}) => {
	if (projectedPoints.length === 0) {
		return null
	}

	const influenceRadius =
		getWeatherMapPrecipitationInfluenceRadius(projectedPoints)
	const influenceRadiusSquared = influenceRadius * influenceRadius
	let totalWeight = 0
	let weightedPrecipitation = 0
	let weightedProbability = 0

	for (const projectedPoint of projectedPoints) {
		const dx = point.x - projectedPoint.x
		const dy = point.y - projectedPoint.y
		const distanceSquared = dx * dx + dy * dy
		const weight = Math.exp(-distanceSquared / (2 * influenceRadiusSquared))

		totalWeight += weight
		weightedPrecipitation += projectedPoint.precipitation * weight
		weightedProbability += projectedPoint.probability * weight
	}

	if (totalWeight === 0) {
		return null
	}

	return {
		precipitation: weightedPrecipitation / totalWeight,
		probability: weightedProbability / totalWeight,
	}
}

const getWeatherMapPrecipitationInfluenceRadius = (
	points: WeatherMapProjectedPrecipitationPoint[],
) => {
	if (points.length < 2) {
		return 120
	}

	const distances = points.map((point, pointIndex) => {
		let nearestDistance = Number.POSITIVE_INFINITY

		for (
			let comparisonPointIndex = 0;
			comparisonPointIndex < points.length;
			comparisonPointIndex += 1
		) {
			if (comparisonPointIndex === pointIndex) {
				continue
			}

			const comparisonPoint = points[comparisonPointIndex]
			if (!comparisonPoint) {
				continue
			}

			const dx = point.x - comparisonPoint.x
			const dy = point.y - comparisonPoint.y
			const distance = Math.hypot(dx, dy)
			if (distance < nearestDistance) {
				nearestDistance = distance
			}
		}

		return nearestDistance
	})
	const medianDistance = [...distances].sort((a, b) => a - b)[
		Math.floor(distances.length / 2)
	]

	return Math.max(72, (medianDistance ?? 120) * 1.35)
}

const getWeatherMapPrecipitationBand = (precipitation: number) => {
	if (precipitation < WEATHER_MAP_PRECIPITATION_MIN_VISIBLE) {
		return 0
	}

	if (precipitation >= 10) {
		return 6
	}

	if (precipitation >= 5) {
		return 5
	}

	if (precipitation >= 2) {
		return 4
	}

	if (precipitation >= 1) {
		return 3
	}

	if (precipitation >= 0.5) {
		return 2
	}

	return 1
}

const isWeatherMapPrecipitationMeshEdge = ({
	band,
	bands,
	height,
	width,
	x,
	y,
}: {
	band: number
	bands: Uint8Array
	height: number
	width: number
	x: number
	y: number
}) => {
	const neighborBands = [
		x > 0 ? bands[y * width + x - 1] : 0,
		x < width - 1 ? bands[y * width + x + 1] : 0,
		y > 0 ? bands[(y - 1) * width + x] : 0,
		y < height - 1 ? bands[(y + 1) * width + x] : 0,
	]

	return neighborBands.some(
		(neighborBand) => neighborBand > 0 && neighborBand !== band,
	)
}

const getWeatherMapPrecipitationMeshAlpha = ({
	isEdge,
	precipitation,
}: {
	isEdge: boolean
	precipitation: number
}) => {
	const amountIntensity = getWeatherMapPrecipitationIntensity(precipitation)
	const alpha = isEdge ? 150 + amountIntensity * 85 : 54 + amountIntensity * 150

	return Math.round(alpha)
}

const getWeatherMapPrecipitationBandColor = ({
	blue,
	green,
	red,
}: {
	blue: number
	green: number
	red: number
}) => `rgb(${red}, ${green}, ${blue})`

const formatWeatherMapPrecipitationBandLabel = ({
	band,
	usesMetricUnits,
}: {
	band: (typeof WEATHER_MAP_PRECIPITATION_BANDS)[number]
	usesMetricUnits: boolean
}) => {
	if (usesMetricUnits) {
		return band.label
	}

	const precipitation = convertPrecipitation({
		precipitation: band.precipitation,
		usesMetricUnits,
	})
	const suffix = band.label.endsWith('+') ? '+' : ''

	if (precipitation < 0.01) {
		return `<0.01${suffix}`
	}

	return `${precipitation >= 1 ? precipitation.toFixed(1) : precipitation.toFixed(2)}${suffix}`
}

const formatWeatherMapTooltipPrecipitationDepth = ({
	precipitation,
	usesMetricUnits,
}: {
	precipitation: number
	usesMetricUnits: boolean
}) => {
	if (usesMetricUnits) {
		return `${formatDecimal(precipitation)} mm/h`
	}

	if (precipitation === 0) {
		return '0.00 in/h'
	}

	if (precipitation < 0.01) {
		return '<0.01 in/h'
	}

	return `${precipitation >= 1 ? precipitation.toFixed(1) : precipitation.toFixed(2)} in/h`
}

const getWeatherMapNoise = (seed: number) => {
	const value = Math.sin(seed * 12.9898) * 43758.5453
	return value - Math.floor(value)
}

const getWeatherMapPrecipitationIntensity = (precipitation: number) =>
	Math.min(1, Math.sqrt(Math.max(0, precipitation) / 6))

const getInterpolatedWeatherMapWindPoints = ({
	framePosition,
	frames,
	viewport,
}: {
	framePosition: number
	frames: WeatherMapData['frames']
	viewport: WeatherMapViewport
}) => {
	const interpolation = getWeatherMapFrameInterpolation({
		framePosition,
		frames,
	})

	if (!interpolation) {
		return []
	}

	const { fromFrame, progress, toFrame } = interpolation

	return fromFrame.points.flatMap((fromPoint, pointIndex) => {
		const toPoint = toFrame.points[pointIndex]
		if (!toPoint) {
			return []
		}

		const projectedPoint = projectWeatherMapPoint({
			point: fromPoint,
			viewport,
		})

		return {
			direction: interpolateWeatherMapDirection({
				fromDirection: fromPoint.windDirection,
				progress,
				toDirection: toPoint.windDirection,
			}),
			speed:
				fromPoint.windSpeed +
				(toPoint.windSpeed - fromPoint.windSpeed) * progress,
			x: projectedPoint.x,
			y: projectedPoint.y,
		}
	})
}

const getWeatherMapWindSpeedAtPoint = ({
	point,
	projectedPoints,
}: {
	point: WeatherMapPointerPoint
	projectedPoints: WeatherMapProjectedWindPoint[]
}) => {
	if (projectedPoints.length === 0) {
		return null
	}

	const influenceRadius = getWeatherMapWindInfluenceRadius(projectedPoints)
	const influenceRadiusSquared = influenceRadius * influenceRadius
	let totalWeight = 0
	let weightedSpeed = 0

	for (const projectedPoint of projectedPoints) {
		const distanceX = point.x - projectedPoint.x
		const distanceY = point.y - projectedPoint.y
		const distanceSquared = distanceX * distanceX + distanceY * distanceY
		const weight = Math.exp(-distanceSquared / (2 * influenceRadiusSquared))

		totalWeight += weight
		weightedSpeed += projectedPoint.speed * weight
	}

	return totalWeight === 0 ? null : weightedSpeed / totalWeight
}

const getWeatherMapWindInfluenceRadius = (
	projectedPoints: WeatherMapProjectedWindPoint[],
) => {
	if (projectedPoints.length < 2) {
		return 120
	}

	const distances = projectedPoints.map((point, pointIndex) => {
		let nearestDistance = Number.POSITIVE_INFINITY

		for (
			let comparisonPointIndex = 0;
			comparisonPointIndex < projectedPoints.length;
			comparisonPointIndex += 1
		) {
			if (comparisonPointIndex === pointIndex) {
				continue
			}

			const comparisonPoint = projectedPoints[comparisonPointIndex]
			if (!comparisonPoint) {
				continue
			}

			const distanceX = point.x - comparisonPoint.x
			const distanceY = point.y - comparisonPoint.y
			const distance = Math.hypot(distanceX, distanceY)
			if (distance < nearestDistance) {
				nearestDistance = distance
			}
		}

		return nearestDistance
	})
	const medianDistance = [...distances].sort((a, b) => a - b)[
		Math.floor(distances.length / 2)
	]

	return Math.max(72, (medianDistance ?? 120) * 1.35)
}

const getWeatherMapPlaybackState = ({
	frames,
	startedAt,
	time,
}: {
	frames: WeatherMapData['frames']
	startedAt: number
	time: number
}): WeatherMapPlaybackState => {
	const frameCount = frames.length
	const firstFrame = frames[0]

	if (frameCount <= 1 || !firstFrame) {
		return {
			frameIndex: 0,
			framePosition: 0,
			frameProgress: 0,
			time: firstFrame?.time ?? 0,
			totalProgress: 0,
		}
	}

	const segmentCount = frameCount - 1
	const duration = segmentCount * WEATHER_MAP_FRAME_DURATION_MS
	const elapsed = (((time - startedAt) % duration) + duration) % duration
	const framePosition = elapsed / WEATHER_MAP_FRAME_DURATION_MS
	const frameIndex = Math.min(segmentCount - 1, Math.floor(framePosition))
	const frameProgress = framePosition - frameIndex
	const fromFrame = frames[frameIndex] ?? firstFrame
	const toFrame = frames[frameIndex + 1] ?? fromFrame

	return {
		frameIndex,
		framePosition,
		frameProgress,
		time: fromFrame.time + (toFrame.time - fromFrame.time) * frameProgress,
		totalProgress: elapsed / duration,
	}
}

const getWeatherMapFrameInterpolation = ({
	framePosition,
	frames,
}: {
	framePosition: number
	frames: WeatherMapData['frames']
}) => {
	const frameCount = frames.length
	if (frameCount === 0) {
		return null
	}

	const lastFrameIndex = frameCount - 1
	const fromIndex = Math.min(
		lastFrameIndex,
		Math.max(0, Math.floor(framePosition)),
	)
	const toIndex = Math.min(lastFrameIndex, fromIndex + 1)
	const fromFrame = frames[fromIndex]
	const toFrame = frames[toIndex]

	if (!fromFrame || !toFrame) {
		return null
	}

	return {
		fromFrame,
		progress: Math.min(1, Math.max(0, framePosition - fromIndex)),
		toFrame,
	}
}

const interpolateWeatherMapDirection = ({
	fromDirection,
	progress,
	toDirection,
}: {
	fromDirection: number
	progress: number
	toDirection: number
}) => {
	const delta = ((((toDirection - fromDirection) % 360) + 540) % 360) - 180
	return (fromDirection + delta * progress + 360) % 360
}

const getNearestWeatherMapWindPoint = ({
	particle,
	projectedPoints,
}: {
	particle: WeatherMapParticle
	projectedPoints: WeatherMapProjectedWindPoint[]
}) => {
	let closestPoint: null | WeatherMapProjectedWindPoint = null
	let closestDistanceSquared = Infinity

	for (const point of projectedPoints) {
		const distanceX = particle.x - point.x
		const distanceY = particle.y - point.y
		const distanceSquared = distanceX * distanceX + distanceY * distanceY

		if (distanceSquared < closestDistanceSquared) {
			closestDistanceSquared = distanceSquared
			closestPoint = point
		}
	}

	return closestPoint
}

const coordinateToWeatherMapWorld = ({
	lat,
	lon,
}: {
	lat: number
	lon: number
}) => {
	const scale = WEATHER_MAP_TILE_SIZE * 2 ** WEATHER_MAP_ZOOM
	const clampedLat = Math.min(Math.max(lat, -85.05112878), 85.05112878)
	const latRadians = (clampedLat * Math.PI) / 180

	return {
		x: ((lon + 180) / 360) * scale,
		y:
			(0.5 -
				Math.log((1 + Math.sin(latRadians)) / (1 - Math.sin(latRadians))) /
					(4 * Math.PI)) *
			scale,
	}
}

const wrapWeatherMapTileX = (tileX: number) => {
	const tileCount = 2 ** WEATHER_MAP_ZOOM
	return ((tileX % tileCount) + tileCount) % tileCount
}

const clampWeatherMapTileY = (tileY: number) => {
	const maxTile = 2 ** WEATHER_MAP_ZOOM - 1
	return Math.min(Math.max(tileY, 0), maxTile)
}

const average = (points: number[]) =>
	points.length > 0 ? sum(points) / points.length : 0

const max = (points: number[]) =>
	points.reduce((currentMax, point) => Math.max(currentMax, point), -Infinity)

const min = (points: number[]) =>
	points.reduce((currentMin, point) => Math.min(currentMin, point), Infinity)

const sum = (points: number[]) =>
	points.reduce((total, point) => total + point, 0)

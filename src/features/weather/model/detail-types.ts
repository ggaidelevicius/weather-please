import type { ReactNode, CSSProperties } from 'react'
import type { Next24HoursData, WeatherMapData } from './types'
import type {
	TemperatureUnit,
	UnitSystem,
} from '../../settings/model/unit-system'

export const NEXT_24_HOURS_DETAIL_VIEW_IDS = [
	'temperature',
	'precipitation',
	'wind',
	'air-quality',
	'sun',
	'conditions',
	'map',
] as const

export type Next24HoursDetailViewId =
	(typeof NEXT_24_HOURS_DETAIL_VIEW_IDS)[number]

export type AnimatedNumberProps = {
	maximumFractionDigits?: number
	minimumFractionDigits?: number
	value: number
}

export type ChartFrameProps = {
	children: ReactNode
	endLabel: ReactNode
	leftLabels: string[]
	middleLabel: ReactNode
	rightLabels?: string[]
	startLabel: ReactNode
}

export type ChartScale = {
	maxValue?: number
	minValue?: number
}

export type ChartTooltipState = {
	seriesLabel: ReactNode
	time: number
	value: ReactNode
	x: number
	y: number
}

export type DetailViewShellProps = {
	accentClassName: string
	accentStyle?: CSSProperties
	children: ReactNode
	footer?: ReactNode
	icon: ReactNode
	isActive: boolean
	kicker: ReactNode
	metrics: ReactNode
	title: ReactNode
}

export type FeelsLikeExplanationProps = {
	apparentTemperature?: number
	dewPoint?: number
	humidity?: number
	shortwaveRadiation?: number
	temperature?: number
	wind?: number
}

export type HourIntervalLabelProps = {
	index: number
	referenceTime?: number
	times: number[]
}

export type LineChartProps = {
	accentClassName: string
	accentStyle?: CSSProperties
	activeSeriesId?: null | WeatherDetailSeriesId
	onSeriesFocus?: (seriesId: null | WeatherDetailSeriesId) => void
	points: number[]
	primarySeriesId?: WeatherDetailSeriesId
	primarySeriesLabel: ReactNode
	primaryValueFormatter: (value: number) => ReactNode
	scale: Required<ChartScale>
	secondaryAccentClassName?: string
	secondaryPoints?: number[]
	secondaryScale?: Required<ChartScale>
	secondarySeriesId?: WeatherDetailSeriesId
	secondarySeriesLabel?: ReactNode
	secondaryValueFormatter?: (value: number) => ReactNode
	times: number[]
}

export type MetricProps = {
	accentClassName?: string
	accentStyle?: CSSProperties
	activeSeriesId?: null | WeatherDetailSeriesId
	icon: ReactNode
	label: ReactNode
	onSeriesFocus?: (seriesId: null | WeatherDetailSeriesId) => void
	seriesId?: WeatherDetailSeriesId
	value: ReactNode
}

export type Next24HoursDetailViewProps = {
	data: Next24HoursData
	isActive: boolean
	temperatureUnit: TemperatureUnit
	unitSystem: UnitSystem
	viewId: Next24HoursDetailViewId
	weatherMapData: null | WeatherMapData
}

export type PointSummary = {
	index: number
	value: number
}

export type PrecipitationChartProps = {
	activeSeriesId?: null | WeatherDetailSeriesId
	amountPoints: number[]
	amountScale: Required<ChartScale>
	amountValueFormatter: (value: number) => string
	onSeriesFocus?: (seriesId: null | WeatherDetailSeriesId) => void
	probabilityPoints: number[]
	times: number[]
}

export type RelativeHourLabelProps = {
	referenceTime?: number
	time?: number
}

export type WeatherDetailSeriesId =
	| 'airQualityAqi'
	| 'precipitationAmount'
	| 'precipitationProbability'
	| 'temperature'
	| 'uv'
	| 'visibility'
	| 'wind'
	| 'windGust'

export type WeatherMapDimensions = {
	height: number
	width: number
}

export type WeatherMapDisplaySize = {
	height: number
	width: number
}

export type WeatherMapMetricPoint = {
	precipitationProbability: number
	windSpeed: number
}

export type WeatherMapParticle = {
	age: number
	x: number
	y: number
}

export type WeatherMapPlaybackState = {
	frameIndex: number
	framePosition: number
	frameProgress: number
	time: number
	totalProgress: number
}

export type WeatherMapPointerPoint = {
	x: number
	y: number
}

export type WeatherMapPointerWeather = {
	precipitation: number
	probability: number
	windSpeed: number
}

export type WeatherMapProjectedPrecipitationPoint = {
	precipitation: number
	probability: number
	x: number
	y: number
}

export type WeatherMapProjectedWindPoint = {
	direction: number
	speed: number
	x: number
	y: number
}

export type WeatherMapTile = {
	key: string
	url: string
	x: number
	y: number
}

export type WeatherMapViewport = {
	centerX: number
	centerY: number
	dimensions: WeatherMapDimensions
}

export type ChartLineProps = {
	activeSeriesId: null | WeatherDetailSeriesId
	className?: string
	onSeriesFocus?: (seriesId: null | WeatherDetailSeriesId) => void
	onTooltipChange: (tooltip: ChartTooltipState | null) => void
	points: number[]
	scale: Required<ChartScale>
	seriesId?: WeatherDetailSeriesId
	seriesLabel: ReactNode
	strokeWidth: number
	style?: CSSProperties
	times: number[]
	valueFormatter: (value: number) => ReactNode
}

import type {
	DetailViewShellProps,
	FeelsLikeExplanationProps,
	MetricProps,
	RelativeHourLabelProps,
	HourIntervalLabelProps,
} from '../../model/detail-types'
import { Trans } from '@lingui/react/macro'
import {
	formatHour,
	isSameLocalDate,
	formatWeekdayHour,
} from '../../model/detail-formatting'

export const FEELS_LIKE_DEW_POINT_THRESHOLD_C = 16

export const FEELS_LIKE_HUMIDITY_THRESHOLD = 65

export const FEELS_LIKE_MIN_DELTA_C = 1.5

export const FEELS_LIKE_SOLAR_RADIATION_THRESHOLD = 250

export const FEELS_LIKE_WARM_TEMPERATURE_C = 20

export const FEELS_LIKE_WIND_THRESHOLD_KMH = 12

export const DetailViewShell = ({
	accentClassName,
	accentStyle,
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
				<span className={accentClassName} style={accentStyle}>
					{icon}
				</span>
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

export const getFeelsLikeExplanation = ({
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

export const Metric = ({
	accentClassName,
	accentStyle,
	activeSeriesId = null,
	icon,
	label,
	onSeriesFocus,
	seriesId,
	value,
}: Readonly<MetricProps>) => {
	const isHighlighted = Boolean(seriesId) && activeSeriesId === seriesId
	const shouldDim = Boolean(activeSeriesId) && !isHighlighted
	const iconClassName =
		accentClassName ?? (isHighlighted ? 'text-white' : 'text-dark-200')
	const iconStyle = accentStyle

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
			<span className={iconClassName} style={iconStyle}>
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

export const RelativeHourLabel = ({
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

export const WeekdayHourLabel = ({ time }: Readonly<{ time: number }>) => {
	const weekday = new Intl.DateTimeFormat('en', { weekday: 'short' }).format(
		new Date(time * 1000),
	)
	const hour = formatHour(time)

	if (weekday === 'Mon') {
		return <Trans>Mon {hour}</Trans>
	}

	if (weekday === 'Tue') {
		return <Trans>Tue {hour}</Trans>
	}

	if (weekday === 'Wed') {
		return <Trans>Wed {hour}</Trans>
	}

	if (weekday === 'Thu') {
		return <Trans>Thu {hour}</Trans>
	}

	if (weekday === 'Fri') {
		return <Trans>Fri {hour}</Trans>
	}

	if (weekday === 'Sat') {
		return <Trans>Sat {hour}</Trans>
	}

	return <Trans>Sun {hour}</Trans>
}

export const HourIntervalLabel = ({
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

import type { Next24HoursData } from './types'

export const convertTemperature = ({
	temperature,
	usesMetricTemperature,
}: {
	temperature: number
	usesMetricTemperature: boolean
}) => (usesMetricTemperature ? temperature : (temperature * 9) / 5 + 32)

export const convertWind = ({
	usesMetricUnits,
	wind,
}: {
	usesMetricUnits: boolean
	wind: number
}) => (usesMetricUnits ? wind : wind / 1.609344)

export const convertPrecipitation = ({
	precipitation,
	usesMetricUnits,
}: {
	precipitation: number
	usesMetricUnits: boolean
}) => (usesMetricUnits ? precipitation : precipitation / 25.4)

export const convertVisibility = ({
	usesMetricUnits,
	visibility,
}: {
	usesMetricUnits: boolean
	visibility: number
}) => (usesMetricUnits ? visibility / 1000 : visibility / 1609.344)

export const formatAxisValue = (value: number) => {
	const absoluteValue = Math.abs(value)

	if (absoluteValue >= 10) {
		return Math.round(value).toString()
	}

	if (absoluteValue > 0 && absoluteValue < 0.1) {
		return value.toFixed(2)
	}

	return value.toFixed(1)
}

export const formatDecimal = (value: number) =>
	value >= 10 ? Math.round(value).toString() : value.toFixed(1)

export const formatPrecipitationValue = ({
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

export const formatHour = (time?: number) => {
	if (typeof time !== 'number') {
		return ''
	}

	return new Intl.DateTimeFormat('en', { hour: 'numeric' }).format(
		new Date(time * 1000),
	)
}

export const formatHourMinute = (time: number) =>
	new Intl.DateTimeFormat('en', {
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(time * 1000))

export const formatPollutantValue = (value: null | number) =>
	typeof value === 'number' ? `${formatDecimal(value)} µg/m³` : '—'

export const formatWeekdayHour = (time: number) =>
	new Intl.DateTimeFormat('en', {
		hour: 'numeric',
		weekday: 'short',
	}).format(new Date(time * 1000))

export const getNextSunEvent = ({
	data,
	referenceTime,
	type,
}: {
	data: Next24HoursData
	referenceTime: number | undefined
	type: 'sunrise' | 'sunset'
}) => {
	const events = data
		.map((point) => point[type])
		.filter((time): time is number => typeof time === 'number')
	const uniqueEvents = [...new Set(events)]

	if (typeof referenceTime !== 'number') {
		return uniqueEvents[0] ?? null
	}

	return (
		uniqueEvents.find((time) => time >= referenceTime) ??
		uniqueEvents[0] ??
		null
	)
}

export const isSameLocalDate = (date: Date, comparisonDate: Date) =>
	date.getFullYear() === comparisonDate.getFullYear() &&
	date.getMonth() === comparisonDate.getMonth() &&
	date.getDate() === comparisonDate.getDate()

export const average = (points: number[]) =>
	points.length > 0 ? sum(points) / points.length : 0

export const max = (points: number[]) =>
	points.reduce((currentMax, point) => Math.max(currentMax, point), -Infinity)

export const min = (points: number[]) =>
	points.reduce((currentMin, point) => Math.min(currentMin, point), Infinity)

export const isNumber = (value: null | number): value is number =>
	typeof value === 'number' && Number.isFinite(value)

export const sum = (points: number[]) =>
	points.reduce((total, point) => total + point, 0)

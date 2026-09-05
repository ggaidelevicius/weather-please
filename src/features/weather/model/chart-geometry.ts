import type { ChartScale, PointSummary } from './detail-types'
import { min, max, formatAxisValue } from './detail-formatting'
export const CHART_HEIGHT = 150

export const CHART_WIDTH = 360

export const CHART_PADDING = 10

export const CHART_SPLINE_TENSION = 0.16

export const getChartScale = (
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

export const getScaleLabels = ({
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

export const getLinePath = (points: number[], scale: Required<ChartScale>) => {
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

export const getChartX = (index: number, pointCount: number) => {
	if (pointCount <= 1) {
		return CHART_WIDTH / 2
	}

	return (index / (pointCount - 1)) * CHART_WIDTH
}

export const getNearestPointIndex = ({
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

export const getChartY = (
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

export const getPeakPoint = (points: number[]): PointSummary => {
	const value = max(points)
	return { index: points.indexOf(value), value }
}

export const getLowPoint = (points: number[]): PointSummary => {
	const value = min(points)
	return { index: points.indexOf(value), value }
}

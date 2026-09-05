import type { WeatherMapData } from '../types'
import type {
	WeatherMapViewport,
	WeatherMapDimensions,
	WeatherMapProjectedPrecipitationPoint,
	WeatherMapPointerPoint,
} from '../detail-types'
import {
	getWeatherMapFrameInterpolation,
	projectWeatherMapPoint,
} from './geometry'
import {
	WEATHER_MAP_PRECIPITATION_MESH_CELL_SIZE,
	WEATHER_MAP_PRECIPITATION_BANDS,
	WEATHER_MAP_PRECIPITATION_MIN_VISIBLE,
} from './constants'
import { convertPrecipitation, formatDecimal } from '../detail-formatting'

export const getInterpolatedWeatherMapPrecipitationPoints = ({
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

export const getWeatherMapPrecipitationMeshDimensions = ({
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

export const createWeatherMapPrecipitationMeshImageData = ({
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

export const getWeatherMapPrecipitationMeshPoint = ({
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

export const getWeatherMapInterpolatedPrecipitation = ({
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

export const getWeatherMapPrecipitationAtPoint = ({
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

export const getWeatherMapPrecipitationInfluenceRadius = (
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

export const getWeatherMapPrecipitationBand = (precipitation: number) => {
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

export const isWeatherMapPrecipitationMeshEdge = ({
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

export const getWeatherMapPrecipitationMeshAlpha = ({
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

export const getWeatherMapPrecipitationBandColor = ({
	blue,
	green,
	red,
}: {
	blue: number
	green: number
	red: number
}) => `rgb(${red}, ${green}, ${blue})`

export const formatWeatherMapPrecipitationBandLabel = ({
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

export const formatWeatherMapTooltipPrecipitationDepth = ({
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

export const getWeatherMapNoise = (seed: number) => {
	const value = Math.sin(seed * 12.9898) * 43758.5453
	return value - Math.floor(value)
}

export const getWeatherMapPrecipitationIntensity = (precipitation: number) =>
	Math.min(1, Math.sqrt(Math.max(0, precipitation) / 6))

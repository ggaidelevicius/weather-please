import type {
	WeatherMapParticle,
	WeatherMapDimensions,
	WeatherMapMetricPoint,
	WeatherMapViewport,
	WeatherMapPointerPoint,
	WeatherMapProjectedWindPoint,
} from '../detail-types'
import type { WeatherMapData } from '../types'
import { WEATHER_MAP_PARTICLE_DENSITY } from './constants'
import {
	getWeatherMapFrameInterpolation,
	projectWeatherMapPoint,
} from './geometry'

export const createWeatherMapParticles = (
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

export const getWeatherMapParticleCount = ({
	height,
	width,
}: WeatherMapDimensions) =>
	Math.min(
		240,
		Math.max(150, Math.round(width * height * WEATHER_MAP_PARTICLE_DENSITY)),
	)

export const resetWeatherMapParticle = ({
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

export const getInterpolatedWeatherMapMetricPoints = ({
	framePosition,
	frames,
}: {
	framePosition: number
	frames: WeatherMapData['frames']
}): WeatherMapMetricPoint[] => {
	const interpolation = getWeatherMapFrameInterpolation({
		framePosition,
		frames,
	})

	if (!interpolation) {
		return []
	}

	const { fromFrame, progress, toFrame } = interpolation

	return fromFrame.points.map((fromPoint, pointIndex) => {
		const toPoint = toFrame.points[pointIndex] ?? fromPoint

		return {
			precipitationProbability:
				fromPoint.precipitationProbability +
				(toPoint.precipitationProbability -
					fromPoint.precipitationProbability) *
					progress,
			windSpeed:
				fromPoint.windSpeed +
				(toPoint.windSpeed - fromPoint.windSpeed) * progress,
		}
	})
}

export const getInterpolatedWeatherMapWindPoints = ({
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

export const getWeatherMapWindSpeedAtPoint = ({
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

export const getWeatherMapWindInfluenceRadius = (
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

export const interpolateWeatherMapDirection = ({
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

export const getNearestWeatherMapWindPoint = ({
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

import { describe, expect, it } from 'vitest'

import {
	getChartScale,
	getChartY,
	getLinePath,
	getNearestPointIndex,
} from '../chart-geometry'
import {
	coordinateToWeatherMapWorld,
	getWeatherMapFrameInterpolation,
} from '../weather-map/geometry'
import { interpolateWeatherMapDirection } from '../weather-map/wind'

describe('detail charts', () => {
	it('renders a constant series without dividing by zero', () => {
		const points = [12, 12, 12]
		const scale = getChartScale(points)
		expect(scale.minValue).toBeLessThan(12)
		expect(scale.maxValue).toBeGreaterThan(12)
		expect(Number.isFinite(getChartY(12, scale))).toBe(true)
		expect(getLinePath(points, scale)).not.toMatch(/NaN|Infinity/)
	})

	it('keeps a zero floor for a dry precipitation series', () => {
		expect(getChartScale([0, 0], { minValue: 0 })).toEqual({
			minValue: 0,
			maxValue: 1,
		})
	})

	it('clamps pointer selection to available data', () => {
		expect(getNearestPointIndex({ pointCount: 24, x: -100 })).toBe(0)
		expect(getNearestPointIndex({ pointCount: 24, x: 1000 })).toBe(23)
		expect(getNearestPointIndex({ pointCount: 1, x: 200 })).toBe(0)
		expect(getLinePath([], { minValue: 0, maxValue: 1 })).toBe('')
	})
})

describe('weather map calculations', () => {
	it('interpolates wind through north by the shortest arc', () => {
		expect(
			interpolateWeatherMapDirection({
				fromDirection: 350,
				toDirection: 10,
				progress: 0.5,
			}),
		).toBe(0)
		expect(
			interpolateWeatherMapDirection({
				fromDirection: 10,
				toDirection: 350,
				progress: 0.5,
			}),
		).toBe(0)
	})

	it('keeps map projection finite at both poles', () => {
		for (const lat of [-90, 90]) {
			const point = coordinateToWeatherMapWorld({ lat, lon: 0 })
			expect(Number.isFinite(point.x)).toBe(true)
			expect(Number.isFinite(point.y)).toBe(true)
		}
	})

	it('handles empty and single-frame playback', () => {
		expect(
			getWeatherMapFrameInterpolation({ frames: [], framePosition: 2 }),
		).toBeNull()
		const frame = { time: 100, points: [] }
		expect(
			getWeatherMapFrameInterpolation({ frames: [frame], framePosition: 0 }),
		).toEqual({ fromFrame: frame, toFrame: frame, progress: 0 })
	})
})

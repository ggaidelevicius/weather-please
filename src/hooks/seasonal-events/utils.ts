import type { Hemisphere } from './types'

export function randomInRange({ min, max }: { min: number; max: number }) {
	return Math.random() * (max - min) + min
}

export function getHemisphereFromLatitude(
	latitude: number | string | null | undefined,
): Hemisphere {
	if (latitude === null || latitude === undefined) {
		return 'northern'
	}

	const numericLatitude =
		typeof latitude === 'string' ? Number.parseFloat(latitude) : latitude

	if (!Number.isFinite(numericLatitude)) {
		return 'northern'
	}

	return numericLatitude < 0 ? 'southern' : 'northern'
}

const DEFAULT_CANVAS_MAX_PIXELS = 8_000_000

export function getCanvasDpr({
	width,
	height,
	maxDpr,
	maxPixels = DEFAULT_CANVAS_MAX_PIXELS,
}: {
	width: number
	height: number
	maxDpr: number
	maxPixels?: number
}) {
	const devicePixelRatio =
		typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
	const safeWidth = Math.max(width, 1)
	const safeHeight = Math.max(height, 1)
	const pixelBudgetDpr = Math.sqrt(maxPixels / (safeWidth * safeHeight))

	if (!Number.isFinite(pixelBudgetDpr)) {
		return Math.min(maxDpr, devicePixelRatio)
	}

	return Math.min(maxDpr, devicePixelRatio, pixelBudgetDpr)
}

export function createAdaptiveDprController({
	maxDpr,
	minScale = 0.6,
	slowFps = 50,
	fastFps = 58,
	sampleCount = 30,
	cooldownMs = 1500,
	step = 0.1,
}: {
	maxDpr: number
	minScale?: number
	slowFps?: number
	fastFps?: number
	sampleCount?: number
	cooldownMs?: number
	step?: number
}) {
	let scale = 1
	let lastFrameTime: number | null = null
	let lastAdjustment = 0
	const samples: number[] = []

	const getDpr = ({ width, height }: { width: number; height: number }) =>
		getCanvasDpr({ width, height, maxDpr: maxDpr * scale })

	const reportFrame = (time: number) => {
		if (lastFrameTime === null) {
			lastFrameTime = time
			return false
		}

		const delta = time - lastFrameTime
		lastFrameTime = time
		if (delta <= 0) {
			return false
		}

		samples.push(1000 / delta)
		if (samples.length < sampleCount) {
			return false
		}

		const avgFps =
			samples.reduce((total, value) => total + value, 0) / samples.length
		samples.length = 0

		if (time - lastAdjustment < cooldownMs) {
			return false
		}

		if (avgFps < slowFps && scale > minScale) {
			scale = Math.max(minScale, scale - step)
			lastAdjustment = time
			return true
		}

		if (avgFps > fastFps && scale < 1) {
			scale = Math.min(1, scale + step)
			lastAdjustment = time
			return true
		}

		return false
	}

	return { getDpr, reportFrame }
}

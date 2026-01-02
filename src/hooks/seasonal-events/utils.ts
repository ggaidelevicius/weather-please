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

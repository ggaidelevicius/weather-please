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

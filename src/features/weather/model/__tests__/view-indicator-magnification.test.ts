import { describe, expect, it } from 'vitest'

import { getMagnifiedSizes } from '../view-indicator-magnification'

const MAGNIFICATION = {
	maxSize: 32,
	radius: 55,
	restSize: 10,
	totalGrowth: 40,
}

describe('getMagnifiedSizes', () => {
	it('keeps the total footprint fixed as the focus moves through the list', () => {
		const atStart = getMagnifiedSizes({
			...MAGNIFICATION,
			distances: [0, 30, 60, 90],
		})
		const inMiddle = getMagnifiedSizes({
			...MAGNIFICATION,
			distances: [-60, -35, 0, 35],
		})

		expect(sum(atStart)).toBeCloseTo(80)
		expect(sum(inMiddle)).toBeCloseTo(80)
		expect(atStart[0]).toBe(32)
		expect(inMiddle[2]).toBe(32)
	})

	it('returns resting sizes while the pointer is outside the radius', () => {
		expect(
			getMagnifiedSizes({
				...MAGNIFICATION,
				distances: [60, 90, 120],
			}),
		).toEqual([10, 10, 10])
	})

	it('caps each dot at its maximum size', () => {
		const sizes = getMagnifiedSizes({
			...MAGNIFICATION,
			distances: [0, 54],
		})

		expect(sizes).toEqual([32, 28])
	})
})

const sum = (values: readonly number[]) =>
	values.reduce((total, value) => total + value, 0)

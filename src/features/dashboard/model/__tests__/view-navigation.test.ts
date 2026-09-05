import { describe, expect, it } from 'vitest'

import { getAdjacentViewId } from '../view-navigation'

describe('dashboard navigation', () => {
	it('keeps the forecast selected until detail data is available', () => {
		expect(
			getAdjacentViewId({
				activeViewId: 'forecast',
				canShowNext24HoursView: false,
				direction: 'next',
			}),
		).toBe('forecast')
	})

	it('moves to the adjacent view and stops at the boundaries', () => {
		expect(
			getAdjacentViewId({
				activeViewId: 'forecast',
				canShowNext24HoursView: true,
				direction: 'next',
			}),
		).toBe('temperature')
		expect(
			getAdjacentViewId({
				activeViewId: 'forecast',
				canShowNext24HoursView: true,
				direction: 'previous',
			}),
		).toBe('forecast')
		expect(
			getAdjacentViewId({
				activeViewId: 'map',
				canShowNext24HoursView: true,
				direction: 'next',
			}),
		).toBe('map')
	})
})

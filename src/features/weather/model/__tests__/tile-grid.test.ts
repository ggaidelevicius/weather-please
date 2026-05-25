import { describe, expect, it } from 'vitest'

import {
	getWeatherTileColumnCount,
	WEATHER_TILE_GRID_GAP_PX,
	WEATHER_TILE_MIN_WIDTH_PX,
} from '../tile-grid'

const getAvailableWidthForColumns = (columnCount: number) =>
	columnCount * WEATHER_TILE_MIN_WIDTH_PX +
	(columnCount - 1) * WEATHER_TILE_GRID_GAP_PX

describe('getWeatherTileColumnCount', () => {
	it('uses one row for seven tiles when all tiles fit', () => {
		const result = getWeatherTileColumnCount({
			availableWidth: getAvailableWidthForColumns(7),
			tileCount: 7,
		})

		expect(result).toBe(7)
	})

	it('keeps five tiles on one row when all tiles fit', () => {
		const result = getWeatherTileColumnCount({
			availableWidth: getAvailableWidthForColumns(5),
			tileCount: 5,
		})

		expect(result).toBe(5)
	})

	it('caps six tiles at two even rows when more columns fit', () => {
		const result = getWeatherTileColumnCount({
			availableWidth: getAvailableWidthForColumns(6),
			tileCount: 6,
		})

		expect(result).toBe(3)
	})

	it('caps nine tiles at three even rows when more columns fit', () => {
		const result = getWeatherTileColumnCount({
			availableWidth: getAvailableWidthForColumns(9),
			tileCount: 9,
		})

		expect(result).toBe(3)
	})

	it('caps eight tiles at two even rows when more columns fit', () => {
		const result = getWeatherTileColumnCount({
			availableWidth: getAvailableWidthForColumns(8),
			tileCount: 8,
		})

		expect(result).toBe(4)
	})

	it('never returns fewer than one column', () => {
		const result = getWeatherTileColumnCount({
			availableWidth: 0,
			tileCount: 8,
		})

		expect(result).toBe(1)
	})
})

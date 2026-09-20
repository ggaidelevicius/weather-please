import type { ReactNode } from 'react'
import type { WeatherMapData } from '../../../model/types'

import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getWeatherMapPlaybackState } from '../../../model/weather-map/geometry'
import { WeatherMap } from '../weather-map'

vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

afterEach(() => {
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe('WeatherMap tiles', () => {
	it('loads tiles only for the active map and keeps them stable during playback', () => {
		vi.stubGlobal('ResizeObserver', ResizeObserverMock)
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
		const weatherMapData: WeatherMapData = {
			center: { lat: 0, lon: 0 },
			frames: [
				{ time: 100, points: [] },
				{ time: 3700, points: [] },
			],
		}
		const props = {
			playback: getWeatherMapPlaybackState({
				frames: weatherMapData.frames,
				startedAt: 0,
				time: 0,
			}),
			usesMetricUnits: true,
			weatherMapData,
			windUnitLabel: 'km/h',
		}
		const { container, rerender } = render(
			<WeatherMap {...props} isActive={false} />,
		)
		expect(container.querySelectorAll('image')).toHaveLength(0)

		rerender(<WeatherMap {...props} isActive />)
		const tiles = Array.from(container.querySelectorAll('image'))
		expect(tiles.length).toBeGreaterThan(0)
		const tileUrls = tiles.map((tile) => tile.getAttribute('href'))
		expect(tileUrls).toEqual(
			expect.arrayContaining([
				expect.stringMatching(/^https:\/\/tile\.openstreetmap\.org\//),
			]),
		)

		rerender(
			<WeatherMap
				{...props}
				isActive
				playback={getWeatherMapPlaybackState({
					frames: weatherMapData.frames,
					startedAt: 0,
					time: 1000,
				})}
			/>,
		)
		const updatedTiles = Array.from(container.querySelectorAll('image'))
		expect(updatedTiles.map((tile) => tile.getAttribute('href'))).toEqual(
			tileUrls,
		)
		updatedTiles.forEach((tile, index) => expect(tile).toBe(tiles[index]))

		rerender(<WeatherMap {...props} isActive={false} />)
		expect(container.querySelectorAll('image')).toHaveLength(0)

		rerender(
			<WeatherMap
				{...props}
				isActive={false}
				weatherMapData={{ ...weatherMapData, center: { lat: 1, lon: 1 } }}
			/>,
		)
		expect(container.querySelectorAll('image')).toHaveLength(0)
	})
})

class ResizeObserverMock implements ResizeObserver {
	constructor(private readonly callback: ResizeObserverCallback) {}

	disconnect = vi.fn()
	unobserve = vi.fn()
	observe = (target: Element) => {
		this.callback(
			[
				{
					borderBoxSize: [],
					contentBoxSize: [],
					contentRect: new DOMRect(0, 0, 800, 384),
					devicePixelContentBoxSize: [],
					target,
				},
			],
			this,
		)
	}
}

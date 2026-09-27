import type { ReactNode } from 'react'

import { cleanup, render } from '@testing-library/react'
import { Activity } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { WeatherMapData } from '../../../model/types'

import {
	getWeatherMapDimensions,
	getWeatherMapPlaybackState,
} from '../../../model/weather-map/geometry'
import { WeatherMap } from '../weather-map'

vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe('WeatherMap tiles', () => {
	it('reconnects its size observer and measures again after Activity reveals it', () => {
		vi.stubGlobal('ResizeObserver', ResizeObserverMock)
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
		const observe = vi.spyOn(ResizeObserverMock.prototype, 'observe')
		const weatherMapData: WeatherMapData = {
			center: { lat: 0, lon: 0 },
			frames: [{ points: [], time: 100 }],
		}
		const props = {
			isActive: true,
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
			<Activity mode="visible">
				<WeatherMap {...props} />
			</Activity>,
		)
		const firstObserver = observe.mock.contexts[0]
		if (!(firstObserver instanceof ResizeObserverMock)) {
			throw new Error('Expected the map to observe its size')
		}
		rerender(
			<Activity mode="hidden">
				<WeatherMap {...props} />
			</Activity>,
		)
		expect(firstObserver.disconnect).toHaveBeenCalledTimes(1)

		observe.mockImplementation(function (this: ResizeObserverMock, target) {
			this.measure(target, new DOMRect(0, 0, 400, 300))
		})
		rerender(
			<Activity mode="visible">
				<WeatherMap {...props} />
			</Activity>,
		)
		expect(observe).toHaveBeenCalledTimes(2)
		expect(observe.mock.contexts[1]).not.toBe(firstObserver)
		const dimensions = getWeatherMapDimensions({ height: 300, width: 400 })
		expect(
			container.querySelector(
				'[aria-label="Local precipitation and wind direction map"]',
			),
		).toHaveAttribute('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`)
	})

	it('loads tiles only for the active map and keeps them stable during playback', () => {
		vi.stubGlobal('ResizeObserver', ResizeObserverMock)
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
		const weatherMapData: WeatherMapData = {
			center: { lat: 0, lon: 0 },
			frames: [
				{ points: [], time: 100 },
				{ points: [], time: 3700 },
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
	disconnect = vi.fn()

	unobserve = vi.fn()
	constructor(private readonly callback: ResizeObserverCallback) {}
	measure(target: Element, contentRect: DOMRect) {
		this.callback(
			[
				{
					borderBoxSize: [],
					contentBoxSize: [],
					contentRect,
					devicePixelContentBoxSize: [],
					target,
				},
			],
			this,
		)
	}
	observe(target: Element) {
		this.measure(target, new DOMRect(0, 0, 800, 384))
	}
}

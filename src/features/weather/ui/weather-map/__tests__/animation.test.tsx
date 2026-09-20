import type { ReactNode } from 'react'
import type { WeatherMapData } from '../../../model/types'

import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getWeatherMapViewport } from '../../../model/weather-map/geometry'
import * as precipitation from '../../../model/weather-map/precipitation'
import * as wind from '../../../model/weather-map/wind'
import { WeatherMapPrecipitationCanvas } from '../precipitation-canvas'
import { WeatherMapTooltip } from '../tooltip'
import { WeatherMapWindParticleCanvas } from '../wind-canvas'

vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

const originalCanvasGetContext = Object.getOwnPropertyDescriptor(
	HTMLCanvasElement.prototype,
	'getContext',
)

afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
	if (originalCanvasGetContext) {
		Object.defineProperty(
			HTMLCanvasElement.prototype,
			'getContext',
			originalCanvasGetContext,
		)
	}
})

describe('weather map animation playback', () => {
	it('samples fresh wind data without resetting particles or their trails', () => {
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		const particles = vi
			.spyOn(wind, 'createWeatherMapParticles')
			.mockImplementation(() => [{ age: 0, x: 40, y: 40 }])
		const interpolateWind = vi.spyOn(
			wind,
			'getInterpolatedWeatherMapWindPoints',
		)
		const props = createMapProps()
		const { rerender, unmount } = render(
			<WeatherMapWindParticleCanvas {...props} />,
		)

		animation.runFrame(66)
		const firstParticleEnd = context.lineTo.mock.calls[0]
		const updatedFrames = createFrames(30)
		rerender(
			<WeatherMapWindParticleCanvas
				{...props}
				frames={updatedFrames}
				playbackPosition={1}
			/>,
		)
		animation.runFrame(132)

		expect(interpolateWind).toHaveBeenLastCalledWith({
			framePosition: 1,
			frames: updatedFrames,
			viewport: props.viewport,
		})
		expect(context.moveTo.mock.calls[1]).toEqual(firstParticleEnd)
		expect(particles).toHaveBeenCalledTimes(1)
		expect(context.clearRect).toHaveBeenCalledTimes(1)
		expect(context.setTransform).toHaveBeenCalledTimes(1)
		expect(animation.cancel).not.toHaveBeenCalled()
		expect(animation.pending.size).toBe(1)

		unmount()
		expect(animation.cancel).toHaveBeenCalledTimes(1)
		expect(animation.pending.size).toBe(0)
	})

	it('keeps precipitation throttled while sampling fresh playback and frames', () => {
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		const interpolatePrecipitation = vi.spyOn(
			precipitation,
			'getInterpolatedWeatherMapPrecipitationPoints',
		)
		const props = createMapProps()
		const { rerender, unmount } = render(
			<WeatherMapPrecipitationCanvas {...props} />,
		)

		animation.runFrame(66)
		const firstImage = context.putImageData.mock.calls[0]?.[0]
		const updatedFrames = createFrames(30)
		rerender(
			<WeatherMapPrecipitationCanvas
				{...props}
				frames={updatedFrames}
				playbackPosition={1}
			/>,
		)
		animation.runFrame(80)
		expect(context.drawImage).toHaveBeenCalledTimes(1)
		animation.runFrame(132)

		expect(interpolatePrecipitation).toHaveBeenLastCalledWith({
			framePosition: 1,
			frames: updatedFrames,
			viewport: props.viewport,
		})
		expect(context.drawImage).toHaveBeenCalledTimes(2)
		expect(context.putImageData.mock.calls[1]?.[0].data).not.toEqual(
			firstImage?.data,
		)
		expect(context.setTransform).toHaveBeenCalledTimes(1)
		expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledTimes(2)
		expect(animation.cancel).not.toHaveBeenCalled()
		expect(animation.pending.size).toBe(1)

		unmount()
		expect(animation.cancel).toHaveBeenCalledTimes(1)
		expect(animation.pending.size).toBe(0)
	})

	it('refreshes tooltip values without restarting its throttled animation', () => {
		const animation = mockAnimationFrames()
		const props = {
			...createMapProps(),
			point: { x: 50, y: 50 },
			usesMetricUnits: true,
			windUnitLabel: 'km/h',
		}
		const { rerender, unmount } = render(<WeatherMapTooltip {...props} />)

		animation.runFrame(66)
		expect(screen.getByText('10 km/h')).toBeInTheDocument()
		expect(screen.getByText('10%')).toBeInTheDocument()
		rerender(
			<WeatherMapTooltip
				{...props}
				frames={createFrames(30)}
				playbackPosition={1}
			/>,
		)
		animation.runFrame(80)
		expect(screen.getByText('10 km/h')).toBeInTheDocument()
		animation.runFrame(132)

		expect(screen.getByText('40 km/h')).toBeInTheDocument()
		expect(screen.getByText('40%')).toBeInTheDocument()
		expect(screen.getByText('4.0 mm/h')).toBeInTheDocument()
		expect(animation.cancel).not.toHaveBeenCalled()
		expect(animation.pending.size).toBe(1)

		unmount()
		expect(animation.cancel).toHaveBeenCalledTimes(1)
		expect(animation.pending.size).toBe(0)
	})

	it.each([
		['wind', WeatherMapWindParticleCanvas],
		['precipitation', WeatherMapPrecipitationCanvas],
	])(
		'restarts the %s canvas for size and viewport changes, and stops when hidden',
		(_, Canvas) => {
			const animation = mockAnimationFrames()
			const context = mockCanvasContext()
			const props = createMapProps()
			const { rerender, unmount } = render(
				<Canvas {...props} isActive={false} />,
			)
			expect(animation.pending.size).toBe(0)

			rerender(<Canvas {...props} />)
			expect(context.setTransform).toHaveBeenCalledTimes(1)
			expect(animation.pending.size).toBe(1)

			const resizedProps = {
				...props,
				dimensions: { height: 120, width: 160 },
			}
			rerender(<Canvas {...resizedProps} />)
			expect(animation.cancel).toHaveBeenCalledTimes(1)
			expect(context.setTransform).toHaveBeenCalledTimes(2)
			expect(animation.pending.size).toBe(1)

			const movedProps = {
				...resizedProps,
				viewport: { ...props.viewport, centerX: props.viewport.centerX + 10 },
			}
			rerender(<Canvas {...movedProps} />)
			expect(animation.cancel).toHaveBeenCalledTimes(2)
			expect(context.setTransform).toHaveBeenCalledTimes(3)
			expect(animation.pending.size).toBe(1)

			rerender(<Canvas {...movedProps} isActive={false} />)
			expect(animation.cancel).toHaveBeenCalledTimes(3)
			expect(animation.pending.size).toBe(0)
			unmount()
			expect(animation.cancel).toHaveBeenCalledTimes(3)
		},
	)
})

const createMapProps = () => {
	const dimensions = { height: 100, width: 100 }
	return {
		dimensions,
		frames: createFrames(10),
		isActive: true,
		playbackPosition: 0,
		viewport: getWeatherMapViewport({
			center: { lat: 0, lon: 0 },
			dimensions,
		}),
	}
}

const createFrames = (windSpeed: number): WeatherMapData['frames'] =>
	[0, 1].map((index) => ({
		points: [
			{
				lat: 0,
				lon: 0,
				precipitation: windSpeed / 10 + index,
				precipitationProbability: windSpeed + index * 10,
				windDirection: 0,
				windSpeed: windSpeed + index * 10,
			},
		],
		time: 100 + index * 3600,
	}))

const mockAnimationFrames = () => {
	const pending = new Map<number, FrameRequestCallback>()
	let nextId = 0
	vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
		nextId += 1
		pending.set(nextId, callback)
		return nextId
	})
	const cancel = vi
		.spyOn(window, 'cancelAnimationFrame')
		.mockImplementation((id) => {
			pending.delete(id)
		})

	return {
		cancel,
		pending,
		runFrame: (time: number) =>
			act(() => {
				for (const [id, callback] of [...pending]) {
					pending.delete(id)
					callback(time)
				}
			}),
	}
}

const mockCanvasContext = () => {
	const context = {
		beginPath: vi.fn(),
		clearRect: vi.fn(),
		createImageData: vi.fn((width: number, height: number): ImageData => ({
			colorSpace: 'srgb',
			data: new Uint8ClampedArray(width * height * 4),
			height,
			width,
		})),
		drawImage: vi.fn(),
		fillRect: vi.fn(),
		lineTo: vi.fn<(x: number, y: number) => void>(),
		moveTo: vi.fn<(x: number, y: number) => void>(),
		putImageData: vi.fn<(imageData: ImageData, x: number, y: number) => void>(),
		setTransform: vi.fn(),
		stroke: vi.fn(),
	}
	Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
		configurable: true,
		value: vi.fn(() => context),
	})
	return context
}

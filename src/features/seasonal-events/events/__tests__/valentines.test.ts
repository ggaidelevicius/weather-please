import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	SETTINGS_MODAL_STATE_EVENT,
	setSettingsModalOpenState,
} from '../../../../shared/lib/settings-modal-state'
import { launchValentinesHearts } from '../valentines'
import * as artwork from '../valentines-artwork'

let cleanupEffect = () => {}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
	vi.spyOn(performance, 'now').mockReturnValue(0)
	vi.spyOn(Math, 'random').mockReturnValue(0.5)
	vi.stubGlobal('innerWidth', 1024)
	vi.stubGlobal('innerHeight', 768)
	vi.stubGlobal('devicePixelRatio', 1)
	setSettingsModalOpenState(false)
})

afterEach(() => {
	cleanupEffect()
	cleanupEffect = () => {}
	setSettingsModalOpenState(false)
	document.body.innerHTML = ''
	document.head.innerHTML = ''
	vi.useRealTimers()
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe('Valentines scene', () => {
	it('waits for its delayed mount and can be canceled before any scene appears', async () => {
		const scene = await createScene({ shouldMount: false })
		vi.advanceTimersByTime(899)
		expect(document.querySelector('[data-valentines]')).toBeNull()
		expect(scene.pending.size).toBe(0)

		cleanupEffect()
		vi.advanceTimersByTime(1000)

		expect(document.querySelector('[data-valentines]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('redraws the static scene on resize and rebuilds artwork only for a new pixel density', async () => {
		const createArtwork = vi.spyOn(artwork, 'createValentinesArtwork')
		const scene = await createScene({ isReducedMotion: true })
		const canvas = document.querySelector('canvas[data-valentines]')

		expect(canvas).toHaveAttribute('data-valentines', 'true')
		expect(canvas).toHaveAttribute('aria-hidden', 'true')
		expect(canvas).toHaveStyle({
			pointerEvents: 'none',
			position: 'fixed',
			zIndex: '0',
		})
		expect(document.querySelectorAll('[data-valentines]')).toHaveLength(1)
		expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
		expect(scene.context.drawImage).toHaveBeenCalled()
		expect(scene.pending.size).toBe(0)
		expect(createArtwork).toHaveBeenCalledOnce()
		const initialDrawCount = scene.context.clearRect.mock.calls.length
		scene.context.drawImage.mockClear()

		vi.stubGlobal('innerWidth', 390)
		vi.stubGlobal('innerHeight', 844)
		window.dispatchEvent(new Event('resize'))

		expect(canvas).toHaveAttribute('width', '390')
		expect(canvas).toHaveAttribute('height', '844')
		expect(scene.context.clearRect).toHaveBeenCalledTimes(initialDrawCount + 1)
		expect(scene.context.clearRect).toHaveBeenLastCalledWith(0, 0, 390, 844)
		expect(scene.context.drawImage).toHaveBeenCalled()
		expect(createArtwork).toHaveBeenCalledOnce()
		vi.stubGlobal('devicePixelRatio', 3)
		window.dispatchEvent(new Event('resize'))

		expect(canvas).toHaveAttribute('width', '780')
		expect(canvas).toHaveAttribute('height', '1688')
		expect(canvas).toHaveStyle({ height: '844px', width: '390px' })
		expect(scene.context.clearRect).toHaveBeenCalledTimes(initialDrawCount + 2)
		expect(createArtwork).toHaveBeenCalledTimes(2)
		expect(createArtwork).toHaveBeenLastCalledWith({ dpr: 2 })
		expect(scene.pending.size).toBe(0)
	})

	it.each([60, 120])(
		'draws every browser frame at %i Hz',
		async (refreshRate) => {
			const scene = await createScene()
			const initialDrawCount = scene.context.clearRect.mock.calls.length

			for (let frame = 1; frame <= 10; frame += 1) {
				scene.runFrame((frame * 1000) / refreshRate)
				expect(scene.context.clearRect).toHaveBeenCalledTimes(
					initialDrawCount + frame,
				)
			}

			expect(scene.pending.size).toBe(1)
		},
	)

	it.each(['visibility', 'settings'])(
		'waits while %s is paused and resumes a long pause without a visual jump',
		async (reason) => {
			setSettingsModalOpenState(reason === 'settings')
			const scene = await createScene({ isHidden: reason === 'visibility' })
			const setPaused = (isPaused: boolean) => {
				if (reason === 'visibility') scene.setHidden(isPaused)
				else setSettingsModalOpenState(isPaused)
			}
			expect(scene.pending.size).toBe(0)
			setPaused(false)
			for (let frame = 0; frame <= 100; frame += 1) {
				scene.runFrame(frame * 50)
			}
			const beforePause = scene.captureFrame(5050)
			expect(beforePause.images.length).toBeGreaterThan(0)

			setPaused(true)
			const drawCount = scene.context.clearRect.mock.calls.length
			scene.runFrame(100_000)
			expect(scene.pending.size).toBe(0)
			expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount)
			window.dispatchEvent(new Event('resize'))
			expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 1)
			expect(scene.pending.size).toBe(0)
			setPaused(false)
			const afterPause = scene.captureFrame(120_000)

			expect(afterPause).toEqual(beforePause)
			expect(scene.captureFrame(120_020)).not.toEqual(afterPause)
		},
	)

	it('animates the heart cloud using cached artwork without creating new gradients on each frame', async () => {
		vi.mocked(Math.random).mockReturnValue(0.2)
		const createArtwork = vi.spyOn(artwork, 'createValentinesArtwork')
		const scene = await createScene()
		const linearGradientCount =
			scene.context.createLinearGradient.mock.calls.length
		const radialGradientCount =
			scene.context.createRadialGradient.mock.calls.length
		scene.context.drawImage.mockClear()

		for (let frame = 0; frame <= 100; frame += 1) {
			scene.runFrame(frame * 50)
		}

		expect(scene.context.drawImage).toHaveBeenCalled()
		expect(createArtwork).toHaveBeenCalledOnce()
		expect(scene.context.createLinearGradient).toHaveBeenCalledTimes(
			linearGradientCount,
		)
		expect(scene.context.createRadialGradient).toHaveBeenCalledTimes(
			radialGradientCount,
		)
	})

	it('lets the heart cloud gradually disperse more slowly than the normal field', async () => {
		const width = window.innerWidth
		const height = window.innerHeight
		const createArtwork = vi.spyOn(artwork, 'createValentinesArtwork')
		const measureDispersion = async (isCloud: boolean) => {
			let seed = 140226
			vi.mocked(Math.random)
				.mockImplementation(() => {
					seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
					return seed / 4294967296
				})
				.mockReturnValueOnce(isCloud ? 0.1 : 0.8)
			createArtwork.mockClear()
			const scene = await createScene()
			const cachedArtwork = createArtwork.mock.results[0]
			if (!cachedArtwork || cachedArtwork.type !== 'return') {
				throw new Error('Expected cached Valentine artwork')
			}
			const heartSprites = new Set<CanvasImageSource>(
				cachedArtwork.value.hearts,
			)
			const getHeartPositions = (time: number) =>
				scene
					.captureFrame(time)
					.images.filter(({ source }) => heartSprites.has(source))
					.map(({ x, y }) => ({ x, y }))
			for (let frame = 0; frame < 100; frame += 1) {
				scene.captureFrame(frame * 50)
			}
			let previous = getHeartPositions(5000)
			expect(previous.length).toBeGreaterThan(0)
			const displacement = previous.map(() => ({ x: 0, y: 0 }))
			for (let frame = 101; frame <= 1900; frame += 1) {
				const positions = getHeartPositions(frame * 50)
				for (let index = 0; index < positions.length; index += 1) {
					const dx = positions[index].x - previous[index].x
					const dy = positions[index].y - previous[index].y
					// Ignore the single-frame jump when a particle wraps at an edge.
					if (Math.abs(dx) < width / 2) displacement[index].x += dx
					if (Math.abs(dy) < height / 2) displacement[index].y += dy
				}
				previous = positions
			}
			expect(previous).toHaveLength(displacement.length)
			cleanupEffect()
			const center = getCenter(displacement)
			return Math.sqrt(
				displacement.reduce(
					(sum, point) =>
						sum + (point.x - center.x) ** 2 + (point.y - center.y) ** 2,
					0,
				) / displacement.length,
			)
		}
		const cloudDispersion = await measureDispersion(true)
		const freeFieldDispersion = await measureDispersion(false)

		expect(cloudDispersion).toBeGreaterThan(1)
		expect(cloudDispersion).toBeLessThan(freeFieldDispersion * 0.35)
	})

	it('responds to live reduced-motion changes with a visible static scene', async () => {
		const scene = await createScene()
		scene.runFrame(0)
		scene.runFrame(20)
		const drawCount = scene.context.clearRect.mock.calls.length
		scene.context.drawImage.mockClear()

		scene.setReducedMotion(true)

		expect(scene.pending.size).toBe(0)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 1)
		expect(scene.context.drawImage).toHaveBeenCalled()
		scene.runFrame(120_000)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 1)
		scene.setReducedMotion(false)
		expect(scene.pending.size).toBe(1)
		scene.runFrame(120_020)
		expect(scene.context.clearRect.mock.calls.length).toBeGreaterThan(
			drawCount + 1,
		)
	})

	it('ignores canceled callbacks after pause and resume without starting an extra loop', async () => {
		const scene = await createScene()
		const staleCallback = scene.pending.values().next().value
		if (!staleCallback) throw new Error('Expected a scheduled Valentines frame')
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		const drawCount = scene.context.clearRect.mock.calls.length

		staleCallback(120_000)

		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount)
		expect(scene.pending.size).toBe(1)
		scene.runFrame(120_020)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 1)
		expect(scene.pending.size).toBe(1)
	})

	it('removes mounted artwork, listeners and queued work on cleanup', async () => {
		const removeWindowListener = vi.spyOn(window, 'removeEventListener')
		const removeDocumentListener = vi.spyOn(document, 'removeEventListener')
		const scene = await createScene()
		const staleCallback = scene.pending.values().next().value
		if (!staleCallback) throw new Error('Expected a scheduled Valentines frame')
		const initialDrawCount = scene.context.clearRect.mock.calls.length

		cleanupEffect()
		staleCallback(120_000)
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		window.dispatchEvent(new Event('resize'))
		scene.setHidden(false)
		scene.setReducedMotion(true)
		vi.advanceTimersByTime(1000)

		expect(document.querySelector('[data-valentines]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(initialDrawCount)
		expect(removeWindowListener).toHaveBeenCalledWith(
			'resize',
			expect.any(Function),
		)
		expect(removeWindowListener).toHaveBeenCalledWith(
			SETTINGS_MODAL_STATE_EVENT,
			expect.any(Function),
		)
		expect(removeDocumentListener).toHaveBeenCalledWith(
			'visibilitychange',
			expect.any(Function),
		)
		expect(scene.motion.removeEventListener).toHaveBeenCalledWith(
			'change',
			expect.any(Function),
		)
	})

	it('cleans up roots and any listeners if artwork initialization fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.spyOn(artwork, 'createValentinesArtwork').mockImplementationOnce(() => {
			throw new Error('Artwork unavailable')
		})
		const addWindowListener = vi.spyOn(window, 'addEventListener')
		const removeWindowListener = vi.spyOn(window, 'removeEventListener')
		const addDocumentListener = vi.spyOn(document, 'addEventListener')
		const removeDocumentListener = vi.spyOn(document, 'removeEventListener')
		const scene = await createScene()
		const initialDrawCount = scene.context.clearRect.mock.calls.length

		for (const [event, listener] of addWindowListener.mock.calls) {
			if (event === 'resize' || event === SETTINGS_MODAL_STATE_EVENT) {
				expect(removeWindowListener).toHaveBeenCalledWith(event, listener)
			}
		}
		for (const [event, listener] of addDocumentListener.mock.calls) {
			if (event === 'visibilitychange') {
				expect(removeDocumentListener).toHaveBeenCalledWith(event, listener)
			}
		}
		for (const [event, listener] of scene.motion.addEventListener.mock.calls) {
			expect(scene.motion.removeEventListener).toHaveBeenCalledWith(
				event,
				listener,
			)
		}
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		window.dispatchEvent(new Event('resize'))
		scene.setHidden(false)
		scene.setReducedMotion(true)

		expect(document.querySelector('[data-valentines]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(initialDrawCount)
	})

	it('leaves one scene and one animation loop after cleanup and restart', async () => {
		const scene = await createScene()

		for (let run = 0; run < 3; run += 1) {
			expect(document.querySelectorAll('[data-valentines]')).toHaveLength(1)
			expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
			expect(scene.pending.size).toBe(1)
			cleanupEffect()
			expect(document.querySelector('[data-valentines]')).toBeNull()
			expect(scene.pending.size).toBe(0)
			if (run < 2) {
				cleanupEffect = await launchValentinesHearts()
				vi.advanceTimersByTime(900)
			}
		}
	})
})

const createScene = async ({
	isHidden = false,
	isReducedMotion = false,
	shouldMount = true,
}: {
	isHidden?: boolean
	isReducedMotion?: boolean
	shouldMount?: boolean
} = {}) => {
	let isDocumentHidden = isHidden
	vi.spyOn(document, 'hidden', 'get').mockImplementation(() => isDocumentHidden)
	const pending = new Map<number, FrameRequestCallback>()
	let nextFrameId = 0
	vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
		nextFrameId += 1
		pending.set(nextFrameId, callback)
		return nextFrameId
	})
	vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
		pending.delete(id)
	})
	const motionTarget = new EventTarget()
	const motion = {
		addEventListener: vi.fn(
			(type: string, listener: EventListenerOrEventListenerObject) =>
				motionTarget.addEventListener(type, listener),
		),
		matches: isReducedMotion,
		removeEventListener: vi.fn(
			(type: string, listener: EventListenerOrEventListenerObject) =>
				motionTarget.removeEventListener(type, listener),
		),
	}
	vi.stubGlobal(
		'matchMedia',
		vi.fn(() => motion),
	)
	const images: {
		alpha: number
		coordinates: number[]
		source: CanvasImageSource
		x: number
		y: number
	}[] = []
	let translation = { x: 0, y: 0 }
	const savedTranslations: { x: number; y: number }[] = []
	const context = {
		arc: () => {},
		beginPath: () => {},
		bezierCurveTo: () => {},
		clearRect: vi.fn(),
		clip: () => {},
		closePath: () => {},
		createLinearGradient: vi.fn(() => ({ addColorStop: () => {} })),
		createRadialGradient: vi.fn(() => ({ addColorStop: () => {} })),
		drawImage: vi.fn((source: CanvasImageSource, ...coordinates: number[]) => {
			images.push({
				alpha: context.globalAlpha,
				coordinates,
				source,
				...translation,
			})
		}),
		ellipse: () => {},
		fill: () => {},
		fillRect: () => {},
		globalAlpha: 1,
		lineTo: () => {},
		moveTo: () => {},
		quadraticCurveTo: () => {},
		restore: () => {
			translation = savedTranslations.pop() ?? { x: 0, y: 0 }
		},
		rotate: vi.fn<(angle: number) => void>(),
		roundRect: () => {},
		save: () => {
			savedTranslations.push({ ...translation })
		},
		scale: vi.fn(),
		setTransform: () => {},
		stroke: () => {},
		translate: vi.fn((x: number, y: number) => {
			translation = { x: translation.x + x, y: translation.y + y }
		}),
	}
	const partialContext: Partial<CanvasRenderingContext2D> = context
	vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
		partialContext as CanvasRenderingContext2D,
	)
	const runFrame = (time: number) => {
		for (const [id, callback] of [...pending]) {
			pending.delete(id)
			callback(time)
		}
	}
	cleanupEffect = await launchValentinesHearts()
	if (shouldMount) vi.advanceTimersByTime(900)

	return {
		context,
		motion,
		pending,
		runFrame,
		captureFrame: (time: number) => {
			context.clearRect.mockClear()
			context.drawImage.mockClear()
			context.translate.mockClear()
			context.rotate.mockClear()
			context.scale.mockClear()
			images.length = 0
			runFrame(time)
			return {
				images: [...images],
				rotations: [...context.rotate.mock.calls],
				scales: [...context.scale.mock.calls],
				translations: [...context.translate.mock.calls],
			}
		},
		setHidden: (isNextHidden: boolean) => {
			isDocumentHidden = isNextHidden
			document.dispatchEvent(new Event('visibilitychange'))
		},
		setReducedMotion: (shouldReduceMotion: boolean) => {
			motion.matches = shouldReduceMotion
			motionTarget.dispatchEvent(new Event('change'))
		},
	}
}

const getCenter = (points: readonly { x: number; y: number }[]) => ({
	x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
	y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
})

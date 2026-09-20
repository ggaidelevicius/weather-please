import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	SETTINGS_MODAL_STATE_EVENT,
	setSettingsModalOpenState,
} from '../../../../shared/lib/settings-modal-state'
import { launchEaster } from '../easter'
import * as artwork from '../easter-artwork'

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

describe('Easter scene', () => {
	it('waits for its delayed mount and can be canceled before any scene appears', async () => {
		const scene = await createScene({ shouldMount: false })
		vi.advanceTimersByTime(899)
		expect(document.querySelector('[data-easter]')).toBeNull()
		expect(scene.pending.size).toBe(0)

		cleanupEffect()
		vi.advanceTimersByTime(1000)

		expect(document.querySelector('[data-easter]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('redraws the static scene on resize and rebuilds artwork only for a new pixel density', async () => {
		const createArtwork = vi.spyOn(artwork, 'createEasterArtwork')
		const scene = await createScene({ isReducedMotion: true })
		const canvas = document.querySelector('canvas[data-easter]')

		expect(canvas).toHaveAttribute('data-easter', 'true')
		expect(canvas).toHaveAttribute('aria-hidden', 'true')
		expect(canvas).toHaveStyle({
			pointerEvents: 'none',
			position: 'fixed',
			zIndex: '0',
		})
		expect(document.querySelectorAll('[data-easter]')).toHaveLength(1)
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

	it('animates cached eggs and flowers with gentle rocking', async () => {
		const createArtwork = vi.spyOn(artwork, 'createEasterArtwork')
		const scene = await createScene()
		const linearGradientCount =
			scene.context.createLinearGradient.mock.calls.length
		const radialGradientCount =
			scene.context.createRadialGradient.mock.calls.length
		scene.context.rotate.mockClear()
		for (let frame = 0; frame <= 400; frame += 1) {
			scene.runFrame(frame * 50)
		}
		const rotations = scene.context.rotate.mock.calls.map(([angle]) =>
			Math.abs(angle),
		)

		expect(rotations.length).toBeGreaterThan(0)
		expect(Math.max(...rotations)).toBeLessThan(Math.PI / 4)
		expect(createArtwork).toHaveBeenCalledOnce()
		expect(scene.context.createLinearGradient).toHaveBeenCalledTimes(
			linearGradientCount,
		)
		expect(scene.context.createRadialGradient).toHaveBeenCalledTimes(
			radialGradientCount,
		)
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
		if (!staleCallback) throw new Error('Expected a scheduled Easter frame')
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
		if (!staleCallback) throw new Error('Expected a scheduled Easter frame')
		const initialDrawCount = scene.context.clearRect.mock.calls.length

		cleanupEffect()
		staleCallback(120_000)
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		window.dispatchEvent(new Event('resize'))
		scene.setHidden(false)
		scene.setReducedMotion(true)
		vi.advanceTimersByTime(1000)

		expect(document.querySelector('[data-easter]')).toBeNull()
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
		vi.spyOn(artwork, 'createEasterArtwork').mockImplementationOnce(() => {
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

		expect(document.querySelector('[data-easter]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(initialDrawCount)
	})

	it('leaves one scene and one animation loop after cleanup and restart', async () => {
		const scene = await createScene()

		for (let run = 0; run < 3; run += 1) {
			expect(document.querySelectorAll('[data-easter]')).toHaveLength(1)
			expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
			expect(scene.pending.size).toBe(1)
			cleanupEffect()
			expect(document.querySelector('[data-easter]')).toBeNull()
			expect(scene.pending.size).toBe(0)
			if (run < 2) {
				cleanupEffect = await launchEaster()
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
	const images: { alpha: number; coordinates: number[] }[] = []
	const context = {
		arc: () => {},
		beginPath: () => {},
		bezierCurveTo: () => {},
		clearRect: vi.fn(),
		clip: () => {},
		closePath: () => {},
		createLinearGradient: vi.fn(() => ({ addColorStop: () => {} })),
		createRadialGradient: vi.fn(() => ({ addColorStop: () => {} })),
		drawImage: vi.fn((_image: CanvasImageSource, ...coordinates: number[]) => {
			images.push({ alpha: context.globalAlpha, coordinates })
		}),
		ellipse: () => {},
		fill: () => {},
		fillRect: () => {},
		globalAlpha: 1,
		lineTo: () => {},
		moveTo: () => {},
		quadraticCurveTo: () => {},
		restore: () => {},
		rotate: vi.fn<(angle: number) => void>(),
		roundRect: () => {},
		save: () => {},
		scale: vi.fn(),
		setTransform: () => {},
		stroke: () => {},
		translate: vi.fn(),
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
	cleanupEffect = await launchEaster()
	if (shouldMount) vi.advanceTimersByTime(900)

	return {
		context,
		motion,
		pending,
		runFrame,
		captureFrame: (time: number) => {
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

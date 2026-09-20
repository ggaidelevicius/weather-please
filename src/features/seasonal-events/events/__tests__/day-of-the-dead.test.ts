import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	SETTINGS_MODAL_STATE_EVENT,
	setSettingsModalOpenState,
} from '../../../../shared/lib/settings-modal-state'
import { launchDayOfTheDead } from '../day-of-the-dead'
import * as artwork from '../day-of-the-dead-artwork'
import * as banners from '../day-of-the-dead-banners'

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
	vi.useRealTimers()
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe('Day of the Dead scene', () => {
	it('can cancel its delayed mount before artwork is allocated', async () => {
		const scene = await createScene({ shouldMount: false })
		vi.advanceTimersByTime(899)
		expect(document.querySelector('[data-day-of-the-dead]')).toBeNull()
		expect(scene.createArtwork).not.toHaveBeenCalled()
		expect(scene.createBanners).not.toHaveBeenCalled()
		expect(scene.pending.size).toBe(0)

		cleanupEffect()
		vi.advanceTimersByTime(1000)

		expect(document.querySelector('[data-day-of-the-dead]')).toBeNull()
		expect(scene.createArtwork).not.toHaveBeenCalled()
		expect(scene.createBanners).not.toHaveBeenCalled()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('redraws a visible static scene and reuses its artwork and particles across resize and density changes', async () => {
		const scene = await createScene({ isReducedMotion: true })
		const canvas = document.querySelector('canvas[data-day-of-the-dead]')
		expect(canvas).toHaveAttribute('data-day-of-the-dead', 'true')
		expect(canvas).toHaveAttribute('aria-hidden', 'true')
		expect(canvas).toHaveStyle({
			pointerEvents: 'none',
			position: 'fixed',
			zIndex: '0',
		})
		expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
		expect(scene.getSnapshot().images.some(({ alpha }) => alpha > 0)).toBe(true)
		expect(scene.createArtwork).toHaveBeenCalledOnce()
		expect(scene.createBanners).toHaveBeenCalledOnce()
		expect(scene.pending.size).toBe(0)
		const drawCount = scene.context.clearRect.mock.calls.length
		const randomCount = vi.mocked(Math.random).mock.calls.length
		const cachedArtwork = scene.createArtwork.mock.results[0].value
		const groundedSources = new Set([
			cachedArtwork.candle,
			...cachedArtwork.skulls,
		])
		const groundedBefore = scene
			.getSnapshot()
			.images.filter(({ source }) => groundedSources.has(source))
		expect(groundedBefore.length).toBeGreaterThan(0)
		vi.stubGlobal('innerHeight', 888)
		window.dispatchEvent(new Event('resize'))
		const groundedAfter = scene
			.getSnapshot()
			.images.filter(({ source }) => groundedSources.has(source))
		expect(groundedAfter).toEqual(
			groundedBefore.map((image) => ({
				...image,
				coordinates: [
					image.coordinates[0],
					image.coordinates[1] + 120,
					...image.coordinates.slice(2),
				],
			})),
		)

		vi.stubGlobal('innerWidth', 390)
		vi.stubGlobal('innerHeight', 844)
		window.dispatchEvent(new Event('resize'))
		expect(canvas).toHaveAttribute('width', '390')
		expect(canvas).toHaveAttribute('height', '844')
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 2)
		vi.stubGlobal('devicePixelRatio', 3)
		window.dispatchEvent(new Event('resize'))

		expect(canvas).toHaveAttribute('width', '780')
		expect(canvas).toHaveAttribute('height', '1688')
		expect(canvas).toHaveStyle({ width: '390px', height: '844px' })
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 3)
		expect(scene.createArtwork).toHaveBeenCalledOnce()
		expect(scene.createBanners).toHaveBeenCalledOnce()
		expect(Math.random).toHaveBeenCalledTimes(randomCount)
		expect(scene.pending.size).toBe(0)
	})

	it.each([60, 120])('draws every browser frame at %i Hz', async (rate) => {
		const scene = await createScene()
		const drawCount = scene.context.clearRect.mock.calls.length
		for (let frame = 0; frame < 10; frame += 1) {
			scene.runFrame((frame * 1000) / rate)
			expect(scene.context.clearRect).toHaveBeenCalledTimes(
				drawCount + frame + 1,
			)
		}
		expect(scene.pending.size).toBe(1)
		expect(scene.createArtwork).toHaveBeenCalledOnce()
		expect(scene.createBanners).toHaveBeenCalledOnce()
	})

	it.each(['visibility', 'settings'])(
		'waits while %s is paused, redraws on resize, and resumes without a visual jump',
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
			expect(beforePause.images.some(({ alpha }) => alpha > 0)).toBe(true)
			setPaused(true)
			const drawCount = scene.context.clearRect.mock.calls.length
			scene.runFrame(100_000)
			expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount)
			expect(scene.pending.size).toBe(0)

			scene.clearSnapshot()
			window.dispatchEvent(new Event('resize'))
			expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 1)
			expect(scene.getSnapshot()).toEqual(beforePause)
			expect(scene.pending.size).toBe(0)
			setPaused(false)
			const afterPause = scene.captureFrame(120_000)

			expect(afterPause).toEqual(beforePause)
			expect(scene.captureFrame(120_020)).not.toEqual(afterPause)
		},
	)

	it('reveals and freezes the scene when reduced motion changes live', async () => {
		const scene = await createScene()
		scene.runFrame(0)
		scene.runFrame(20)
		const drawCount = scene.context.clearRect.mock.calls.length
		scene.clearSnapshot()

		scene.setReducedMotion(true)

		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 1)
		expect(scene.pending.size).toBe(0)
		const staticFrame = scene.getSnapshot()
		expect(staticFrame.images.some(({ alpha }) => alpha > 0)).toBe(true)
		scene.runFrame(120_000)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 1)
		scene.clearSnapshot()
		window.dispatchEvent(new Event('resize'))
		expect(scene.getSnapshot()).toEqual(staticFrame)
		scene.setReducedMotion(false)
		expect(scene.pending.size).toBe(1)
		expect(scene.captureFrame(120_020)).toEqual(staticFrame)
	})

	it('ignores canceled callbacks after pause and resume without creating an extra loop', async () => {
		const scene = await createScene()
		const staleCallback = scene.getPendingCallback()
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

	it('cleans up immediately after resume and ignores duplicate cleanup or late callbacks', async () => {
		const removeWindowListener = vi.spyOn(window, 'removeEventListener')
		const removeDocumentListener = vi.spyOn(document, 'removeEventListener')
		const scene = await createScene()
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		const staleCallback = scene.getPendingCallback()
		const drawCount = scene.context.clearRect.mock.calls.length

		cleanupEffect()
		cleanupEffect()
		staleCallback(120_000)
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		window.dispatchEvent(new Event('resize'))
		scene.setHidden(false)
		scene.setReducedMotion(true)
		vi.advanceTimersByTime(1000)

		expect(document.querySelector('[data-day-of-the-dead]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount)
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

	it.each(['context', 'initial draw'])(
		'leaves no roots or active listeners when %s fails',
		async (stage) => {
			vi.spyOn(console, 'error').mockImplementation(() => {})
			const addWindowListener = vi.spyOn(window, 'addEventListener')
			const removeWindowListener = vi.spyOn(window, 'removeEventListener')
			const addDocumentListener = vi.spyOn(document, 'addEventListener')
			const removeDocumentListener = vi.spyOn(document, 'removeEventListener')
			const scene = await createScene({ shouldMount: false })
			if (stage === 'context') scene.getContext.mockReturnValueOnce(null)
			else
				scene.context.drawImage.mockImplementationOnce(() => {
					throw new Error('Initial drawing unavailable')
				})

			vi.advanceTimersByTime(900)

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
			for (const [event, listener] of scene.motion.addEventListener.mock
				.calls) {
				expect(scene.motion.removeEventListener).toHaveBeenCalledWith(
					event,
					listener,
				)
			}
			const drawCount = scene.context.clearRect.mock.calls.length
			setSettingsModalOpenState(true)
			setSettingsModalOpenState(false)
			window.dispatchEvent(new Event('resize'))
			scene.setHidden(false)
			scene.setReducedMotion(true)
			expect(document.querySelector('[data-day-of-the-dead]')).toBeNull()
			expect(scene.pending.size).toBe(0)
			expect(vi.getTimerCount()).toBe(0)
			expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount)
			if (stage === 'context') {
				expect(scene.createArtwork).not.toHaveBeenCalled()
				expect(scene.createBanners).not.toHaveBeenCalled()
			}
		},
	)

	it('leaves one scene and animation loop after cleanup and restart', async () => {
		const scene = await createScene()
		for (let run = 0; run < 3; run += 1) {
			expect(document.querySelectorAll('[data-day-of-the-dead]')).toHaveLength(
				1,
			)
			expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
			expect(scene.pending.size).toBe(1)
			cleanupEffect()
			expect(document.querySelector('[data-day-of-the-dead]')).toBeNull()
			expect(scene.pending.size).toBe(0)
			if (run < 2) {
				cleanupEffect = await launchDayOfTheDead()
				vi.advanceTimersByTime(900)
			}
		}
		expect(scene.createArtwork).toHaveBeenCalledTimes(3)
		expect(scene.createBanners).toHaveBeenCalledTimes(3)
	})
})

async function createScene({
	isHidden = false,
	isReducedMotion = false,
	shouldMount = true,
}: {
	isHidden?: boolean
	isReducedMotion?: boolean
	shouldMount?: boolean
} = {}) {
	let isDocumentHidden = isHidden
	vi.spyOn(document, 'hidden', 'get').mockImplementation(() => isDocumentHidden)
	const pending = new Map<number, FrameRequestCallback>()
	let nextFrameId = 0
	vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
		nextFrameId += 1
		pending.set(nextFrameId, callback)
		return nextFrameId
	})
	vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) =>
		pending.delete(id),
	)
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
	const createArtwork = vi
		.spyOn(artwork, 'createDayOfTheDeadArtwork')
		.mockImplementation(() => {
			const createCanvas = () => document.createElement('canvas')
			return {
				skulls: Array.from({ length: 2 }, createCanvas),
				marigolds: Array.from({ length: 3 }, createCanvas),
				petals: Array.from({ length: 3 }, createCanvas),
				butterflies: Array.from({ length: 2 }, createCanvas),
				candle: createCanvas(),
				flame: createCanvas(),
				glow: createCanvas(),
			}
		})
	const createBanners = vi
		.spyOn(banners, 'createDayOfTheDeadBanners')
		.mockImplementation(() =>
			Array.from({ length: 5 }, () => document.createElement('canvas')),
		)
	const images: {
		alpha: number
		composition: string
		coordinates: number[]
		source: CanvasImageSource
	}[] = []
	const savedStates: {
		alpha: number
		composition: GlobalCompositeOperation
	}[] = []
	const context = {
		beginPath: vi.fn(),
		moveTo: vi.fn<(x: number, y: number) => void>(),
		quadraticCurveTo:
			vi.fn<(cpx: number, cpy: number, x: number, y: number) => void>(),
		stroke: vi.fn(),
		clearRect: vi.fn(() => {
			images.length = 0
		}),
		drawImage: vi.fn((source: CanvasImageSource, ...coordinates: number[]) => {
			images.push({
				alpha: context.globalAlpha,
				composition: context.globalCompositeOperation,
				coordinates,
				source,
			})
		}),
		globalAlpha: 1,
		globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
		restore: () => {
			const state = savedStates.pop()
			if (!state) return
			context.globalAlpha = state.alpha
			context.globalCompositeOperation = state.composition
		},
		rotate: vi.fn<(angle: number) => void>(),
		save: () =>
			savedStates.push({
				alpha: context.globalAlpha,
				composition: context.globalCompositeOperation,
			}),
		scale: vi.fn<(x: number, y: number) => void>(),
		setTransform: vi.fn(),
		translate: vi.fn<(x: number, y: number) => void>(),
	}
	const partialContext: Partial<CanvasRenderingContext2D> = context
	const getContext = vi
		.spyOn(HTMLCanvasElement.prototype, 'getContext')
		.mockReturnValue(partialContext as CanvasRenderingContext2D)
	const runFrame = (time: number) => {
		for (const [id, callback] of [...pending]) {
			pending.delete(id)
			callback(time)
		}
	}
	const clearSnapshot = () => {
		images.length = 0
		context.translate.mockClear()
		context.rotate.mockClear()
		context.scale.mockClear()
		context.moveTo.mockClear()
		context.quadraticCurveTo.mockClear()
	}
	const getSnapshot = () => ({
		images: [...images],
		translations: [...context.translate.mock.calls],
		rotations: [...context.rotate.mock.calls],
		scales: [...context.scale.mock.calls],
		pathStarts: [...context.moveTo.mock.calls],
		curves: [...context.quadraticCurveTo.mock.calls],
	})
	cleanupEffect = await launchDayOfTheDead()
	if (shouldMount) vi.advanceTimersByTime(900)

	return {
		clearSnapshot,
		context,
		createArtwork,
		createBanners,
		getContext,
		getPendingCallback: () => {
			const callback = pending.values().next().value
			if (!callback)
				throw new Error('Expected a scheduled Day of the Dead frame')
			return callback
		},
		getSnapshot,
		motion,
		pending,
		runFrame,
		captureFrame: (time: number) => {
			clearSnapshot()
			runFrame(time)
			return getSnapshot()
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

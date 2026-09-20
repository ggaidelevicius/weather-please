import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	SETTINGS_MODAL_STATE_EVENT,
	setSettingsModalOpenState,
} from '../../../../shared/lib/settings-modal-state'
import { launchWinterSolstice } from '../winter-solstice'
import * as artwork from '../winter-solstice-artwork'

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

describe('Winter solstice scene', () => {
	it('waits for the delayed mount and can be canceled before any scene appears', async () => {
		const scene = await createScene({ shouldMount: false })
		vi.advanceTimersByTime(899)
		expect(document.querySelector('[data-winter-solstice]')).toBeNull()
		expect(scene.pending.size).toBe(0)

		cleanupEffect()
		vi.advanceTimersByTime(1000)

		expect(document.querySelector('[data-winter-solstice]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('redraws the static scene on resize and rebuilds crystal artwork only for a new pixel density', async () => {
		const createArtwork = vi.spyOn(artwork, 'createWinterCrystalArtwork')
		const scene = await createScene({ isReducedMotion: true })
		const overlay = document.querySelector('[data-winter-solstice="true"]')
		const canvas = document.querySelector('canvas[data-winter-solstice]')
		const crystals = createArtwork.mock.calls[0]?.[0].crystals

		expect(overlay).toHaveAttribute('aria-hidden', 'true')
		expect(overlay).toHaveStyle({ pointerEvents: 'none', position: 'fixed' })
		expect(overlay?.querySelectorAll('[data-winter-aurora]')).toHaveLength(3)
		expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
		expect(scene.context.drawImage).toHaveBeenCalled()
		expect(scene.pending.size).toBe(0)
		expect(createArtwork).toHaveBeenCalledOnce()
		const initialDrawCount = scene.context.clearRect.mock.calls.length

		vi.stubGlobal('innerWidth', 390)
		vi.stubGlobal('innerHeight', 844)
		window.dispatchEvent(new Event('resize'))

		expect(canvas).toHaveAttribute('width', '390')
		expect(canvas).toHaveAttribute('height', '844')
		expect(scene.context.clearRect).toHaveBeenCalledTimes(initialDrawCount + 1)
		expect(scene.context.clearRect).toHaveBeenLastCalledWith(0, 0, 390, 844)
		expect(createArtwork).toHaveBeenCalledOnce()
		vi.stubGlobal('devicePixelRatio', 2)
		window.dispatchEvent(new Event('resize'))

		expect(canvas).toHaveAttribute('width', '780')
		expect(canvas).toHaveAttribute('height', '1688')
		expect(canvas).toHaveStyle({ height: '844px', width: '390px' })
		expect(createArtwork).toHaveBeenCalledTimes(2)
		expect(createArtwork).toHaveBeenLastCalledWith({ dpr: 2, crystals })
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

	it.each(['visibility', 'settings', 'motion'])(
		'waits for %s to permit animation and pauses again when it changes',
		async (reason) => {
			setSettingsModalOpenState(reason === 'settings')
			const scene = await createScene({
				isHidden: reason === 'visibility',
				isReducedMotion: reason === 'motion',
			})
			const setPaused = (isPaused: boolean) => {
				if (reason === 'visibility') scene.setHidden(isPaused)
				else if (reason === 'motion') scene.setReducedMotion(isPaused)
				else setSettingsModalOpenState(isPaused)
			}
			expect(scene.pending.size).toBe(0)

			setPaused(false)
			const initialDrawCount = scene.context.clearRect.mock.calls.length
			scene.runFrame(20)
			expect(scene.context.clearRect).toHaveBeenCalledTimes(
				initialDrawCount + 1,
			)
			setPaused(true)
			const pausedDrawCount = scene.context.clearRect.mock.calls.length
			scene.runFrame(40)

			expect(scene.pending.size).toBe(0)
			expect(scene.context.clearRect).toHaveBeenCalledTimes(pausedDrawCount)
			window.dispatchEvent(new Event('resize'))
			expect(scene.context.clearRect).toHaveBeenCalledTimes(pausedDrawCount + 1)
			expect(scene.pending.size).toBe(0)
			setPaused(false)
			expect(scene.pending.size).toBe(1)
		},
	)

	it.each(['visibility', 'settings'])(
		'preserves crystal and aurora state across a long %s pause',
		async (reason) => {
			const scene = await createScene()
			for (let frame = 0; frame <= 100; frame += 1) {
				scene.runFrame(frame * 50)
			}
			const beforePause = scene.captureFrame(5050)
			expect(beforePause.translations.length).toBeGreaterThan(0)
			if (reason === 'visibility') scene.setHidden(true)
			else setSettingsModalOpenState(true)

			if (reason === 'visibility') scene.setHidden(false)
			else setSettingsModalOpenState(false)
			const afterPause = scene.captureFrame(120_000)

			expect(afterPause).toEqual(beforePause)
			expect(scene.captureFrame(120_020)).not.toEqual(afterPause)
		},
	)

	it('ignores a canceled callback after pause and resume without starting an extra loop', async () => {
		const scene = await createScene()
		const staleCallback = scene.pending.values().next().value
		if (!staleCallback) throw new Error('Expected a scheduled winter frame')
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
		if (!staleCallback) throw new Error('Expected a scheduled winter frame')
		const initialDrawCount = scene.context.clearRect.mock.calls.length

		cleanupEffect()
		staleCallback(120_000)
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		window.dispatchEvent(new Event('resize'))
		scene.setHidden(false)
		scene.setReducedMotion(true)
		vi.advanceTimersByTime(1000)

		expect(document.querySelector('[data-winter-solstice]')).toBeNull()
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

	it('cleans up roots and any listeners if cached artwork creation fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.spyOn(artwork, 'createWinterCrystalArtwork').mockImplementationOnce(
			() => {
				throw new Error('Artwork unavailable')
			},
		)
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

		expect(document.querySelector('[data-winter-solstice]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(initialDrawCount)
	})

	it('leaves one scene and one animation loop after cleanup and restart', async () => {
		const scene = await createScene()

		for (let run = 0; run < 3; run += 1) {
			expect(
				document.querySelectorAll('[data-winter-solstice="true"]'),
			).toHaveLength(1)
			expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
			expect(scene.pending.size).toBe(1)
			cleanupEffect()
			expect(document.querySelector('[data-winter-solstice]')).toBeNull()
			expect(scene.pending.size).toBe(0)
			if (run < 2) {
				cleanupEffect = await launchWinterSolstice()
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
	const drawAlphas: number[] = []
	const context = {
		arc: () => {},
		beginPath: () => {},
		clearRect: vi.fn(),
		createRadialGradient: () => ({ addColorStop: () => {} }),
		drawImage: vi.fn(() => {
			drawAlphas.push(context.globalAlpha)
		}),
		fill: () => {},
		globalAlpha: 1,
		lineTo: () => {},
		moveTo: () => {},
		restore: () => {},
		rotate: vi.fn(),
		save: () => {},
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
	cleanupEffect = await launchWinterSolstice()
	if (shouldMount) vi.advanceTimersByTime(900)

	return {
		context,
		motion,
		pending,
		runFrame,
		captureFrame: (time: number) => {
			context.translate.mockClear()
			context.rotate.mockClear()
			drawAlphas.length = 0
			runFrame(time)
			return {
				alphas: [...drawAlphas],
				auroras: Array.from(
					document.querySelectorAll<HTMLElement>('[data-winter-aurora]'),
					(layer) => layer.style.cssText,
				),
				rotations: [...context.rotate.mock.calls],
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

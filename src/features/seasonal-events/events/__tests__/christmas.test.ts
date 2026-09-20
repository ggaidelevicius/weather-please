import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setSettingsModalOpenState } from '../../../../shared/lib/settings-modal-state'
import { launchChristmasSnowfall } from '../christmas'
import * as artwork from '../christmas-artwork'

let cleanupEffect = () => {}

beforeEach(() => {
	vi.spyOn(performance, 'now').mockReturnValue(0)
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
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe('Christmas scene', () => {
	it('keeps a static scene visible on resize and rebuilds cached artwork only when pixel density changes', async () => {
		const createArtwork = vi.spyOn(artwork, 'createChristmasArtwork')
		const scene = await createScene({ isReducedMotion: true })
		const canvas = document.querySelector('canvas[data-christmas]')

		expect(canvas).toHaveAttribute('data-christmas', 'true')
		expect(canvas).toHaveAttribute('aria-hidden', 'true')
		expect(canvas).toHaveStyle({ pointerEvents: 'none', position: 'fixed' })
		expect(scene.context.drawImage).toHaveBeenCalled()
		expect(scene.pending.size).toBe(0)
		expect(createArtwork).toHaveBeenCalledOnce()

		vi.stubGlobal('innerWidth', 390)
		vi.stubGlobal('innerHeight', 844)
		window.dispatchEvent(new Event('resize'))

		expect(canvas).toHaveAttribute('width', '390')
		expect(canvas).toHaveAttribute('height', '844')
		expect(scene.context.clearRect).toHaveBeenLastCalledWith(0, 0, 390, 844)
		expect(createArtwork).toHaveBeenCalledOnce()
		vi.stubGlobal('devicePixelRatio', 2)
		window.dispatchEvent(new Event('resize'))

		expect(canvas).toHaveAttribute('width', '780')
		expect(canvas).toHaveAttribute('height', '1688')
		expect(canvas).toHaveStyle({ height: '844px', width: '390px' })
		expect(createArtwork).toHaveBeenCalledTimes(2)
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
			const initialDrawCount = scene.context.clearRect.mock.calls.length
			expect(scene.pending.size).toBe(0)

			setPaused(false)
			scene.runFrame(20)
			expect(scene.context.clearRect).toHaveBeenCalledTimes(
				initialDrawCount + 1,
			)
			setPaused(true)
			const pausedDrawCount = scene.context.clearRect.mock.calls.length
			scene.runFrame(40)

			expect(scene.pending.size).toBe(0)
			expect(scene.context.clearRect).toHaveBeenCalledTimes(pausedDrawCount)
			setPaused(false)
			expect(scene.pending.size).toBe(1)
		},
	)

	it.each(['visibility', 'motion'])(
		'keeps one animation loop when %s changes immediately after settings close',
		async (change) => {
			setSettingsModalOpenState(true)
			const scene = await createScene()
			setSettingsModalOpenState(false)

			if (change === 'visibility') {
				scene.setHidden(true)
				scene.setHidden(false)
			} else {
				scene.setReducedMotion(true)
				scene.setReducedMotion(false)
			}
			scene.runFrame(20)

			expect(scene.pending.size).toBe(1)
		},
	)

	it.each(['running', 'queued', 'resumed'])(
		'cleans up the scene and browser listeners with a %s frame',
		async (frameState) => {
			setSettingsModalOpenState(frameState !== 'running')
			const removeWindowListener = vi.spyOn(window, 'removeEventListener')
			const removeDocumentListener = vi.spyOn(document, 'removeEventListener')
			const scene = await createScene()
			const initialDrawCount = scene.context.clearRect.mock.calls.length
			if (frameState === 'resumed') setSettingsModalOpenState(false)

			cleanupEffect()
			setSettingsModalOpenState(false)
			scene.runFrame(20)
			window.dispatchEvent(new Event('resize'))
			scene.setHidden(false)
			scene.setReducedMotion(true)

			expect(document.querySelector('[data-christmas]')).toBeNull()
			expect(scene.pending.size).toBe(0)
			expect(scene.context.clearRect).toHaveBeenCalledTimes(initialDrawCount)
			expect(removeWindowListener).toHaveBeenCalledWith(
				'resize',
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
		},
	)

	it('keeps one scene and one animation loop after repeated cleanup and restart', async () => {
		const scene = await createScene()

		for (let run = 0; run < 3; run += 1) {
			expect(document.querySelectorAll('[data-christmas]')).toHaveLength(1)
			expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
			expect(scene.pending.size).toBe(1)
			cleanupEffect()
			expect(document.querySelectorAll('[data-christmas]')).toHaveLength(0)
			expect(scene.pending.size).toBe(0)
			if (run < 2) cleanupEffect = await launchChristmasSnowfall()
		}
	})
})

const createScene = async ({
	isHidden = false,
	isReducedMotion = false,
}: { isHidden?: boolean; isReducedMotion?: boolean } = {}) => {
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
	const context = {
		arc: () => {},
		beginPath: () => {},
		bezierCurveTo: () => {},
		clearRect: vi.fn(),
		clip: () => {},
		closePath: () => {},
		createLinearGradient: () => ({ addColorStop: () => {} }),
		createRadialGradient: () => ({ addColorStop: () => {} }),
		drawImage: vi.fn(),
		ellipse: () => {},
		fill: () => {},
		fillRect: () => {},
		lineTo: () => {},
		moveTo: () => {},
		quadraticCurveTo: () => {},
		rect: () => {},
		restore: () => {},
		rotate: () => {},
		roundRect: () => {},
		save: () => {},
		scale: () => {},
		setTransform: () => {},
		stroke: () => {},
		translate: () => {},
	}
	const partialContext: Partial<CanvasRenderingContext2D> = context
	vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
		partialContext as CanvasRenderingContext2D,
	)
	cleanupEffect = await launchChristmasSnowfall()

	return {
		context,
		motion,
		pending,
		runFrame: (time: number) => {
			for (const [id, callback] of [...pending]) {
				pending.delete(id)
				callback(time)
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

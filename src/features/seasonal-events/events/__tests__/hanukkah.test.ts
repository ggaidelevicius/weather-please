import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setSettingsModalOpenState } from '../../../../shared/lib/settings-modal-state'
import { launchHanukkahGlow } from '../hanukkah'

let cleanupEffect = () => {}

beforeEach(() => {
	vi.spyOn(performance, 'now').mockReturnValue(0)
	vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
	vi.stubGlobal('innerWidth', 1024)
	vi.stubGlobal('innerHeight', 768)
	vi.stubGlobal('devicePixelRatio', 1)
	vi.stubGlobal(
		'Path2D',
		class {
			bezierCurveTo() {}
			closePath() {}
			ellipse() {}
			lineTo() {}
			moveTo() {}
			quadraticCurveTo() {}
			rect() {}
			roundRect() {}
		},
	)
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

describe('Hanukkah scene', () => {
	it('renders and resizes a static scene without requesting frames for reduced motion', async () => {
		mockMotionPreference(true)
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		cleanupEffect = await launchHanukkahGlow()
		const canvas = document.querySelector('canvas[data-hanukkah]')

		expect(canvas).toHaveAttribute('data-hanukkah', 'true')
		expect(canvas).toHaveAttribute('aria-hidden', 'true')
		expect(canvas).toHaveAttribute('width', '1024')
		expect(canvas).toHaveAttribute('height', '768')
		expect(canvas).toHaveStyle({ pointerEvents: 'none', position: 'fixed' })
		expect(context.drawImage).toHaveBeenCalled()
		expect(animation.pending.size).toBe(0)
		const initialDrawCount = context.clearRect.mock.calls.length

		vi.stubGlobal('innerWidth', 390)
		vi.stubGlobal('innerHeight', 844)
		window.dispatchEvent(new Event('resize'))

		expect(canvas).toHaveAttribute('width', '390')
		expect(canvas).toHaveAttribute('height', '844')
		expect(context.clearRect.mock.calls.length).toBeGreaterThan(
			initialDrawCount,
		)
		expect(context.clearRect).toHaveBeenLastCalledWith(0, 0, 390, 844)
		expect(animation.pending.size).toBe(0)
	})

	it.each([60, 120])(
		'draws every browser frame at %i Hz',
		async (refreshRate) => {
			mockMotionPreference(false)
			const animation = mockAnimationFrames()
			const context = mockCanvasContext()
			cleanupEffect = await launchHanukkahGlow()
			const initialDrawCount = context.clearRect.mock.calls.length

			for (let frame = 1; frame <= 10; frame += 1) {
				animation.runFrame((frame * 1000) / refreshRate)
				expect(context.clearRect).toHaveBeenCalledTimes(
					initialDrawCount + frame,
				)
			}

			expect(animation.pending.size).toBe(1)
		},
	)

	it('waits while hidden and stops drawing when the page becomes hidden again', async () => {
		mockMotionPreference(false)
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
		cleanupEffect = await launchHanukkahGlow()
		const initialDrawCount = context.clearRect.mock.calls.length
		expect(animation.pending.size).toBe(0)

		vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
		document.dispatchEvent(new Event('visibilitychange'))
		animation.runFrame(20)
		expect(context.clearRect).toHaveBeenCalledTimes(initialDrawCount + 1)
		vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
		document.dispatchEvent(new Event('visibilitychange'))
		animation.runFrame(40)

		expect(animation.pending.size).toBe(0)
		expect(context.clearRect).toHaveBeenCalledTimes(initialDrawCount + 1)
	})

	it('pauses for settings that are already open and when settings reopen', async () => {
		mockMotionPreference(false)
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		setSettingsModalOpenState(true)
		cleanupEffect = await launchHanukkahGlow()
		const initialDrawCount = context.clearRect.mock.calls.length
		expect(animation.pending.size).toBe(0)

		setSettingsModalOpenState(false)
		animation.runFrame(20)
		expect(context.clearRect).toHaveBeenCalledTimes(initialDrawCount + 1)
		setSettingsModalOpenState(true)
		animation.runFrame(40)
		expect(animation.pending.size).toBe(0)
		expect(context.clearRect).toHaveBeenCalledTimes(initialDrawCount + 1)
		setSettingsModalOpenState(false)
		expect(animation.pending.size).toBe(1)
	})

	it('switches between animated and static scenes when motion preferences change', async () => {
		const motion = mockMotionPreference(false)
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		cleanupEffect = await launchHanukkahGlow()
		const initialDrawCount = context.clearRect.mock.calls.length
		expect(animation.pending.size).toBe(1)

		motion.setReducedMotion(true)

		expect(animation.pending.size).toBe(0)
		expect(context.clearRect).toHaveBeenCalledTimes(initialDrawCount + 1)
		motion.setReducedMotion(false)
		expect(animation.pending.size).toBe(1)
		animation.runFrame(20)
		expect(context.clearRect).toHaveBeenCalledTimes(initialDrawCount + 2)
	})

	it.each(['visibility', 'motion'])(
		'keeps one animation loop when %s changes immediately after settings close',
		async (change) => {
			const motion = mockMotionPreference(false)
			const animation = mockAnimationFrames()
			mockCanvasContext()
			setSettingsModalOpenState(true)
			cleanupEffect = await launchHanukkahGlow()
			setSettingsModalOpenState(false)

			if (change === 'visibility') {
				vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
				document.dispatchEvent(new Event('visibilitychange'))
				vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
				document.dispatchEvent(new Event('visibilitychange'))
			} else {
				motion.setReducedMotion(true)
				motion.setReducedMotion(false)
			}
			animation.runFrame(20)

			expect(animation.pending.size).toBe(1)
		},
	)

	it('removes the canvas, pending frame, and browser listeners on cleanup', async () => {
		const motion = mockMotionPreference(false)
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		const removeWindowListener = vi.spyOn(window, 'removeEventListener')
		const removeDocumentListener = vi.spyOn(document, 'removeEventListener')
		cleanupEffect = await launchHanukkahGlow()
		const initialDrawCount = context.clearRect.mock.calls.length

		cleanupEffect()

		expect(document.querySelector('[data-hanukkah]')).toBeNull()
		expect(animation.cancel).toHaveBeenCalledOnce()
		expect(animation.pending.size).toBe(0)
		expect(removeWindowListener).toHaveBeenCalledWith(
			'resize',
			expect.any(Function),
		)
		expect(removeDocumentListener).toHaveBeenCalledWith(
			'visibilitychange',
			expect.any(Function),
		)
		expect(motion.query.removeEventListener).toHaveBeenCalledWith(
			'change',
			expect.any(Function),
		)
		window.dispatchEvent(new Event('resize'))
		document.dispatchEvent(new Event('visibilitychange'))
		motion.setReducedMotion(true)
		expect(context.clearRect).toHaveBeenCalledTimes(initialDrawCount)
		expect(animation.pending.size).toBe(0)
	})

	it.each([false, true])(
		'discards settings callbacks after cleanup (already resumed: %s)',
		async (hasResumed) => {
			mockMotionPreference(false)
			const animation = mockAnimationFrames()
			const context = mockCanvasContext()
			setSettingsModalOpenState(true)
			cleanupEffect = await launchHanukkahGlow()
			const initialDrawCount = context.clearRect.mock.calls.length
			if (hasResumed) {
				setSettingsModalOpenState(false)
			}

			cleanupEffect()
			setSettingsModalOpenState(false)
			animation.runFrame(20)

			expect(context.clearRect).toHaveBeenCalledTimes(initialDrawCount)
			expect(animation.pending.size).toBe(0)
			expect(document.querySelector('[data-hanukkah]')).toBeNull()
		},
	)

	it('leaves only one scene and one animation loop when restarted after cleanup', async () => {
		mockMotionPreference(false)
		const animation = mockAnimationFrames()
		mockCanvasContext()

		for (let run = 0; run < 3; run += 1) {
			cleanupEffect = await launchHanukkahGlow()
			expect(document.querySelectorAll('[data-hanukkah]')).toHaveLength(1)
			expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
			expect(animation.pending.size).toBe(1)
			cleanupEffect()
			expect(document.querySelectorAll('[data-hanukkah]')).toHaveLength(0)
			expect(animation.pending.size).toBe(0)
		}
	})
})

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
		runFrame: (time: number) => {
			for (const [id, callback] of [...pending]) {
				pending.delete(id)
				callback(time)
			}
		},
	}
}

const mockCanvasContext = () => {
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
	return context
}

const mockMotionPreference = (isReducedMotion: boolean) => {
	const target = new EventTarget()
	const query = {
		addEventListener: vi.fn(
			(type: string, listener: EventListenerOrEventListenerObject) =>
				target.addEventListener(type, listener),
		),
		matches: isReducedMotion,
		removeEventListener: vi.fn(
			(type: string, listener: EventListenerOrEventListenerObject) =>
				target.removeEventListener(type, listener),
		),
	}
	vi.stubGlobal(
		'matchMedia',
		vi.fn(() => query),
	)
	return {
		query,
		setReducedMotion: (shouldReduceMotion: boolean) => {
			query.matches = shouldReduceMotion
			target.dispatchEvent(new Event('change'))
		},
	}
}

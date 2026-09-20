import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setSettingsModalOpenState } from '../../../../shared/lib/settings-modal-state'
import { launchNewYearsCelebration } from '../new-years'
import * as fireworks from '../new-years-fireworks'

let cleanupEffect = () => {}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] })
	vi.setSystemTime(new Date(2026, 8, 20))
	vi.spyOn(performance, 'now').mockReturnValue(0)
	vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
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
	vi.useRealTimers()
})

describe('New Year celebration', () => {
	it.each([
		['an upcoming celebration preview', new Date(2026, 8, 20)],
		['New Year’s Day itself', new Date(2027, 0, 1)],
	])('commemorates 2027 for %s', async (_, date) => {
		vi.setSystemTime(date)
		mockMotionPreference(true)
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()

		cleanupEffect = await launchNewYearsCelebration()

		const canvas = document.querySelector('canvas[data-new-years]')
		expect(canvas).toHaveAttribute('data-new-years', '2027')
		expect(canvas).toHaveAttribute('aria-hidden', 'true')
		expect(context.fillText).toHaveBeenCalledWith(
			'2027',
			expect.any(Number),
			expect.any(Number),
		)
		expect(animation.pending.size).toBe(0)
	})

	it('keeps a static celebration visible and redraws it after resizing with reduced motion', async () => {
		mockMotionPreference(true)
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		cleanupEffect = await launchNewYearsCelebration()
		const canvas = document.querySelector('canvas[data-new-years]')
		expect(canvas).toHaveAttribute('width', '1024')
		expect(canvas).toHaveAttribute('height', '768')
		const initialDrawCount = context.clearRect.mock.calls.length

		vi.stubGlobal('innerWidth', 390)
		vi.stubGlobal('innerHeight', 844)
		window.dispatchEvent(new Event('resize'))

		expect(canvas).toHaveAttribute('width', '390')
		expect(canvas).toHaveAttribute('height', '844')
		expect(context.clearRect).toHaveBeenCalledTimes(initialDrawCount + 1)
		expect(context.fillText).toHaveBeenCalledWith(
			'2027',
			expect.any(Number),
			expect.any(Number),
		)
		expect(animation.pending.size).toBe(0)
	})

	it('responds to motion preference changes without losing the year', async () => {
		const motion = mockMotionPreference(false)
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		cleanupEffect = await launchNewYearsCelebration()
		expect(animation.pending.size).toBe(1)

		motion.setReducedMotion(true)

		expect(animation.pending.size).toBe(0)
		expect(context.fillText).toHaveBeenCalledWith(
			'2027',
			expect.any(Number),
			expect.any(Number),
		)
		motion.setReducedMotion(false)
		expect(animation.pending.size).toBe(1)
	})

	it.each([60, 120])(
		'draws every browser frame at %i Hz',
		async (refreshRate) => {
			mockMotionPreference(false)
			const animation = mockAnimationFrames()
			const context = mockCanvasContext()
			cleanupEffect = await launchNewYearsCelebration()
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

	it('keeps the opening firework timing consistent across refresh rates', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.5)
		mockMotionPreference(false)
		const animation = mockAnimationFrames()
		mockCanvasContext()
		const createFirework = vi.spyOn(fireworks, 'createNewYearsFirework')
		const launchTimes: number[] = []

		for (const refreshRate of [60, 120]) {
			createFirework.mockClear()
			cleanupEffect = await launchNewYearsCelebration()
			for (let frame = 1; frame <= refreshRate; frame += 1) {
				const time = (frame * 1000) / refreshRate
				animation.runFrame(time)
				if (createFirework.mock.calls.length > 0) {
					launchTimes.push(time)
					break
				}
			}
			cleanupEffect()
		}

		expect(launchTimes).toHaveLength(2)
		expect(Math.abs(launchTimes[0] - launchTimes[1])).toBeLessThanOrEqual(
			1000 / 60,
		)
	})

	it('keeps the year mounted and animated beyond the original six-second fireworks', async () => {
		mockMotionPreference(false)
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		const createFirework = vi.spyOn(fireworks, 'createNewYearsFirework')
		cleanupEffect = await launchNewYearsCelebration()

		for (let time = 40; time <= 8000; time += 40) {
			animation.runFrame(time)
		}
		const completedDrawCount = context.clearRect.mock.calls.length
		const launchedFireworks = createFirework.mock.calls.length
		const completedStrokes = context.stroke.mock.calls.length
		animation.runFrame(8040)

		expect(document.querySelector('[data-new-years]')).toBeInTheDocument()
		expect(context.clearRect).toHaveBeenCalledTimes(completedDrawCount + 1)
		expect(context.fillText).toHaveBeenCalledWith(
			'2027',
			expect.any(Number),
			expect.any(Number),
		)
		expect(animation.pending.size).toBe(1)
		expect(launchedFireworks).toBeGreaterThan(3)

		for (let time = 8080; time <= 12000; time += 40) {
			animation.runFrame(time)
		}

		expect(createFirework.mock.calls.length).toBeGreaterThan(launchedFireworks)
		expect(context.stroke.mock.calls.length).toBeGreaterThan(completedStrokes)
		expect(animation.pending.size).toBe(1)
	})

	it('stops requesting frames while hidden and resumes when visible', async () => {
		mockMotionPreference(false)
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		cleanupEffect = await launchNewYearsCelebration()
		animation.runFrame(40)
		const visibleDrawCount = context.clearRect.mock.calls.length

		vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
		document.dispatchEvent(new Event('visibilitychange'))
		animation.runFrame(80)

		expect(animation.pending.size).toBe(0)
		expect(context.clearRect).toHaveBeenCalledTimes(visibleDrawCount)
		vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
		document.dispatchEvent(new Event('visibilitychange'))
		expect(animation.pending.size).toBe(1)
		animation.runFrame(120)
		expect(context.clearRect).toHaveBeenCalledTimes(visibleDrawCount + 1)
	})

	it('pauses for settings that are already open and pauses again when reopened', async () => {
		mockMotionPreference(false)
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		setSettingsModalOpenState(true)
		cleanupEffect = await launchNewYearsCelebration()
		const initialDrawCount = context.clearRect.mock.calls.length
		expect(animation.pending.size).toBe(0)

		setSettingsModalOpenState(false)
		animation.runFrame(40)
		expect(context.clearRect).toHaveBeenCalledTimes(initialDrawCount + 1)
		setSettingsModalOpenState(true)
		animation.runFrame(80)
		expect(animation.pending.size).toBe(0)
		expect(context.clearRect).toHaveBeenCalledTimes(initialDrawCount + 1)
		setSettingsModalOpenState(false)
		expect(animation.pending.size).toBe(1)
	})

	it('does not fast-forward fireworks after a long settings pause', async () => {
		mockMotionPreference(false)
		const animation = mockAnimationFrames()
		mockCanvasContext()
		const createFirework = vi.spyOn(fireworks, 'createNewYearsFirework')
		cleanupEffect = await launchNewYearsCelebration()
		for (let time = 40; time <= 400; time += 40) {
			animation.runFrame(time)
		}
		const firstFireworkResult = createFirework.mock.results[0]
		expect(firstFireworkResult?.type).toBe('return')
		if (firstFireworkResult?.type !== 'return') {
			throw new Error('Expected the opening firework to launch')
		}
		const firstFirework = firstFireworkResult.value
		const ageBeforePause = firstFirework.age
		const launchCountBeforePause = createFirework.mock.calls.length

		setSettingsModalOpenState(true)
		animation.runFrame(440)
		expect(firstFirework.age).toBe(ageBeforePause)
		setSettingsModalOpenState(false)
		animation.runFrame(120_000)

		expect(firstFirework.age).toBeGreaterThan(ageBeforePause)
		expect(firstFirework.age - ageBeforePause).toBeLessThanOrEqual(0.051)
		expect(createFirework).toHaveBeenCalledTimes(launchCountBeforePause)
		expect(animation.pending.size).toBe(1)
	})

	it('removes the canvas, pending frame, and browser listeners on cleanup', async () => {
		const motion = mockMotionPreference(false)
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		const removeWindowListener = vi.spyOn(window, 'removeEventListener')
		const removeDocumentListener = vi.spyOn(document, 'removeEventListener')
		cleanupEffect = await launchNewYearsCelebration()
		const initialDrawCount = context.clearRect.mock.calls.length

		cleanupEffect()

		expect(document.querySelector('[data-new-years]')).toBeNull()
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

	it('discards frames queued while settings are open after cleanup', async () => {
		mockMotionPreference(false)
		const animation = mockAnimationFrames()
		mockCanvasContext()
		setSettingsModalOpenState(true)
		cleanupEffect = await launchNewYearsCelebration()

		cleanupEffect()
		setSettingsModalOpenState(false)

		expect(animation.pending.size).toBe(0)
		expect(document.querySelector('[data-new-years]')).toBeNull()
	})

	it.each(['visibility', 'motion'])(
		'keeps one animation loop when %s changes immediately after settings close',
		async (change) => {
			const motion = mockMotionPreference(false)
			const animation = mockAnimationFrames()
			mockCanvasContext()
			setSettingsModalOpenState(true)
			cleanupEffect = await launchNewYearsCelebration()
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
			animation.runFrame(40)

			expect(animation.pending.size).toBe(1)
		},
	)

	it('does not draw or schedule more frames when a resumed callback outlives cleanup', async () => {
		mockMotionPreference(false)
		const animation = mockAnimationFrames()
		const context = mockCanvasContext()
		setSettingsModalOpenState(true)
		cleanupEffect = await launchNewYearsCelebration()
		const initialDrawCount = context.clearRect.mock.calls.length
		setSettingsModalOpenState(false)

		cleanupEffect()
		animation.runFrame(40)

		expect(context.clearRect).toHaveBeenCalledTimes(initialDrawCount)
		expect(animation.pending.size).toBe(0)
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
		clearRect: vi.fn(),
		closePath: () => {},
		createLinearGradient: () => ({ addColorStop: () => {} }),
		createRadialGradient: () => ({ addColorStop: () => {} }),
		drawImage: () => {},
		fill: () => {},
		fillRect: () => {},
		fillText: vi.fn(),
		getImageData: vi.fn(
			(_x: number, _y: number, width: number, height: number): ImageData => {
				const data = new Uint8ClampedArray(width * height * 4)
				const centerX = Math.floor(width / 2)
				const centerY = Math.floor(height / 2)
				for (let y = centerY; y < Math.min(centerY + 12, height); y += 1) {
					for (let x = centerX; x < Math.min(centerX + 12, width); x += 1) {
						data[(y * width + x) * 4 + 3] = 255
					}
				}
				return { colorSpace: 'srgb', data, height, width }
			},
		),
		lineTo: () => {},
		measureText: vi.fn((): TextMetrics => ({
			actualBoundingBoxAscent: 110,
			actualBoundingBoxDescent: 0,
			actualBoundingBoxLeft: 0,
			actualBoundingBoxRight: 600,
			alphabeticBaseline: 0,
			emHeightAscent: 110,
			emHeightDescent: 0,
			fontBoundingBoxAscent: 110,
			fontBoundingBoxDescent: 0,
			hangingBaseline: 0,
			ideographicBaseline: 0,
			width: 600,
		})),
		moveTo: () => {},
		restore: () => {},
		rotate: () => {},
		save: () => {},
		scale: () => {},
		setTransform: () => {},
		stroke: vi.fn(),
		strokeText: () => {},
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

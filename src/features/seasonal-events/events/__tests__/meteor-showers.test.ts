import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	SETTINGS_MODAL_STATE_EVENT,
	setSettingsModalOpenState,
} from '../../../../shared/lib/settings-modal-state'
import { launchEtaAquariidsShower } from '../eta-aquariids'
import { launchGeminidsShower } from '../geminids'
import { launchLeonidsShower } from '../leonids'
import { launchLyridsShower } from '../lyrids'
import { launchOrionidsShower } from '../orionids'
import { launchPerseidsShower } from '../perseids'
import { launchQuadrantidsShower } from '../quadrantids'

type Launcher = () => Promise<() => void>
type StarDraw = { x: number; y: number; radius: number; alpha: number }
type MeteorDraw = {
	x: number
	y: number
	rotation: number
	alpha: number
	width: number
	length: number
	glow: number
	color: string
}
type Frame = { stars: StarDraw[]; meteors: MeteorDraw[] }

let cleanupEffect = () => {}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
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
	vi.useRealTimers()
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe.each([
	['Eta Aquariids', launchEtaAquariidsShower],
	['Geminids', launchGeminidsShower],
	['Leonids', launchLeonidsShower],
	['Lyrids', launchLyridsShower],
	['Orionids', launchOrionidsShower],
	['Perseids', launchPerseidsShower],
	['Quadrantids', launchQuadrantidsShower],
] as const)('%s lifecycle', (_, launch) => {
	it('can be canceled before its delayed mount without leaving work or a canvas', async () => {
		const scene = await createScene({ launch, shouldMount: false })
		vi.advanceTimersByTime(899)
		expect(document.querySelector('canvas')).toBeNull()
		expect(scene.pending.size).toBe(0)
		scene.dispose()
		vi.advanceTimersByTime(10_000)
		window.dispatchEvent(new Event('resize'))
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		expect(document.querySelector('canvas')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(scene.context.clearRect).not.toHaveBeenCalled()
		expect(vi.getTimerCount()).toBe(0)
	})

	it.each(['settings', 'visibility'] as const)(
		'preserves star phases, meteor motion and spawn deadlines through a long %s pause',
		async (reason) => {
			const reference = await createScene({ launch })
			const expected: Frame[] = []
			for (let frame = 0; frame <= 180; frame += 1) {
				reference.runFrame(frame * 20)
				expected.push(reference.snapshot())
			}
			expect(expected[80].stars.length).toBeGreaterThan(0)
			expect(expected[80].meteors.length).toBeGreaterThan(0)
			reference.dispose()

			const scene = await createScene({ launch })
			for (let frame = 0; frame <= 80; frame += 1) scene.runFrame(frame * 20)
			expect(scene.snapshot()).toEqual(expected[80])
			const setPaused = (isPaused: boolean) => {
				if (reason === 'settings') setSettingsModalOpenState(isPaused)
				else scene.setHidden(isPaused)
			}
			setPaused(true)
			const drawCount = scene.context.clearRect.mock.calls.length
			scene.runFrame(120_000)
			expect(scene.pending.size).toBe(0)
			expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount)
			window.dispatchEvent(new Event('resize'))
			expect(scene.snapshot()).toEqual(expected[80])
			expect(scene.pending.size).toBe(0)
			setPaused(false)
			scene.runFrame(120_000)
			expect(scene.snapshot()).toEqual(expected[80])
			for (let frame = 81; frame <= 180; frame += 1) {
				scene.runFrame(120_000 + (frame - 80) * 20)
				expect(scene.snapshot()).toEqual(expected[frame])
				expect(scene.pending.size).toBe(1)
			}
			expect(expected[81]).not.toEqual(expected[80])
		},
	)

	it('waits for both settings and document visibility before scheduling its first frame', async () => {
		setSettingsModalOpenState(true)
		const scene = await createScene({ launch, isHidden: true })
		expect(document.querySelectorAll('canvas')).toHaveLength(1)
		expect(scene.pending.size).toBe(0)
		setSettingsModalOpenState(false)
		expect(scene.pending.size).toBe(0)
		scene.setHidden(false)
		expect(scene.pending.size).toBe(1)
		scene.runFrame(60_000)
		expect(scene.pending.size).toBe(1)
	})

	it('redraws and scales the frozen field on resize without generating replacement objects', async () => {
		const scene = await createScene({ launch })
		for (let frame = 0; frame <= 80; frame += 1) scene.runFrame(frame * 20)
		const before = scene.snapshot()
		expect(before.stars.length).toBeGreaterThan(0)
		expect(before.meteors.length).toBeGreaterThan(0)
		setSettingsModalOpenState(true)
		const randomCalls = vi.mocked(Math.random).mock.calls.length
		vi.mocked(performance.now).mockReturnValue(120_000)
		vi.stubGlobal('innerWidth', 512)
		vi.stubGlobal('innerHeight', 576)
		window.dispatchEvent(new Event('resize'))

		expectScaledFrame(scene.snapshot(), before, 0.5, 0.75)
		expect(vi.mocked(Math.random)).toHaveBeenCalledTimes(randomCalls)
		expect(scene.pending.size).toBe(0)
		expect(document.querySelector('canvas')).toHaveStyle({
			width: '512px',
			height: '576px',
		})
	})

	it('keeps a stable reduced-motion tableau on resize and responds to live preference changes', async () => {
		const scene = await createScene({ launch, isReducedMotion: true })
		const initial = scene.snapshot()
		expect(initial.stars.length).toBeGreaterThan(0)
		expect(initial.meteors.length).toBeGreaterThan(0)
		expect(scene.pending.size).toBe(0)
		const randomCalls = vi.mocked(Math.random).mock.calls.length
		vi.mocked(performance.now).mockReturnValue(120_000)
		window.dispatchEvent(new Event('resize'))
		expect(scene.snapshot()).toEqual(initial)
		expect(vi.mocked(Math.random)).toHaveBeenCalledTimes(randomCalls)
		vi.stubGlobal('innerWidth', 512)
		vi.stubGlobal('innerHeight', 384)
		window.dispatchEvent(new Event('resize'))
		expectScaledFrame(scene.snapshot(), initial, 0.5, 0.5)
		expect(vi.mocked(Math.random)).toHaveBeenCalledTimes(randomCalls)

		scene.setReducedMotion(false)
		expect(scene.pending.size).toBe(1)
		scene.runFrame(120_000)
		scene.runFrame(120_020)
		scene.setReducedMotion(true)
		const frozen = scene.snapshot()
		const drawCount = scene.context.clearRect.mock.calls.length
		expect(frozen.stars.length).toBeGreaterThan(0)
		expect(frozen.meteors.length).toBeGreaterThan(0)
		expect(scene.pending.size).toBe(0)
		scene.runFrame(240_000)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount)
		window.dispatchEvent(new Event('resize'))
		expect(scene.snapshot()).toEqual(frozen)
		expect(scene.pending.size).toBe(0)
	})

	it('ignores canceled callbacks after pause and resume without duplicating the loop', async () => {
		const scene = await createScene({ launch })
		const stale = scene.getPendingCallback()
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		const drawCount = scene.context.clearRect.mock.calls.length
		stale(120_000)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount)
		expect(scene.pending.size).toBe(1)
		scene.runFrame(120_020)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 1)
		expect(scene.pending.size).toBe(1)
	})

	it.each([false, true])(
		'cleans up after resume with a resumed frame: %s',
		async (hasResumedFrame) => {
			const addWindowListener = vi.spyOn(window, 'addEventListener')
			const addDocumentListener = vi.spyOn(document, 'addEventListener')
			const removeWindowListener = vi.spyOn(window, 'removeEventListener')
			const removeDocumentListener = vi.spyOn(document, 'removeEventListener')
			const scene = await createScene({ launch })
			setSettingsModalOpenState(true)
			setSettingsModalOpenState(false)
			if (hasResumedFrame) scene.runFrame(120_000)
			const stale = scene.getPendingCallback()
			const drawCount = scene.context.clearRect.mock.calls.length
			scene.dispose()
			stale(120_020)
			setSettingsModalOpenState(true)
			setSettingsModalOpenState(false)
			scene.setHidden(true)
			scene.setHidden(false)
			scene.setReducedMotion(true)
			scene.setReducedMotion(false)
			window.dispatchEvent(new Event('resize'))
			vi.advanceTimersByTime(10_000)

			expect(document.body.children).toHaveLength(0)
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
		},
	)

	it('handles an unavailable canvas context without mounting or leaving scheduled work', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		const scene = await createScene({ launch, hasContext: false })
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		scene.setHidden(false)
		scene.setReducedMotion(true)
		window.dispatchEvent(new Event('resize'))
		vi.advanceTimersByTime(10_000)
		expect(document.body.children).toHaveLength(0)
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
		expect(scene.context.clearRect).not.toHaveBeenCalled()
		expect(console.error).toHaveBeenCalled()
	})
})

async function createScene({
	launch,
	shouldMount = true,
	isHidden = false,
	isReducedMotion = false,
	hasContext = true,
}: {
	launch: Launcher
	shouldMount?: boolean
	isHidden?: boolean
	isReducedMotion?: boolean
	hasContext?: boolean
}) {
	let seed = 314159
	vi.spyOn(Math, 'random').mockImplementation(() => {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
		return seed / 4294967296
	})
	vi.mocked(performance.now).mockReturnValue(0)
	let isDocumentHidden = isHidden
	vi.spyOn(document, 'hidden', 'get').mockImplementation(() => isDocumentHidden)
	const pending = new Map<number, FrameRequestCallback>()
	let nextFrameId = 0
	vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
		pending.set(++nextFrameId, callback)
		return nextFrameId
	})
	vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
		pending.delete(id)
	})
	const motionTarget = new EventTarget()
	const motion = {
		matches: isReducedMotion,
		addEventListener: vi.fn(
			(type: string, listener: EventListenerOrEventListenerObject) =>
				motionTarget.addEventListener(type, listener),
		),
		removeEventListener: vi.fn(
			(type: string, listener: EventListenerOrEventListenerObject) =>
				motionTarget.removeEventListener(type, listener),
		),
	}
	vi.stubGlobal(
		'matchMedia',
		vi.fn(() => motion),
	)
	const frame: Frame = { stars: [], meteors: [] }
	let transform = { x: 0, y: 0, rotation: 0 }
	const savedStates: { transform: typeof transform; alpha: number }[] = []
	let currentArc = { x: 0, y: 0, radius: 0 }
	let tailX = 0
	const context = {
		globalAlpha: 1,
		lineWidth: 1,
		shadowBlur: 0,
		shadowColor: 'transparent',
		clearRect: vi.fn(() => {
			frame.stars.length = 0
			frame.meteors.length = 0
		}),
		beginPath: () => {},
		arc: (x: number, y: number, radius: number) => {
			currentArc = { x, y, radius }
		},
		fill: () => {
			frame.stars.push({ ...currentArc, alpha: context.globalAlpha })
		},
		stroke: () => {
			frame.meteors.push({
				...transform,
				alpha: context.globalAlpha,
				width: context.lineWidth,
				length: -tailX,
				glow: context.shadowBlur,
				color: context.shadowColor,
			})
		},
		moveTo: (x: number) => {
			tailX = x
		},
		lineTo: () => {},
		createLinearGradient: () => ({ addColorStop: () => {} }),
		setTransform: () => {
			transform = { x: 0, y: 0, rotation: 0 }
		},
		save: () => {
			savedStates.push({
				transform: { ...transform },
				alpha: context.globalAlpha,
			})
		},
		restore: () => {
			const state = savedStates.pop()
			if (state) {
				transform = state.transform
				context.globalAlpha = state.alpha
			}
		},
		translate: (x: number, y: number) => {
			transform.x += x
			transform.y += y
		},
		rotate: (angle: number) => {
			transform.rotation += angle
		},
	}
	const partialContext: Partial<CanvasRenderingContext2D> = context
	vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
		hasContext ? (partialContext as CanvasRenderingContext2D) : null,
	)
	const runFrame = (time: number) => {
		vi.mocked(performance.now).mockReturnValue(time)
		for (const [id, callback] of [...pending]) {
			pending.delete(id)
			callback(time)
		}
	}
	const dispose = await launch()
	cleanupEffect = dispose
	if (shouldMount) vi.advanceTimersByTime(900)
	return {
		context,
		motion,
		pending,
		dispose,
		runFrame,
		snapshot: (): Frame => ({
			stars: frame.stars.map((star) => ({ ...star })),
			meteors: frame.meteors.map((meteor) => ({ ...meteor })),
		}),
		getPendingCallback: () => {
			const callback = pending.values().next().value
			if (!callback) throw new Error('Expected a scheduled meteor shower frame')
			return callback
		},
		setHidden: (isNextHidden: boolean) => {
			isDocumentHidden = isNextHidden
			document.dispatchEvent(new Event('visibilitychange'))
		},
		setReducedMotion: (isReduced: boolean) => {
			motion.matches = isReduced
			motionTarget.dispatchEvent(new Event('change'))
		},
	}
}

function expectScaledFrame(
	actual: Frame,
	before: Frame,
	scaleX: number,
	scaleY: number,
) {
	for (const kind of ['stars', 'meteors'] as const) {
		expect(actual[kind]).toHaveLength(before[kind].length)
		for (const [index, original] of before[kind].entries()) {
			const point = actual[kind][index]
			expect(point.x).toBeCloseTo(original.x * scaleX, 8)
			expect(point.y).toBeCloseTo(original.y * scaleY, 8)
			expect({ ...point, x: 0, y: 0 }).toEqual({ ...original, x: 0, y: 0 })
		}
	}
}

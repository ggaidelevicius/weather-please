import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	SETTINGS_MODAL_STATE_EVENT,
	setSettingsModalOpenState,
} from '../../../../shared/lib/settings-modal-state'
import { launchEidAlFitrGlow } from '../eid-al-fitr'
import { createEidAlFitrArtwork } from '../eid-al-fitr-artwork'

vi.mock('../eid-al-fitr-artwork', () => ({ createEidAlFitrArtwork: vi.fn() }))

type Transform = [string, ...number[]]
type ImageDraw = {
	source: string
	coordinates: number[]
	alpha: number
	composition: GlobalCompositeOperation
	transforms: Transform[]
}

let cleanupEffect = () => {}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
	vi.spyOn(performance, 'now').mockReturnValue(0)
	vi.spyOn(Math, 'random').mockReturnValue(0.5)
	vi.spyOn(console, 'error').mockImplementation(() => {})
	vi.stubGlobal('innerWidth', 1024)
	vi.stubGlobal('innerHeight', 768)
	vi.stubGlobal('devicePixelRatio', 1)
	vi.mocked(createEidAlFitrArtwork).mockReset()
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

describe('Eid al-Fitr scene', () => {
	it('can cancel the delayed mount before allocating artwork or drawing', async () => {
		const scene = await createScene({ shouldMount: false })
		vi.advanceTimersByTime(899)
		expect(createEidAlFitrArtwork).not.toHaveBeenCalled()
		expect(document.querySelector('[data-eid-al-fitr]')).toBeNull()
		cleanupEffect()
		vi.advanceTimersByTime(10_000)
		expect(createEidAlFitrArtwork).not.toHaveBeenCalled()
		expect(scene.context.drawImage).not.toHaveBeenCalled()
		expect(document.querySelector('[data-eid-al-fitr]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('renders a visible static background and preserves artwork and particles across resizing', async () => {
		const scene = await createScene({ isReducedMotion: true })
		const canvas = document.querySelector('canvas[data-eid-al-fitr]')
		expect(canvas).toHaveAttribute('aria-hidden', 'true')
		expect(canvas).toHaveStyle({
			position: 'fixed',
			pointerEvents: 'none',
			zIndex: '0',
		})
		expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
		expect(scene.snapshot().some(({ alpha }) => alpha > 0)).toBe(true)
		for (const artworkName of ['crescent', 'star', 'lantern']) {
			expect(
				scene
					.snapshot()
					.some(
						({ source, alpha }) => source.startsWith(artworkName) && alpha > 0,
					),
			).toBe(true)
		}
		expect(createEidAlFitrArtwork).toHaveBeenCalledOnce()
		expect(scene.pending.size).toBe(0)
		const drawCount = scene.context.clearRect.mock.calls.length
		const randomCount = vi.mocked(Math.random).mock.calls.length
		const gradientCount = scene.getGradientCount()
		vi.stubGlobal('innerWidth', 390)
		vi.stubGlobal('innerHeight', 844)
		window.dispatchEvent(new Event('resize'))
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 1)
		expect(canvas).toHaveAttribute('width', '390')
		expect(canvas).toHaveAttribute('height', '844')
		expect(scene.getGradientCount()).toBe(gradientCount)
		vi.stubGlobal('devicePixelRatio', 3)
		window.dispatchEvent(new Event('resize'))
		expect(canvas).toHaveAttribute('width', '780')
		expect(canvas).toHaveAttribute('height', '1688')
		expect(canvas).toHaveStyle({ width: '390px', height: '844px' })
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 2)
		expect(createEidAlFitrArtwork).toHaveBeenCalledOnce()
		expect(Math.random).toHaveBeenCalledTimes(randomCount)
		expect(scene.pending.size).toBe(0)
	})

	it.each([60, 120])(
		'draws every browser frame at %i Hz using cached artwork and lighting',
		async (rate) => {
			const scene = await createScene()
			const drawCount = scene.context.clearRect.mock.calls.length
			const gradientCount = scene.getGradientCount()
			for (let frame = 0; frame < 12; frame += 1) {
				scene.runFrame((frame * 1000) / rate)
				expect(scene.context.clearRect).toHaveBeenCalledTimes(
					drawCount + frame + 1,
				)
			}
			expect(createEidAlFitrArtwork).toHaveBeenCalledOnce()
			expect(scene.getGradientCount()).toBe(gradientCount)
			expect(scene.pending.size).toBe(1)
		},
	)

	it.each(['settings', 'visibility'])(
		'freezes for %s and resumes with the same visual pose',
		async (reason) => {
			setSettingsModalOpenState(reason === 'settings')
			const scene = await createScene({ isHidden: reason === 'visibility' })
			const setPaused = (isPaused: boolean) => {
				if (reason === 'settings') setSettingsModalOpenState(isPaused)
				else scene.setHidden(isPaused)
			}
			expect(scene.pending.size).toBe(0)
			setPaused(false)
			for (let frame = 0; frame <= 100; frame += 1) scene.runFrame(frame * 50)
			const frozen = scene.snapshot()
			expect(frozen.some(({ alpha }) => alpha > 0)).toBe(true)
			setPaused(true)
			const drawCount = scene.context.clearRect.mock.calls.length
			scene.runFrame(100_000)
			expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount)
			expect(scene.pending.size).toBe(0)
			window.dispatchEvent(new Event('resize'))
			expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 1)
			expect(scene.snapshot()).toEqual(frozen)
			expect(scene.pending.size).toBe(0)
			setPaused(false)
			scene.runFrame(120_000)
			expect(scene.snapshot()).toEqual(frozen)
			scene.runFrame(120_020)
			expect(scene.snapshot()).not.toEqual(frozen)
		},
	)

	it('limits long frame gaps to the same visual advance as a 50ms frame', async () => {
		const reference = await createScene()
		reference.runFrame(0)
		reference.runFrame(50)
		const expected = reference.snapshot()
		cleanupEffect()
		const delayed = await createScene()
		delayed.runFrame(0)
		delayed.runFrame(120_000)
		expect(delayed.snapshot()).toEqual(expected)
	})

	it('reveals a stable reduced-motion scene and resumes without restarting its motion', async () => {
		const scene = await createScene()
		scene.runFrame(0)
		scene.runFrame(20)
		const drawCount = scene.context.clearRect.mock.calls.length
		scene.setReducedMotion(true)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 1)
		expect(scene.pending.size).toBe(0)
		const frozen = scene.snapshot()
		expect(frozen.some(({ alpha }) => alpha > 0)).toBe(true)
		scene.runFrame(120_000)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount + 1)
		window.dispatchEvent(new Event('resize'))
		expect(scene.snapshot()).toEqual(frozen)
		scene.setReducedMotion(false)
		expect(scene.pending.size).toBe(1)
		scene.runFrame(120_020)
		expect(scene.snapshot()).toEqual(frozen)
	})

	it('ignores stale callbacks after pausing and restarting the animation loop', async () => {
		const scene = await createScene()
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

	it('cleans up immediately after resume, removing exact listeners and ignoring late callbacks', async () => {
		const addWindow = vi.spyOn(window, 'addEventListener')
		const removeWindow = vi.spyOn(window, 'removeEventListener')
		const addDocument = vi.spyOn(document, 'addEventListener')
		const removeDocument = vi.spyOn(document, 'removeEventListener')
		const scene = await createScene()
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		const stale = scene.getPendingCallback()
		const drawCount = scene.context.clearRect.mock.calls.length
		cleanupEffect()
		cleanupEffect()
		stale(120_000)
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		scene.setHidden(true)
		scene.setHidden(false)
		scene.setReducedMotion(true)
		scene.setReducedMotion(false)
		window.dispatchEvent(new Event('resize'))
		vi.advanceTimersByTime(10_000)
		expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount)
		expect(document.querySelector('[data-eid-al-fitr]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
		for (const [event, listener] of addWindow.mock.calls) {
			if (event === 'resize' || event === SETTINGS_MODAL_STATE_EVENT)
				expect(removeWindow).toHaveBeenCalledWith(event, listener)
		}
		for (const [event, listener] of addDocument.mock.calls) {
			if (event === 'visibilitychange')
				expect(removeDocument).toHaveBeenCalledWith(event, listener)
		}
		expect(scene.motion.addEventListener).toHaveBeenCalled()
		for (const [event, listener] of scene.motion.addEventListener.mock.calls) {
			expect(scene.motion.removeEventListener).toHaveBeenCalledWith(
				event,
				listener,
			)
		}
	})

	it.each(['context', 'artwork', 'initial draw'])(
		'leaves no scene or scheduled work when %s fails',
		async (stage) => {
			const scene = await createScene({ shouldMount: false })
			if (stage === 'context') scene.getContext.mockReturnValueOnce(null)
			else if (stage === 'artwork')
				vi.mocked(createEidAlFitrArtwork).mockImplementationOnce(() => {
					throw new Error('Artwork unavailable')
				})
			else
				scene.context.drawImage.mockImplementationOnce(() => {
					throw new Error('Drawing unavailable')
				})
			vi.advanceTimersByTime(900)
			const drawCount = scene.context.clearRect.mock.calls.length
			setSettingsModalOpenState(true)
			setSettingsModalOpenState(false)
			scene.setHidden(false)
			scene.setReducedMotion(true)
			window.dispatchEvent(new Event('resize'))
			expect(scene.context.clearRect).toHaveBeenCalledTimes(drawCount)
			expect(document.querySelector('[data-eid-al-fitr]')).toBeNull()
			expect(scene.pending.size).toBe(0)
			expect(vi.getTimerCount()).toBe(0)
			if (stage === 'context')
				expect(createEidAlFitrArtwork).not.toHaveBeenCalled()
		},
	)

	it('leaves one canvas and one animation loop after cleanup and relaunch', async () => {
		const scene = await createScene()
		for (let run = 0; run < 3; run += 1) {
			expect(document.querySelectorAll('[data-eid-al-fitr]')).toHaveLength(1)
			expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
			expect(scene.pending.size).toBe(1)
			cleanupEffect()
			expect(scene.pending.size).toBe(0)
			expect(document.querySelector('[data-eid-al-fitr]')).toBeNull()
			if (run < 2) {
				cleanupEffect = await launchEidAlFitrGlow()
				vi.advanceTimersByTime(900)
			}
		}
		expect(createEidAlFitrArtwork).toHaveBeenCalledTimes(3)
	})
})

async function createScene({
	shouldMount = true,
	isHidden = false,
	isReducedMotion = false,
}: {
	shouldMount?: boolean
	isHidden?: boolean
	isReducedMotion?: boolean
} = {}) {
	let isDocumentHidden = isHidden
	vi.spyOn(document, 'hidden', 'get').mockImplementation(() => isDocumentHidden)
	const pending = new Map<number, FrameRequestCallback>()
	let nextFrameId = 0
	vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
		pending.set(++nextFrameId, callback)
		return nextFrameId
	})
	vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) =>
		pending.delete(id),
	)
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
	vi.mocked(createEidAlFitrArtwork).mockImplementation(({ dpr }) => ({
		lanterns: [0, 1, 2].map((variant) => ({
			...createSprite({
				name: `lantern-${variant}`,
				width: 240,
				height: 300,
				dpr,
			}),
			anchorX: 120,
			anchorY: 30,
			lightX: 120,
			lightY: 144,
		})),
		crescent: createSprite({ name: 'crescent', width: 320, dpr }),
		glow: createSprite({ name: 'glow', width: 256, dpr }),
		haze: createSprite({ name: 'haze', width: 256, dpr }),
		star: createSprite({ name: 'star', width: 64, dpr }),
		rosette: createSprite({ name: 'rosette', width: 128, dpr }),
	}))
	const context = createCanvasContext()
	const partial: Partial<CanvasRenderingContext2D> = context
	const getContext = vi
		.spyOn(HTMLCanvasElement.prototype, 'getContext')
		.mockReturnValue(partial as CanvasRenderingContext2D)
	cleanupEffect = await launchEidAlFitrGlow()
	if (shouldMount) vi.advanceTimersByTime(900)
	return {
		context,
		getContext,
		motion,
		pending,
		snapshot: () => [...context.images],
		getGradientCount: () =>
			context.createLinearGradient.mock.calls.length +
			context.createRadialGradient.mock.calls.length,
		getPendingCallback: () => {
			const callback = pending.values().next().value
			if (!callback) throw new Error('Expected a scheduled Eid al-Fitr frame')
			return callback
		},
		runFrame: (time: number) => {
			vi.mocked(performance.now).mockReturnValue(time)
			for (const [id, callback] of [...pending]) {
				pending.delete(id)
				callback(time)
			}
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

function createCanvasContext() {
	const images: ImageDraw[] = []
	let transforms: Transform[] = []
	const savedStates: {
		alpha: number
		composition: GlobalCompositeOperation
		transforms: Transform[]
	}[] = []
	const context = {
		images,
		globalAlpha: 1,
		globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
		clearRect: vi.fn(() => {
			images.length = 0
		}),
		drawImage: vi.fn((source: CanvasImageSource, ...coordinates: number[]) => {
			images.push({
				source:
					source instanceof HTMLCanvasElement
						? (source.dataset.testSprite ?? 'cache')
						: 'image',
				coordinates,
				alpha: context.globalAlpha,
				composition: context.globalCompositeOperation,
				transforms: [...transforms],
			})
		}),
		save: () =>
			savedStates.push({
				alpha: context.globalAlpha,
				composition: context.globalCompositeOperation,
				transforms: [...transforms],
			}),
		restore: () => {
			const state = savedStates.pop()
			if (!state) return
			context.globalAlpha = state.alpha
			context.globalCompositeOperation = state.composition
			transforms = state.transforms
		},
		translate: (x: number, y: number) => {
			transforms.push(['translate', x, y])
		},
		rotate: (angle: number) => {
			transforms.push(['rotate', angle])
		},
		scale: (x: number, y: number) => {
			transforms.push(['scale', x, y])
		},
		setTransform: vi.fn(() => {
			transforms = []
		}),
		createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
		createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
		fillRect: vi.fn(),
		beginPath: vi.fn(),
		closePath: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		bezierCurveTo: vi.fn(),
		quadraticCurveTo: vi.fn(),
		arc: vi.fn(),
		ellipse: vi.fn(),
		fill: vi.fn(),
		stroke: vi.fn(),
		clip: vi.fn(),
	}
	return context
}

function createSprite({
	name,
	width,
	height = width,
	dpr,
}: {
	name: string
	width: number
	height?: number
	dpr: number
}) {
	const canvas = document.createElement('canvas')
	canvas.width = Math.round(width * dpr)
	canvas.height = Math.round(height * dpr)
	canvas.dataset.testSprite = name
	return { canvas, width, height }
}

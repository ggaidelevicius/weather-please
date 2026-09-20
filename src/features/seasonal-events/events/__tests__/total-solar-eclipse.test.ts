import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	SETTINGS_MODAL_STATE_EVENT,
	setSettingsModalOpenState,
} from '../../../../shared/lib/settings-modal-state'
import { launchTotalSolarEclipse } from '../total-solar-eclipse'
import { createTotalSolarEclipseArtwork } from '../total-solar-eclipse-artwork'

vi.mock('../total-solar-eclipse-artwork', () => ({
	createTotalSolarEclipseArtwork: vi.fn(),
}))

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
	vi.mocked(createTotalSolarEclipseArtwork).mockReset()
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

describe('Total solar eclipse scene', () => {
	it('can cancel the delayed mount before allocating artwork or drawing', async () => {
		const scene = await createScene({ shouldMount: false })
		vi.advanceTimersByTime(899)
		expect(createTotalSolarEclipseArtwork).not.toHaveBeenCalled()
		expect(document.querySelector('[data-total-solar-eclipse]')).toBeNull()
		cleanupEffect()
		vi.advanceTimersByTime(10_000)
		expect(createTotalSolarEclipseArtwork).not.toHaveBeenCalled()
		expect(scene.context.drawImage).not.toHaveBeenCalled()
		expect(document.querySelector('[data-total-solar-eclipse]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('renders a visible static background and preserves artwork and particles across resizing', async () => {
		const scene = await createScene({ isReducedMotion: true })
		const canvas = document.querySelector('canvas[data-total-solar-eclipse]')
		expect(canvas).toHaveAttribute('aria-hidden', 'true')
		expect(canvas).toHaveStyle({
			position: 'fixed',
			pointerEvents: 'none',
			zIndex: '0',
		})
		expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
		expect(scene.snapshot().some(({ alpha }) => alpha > 0)).toBe(true)
		for (const artworkName of ['corona', 'filaments', 'moon', 'star']) {
			expect(
				scene
					.snapshot()
					.some(
						({ source, alpha }) => source.startsWith(artworkName) && alpha > 0,
					),
			).toBe(true)
		}
		expect(createTotalSolarEclipseArtwork).toHaveBeenCalledOnce()
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
		expect(createTotalSolarEclipseArtwork).toHaveBeenCalledOnce()
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
			expect(createTotalSolarEclipseArtwork).toHaveBeenCalledOnce()
			expect(scene.getGradientCount()).toBe(gradientCount)
			expect(scene.pending.size).toBe(1)
		},
	)

	it('keeps eclipse layers concentric through animation and resizing while preserving star positions', async () => {
		const scene = await createScene()
		for (let frame = 0; frame <= 100; frame += 1) {
			scene.runFrame(frame * 50)
			if (frame % 25 === 0) expectEclipseAlignment(scene.snapshot())
		}
		setSettingsModalOpenState(true)
		const starsBefore = scene
			.snapshot()
			.filter(({ source }) => source === 'star')
		expect(starsBefore.length).toBeGreaterThan(0)
		vi.stubGlobal('innerHeight', 888)
		window.dispatchEvent(new Event('resize'))
		expectEclipseAlignment(scene.snapshot())
		const starsAfter = scene
			.snapshot()
			.filter(({ source }) => source === 'star')
		expect(starsAfter).toHaveLength(starsBefore.length)
		for (const [index, image] of starsBefore.entries()) {
			const before = getImagePoint(image)
			const after = getImagePoint(starsAfter[index])
			expect(after.x).toBeCloseTo(before.x, 8)
			expect(after.y / 888).toBeCloseTo(before.y / 768, 8)
		}
		vi.stubGlobal('innerWidth', 390)
		vi.stubGlobal('innerHeight', 844)
		window.dispatchEvent(new Event('resize'))
		expectEclipseAlignment(scene.snapshot())
		expect(scene.pending.size).toBe(0)
		expect(createTotalSolarEclipseArtwork).toHaveBeenCalledOnce()
	})

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
		const artwork: ReturnType<typeof createTotalSolarEclipseArtwork> =
			vi.mocked(createTotalSolarEclipseArtwork).mock.results[0].value
		const canvas = document.querySelector<HTMLCanvasElement>(
			'canvas[data-total-solar-eclipse]',
		)
		if (!canvas) throw new Error('Missing Total solar eclipse canvas')
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
		expect(document.querySelector('[data-total-solar-eclipse]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
		for (const surface of [
			canvas,
			artwork.corona.canvas,
			artwork.filaments.canvas,
			artwork.moon.canvas,
			artwork.glow.canvas,
			artwork.haze.canvas,
			artwork.star.canvas,
		]) {
			expect(surface.width).toBe(0)
			expect(surface.height).toBe(0)
		}
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
				vi.mocked(createTotalSolarEclipseArtwork).mockImplementationOnce(() => {
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
			expect(document.querySelector('[data-total-solar-eclipse]')).toBeNull()
			expect(scene.pending.size).toBe(0)
			expect(vi.getTimerCount()).toBe(0)
			if (stage === 'context')
				expect(createTotalSolarEclipseArtwork).not.toHaveBeenCalled()
		},
	)

	it('leaves one canvas and one animation loop after cleanup and relaunch', async () => {
		const scene = await createScene()
		for (let run = 0; run < 3; run += 1) {
			expect(
				document.querySelectorAll('[data-total-solar-eclipse]'),
			).toHaveLength(1)
			expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
			expect(scene.pending.size).toBe(1)
			cleanupEffect()
			expect(scene.pending.size).toBe(0)
			expect(document.querySelector('[data-total-solar-eclipse]')).toBeNull()
			if (run < 2) {
				cleanupEffect = await launchTotalSolarEclipse()
				vi.advanceTimersByTime(900)
			}
		}
		expect(createTotalSolarEclipseArtwork).toHaveBeenCalledTimes(3)
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
	vi.mocked(createTotalSolarEclipseArtwork).mockImplementation(({ dpr }) => ({
		corona: createSprite({ name: 'corona', width: 800, dpr }),
		filaments: createSprite({ name: 'filaments', width: 2200, dpr }),
		moon: createSprite({ name: 'moon', width: 800, dpr }),
		glow: createSprite({ name: 'glow', width: 256, dpr }),
		star: createSprite({ name: 'star', width: 64, dpr }),
		haze: createSprite({ name: 'haze', width: 512, dpr }),
		radius: 125,
	}))
	const context = createCanvasContext()
	const partial: Partial<CanvasRenderingContext2D> = context
	const getContext = vi
		.spyOn(HTMLCanvasElement.prototype, 'getContext')
		.mockReturnValue(partial as CanvasRenderingContext2D)
	cleanupEffect = await launchTotalSolarEclipse()
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
			if (!callback)
				throw new Error('Expected a scheduled Total solar eclipse frame')
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

function getImagePoint(image: ImageDraw, relativeX = 0.5, relativeY = 0.5) {
	let x = image.coordinates[0] + image.coordinates[2] * relativeX
	let y = image.coordinates[1] + image.coordinates[3] * relativeY
	for (const [operation, first, second] of [...image.transforms].reverse()) {
		if (operation === 'translate') {
			x += first
			y += second
		} else if (operation === 'scale') {
			x *= first
			y *= second
		} else if (operation === 'rotate') {
			const nextX = x * Math.cos(first) - y * Math.sin(first)
			y = x * Math.sin(first) + y * Math.cos(first)
			x = nextX
		}
	}
	return { x, y }
}

function expectEclipseAlignment(images: ImageDraw[]) {
	const result = vi.mocked(createTotalSolarEclipseArtwork).mock.results.at(-1)
	if (!result || result.type !== 'return')
		throw new Error('Missing eclipse artwork')
	const artwork: ReturnType<typeof createTotalSolarEclipseArtwork> =
		result.value
	const moon = images.find(({ source }) => source === 'moon')
	const corona = images.find(({ source }) => source === 'corona')
	const filaments = images.filter(({ source }) => source === 'filaments')
	if (!moon || !corona) throw new Error('Missing moon or corona layer')
	expect(filaments.length).toBeGreaterThan(0)
	const center = getImagePoint(moon)
	for (const layer of [corona, ...filaments]) {
		const layerCenter = getImagePoint(layer)
		expect(layerCenter.x).toBeCloseTo(center.x, 8)
		expect(layerCenter.y).toBeCloseTo(center.y, 8)
	}
	for (const filament of filaments) {
		expect(images.indexOf(filament)).toBeLessThan(images.indexOf(corona))
	}
	expect(images.indexOf(corona)).toBeLessThan(images.indexOf(moon))
	for (const direction of ['width', 'height'] as const) {
		const startX = direction === 'width' ? 0 : 0.5
		const startY = direction === 'height' ? 0 : 0.5
		const moonStart = getImagePoint(moon, startX, startY)
		const moonEnd = getImagePoint(moon, 1 - startX, 1 - startY)
		const moonScale =
			Math.hypot(moonEnd.x - moonStart.x, moonEnd.y - moonStart.y) /
			artwork.moon[direction]
		for (const { image, sprite } of [
			{ image: corona, sprite: artwork.corona },
			...filaments.map((image) => ({ image, sprite: artwork.filaments })),
		]) {
			const start = getImagePoint(image, startX, startY)
			const end = getImagePoint(image, 1 - startX, 1 - startY)
			expect(
				Math.hypot(end.x - start.x, end.y - start.y) / sprite[direction],
			).toBeCloseTo(moonScale, 8)
		}
	}
}

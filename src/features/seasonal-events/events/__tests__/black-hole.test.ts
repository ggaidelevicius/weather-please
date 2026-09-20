import { Texture, TextureLoader, WebGLRenderer } from 'three'
import type { WebGLRendererParameters } from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'

import {
	SETTINGS_MODAL_STATE_EVENT,
	setSettingsModalOpenState,
} from '../../../../shared/lib/settings-modal-state'
import { launchBlackHoleEvent } from '../black-hole'
import { createBlackHoleScene } from '../black-hole-scene'

vi.mock('three', async (importOriginal) => {
	const original = await importOriginal<typeof import('three')>()
	return { ...original, WebGLRenderer: vi.fn(), TextureLoader: vi.fn() }
})
vi.mock('../black-hole-scene', () => ({ createBlackHoleScene: vi.fn() }))
vi.mock('../../assets/milkyway.jpg', () => ({
	default: { src: '/milkyway.jpg' },
}))
vi.mock('../../assets/star_noise.png', () => ({
	default: { src: '/star_noise.png' },
}))

let cleanupEffect = () => {}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
	vi.spyOn(performance, 'now').mockReturnValue(0)
	vi.spyOn(console, 'error').mockImplementation(() => {})
	vi.stubGlobal('innerWidth', 1024)
	vi.stubGlobal('innerHeight', 768)
	vi.stubGlobal('devicePixelRatio', 1)
	vi.mocked(WebGLRenderer).mockReset()
	vi.mocked(TextureLoader).mockReset()
	vi.mocked(createBlackHoleScene).mockReset()
	setSettingsModalOpenState(false)
})

afterEach(async () => {
	cleanupEffect()
	cleanupEffect = () => {}
	await flushLoading()
	setSettingsModalOpenState(false)
	document.body.innerHTML = ''
	vi.useRealTimers()
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe('Event Horizon Day scene', () => {
	it('returns cleanup before the delayed mount and allocates nothing when canceled', async () => {
		const scene = await createScene({ shouldStart: false })
		vi.advanceTimersByTime(899)
		expect(TextureLoader).not.toHaveBeenCalled()
		expect(WebGLRenderer).not.toHaveBeenCalled()
		cleanupEffect()
		vi.advanceTimersByTime(20_000)
		await flushLoading()
		expect(TextureLoader).not.toHaveBeenCalled()
		expect(WebGLRenderer).not.toHaveBeenCalled()
		expect(createBlackHoleScene).not.toHaveBeenCalled()
		expect(document.querySelector('[data-black-hole]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('disposes completed and pending textures on cancellation and ignores late callbacks', async () => {
		const scene = await createScene({ shouldLoad: false })
		expect(scene.requests).toHaveLength(2)
		scene.requests[0].complete()
		await flushLoading()
		cleanupEffect()
		cleanupEffect()
		for (const request of scene.requests) {
			expect(request.dispose).toHaveBeenCalledOnce()
			request.complete()
			request.fail()
		}
		await flushLoading()
		for (const request of scene.requests) {
			expect(request.dispose).toHaveBeenCalledOnce()
		}
		expect(WebGLRenderer).not.toHaveBeenCalled()
		expect(createBlackHoleScene).not.toHaveBeenCalled()
		expect(document.querySelector('[data-black-hole]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('waits for both sky assets before mounting one accessible background canvas', async () => {
		const scene = await createScene({ shouldLoad: false })
		expect(scene.requests.map(({ url }) => url)).toEqual([
			'/milkyway.jpg',
			'/star_noise.png',
		])
		scene.requests[0].complete()
		await flushLoading()
		expect(WebGLRenderer).not.toHaveBeenCalled()
		expect(scene.render).not.toHaveBeenCalled()
		expect(document.querySelector('[data-black-hole]')).toBeNull()
		setSettingsModalOpenState(true)
		scene.setReducedMotion(true)
		scene.requests[1].complete()
		await flushLoading()
		const canvas = document.querySelector('canvas[data-black-hole]')
		expect(canvas).toHaveAttribute('aria-hidden', 'true')
		expect(canvas).toHaveStyle({
			position: 'fixed',
			pointerEvents: 'none',
			zIndex: '0',
		})
		expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
		expect(WebGLRenderer).toHaveBeenCalledOnce()
		expect(createBlackHoleScene).toHaveBeenCalledOnce()
		expect(createBlackHoleScene).toHaveBeenCalledWith(
			expect.objectContaining({
				bgTexture: scene.requests[0].texture,
				starTexture: scene.requests[1].texture,
			}),
		)
		expect(scene.render).toHaveBeenCalled()
		expect(scene.getState().reveal).toBe(1)
		expect(scene.pending.size).toBe(0)
		scene.setReducedMotion(false)
		expect(scene.pending.size).toBe(0)
		setSettingsModalOpenState(false)
		expect(scene.pending.size).toBe(1)
		expect(vi.getTimerCount()).toBe(0)
	})

	it.each(['failure', 'deadline'])(
		'releases every texture after an asset %s',
		async (reason) => {
			const scene = await createScene({ shouldLoad: false })
			scene.requests[0].complete()
			if (reason === 'failure') scene.requests[1].fail()
			else {
				vi.advanceTimersByTime(14_999)
				await flushLoading()
				expect(scene.requests[0].dispose).not.toHaveBeenCalled()
				vi.advanceTimersByTime(1)
			}
			await flushLoading()
			for (const request of scene.requests) {
				expect(request.dispose).toHaveBeenCalledOnce()
				request.complete()
			}
			await flushLoading()
			cleanupEffect()
			for (const request of scene.requests) {
				expect(request.dispose).toHaveBeenCalledOnce()
			}
			expect(WebGLRenderer).not.toHaveBeenCalled()
			expect(createBlackHoleScene).not.toHaveBeenCalled()
			expect(document.querySelector('[data-black-hole]')).toBeNull()
			expect(scene.pending.size).toBe(0)
			expect(vi.getTimerCount()).toBe(0)
		},
	)

	it.each([60, 120])(
		'renders every frame at %i Hz with time-based, bounded rotation',
		async (rate) => {
			const scene = await createScene()
			const drawCount = scene.render.mock.calls.length
			const sizeCount = scene.setSize.mock.calls.length
			const dprCount = scene.setPixelRatio.mock.calls.length
			scene.runFrame(0)
			for (let frame = 1; frame <= rate; frame += 1) {
				scene.runFrame((frame * 1000) / rate)
				expect(scene.render).toHaveBeenCalledTimes(drawCount + frame + 1)
			}
			expect(scene.getState().time).toBeCloseTo(0.02, 8)
			expect(scene.getState().reveal).toBeGreaterThan(0)
			expect(scene.setSize).toHaveBeenCalledTimes(sizeCount)
			expect(scene.setPixelRatio).toHaveBeenCalledTimes(dprCount)
			scene.runFrame(5000)
			expect(scene.getState().time).toBeCloseTo(0.021, 8)
			for (let frame = 1; frame <= 6500; frame += 1) {
				scene.runFrame(5000 + frame * 50)
			}
			expect(scene.getState().time).toBeCloseTo(
				(0.021 + 6.5) % (Math.PI * 2),
				8,
			)
			expect(scene.getState().reveal).toBe(1)
			expect(scene.pending.size).toBe(1)
			expect(createBlackHoleScene).toHaveBeenCalledOnce()
		},
	)

	it.each(['settings', 'visibility'])(
		'freezes for %s and resumes at the identical pose',
		async (reason) => {
			setSettingsModalOpenState(reason === 'settings')
			const scene = await createScene({ isHidden: reason === 'visibility' })
			const setPaused = (isPaused: boolean) => {
				if (reason === 'visibility') scene.setHidden(isPaused)
				else setSettingsModalOpenState(isPaused)
			}
			expect(scene.pending.size).toBe(0)
			setPaused(false)
			for (let frame = 0; frame <= 100; frame += 1) scene.runFrame(frame * 20)
			const frozen = scene.getState()
			setPaused(true)
			const drawCount = scene.render.mock.calls.length
			scene.runFrame(120_000)
			expect(scene.render).toHaveBeenCalledTimes(drawCount)
			expect(scene.pending.size).toBe(0)
			window.dispatchEvent(new Event('resize'))
			expect(scene.getState()).toEqual(frozen)
			setPaused(false)
			scene.runFrame(120_000)
			expect(scene.getState()).toEqual(frozen)
			scene.runFrame(120_020)
			expect(scene.getState().time).toBeCloseTo(frozen.time + 0.0004, 8)
			expect(scene.pending.size).toBe(1)
		},
	)

	it.each([false, true])(
		'keeps reduced motion static and fully revealed when initially reduced: %s',
		async (isInitiallyReduced) => {
			const scene = await createScene({ isReducedMotion: isInitiallyReduced })
			if (!isInitiallyReduced) {
				scene.runFrame(0)
				scene.runFrame(20)
				expect(scene.getState().reveal).toBeLessThan(1)
				scene.setReducedMotion(true)
			}
			expect(scene.getState().reveal).toBe(1)
			expect(scene.pending.size).toBe(0)
			const frozen = scene.getState()
			const drawCount = scene.render.mock.calls.length
			scene.runFrame(120_000)
			expect(scene.render).toHaveBeenCalledTimes(drawCount)
			window.dispatchEvent(new Event('resize'))
			expect(scene.getState()).toEqual(frozen)
			scene.setReducedMotion(false)
			scene.runFrame(120_000)
			expect(scene.getState()).toEqual(frozen)
			scene.runFrame(120_020)
			const moving = scene.getState()
			expect(moving.time).toBeGreaterThan(frozen.time)
			scene.setReducedMotion(true)
			expect(scene.getState()).toEqual(moving)
			expect(scene.pending.size).toBe(0)
		},
	)

	it('resizes a frozen scene without changing its pose or reallocating its resources', async () => {
		const scene = await createScene()
		scene.runFrame(0)
		scene.runFrame(20)
		setSettingsModalOpenState(true)
		const frozen = scene.getState()
		vi.stubGlobal('innerWidth', 390)
		vi.stubGlobal('innerHeight', 844)
		vi.stubGlobal('devicePixelRatio', 3)
		window.dispatchEvent(new Event('resize'))
		expect(scene.getState()).toEqual({
			...frozen,
			width: 390,
			height: 844,
			dpr: 1.2,
		})
		expect(scene.setSize).toHaveBeenLastCalledWith(390, 844, expect.anything())
		expect(document.querySelector('canvas[data-black-hole]')).toHaveStyle({
			width: '390px',
			height: '844px',
		})
		vi.stubGlobal('innerWidth', 8000)
		vi.stubGlobal('innerHeight', 5000)
		window.dispatchEvent(new Event('resize'))
		expect(scene.getState().dpr).toBeLessThan(1)
		expect(scene.getState().time).toBe(frozen.time)
		expect(scene.getState().reveal).toBe(frozen.reveal)
		expect(scene.pending.size).toBe(0)
		expect(scene.requests).toHaveLength(2)
		expect(createBlackHoleScene).toHaveBeenCalledOnce()
	})

	it('rejects stale animation callbacks after pause and resume', async () => {
		const scene = await createScene()
		const stale = scene.getPendingCallback()
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		const drawCount = scene.render.mock.calls.length
		stale(120_000)
		expect(scene.render).toHaveBeenCalledTimes(drawCount)
		expect(scene.pending.size).toBe(1)
		scene.runFrame(120_020)
		expect(scene.render).toHaveBeenCalledTimes(drawCount + 1)
		expect(scene.pending.size).toBe(1)
	})

	it.each([false, true])(
		'cleans up once after resume with a resumed frame: %s',
		async (hasResumedFrame) => {
			const addWindowListener = vi.spyOn(window, 'addEventListener')
			const removeWindowListener = vi.spyOn(window, 'removeEventListener')
			const addDocumentListener = vi.spyOn(document, 'addEventListener')
			const removeDocumentListener = vi.spyOn(document, 'removeEventListener')
			const scene = await createScene()
			setSettingsModalOpenState(true)
			setSettingsModalOpenState(false)
			if (hasResumedFrame) scene.runFrame(120_000)
			const stale = scene.getPendingCallback()
			const drawCount = scene.render.mock.calls.length
			cleanupEffect()
			cleanupEffect()
			stale(120_020)
			setSettingsModalOpenState(true)
			setSettingsModalOpenState(false)
			scene.setHidden(true)
			scene.setHidden(false)
			scene.setReducedMotion(true)
			scene.setReducedMotion(false)
			window.dispatchEvent(new Event('resize'))
			for (const request of scene.requests) request.complete()
			vi.advanceTimersByTime(20_000)
			await flushLoading()
			expect(scene.render).toHaveBeenCalledTimes(drawCount)
			expect(scene.disposeScene).toHaveBeenCalledOnce()
			expect(scene.disposeRenderer).toHaveBeenCalledOnce()
			expect(scene.forceContextLoss).toHaveBeenCalledOnce()
			for (const request of scene.requests)
				expect(request.dispose).toHaveBeenCalledOnce()
			expect(document.querySelector('[data-black-hole]')).toBeNull()
			expect(scene.pending.size).toBe(0)
			expect(vi.getTimerCount()).toBe(0)
			for (const [event, listener] of addWindowListener.mock.calls) {
				if (event === 'resize' || event === SETTINGS_MODAL_STATE_EVENT) {
					expect(removeWindowListener).toHaveBeenCalledWith(event, listener)
				}
			}
			for (const [event, listener] of addDocumentListener.mock.calls) {
				if (event === 'visibilitychange')
					expect(removeDocumentListener).toHaveBeenCalledWith(event, listener)
			}
			expect(scene.motion.addEventListener).toHaveBeenCalled()
			for (const [event, listener] of scene.motion.addEventListener.mock
				.calls) {
				expect(scene.motion.removeEventListener).toHaveBeenCalledWith(
					event,
					listener,
				)
			}
		},
	)

	it('releases all resources if the initial scene render fails', async () => {
		const scene = await createScene({ shouldLoad: false })
		scene.render.mockImplementationOnce(() => {
			throw new Error('Unable to render')
		})
		for (const request of scene.requests) request.complete()
		await flushLoading()
		expect(scene.disposeScene).toHaveBeenCalledOnce()
		expect(scene.disposeRenderer).toHaveBeenCalledOnce()
		expect(scene.forceContextLoss).toHaveBeenCalledOnce()
		for (const request of scene.requests)
			expect(request.dispose).toHaveBeenCalledOnce()
		expect(document.querySelector('[data-black-hole]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
	})
})

async function createScene({
	shouldStart = true,
	shouldLoad = true,
	isHidden = false,
	isReducedMotion = false,
}: {
	shouldStart?: boolean
	shouldLoad?: boolean
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
	const requests: {
		url: string
		texture: Texture
		dispose: MockInstance<Texture['dispose']>
		complete: () => void
		fail: () => void
	}[] = []
	vi.mocked(TextureLoader).mockImplementation(function () {
		const loader: Partial<TextureLoader> = {
			load: (url, onLoad, _onProgress, onError) => {
				const texture = new Texture(document.createElement('img'))
				requests.push({
					url,
					texture,
					dispose: vi.spyOn(texture, 'dispose'),
					complete: () => onLoad?.(texture),
					fail: () => onError?.(new Error('Texture unavailable')),
				})
				return texture
			},
		}
		return loader as TextureLoader
	})
	const disposeRenderer = vi.fn()
	const forceContextLoss = vi.fn()
	let canvas = document.createElement('canvas')
	let pixelRatio = 1
	const setPixelRatio = vi.fn((dpr: number) => {
		pixelRatio = dpr
	})
	const setSize = vi.fn(
		(width: number, height: number, shouldUpdateStyle = true) => {
			canvas.width = Math.round(width * pixelRatio)
			canvas.height = Math.round(height * pixelRatio)
			if (shouldUpdateStyle) {
				canvas.style.width = `${width}px`
				canvas.style.height = `${height}px`
			}
		},
	)
	vi.mocked(WebGLRenderer).mockImplementation(function (
		parameters?: WebGLRendererParameters,
	) {
		if (parameters?.canvas instanceof HTMLCanvasElement)
			canvas = parameters.canvas
		const renderer: Partial<WebGLRenderer> = {
			domElement: canvas,
			dispose: disposeRenderer,
			forceContextLoss,
			setPixelRatio,
			setSize,
			setClearColor: vi.fn(),
			getPixelRatio: () => pixelRatio,
		}
		return renderer as WebGLRenderer
	})
	const render =
		vi.fn<
			(frame: {
				width: number
				height: number
				dpr: number
				time: number
				reveal: number
			}) => void
		>()
	const disposeScene = vi.fn()
	vi.mocked(createBlackHoleScene).mockReturnValue({
		render,
		dispose: disposeScene,
	})
	cleanupEffect = await launchBlackHoleEvent()
	if (shouldStart) {
		vi.advanceTimersByTime(900)
		await flushLoading()
		if (shouldLoad) {
			for (const request of requests) request.complete()
			await flushLoading()
		}
	}
	return {
		requests,
		pending,
		motion,
		render,
		disposeScene,
		disposeRenderer,
		forceContextLoss,
		setPixelRatio,
		setSize,
		getState: () => {
			const state = render.mock.lastCall?.[0]
			if (!state) throw new Error('Expected the black hole scene to render')
			return { ...state }
		},
		getPendingCallback: () => {
			const callback = pending.values().next().value
			if (!callback) throw new Error('Expected a scheduled black hole frame')
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

async function flushLoading() {
	await vi.advanceTimersByTimeAsync(0)
}

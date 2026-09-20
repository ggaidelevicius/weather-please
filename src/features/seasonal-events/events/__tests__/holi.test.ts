import { BufferGeometry, ShaderMaterial, WebGLRenderer } from 'three'
import type { WebGLRendererParameters } from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	SETTINGS_MODAL_STATE_EVENT,
	setSettingsModalOpenState,
} from '../../../../shared/lib/settings-modal-state'
import { launchHoliColors } from '../holi'
import * as artwork from '../holi-particles'

vi.mock('three', async (importOriginal) => {
	const original = await importOriginal<typeof import('three')>()
	return { ...original, WebGLRenderer: vi.fn() }
})

let cleanupEffect = () => {}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
	vi.spyOn(performance, 'now').mockReturnValue(0)
	vi.spyOn(Math, 'random').mockReturnValue(0.5)
	vi.stubGlobal('innerWidth', 1024)
	vi.stubGlobal('innerHeight', 768)
	vi.stubGlobal('devicePixelRatio', 1)
	vi.mocked(WebGLRenderer).mockReset()
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

describe('Holi scene', () => {
	it('can cancel its delayed mount without allocating graphics resources', async () => {
		const createParticles = vi.spyOn(artwork, 'createHoliParticles')
		const scene = await createScene({ shouldMount: false })
		vi.advanceTimersByTime(899)
		expect(document.querySelector('[data-holi]')).toBeNull()
		expect(WebGLRenderer).not.toHaveBeenCalled()

		cleanupEffect()
		vi.advanceTimersByTime(1000)

		expect(document.querySelector('[data-holi]')).toBeNull()
		expect(createParticles).not.toHaveBeenCalled()
		expect(WebGLRenderer).not.toHaveBeenCalled()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('renders a revealed static scene and reuses its geometry through resizing and density changes', async () => {
		const createParticles = vi.spyOn(artwork, 'createHoliParticles')
		const scene = await createScene({ isReducedMotion: true })
		const canvas = document.querySelector('canvas[data-holi]')

		expect(canvas).toHaveAttribute('data-holi', 'true')
		expect(canvas).toHaveAttribute('aria-hidden', 'true')
		expect(canvas).toHaveStyle({
			position: 'fixed',
			pointerEvents: 'none',
			zIndex: '0',
		})
		expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
		expect(scene.render).toHaveBeenCalled()
		expect(scene.getState().hasRevealed).toBe(true)
		expect(scene.pending.size).toBe(0)
		const initialDrawCount = scene.render.mock.calls.length
		const particles = createParticles.mock.results[0].value
		const positions = particles.geometry.getAttribute('position')

		vi.stubGlobal('innerWidth', 390)
		vi.stubGlobal('innerHeight', 844)
		window.dispatchEvent(new Event('resize'))
		expect(scene.render).toHaveBeenCalledTimes(initialDrawCount + 1)
		expect(canvas).toHaveStyle({ width: '390px', height: '844px' })
		vi.stubGlobal('devicePixelRatio', 3)
		window.dispatchEvent(new Event('resize'))

		expect(scene.render).toHaveBeenCalledTimes(initialDrawCount + 2)
		expect(scene.getState().dpr).toBeGreaterThan(1)
		expect(scene.getState().dpr).toBeLessThanOrEqual(2)
		expect(createParticles).toHaveBeenCalledOnce()
		expect(particles.geometry.getAttribute('position')).toBe(positions)
		expect(scene.pending.size).toBe(0)
	})

	it.each([60, 120])('renders every browser frame at %i Hz', async (rate) => {
		const createParticles = vi.spyOn(artwork, 'createHoliParticles')
		const scene = await createScene()
		const initialDrawCount = scene.render.mock.calls.length
		scene.runFrame(0)
		for (let frame = 1; frame <= rate; frame += 1) {
			scene.runFrame((frame * 1000) / rate)
			expect(scene.render).toHaveBeenCalledTimes(initialDrawCount + frame + 1)
		}

		expect(scene.getState().elapsed).toBeCloseTo(1)
		expect(createParticles).toHaveBeenCalledOnce()
		expect(scene.pending.size).toBe(1)
		scene.runFrame(5000)
		expect(scene.getState().elapsed).toBeCloseTo(1.05)
	})

	it.each(['visibility', 'settings'])(
		'freezes while %s is paused and resumes without restarting or jumping forward',
		async (reason) => {
			setSettingsModalOpenState(reason === 'settings')
			const scene = await createScene({ isHidden: reason === 'visibility' })
			const setPaused = (isPaused: boolean) => {
				if (reason === 'visibility') scene.setHidden(isPaused)
				else setSettingsModalOpenState(isPaused)
			}
			expect(scene.pending.size).toBe(0)
			setPaused(false)
			for (let frame = 0; frame <= 160; frame += 1) {
				scene.runFrame(frame * 50)
			}
			const beforePause = scene.getState()
			expect(beforePause.elapsed).toBeGreaterThan(7)

			setPaused(true)
			const drawCount = scene.render.mock.calls.length
			scene.runFrame(100_000)
			expect(scene.render).toHaveBeenCalledTimes(drawCount)
			expect(scene.pending.size).toBe(0)
			window.dispatchEvent(new Event('resize'))
			expect(scene.render).toHaveBeenCalledTimes(drawCount + 1)
			expect(scene.getState()).toEqual(beforePause)
			expect(scene.pending.size).toBe(0)
			setPaused(false)
			scene.runFrame(120_000)
			expect(scene.getState()).toEqual(beforePause)
			scene.runFrame(120_020)
			expect(scene.getState().elapsed).toBeCloseTo(beforePause.elapsed + 0.02)
		},
	)

	it('responds to live reduced motion with a fully revealed static scene', async () => {
		const scene = await createScene()
		scene.runFrame(0)
		scene.runFrame(20)
		const drawCount = scene.render.mock.calls.length

		scene.setReducedMotion(true)

		expect(scene.pending.size).toBe(0)
		expect(scene.render).toHaveBeenCalledTimes(drawCount + 1)
		expect(scene.getState().hasRevealed).toBe(true)
		const staticState = scene.getState()
		scene.runFrame(120_000)
		expect(scene.render).toHaveBeenCalledTimes(drawCount + 1)
		scene.setReducedMotion(false)
		expect(scene.pending.size).toBe(1)
		scene.runFrame(120_020)
		expect(scene.getState()).toEqual(staticState)
	})

	it('ignores stale callbacks after pause and resume without creating another loop', async () => {
		const scene = await createScene()
		const staleCallback = scene.pending.values().next().value
		if (!staleCallback) throw new Error('Expected a scheduled Holi frame')
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		const drawCount = scene.render.mock.calls.length

		staleCallback(120_000)

		expect(scene.render).toHaveBeenCalledTimes(drawCount)
		expect(scene.pending.size).toBe(1)
		scene.runFrame(120_020)
		expect(scene.render).toHaveBeenCalledTimes(drawCount + 1)
		expect(scene.pending.size).toBe(1)
	})

	it('disposes graphics resources once and removes listeners, roots and queued work', async () => {
		const createParticles = vi.spyOn(artwork, 'createHoliParticles')
		const removeWindowListener = vi.spyOn(window, 'removeEventListener')
		const removeDocumentListener = vi.spyOn(document, 'removeEventListener')
		const scene = await createScene()
		const particles = createParticles.mock.results[0].value
		const disposeGeometry = vi.spyOn(particles.geometry, 'dispose')
		const disposeMaterial = vi.spyOn(particles.material, 'dispose')
		const staleCallback = scene.pending.values().next().value
		if (!staleCallback) throw new Error('Expected a scheduled Holi frame')
		const drawCount = scene.render.mock.calls.length

		cleanupEffect()
		cleanupEffect()
		staleCallback(120_000)
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		window.dispatchEvent(new Event('resize'))
		scene.setHidden(false)
		scene.setReducedMotion(true)
		vi.advanceTimersByTime(1000)

		expect(document.querySelector('[data-holi]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
		expect(scene.render).toHaveBeenCalledTimes(drawCount)
		expect(disposeGeometry).toHaveBeenCalledOnce()
		expect(disposeMaterial).toHaveBeenCalledOnce()
		expect(scene.dispose).toHaveBeenCalledOnce()
		expect(scene.forceContextLoss).toHaveBeenCalledOnce()
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

	it('releases allocated graphics resources when the initial render fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		const createParticles = vi.spyOn(artwork, 'createHoliParticles')
		const disposeGeometry = vi.spyOn(BufferGeometry.prototype, 'dispose')
		const disposeMaterial = vi.spyOn(ShaderMaterial.prototype, 'dispose')
		const scene = await createScene({ shouldMount: false })
		scene.render.mockImplementationOnce(() => {
			throw new Error('Rendering unavailable')
		})
		vi.advanceTimersByTime(900)
		const drawCount = scene.render.mock.calls.length

		expect(createParticles).toHaveBeenCalledOnce()
		expect(scene.dispose).toHaveBeenCalledOnce()
		expect(scene.forceContextLoss).toHaveBeenCalledOnce()
		expect(disposeGeometry).toHaveBeenCalledOnce()
		expect(disposeMaterial).toHaveBeenCalledOnce()
		expect(document.querySelector('[data-holi]')).toBeNull()
		expect(scene.pending.size).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		window.dispatchEvent(new Event('resize'))
		scene.setHidden(false)
		scene.setReducedMotion(true)
		expect(scene.render).toHaveBeenCalledTimes(drawCount)
	})

	it('leaves one scene and one animation loop after cleanup and restart', async () => {
		const scene = await createScene()
		for (let run = 0; run < 3; run += 1) {
			expect(document.querySelectorAll('[data-holi]')).toHaveLength(1)
			expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
			expect(scene.pending.size).toBe(1)
			cleanupEffect()
			expect(document.querySelector('[data-holi]')).toBeNull()
			expect(scene.pending.size).toBe(0)
			if (run < 2) {
				cleanupEffect = await launchHoliColors()
				vi.advanceTimersByTime(900)
			}
		}
		expect(WebGLRenderer).toHaveBeenCalledTimes(3)
		expect(scene.dispose).toHaveBeenCalledTimes(3)
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
	const render = vi.fn<WebGLRenderer['render']>()
	const dispose = vi.fn()
	const forceContextLoss = vi.fn()
	vi.mocked(WebGLRenderer).mockImplementation(function (
		parameters?: WebGLRendererParameters,
	) {
		const canvas =
			parameters?.canvas instanceof HTMLCanvasElement
				? parameters.canvas
				: document.createElement('canvas')
		let dpr = 1
		const renderer: Partial<WebGLRenderer> = {
			domElement: canvas,
			dispose,
			forceContextLoss,
			getPixelRatio: () => dpr,
			render,
			setClearColor: vi.fn(),
			setPixelRatio: (nextDpr) => {
				dpr = nextDpr
			},
			setSize: (width, height, shouldUpdateStyle = true) => {
				canvas.width = Math.round(width * dpr)
				canvas.height = Math.round(height * dpr)
				if (shouldUpdateStyle) {
					canvas.style.width = `${width}px`
					canvas.style.height = `${height}px`
				}
			},
		}
		return renderer as WebGLRenderer
	})
	const updateParticles = vi.spyOn(artwork, 'updateHoliParticles')
	const runFrame = (time: number) => {
		for (const [id, callback] of [...pending]) {
			pending.delete(id)
			callback(time)
		}
	}
	cleanupEffect = await launchHoliColors()
	if (shouldMount) vi.advanceTimersByTime(900)

	return {
		dispose,
		forceContextLoss,
		getState: () => {
			const state = updateParticles.mock.lastCall?.[0]
			if (!state) throw new Error('Expected Holi particles to be updated')
			return {
				dpr: state.dpr,
				elapsed: state.elapsed,
				hasRevealed: state.hasRevealed,
				isCompact: state.isCompact,
			}
		},
		motion,
		pending,
		render,
		runFrame,
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

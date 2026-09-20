import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSettingsModalAnimationController } from '../settings-modal-animation-controller'
import {
	SETTINGS_MODAL_STATE_EVENT,
	setSettingsModalOpenState,
} from '../settings-modal-state'

const controllers: ReturnType<typeof createSettingsModalAnimationController>[] =
	[]
const nativeFrames = new Map<number, FrameRequestCallback>()

beforeEach(() => {
	vi.useFakeTimers()
	setSettingsModalOpenState(false)
	nativeFrames.clear()
	let nextId = 0
	vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
		nextId += 1
		nativeFrames.set(nextId, callback)
		return nextId
	})
	vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
		nativeFrames.delete(id)
	})
})

afterEach(() => {
	for (const controller of controllers) controller.dispose()
	controllers.length = 0
	setSettingsModalOpenState(false)
	document.body.innerHTML = ''
	document.head.innerHTML = ''
	vi.useRealTimers()
	vi.restoreAllMocks()
})

describe('settings modal animation controller', () => {
	it('delivers an animation frame once with its browser timestamp', () => {
		const controller = createController()
		const callback = vi.fn()
		controller.requestAnimationFrame(callback)
		runFrame(123)
		runFrame(456)

		expect(callback).toHaveBeenCalledExactlyOnceWith(123)
		expect(nativeFrames.size).toBe(0)
	})

	it('can cancel a queued frame before the modal closes', () => {
		setSettingsModalOpenState(true)
		const controller = createController()
		const callback = vi.fn()
		const id = controller.requestAnimationFrame(callback)
		expect(controller.isPaused()).toBe(true)
		expect(nativeFrames.size).toBe(0)

		controller.cancelAnimationFrame(id)
		setSettingsModalOpenState(false)
		runFrame(100)

		expect(callback).not.toHaveBeenCalled()
		expect(nativeFrames.size).toBe(0)
	})

	it('keeps a resumed frame cancellable using its original request ID', () => {
		setSettingsModalOpenState(true)
		const controller = createController()
		const callback = vi.fn(() => {
			controller.requestAnimationFrame(callback)
		})
		const id = controller.requestAnimationFrame(callback)
		setSettingsModalOpenState(false)
		const staleCallback = getNativeCallback()

		controller.cancelAnimationFrame(id)
		expect(nativeFrames.size).toBe(0)
		staleCallback(100)

		expect(callback).not.toHaveBeenCalled()
		expect(nativeFrames.size).toBe(0)
	})

	it('retains a pending frame through repeated pauses and ignores replaced native callbacks', () => {
		const controller = createController()
		const callback = vi.fn()
		controller.requestAnimationFrame(callback)
		const originalCallback = getNativeCallback()

		setSettingsModalOpenState(true)
		expect(nativeFrames.size).toBe(0)
		originalCallback(100)
		expect(callback).not.toHaveBeenCalled()
		setSettingsModalOpenState(false)
		const resumedCallback = getNativeCallback()
		setSettingsModalOpenState(true)
		setSettingsModalOpenState(false)
		originalCallback(200)
		resumedCallback(200)
		expect(callback).not.toHaveBeenCalled()
		expect(nativeFrames.size).toBe(1)

		runFrame(300)

		expect(callback).toHaveBeenCalledExactlyOnceWith(300)
		expect(nativeFrames.size).toBe(0)
	})

	it('resumes multiple frames once while keeping their cancellation independent', () => {
		setSettingsModalOpenState(true)
		const controller = createController()
		const canceledCallback = vi.fn()
		const retainedCallback = vi.fn()
		const canceledId = controller.requestAnimationFrame(canceledCallback)
		controller.requestAnimationFrame(retainedCallback)
		setSettingsModalOpenState(false)
		setSettingsModalOpenState(false)
		expect(nativeFrames.size).toBe(2)
		controller.cancelAnimationFrame(canceledId)

		runFrame(100)

		expect(canceledCallback).not.toHaveBeenCalled()
		expect(retainedCallback).toHaveBeenCalledExactlyOnceWith(100)
		expect(nativeFrames.size).toBe(0)
	})

	it.each(['active', 'paused', 'resumed'])(
		'disposes %s work and prevents late callbacks from restarting a loop',
		(state) => {
			setSettingsModalOpenState(state !== 'active')
			const removeListener = vi.spyOn(window, 'removeEventListener')
			const controller = createController()
			const callback = vi.fn(() => {
				controller.requestAnimationFrame(callback)
			})
			controller.requestAnimationFrame(callback)
			if (state === 'resumed') setSettingsModalOpenState(false)
			const staleCallbacks = [...nativeFrames.values()]

			controller.dispose()
			controller.dispose()
			expect(nativeFrames.size).toBe(0)
			for (const staleCallback of staleCallbacks) staleCallback(100)
			setSettingsModalOpenState(true)
			setSettingsModalOpenState(false)
			controller.requestAnimationFrame(callback)
			runFrame(200)

			expect(callback).not.toHaveBeenCalled()
			expect(nativeFrames.size).toBe(0)
			expect(removeListener).toHaveBeenCalledWith(
				SETTINGS_MODAL_STATE_EVENT,
				expect.any(Function),
			)
		},
	)

	it('does not pause frames or intervals when shouldAnimate is false', () => {
		setSettingsModalOpenState(true)
		const controller = createController(false)
		const frame = vi.fn()
		const interval = vi.fn()
		controller.requestAnimationFrame(frame)
		const intervalId = controller.setInterval(interval, 100)

		runFrame(10)
		vi.advanceTimersByTime(100)
		setSettingsModalOpenState(false)
		setSettingsModalOpenState(true)
		controller.requestAnimationFrame(frame)
		runFrame(20)
		vi.advanceTimersByTime(100)
		controller.clearInterval(intervalId)

		expect(controller.isPaused()).toBe(false)
		expect(frame).toHaveBeenCalledTimes(2)
		expect(interval).toHaveBeenCalledTimes(2)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('preserves interval pausing and CSS overlay marking', () => {
		const overlay = document.createElement('div')
		Object.assign(overlay.style, {
			position: 'fixed',
			pointerEvents: 'none',
			zIndex: '0',
		})
		document.body.appendChild(overlay)
		const controller = createController()
		const callback = vi.fn()
		const id = controller.setInterval(callback, 100)
		vi.advanceTimersByTime(100)

		setSettingsModalOpenState(true)
		vi.advanceTimersByTime(300)
		expect(callback).toHaveBeenCalledOnce()
		expect(overlay).toHaveClass('wp-settings-modal-pause-root')
		setSettingsModalOpenState(false)
		vi.advanceTimersByTime(100)
		expect(callback).toHaveBeenCalledTimes(2)
		expect(overlay).not.toHaveClass('wp-settings-modal-pause-root')
		controller.clearInterval(id)
		vi.advanceTimersByTime(100)
		expect(callback).toHaveBeenCalledTimes(2)
	})
})

function createController(shouldAnimate = true) {
	const controller = createSettingsModalAnimationController({ shouldAnimate })
	controllers.push(controller)
	return controller
}

function getNativeCallback() {
	const callback = nativeFrames.values().next().value
	if (!callback) throw new Error('Expected a native animation frame')
	return callback
}

function runFrame(time: number) {
	for (const [id, callback] of [...nativeFrames]) {
		nativeFrames.delete(id)
		callback(time)
	}
}

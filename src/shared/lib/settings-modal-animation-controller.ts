import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
	SETTINGS_MODAL_OPEN_ATTRIBUTE,
} from './settings-modal-state'

type ControllerOptions = {
	shouldAnimate?: boolean
}

type IntervalHandler = () => void
type PendingAnimationFrame = {
	callback: FrameRequestCallback
	nativeId: null | number
}
const MODAL_PAUSE_CLASS = 'wp-settings-modal-pause-root'
const MODAL_PAUSE_STYLE_ID = 'wp-settings-modal-pause-style'
const markedCssRoots = new Set<HTMLElement>()

const ensureModalPauseStyle = () => {
	if (typeof document === 'undefined') {
		return
	}
	if (document.getElementById(MODAL_PAUSE_STYLE_ID)) {
		return
	}

	const style = document.createElement('style')
	style.id = MODAL_PAUSE_STYLE_ID
	style.textContent = `
		:root[${SETTINGS_MODAL_OPEN_ATTRIBUTE}] .${MODAL_PAUSE_CLASS},
		:root[${SETTINGS_MODAL_OPEN_ATTRIBUTE}] .${MODAL_PAUSE_CLASS} *,
		:root[${SETTINGS_MODAL_OPEN_ATTRIBUTE}] .${MODAL_PAUSE_CLASS}::before,
		:root[${SETTINGS_MODAL_OPEN_ATTRIBUTE}] .${MODAL_PAUSE_CLASS}::after,
		:root[${SETTINGS_MODAL_OPEN_ATTRIBUTE}] .${MODAL_PAUSE_CLASS} *::before,
		:root[${SETTINGS_MODAL_OPEN_ATTRIBUTE}] .${MODAL_PAUSE_CLASS} *::after {
			animation-play-state: paused !important;
		}
	`
	document.head.appendChild(style)
}

const isLikelySeasonalOverlayRoot = (element: HTMLElement) => {
	const computed = window.getComputedStyle(element)
	if (computed.position !== 'fixed') {
		return false
	}
	if (computed.pointerEvents !== 'none') {
		return false
	}

	const zIndex = Number.parseInt(computed.zIndex || '', 10)
	return Number.isFinite(zIndex) && zIndex >= 0 && zIndex <= 1
}

const pauseOverlayCssAnimations = () => {
	if (typeof document === 'undefined') {
		return
	}

	ensureModalPauseStyle()
	for (const child of document.body.children) {
		if (!(child instanceof HTMLElement)) {
			continue
		}
		if (!isLikelySeasonalOverlayRoot(child)) {
			continue
		}

		child.classList.add(MODAL_PAUSE_CLASS)
		markedCssRoots.add(child)
	}
}

const resumeOverlayCssAnimations = () => {
	for (const root of markedCssRoots) {
		root.classList.remove(MODAL_PAUSE_CLASS)
	}
	markedCssRoots.clear()
}

export const createSettingsModalAnimationController = ({
	shouldAnimate = true,
}: ControllerOptions = {}) => {
	if (typeof window === 'undefined') {
		return {
			cancelAnimationFrame: () => {},
			clearInterval: () => {},
			dispose: () => {},
			isPaused: () => false,
			requestAnimationFrame: () => 0,
			setInterval: () => 0,
		}
	}

	let isPaused = shouldAnimate && isSettingsModalOpen()
	let hasDisposed = false
	let nextSyntheticRafId = 1
	const pendingFrames = new Map<number, PendingAnimationFrame>()

	if (isPaused) {
		pauseOverlayCssAnimations()
	}

	const scheduleFrame = (id: number, frame: PendingAnimationFrame) => {
		const nativeId = window.requestAnimationFrame((time) => {
			if (
				hasDisposed ||
				pendingFrames.get(id) !== frame ||
				frame.nativeId !== nativeId
			) {
				return
			}
			frame.nativeId = null
			if (isPaused) return
			pendingFrames.delete(id)
			frame.callback(time)
		})
		frame.nativeId = nativeId
	}

	const pausePendingFrames = () => {
		for (const frame of pendingFrames.values()) {
			if (frame.nativeId !== null) {
				window.cancelAnimationFrame(frame.nativeId)
				frame.nativeId = null
			}
		}
	}

	const flushQueuedFrames = () => {
		for (const [id, frame] of pendingFrames) {
			if (frame.nativeId === null) scheduleFrame(id, frame)
		}
	}

	const unsubscribeModalState = onSettingsModalStateChange((isOpen) => {
		if (hasDisposed || !shouldAnimate) {
			return
		}

		isPaused = isOpen
		if (isPaused) {
			pausePendingFrames()
			pauseOverlayCssAnimations()
		} else {
			resumeOverlayCssAnimations()
		}
		if (!isPaused) {
			flushQueuedFrames()
		}
	})

	const requestAnimationFrame = (callback: FrameRequestCallback) => {
		if (hasDisposed) return 0
		// Keep the caller's ID valid when pause/resume replaces the native request.
		const syntheticId = -nextSyntheticRafId
		nextSyntheticRafId += 1
		const frame: PendingAnimationFrame = { callback, nativeId: null }
		pendingFrames.set(syntheticId, frame)
		if (!isPaused) scheduleFrame(syntheticId, frame)
		return syntheticId
	}

	const cancelAnimationFrame = (id: number) => {
		const frame = pendingFrames.get(id)
		if (!frame) return
		pendingFrames.delete(id)
		if (frame.nativeId !== null) {
			window.cancelAnimationFrame(frame.nativeId)
		}
	}

	const setInterval = (handler: IntervalHandler, ms: number) =>
		window.setInterval(() => {
			if (!shouldAnimate || !isPaused) {
				handler()
			}
		}, ms)

	const clearInterval = (id: number) => {
		window.clearInterval(id)
	}

	const dispose = () => {
		if (hasDisposed) return
		hasDisposed = true
		pausePendingFrames()
		pendingFrames.clear()
		unsubscribeModalState()
		if (!isSettingsModalOpen()) {
			resumeOverlayCssAnimations()
		}
	}

	return {
		cancelAnimationFrame,
		clearInterval,
		dispose,
		isPaused: () => isPaused,
		requestAnimationFrame,
		setInterval,
	}
}

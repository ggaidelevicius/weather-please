import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
	SETTINGS_MODAL_OPEN_ATTRIBUTE,
} from './settings-modal-state'

type ControllerOptions = {
	shouldAnimate?: boolean
}

type IntervalHandler = () => void
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
			requestAnimationFrame: (_callback: FrameRequestCallback) => 0,
			cancelAnimationFrame: (_id: number) => {},
			setInterval: (_handler: IntervalHandler, _ms: number) => 0,
			clearInterval: (_id: number) => {},
			isPaused: () => false,
			dispose: () => {},
		}
	}

	let isPaused = shouldAnimate && isSettingsModalOpen()
	let nextSyntheticRafId = 1
	const queuedRafCallbacks = new Map<number, FrameRequestCallback>()

	if (isPaused) {
		pauseOverlayCssAnimations()
	}

	const flushQueuedFrames = () => {
		if (!shouldAnimate || queuedRafCallbacks.size === 0) {
			return
		}

		const callbacks = [...queuedRafCallbacks.values()]
		queuedRafCallbacks.clear()

		for (const callback of callbacks) {
			window.requestAnimationFrame(callback)
		}
	}

	const unsubscribeModalState = onSettingsModalStateChange((isOpen) => {
		if (!shouldAnimate) {
			return
		}

		isPaused = isOpen
		if (isPaused) {
			pauseOverlayCssAnimations()
		} else {
			resumeOverlayCssAnimations()
		}
		if (!isPaused) {
			flushQueuedFrames()
		}
	})

	const requestAnimationFrame = (callback: FrameRequestCallback) => {
		if (!shouldAnimate || !isPaused) {
			return window.requestAnimationFrame(callback)
		}

		const syntheticId = -nextSyntheticRafId
		nextSyntheticRafId += 1
		queuedRafCallbacks.set(syntheticId, callback)
		return syntheticId
	}

	const cancelAnimationFrame = (id: number) => {
		if (id < 0) {
			queuedRafCallbacks.delete(id)
			return
		}
		window.cancelAnimationFrame(id)
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
		queuedRafCallbacks.clear()
		unsubscribeModalState()
		if (!isSettingsModalOpen()) {
			resumeOverlayCssAnimations()
		}
	}

	return {
		requestAnimationFrame,
		cancelAnimationFrame,
		setInterval,
		clearInterval,
		isPaused: () => isPaused,
		dispose,
	}
}

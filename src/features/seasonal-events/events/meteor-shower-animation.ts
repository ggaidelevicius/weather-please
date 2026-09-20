import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'

export type MeteorShowerFrame = {
	delta: number
	isReducedMotion: boolean
	time: number
}

export function startMeteorShowerAnimation({
	mountDelayMs,
	onFrame,
	onResize,
	overlay,
}: {
	mountDelayMs: number
	onFrame: (frame: MeteorShowerFrame) => void
	onResize: (time: number) => void
	overlay: HTMLElement
}): () => void {
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	let time = 0
	let lastTime: number | null = null
	let animationFrameId: number | null = null
	let animationGeneration = 0
	let hasCanceled = false
	let isMounted = false
	let unsubscribeSettings = () => {}

	const canAnimate = () =>
		!motionPreference.matches && !document.hidden && !isSettingsModalOpen()

	const stopAnimation = () => {
		animationGeneration += 1
		if (animationFrameId !== null) {
			window.cancelAnimationFrame(animationFrameId)
			animationFrameId = null
		}
		lastTime = null
	}

	const drawFrame = (delta = 0) => {
		onFrame({ delta, isReducedMotion: motionPreference.matches, time })
	}

	const scheduleFrame = () => {
		const generation = animationGeneration
		animationFrameId = window.requestAnimationFrame((nextTime) => {
			if (hasCanceled || generation !== animationGeneration) return
			animationFrameId = null
			if (!canAnimate()) {
				lastTime = null
				return
			}

			const delta =
				lastTime === null ? 0 : Math.max(0, Math.min(48, nextTime - lastTime))
			lastTime = nextTime
			time += delta
			try {
				drawFrame(delta)
				scheduleFrame()
			} catch (error) {
				handleFailure(error)
			}
		})
	}

	const syncAnimation = () => {
		if (hasCanceled || !isMounted) return
		stopAnimation()
		try {
			if (motionPreference.matches) {
				drawFrame()
			} else if (canAnimate()) {
				scheduleFrame()
			}
		} catch (error) {
			handleFailure(error)
		}
	}

	const handleResize = () => {
		if (hasCanceled || !isMounted) return
		try {
			onResize(time)
			drawFrame()
		} catch (error) {
			handleFailure(error)
		}
	}

	const cleanup = () => {
		if (hasCanceled) return
		hasCanceled = true
		window.clearTimeout(timeoutId)
		stopAnimation()
		unsubscribeSettings()
		window.removeEventListener('resize', handleResize)
		document.removeEventListener('visibilitychange', syncAnimation)
		motionPreference.removeEventListener('change', syncAnimation)
		overlay.remove()
	}

	const handleFailure = (error: unknown) => {
		cleanup()
		console.error('Failed to render meteor shower', error)
	}

	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			document.body.appendChild(overlay)
			isMounted = true
			onResize(time)
			if (!motionPreference.matches) drawFrame()
			window.addEventListener('resize', handleResize)
			document.addEventListener('visibilitychange', syncAnimation)
			motionPreference.addEventListener('change', syncAnimation)
			unsubscribeSettings = onSettingsModalStateChange(syncAnimation)
			syncAnimation()
		} catch (error) {
			handleFailure(error)
		}
	}, mountDelayMs)

	return cleanup
}

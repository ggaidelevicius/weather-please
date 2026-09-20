import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createSummerSolsticeArtwork } from './summer-solstice-artwork'

const SOLSTICE_MOUNT_DELAY_MS = 900
const SOLSTICE_MOTE_COUNT = 52
const POLLEN_VARIANTS = [0, 1, 2, 3, 0, 4, 1, 5]

export async function launchSummerSolstice(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountSummerSolstice()
		} catch (error) {
			console.error('Failed to launch summer solstice effect', error)
		}
	}, SOLSTICE_MOUNT_DELAY_MS)

	return () => {
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountSummerSolstice() {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create summer solstice canvas')
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const artwork = createSummerSolsticeArtwork()
	const motes = Array.from({ length: SOLSTICE_MOTE_COUNT }, (_, index) =>
		createMote(index),
	)
	let width = Math.max(1, window.innerWidth)
	let height = Math.max(1, window.innerHeight)
	let elapsed = 0
	let hasRevealed = motionPreference.matches
	let lastTime: number | null = null
	let animationFrameId: number | null = null
	let animationGeneration = 0
	let hasCanceled = false
	let unsubscribeSettings = () => {}

	canvas.dataset.summerSolstice = 'true'
	canvas.setAttribute('aria-hidden', 'true')
	Object.assign(canvas.style, {
		inset: '0',
		mixBlendMode: 'screen',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})

	const drawScene = () => {
		context.clearRect(0, 0, width, height)
		const reveal = hasRevealed ? 1 : easeOut(elapsed / 3.2)
		const breeze =
			Math.sin(elapsed * 0.16) * 0.65 + Math.sin(elapsed * 0.07) * 0.35
		const sunX = width * (0.16 + breeze * 0.014)
		const sunY = height * (0.12 + Math.sin(elapsed * 0.09) * 0.012)
		const lightWidth = Math.max(width * 1.65, height * 1.1)
		const lightHeight = height * 1.85

		context.globalAlpha = reveal * (0.28 + Math.sin(elapsed * 0.12) * 0.016)
		context.drawImage(
			artwork.sunlight,
			sunX - lightWidth / 2,
			sunY - lightHeight / 2,
			lightWidth,
			lightHeight,
		)
		context.globalAlpha = reveal * 0.065
		context.drawImage(
			artwork.sunlight,
			sunX - lightWidth * 0.23,
			sunY - lightHeight * 0.23,
			lightWidth * 0.46,
			lightHeight * 0.46,
		)

		const moteCount = width < 600 ? 30 : motes.length
		for (let index = 0; index < moteCount; index += 1) {
			const mote = motes[index]
			const horizontal = (mote.x + elapsed * mote.speed * 0.45) % 1
			const vertical = (mote.y + elapsed * mote.speed * 0.7) % 1
			const x =
				horizontal * (width + 100) -
				50 +
				Math.sin(elapsed * 0.32 + mote.phase) * mote.sway +
				breeze * 9
			const y =
				vertical * (height + 100) -
				50 +
				Math.cos(elapsed * 0.24 + mote.phase) * mote.sway * 0.4
			const edgeFade = Math.min(
				1,
				horizontal * 12,
				(1 - horizontal) * 12,
				vertical * 12,
				(1 - vertical) * 12,
			)
			const sunlight = Math.max(0, 1 - horizontal * 0.55 - vertical * 0.45)
			const centreDistance = Math.hypot(
				(horizontal - 0.5) * 2,
				(vertical - 0.48) * 2,
			)
			const centreQuiet = 0.62 + Math.min(1, centreDistance) * 0.38
			const glint = Math.max(0, Math.sin(elapsed * 0.65 + mote.phase)) ** 6
			const size = mote.size * (width < 600 ? 0.82 : 1)
			context.globalAlpha =
				reveal *
				edgeFade *
				centreQuiet *
				mote.opacity *
				(0.78 + sunlight * 0.22) *
				(0.82 + glint * 0.18)
			context.drawImage(
				mote.isSoft ? artwork.bokeh : artwork.pollen[mote.variant],
				x - size / 2,
				y - size / 2,
				size,
				size,
			)
		}
		context.globalAlpha = 1
	}
	const resizeScene = () => {
		width = Math.max(1, window.innerWidth)
		height = Math.max(1, window.innerHeight)
		const dpr = getCanvasDpr({ height, maxDpr: 2, width })
		canvas.width = Math.round(width * dpr)
		canvas.height = Math.round(height * dpr)
		canvas.style.width = `${width}px`
		canvas.style.height = `${height}px`
		context.setTransform(dpr, 0, 0, dpr, 0, 0)
		drawScene()
	}
	const canAnimate = () =>
		!motionPreference.matches && !document.hidden && !isSettingsModalOpen()
	const renderFrame = (time: number, generation: number) => {
		if (hasCanceled || generation !== animationGeneration) return
		animationFrameId = null
		if (!canAnimate()) return
		const delta =
			lastTime === null ? 0 : Math.max(0, Math.min(50, time - lastTime))
		lastTime = time
		elapsed += delta / 1000
		drawScene()
		animationFrameId = window.requestAnimationFrame((nextTime) =>
			renderFrame(nextTime, generation),
		)
	}
	const syncAnimation = () => {
		animationGeneration += 1
		if (animationFrameId !== null) {
			window.cancelAnimationFrame(animationFrameId)
			animationFrameId = null
		}
		lastTime = null
		if (motionPreference.matches) {
			hasRevealed = true
			drawScene()
		} else if (canAnimate()) {
			const generation = animationGeneration
			animationFrameId = window.requestAnimationFrame((time) =>
				renderFrame(time, generation),
			)
		}
	}
	const cleanup = () => {
		hasCanceled = true
		if (animationFrameId !== null) {
			window.cancelAnimationFrame(animationFrameId)
			animationFrameId = null
		}
		unsubscribeSettings()
		window.removeEventListener('resize', resizeScene)
		document.removeEventListener('visibilitychange', syncAnimation)
		motionPreference.removeEventListener('change', syncAnimation)
		canvas.remove()
	}

	try {
		document.body.appendChild(canvas)
		resizeScene()
		window.addEventListener('resize', resizeScene)
		document.addEventListener('visibilitychange', syncAnimation)
		motionPreference.addEventListener('change', syncAnimation)
		unsubscribeSettings = onSettingsModalStateChange(syncAnimation)
		syncAnimation()
	} catch (error) {
		cleanup()
		throw error
	}
	return cleanup
}

function createMote(index: number) {
	const isSoft = index % 8 === 0
	const isDistant = index % 3 === 0
	return {
		isSoft,
		variant: POLLEN_VARIANTS[index % POLLEN_VARIANTS.length],
		x: (index * 0.618034 + Math.random() * 0.08) % 1,
		y: (index * 0.414214 + Math.random() * 0.08) % 1,
		phase: randomInRange({ min: 0, max: Math.PI * 2 }),
		size: randomInRange({
			min: isSoft ? 42 : isDistant ? 12 : 20,
			max: isSoft ? 72 : isDistant ? 20 : 34,
		}),
		opacity: isSoft ? 0.22 : isDistant ? 0.34 : 0.52,
		speed: randomInRange({ min: 0.003, max: isSoft ? 0.005 : 0.01 }),
		sway: randomInRange({ min: 5, max: 16 }),
	}
}

function easeOut(progress: number) {
	return 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3
}

import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createTotalSolarEclipseArtwork } from './total-solar-eclipse-artwork'

const ECLIPSE_MOUNT_DELAY_MS = 900

export async function launchTotalSolarEclipse(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountTotalSolarEclipse()
		} catch (error) {
			console.error('Failed to launch total solar eclipse glow', error)
		}
	}, ECLIPSE_MOUNT_DELAY_MS)
	return () => {
		if (hasCanceled) return
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountTotalSolarEclipse() {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create total solar eclipse canvas')
	const artwork = createTotalSolarEclipseArtwork({ dpr: 2 })
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const stars = Array.from({ length: 72 }, (_, index) => ({
		x: Math.random(),
		y: Math.random(),
		size: randomInRange({ min: 2.5, max: index % 17 === 0 ? 9 : 4 }),
		opacity: randomInRange({ min: 0.12, max: 0.43 }),
		phase: Math.random() * Math.PI * 2,
		speed: randomInRange({ min: 0.18, max: 0.42 }),
	}))
	let width = Math.max(1, window.innerWidth)
	let height = Math.max(1, window.innerHeight)
	let elapsed = 0
	let hasRevealed = motionPreference.matches
	let lastTime: number | null = null
	let animationFrameId: number | null = null
	let animationGeneration = 0
	let hasCanceled = false
	let unsubscribeSettings = () => {}

	canvas.dataset.totalSolarEclipse = 'true'
	canvas.setAttribute('aria-hidden', 'true')
	Object.assign(canvas.style, {
		inset: '0',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})

	const drawScene = () => {
		context.clearRect(0, 0, width, height)
		const reveal = hasRevealed ? 1 : easeOut(elapsed / 3.8)
		const isCompact = width < 600
		const radius = isCompact
			? Math.min(width * 0.185, height * 0.1)
			: Math.min(150, width * 0.115, height * 0.18)
		const centerX = width * (isCompact ? 0.5 : 0.81)
		const centerY = height * (isCompact ? 0.165 : 0.25)
		const scale = radius / artwork.radius
		const size = artwork.corona.width * scale
		const left = centerX - size / 2
		const top = centerY - size / 2

		context.globalAlpha = reveal * 0.46
		context.fillStyle = '#040812'
		context.fillRect(0, 0, width, height)
		context.globalAlpha = reveal * 0.27
		context.drawImage(
			artwork.haze.canvas,
			-width * 0.15,
			-height * 0.3,
			width * 1.3,
			height * 1.55,
		)
		context.globalAlpha = reveal * 0.1
		context.drawImage(
			artwork.glow.canvas,
			-width * 0.45,
			height * 0.81,
			width * 1.9,
			height * 0.65,
		)

		const starCount = isCompact ? 38 : stars.length
		for (let index = 0; index < starCount; index += 1) {
			const star = stars[index]
			const x = star.x * width
			const y = star.y * height
			const distance = Math.hypot(x - centerX, y - centerY) / radius
			const exposure = Math.max(0, Math.min(1, (distance - 1.2) / 1.8))
			const twinkle = 0.8 + Math.sin(elapsed * star.speed + star.phase) * 0.2
			const starSize = star.size * (isCompact ? 0.85 : 1)
			context.globalAlpha = reveal * star.opacity * twinkle * exposure
			context.drawImage(
				artwork.star.canvas,
				x - starSize / 2,
				y - starSize / 2,
				starSize,
				starSize,
			)
		}

		const streamerWidth = artwork.filaments.width * scale
		const streamerHeight = artwork.filaments.height * scale
		context.save()
		context.translate(centerX, centerY)
		context.rotate((isCompact ? -1.15 : 0) + Math.sin(elapsed * 0.075) * 0.012)
		context.globalAlpha =
			reveal * (0.88 + Math.sin(elapsed * 0.21 + 0.8) * 0.06)
		context.drawImage(
			artwork.filaments.canvas,
			-streamerWidth / 2,
			-streamerHeight / 2,
			streamerWidth,
			streamerHeight,
		)
		context.restore()
		const breath = 0.94 + Math.sin(elapsed * 0.16) * 0.035
		context.globalAlpha = reveal * breath
		context.drawImage(artwork.corona.canvas, left, top, size, size)
		context.globalAlpha = reveal
		context.drawImage(artwork.moon.canvas, left, top, size, size)
		context.globalAlpha = 1
	}
	const resizeScene = () => {
		if (hasCanceled) return
		width = Math.max(1, window.innerWidth)
		height = Math.max(1, window.innerHeight)
		const dpr = getCanvasDpr({ height, width, maxDpr: 2, maxPixels: 4_000_000 })
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
		try {
			drawScene()
			animationFrameId = window.requestAnimationFrame((nextTime) =>
				renderFrame(nextTime, generation),
			)
		} catch (error) {
			handleFailure(error)
		}
	}
	const syncAnimation = () => {
		if (hasCanceled) return
		animationGeneration += 1
		if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
		animationFrameId = null
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
	const handleResize = () => {
		try {
			resizeScene()
		} catch (error) {
			handleFailure(error)
		}
	}
	const handleAnimationChange = () => {
		try {
			syncAnimation()
		} catch (error) {
			handleFailure(error)
		}
	}
	const cleanup = () => {
		if (hasCanceled) return
		hasCanceled = true
		if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
		animationFrameId = null
		unsubscribeSettings()
		window.removeEventListener('resize', handleResize)
		document.removeEventListener('visibilitychange', handleAnimationChange)
		motionPreference.removeEventListener('change', handleAnimationChange)
		canvas.remove()
		for (const surface of [
			canvas,
			artwork.corona.canvas,
			artwork.filaments.canvas,
			artwork.moon.canvas,
			artwork.glow.canvas,
			artwork.haze.canvas,
			artwork.star.canvas,
		]) {
			surface.width = 0
			surface.height = 0
		}
	}
	const handleFailure = (error: unknown) => {
		cleanup()
		console.error('Failed to render total solar eclipse glow', error)
	}
	try {
		document.body.appendChild(canvas)
		resizeScene()
		window.addEventListener('resize', handleResize)
		document.addEventListener('visibilitychange', handleAnimationChange)
		motionPreference.addEventListener('change', handleAnimationChange)
		unsubscribeSettings = onSettingsModalStateChange(handleAnimationChange)
		syncAnimation()
	} catch (error) {
		cleanup()
		throw error
	}
	return cleanup
}

function easeOut(progress: number) {
	return 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3
}

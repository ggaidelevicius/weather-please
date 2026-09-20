import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createTotalLunarEclipseArtwork } from './total-lunar-eclipse-artwork'

const ECLIPSE_MOUNT_DELAY_MS = 900

export async function launchTotalLunarEclipse(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountTotalLunarEclipse()
		} catch (error) {
			console.error('Failed to launch total lunar eclipse glow', error)
		}
	}, ECLIPSE_MOUNT_DELAY_MS)
	return () => {
		if (hasCanceled) return
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountTotalLunarEclipse() {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create total lunar eclipse canvas')
	const artwork = createTotalLunarEclipseArtwork({ dpr: 2 })
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const stars = Array.from({ length: 230 }, (_, index) => {
		const isBright = index % 17 === 0
		return {
			x: Math.random(),
			y: Math.random(),
			isBright,
			size: isBright
				? randomInRange({ min: 11, max: 17 })
				: randomInRange({ min: 3.2, max: 7.5 }),
			opacity: isBright
				? randomInRange({ min: 0.68, max: 0.94 })
				: randomInRange({ min: 0.3, max: 0.76 }),
			phase: Math.random() * Math.PI * 2,
			speed: randomInRange({ min: 0.17, max: 0.38 }),
		}
	})
	let width = Math.max(1, window.innerWidth)
	let height = Math.max(1, window.innerHeight)
	let elapsed = 0
	let hasRevealed = motionPreference.matches
	let lastTime: number | null = null
	let animationFrameId: number | null = null
	let animationGeneration = 0
	let hasCanceled = false
	let unsubscribeSettings = () => {}

	canvas.dataset.totalLunarEclipse = 'true'
	canvas.setAttribute('aria-hidden', 'true')
	Object.assign(canvas.style, {
		inset: '0',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})

	const drawScene = () => {
		context.clearRect(0, 0, width, height)
		const reveal = hasRevealed ? 1 : easeOut(elapsed / 3.6)
		const isCompact = width < 600
		const radius = isCompact
			? Math.min(width * 0.189, height * 0.094)
			: Math.min(138, width * 0.106, height * 0.17)
		const centerX = width * (isCompact ? 0.5 : 0.18)
		const centerY = height * (isCompact ? 0.17 : 0.25)
		const scale = radius / artwork.radius
		const size = artwork.moon.width * scale
		const left = centerX - size / 2
		const top = centerY - size / 2
		const drift = Math.sin(elapsed * 0.045) * width * 0.035

		context.globalAlpha = reveal * 0.28
		context.fillStyle = '#080913'
		context.fillRect(0, 0, width, height)
		context.globalAlpha = reveal * 0.35
		context.drawImage(
			artwork.haze.canvas,
			-width * 0.38 + drift,
			height * 0.03,
			width * 1.45,
			height * 1.4,
		)
		context.globalAlpha = reveal * 0.22
		context.drawImage(
			artwork.haze.canvas,
			width * 0.35 - drift,
			-height * 0.42,
			width * 1.2,
			height * 1.4,
		)

		const skyWidth = width * (isCompact ? 2.1 : 1.3)
		const skyHeight = height * (isCompact ? 1.08 : 1.32)
		context.globalAlpha = reveal * 0.28
		context.drawImage(
			artwork.nebula.canvas,
			width * (isCompact ? -0.6 : -0.08) + drift,
			height * (isCompact ? 0.08 : -0.07),
			skyWidth,
			skyHeight,
		)

		const starCount = isCompact ? 125 : stars.length
		for (let index = 0; index < starCount; index += 1) {
			const star = stars[index]
			const x = star.x * width
			const y = star.y * height
			const distance = Math.hypot(x - centerX, y - centerY) / radius
			const exposure = Math.max(0, Math.min(1, (distance - 1.03) / 0.65))
			const isCentral =
				star.x > 0.3 && star.x < 0.7 && star.y > 0.3 && star.y < 0.7
			const twinkle = 0.85 + Math.sin(elapsed * star.speed + star.phase) * 0.15
			const starSize = star.size * (isCompact ? 0.9 : 1)
			context.globalAlpha =
				reveal * star.opacity * twinkle * exposure * (isCentral ? 0.82 : 1)
			context.drawImage(
				star.isBright ? artwork.glint.canvas : artwork.star.canvas,
				x - starSize / 2,
				y - starSize / 2,
				starSize,
				starSize,
			)
		}

		const haloSize = radius * 5.5
		context.globalAlpha = reveal * (0.16 + Math.sin(elapsed * 0.08) * 0.012)
		context.drawImage(
			artwork.glow.canvas,
			centerX - haloSize / 2,
			centerY - haloSize / 2,
			haloSize,
			haloSize,
		)
		context.globalAlpha = reveal * 0.78
		context.drawImage(artwork.moon.canvas, left, top, size, size)
		context.globalAlpha =
			reveal * (0.2 + Math.sin(elapsed * 0.065 + 0.6) * 0.055)
		context.drawImage(artwork.shade.canvas, left, top, size, size)
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
			artwork.shade.canvas,
			artwork.moon.canvas,
			artwork.glow.canvas,
			artwork.haze.canvas,
			artwork.star.canvas,
			artwork.glint.canvas,
			artwork.nebula.canvas,
		]) {
			surface.width = 0
			surface.height = 0
		}
	}
	const handleFailure = (error: unknown) => {
		cleanup()
		console.error('Failed to render total lunar eclipse glow', error)
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

import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createHanukkahArtwork } from './hanukkah-artwork'

type Light = {
	phase: number
	size: number
	x: number
	y: number
}

export async function launchHanukkahGlow(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) {
		throw new Error('Unable to create 2D context for Hanukkah canvas')
	}

	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const flame = createFlameSprite()
	const glow = createGlowSprite()
	const stars = Array.from({ length: 90 }, createLight)
	const embers = Array.from({ length: 32 }, createLight)
	let artwork: ReturnType<typeof createHanukkahArtwork> | null = null
	let artworkDpr = 0
	let width = window.innerWidth
	let height = window.innerHeight
	let elapsed = 0
	let lastTime = performance.now()
	let shouldAnimate = !motionPreference.matches
	let hasCanceled = false
	let animationFrameId: null | number = null
	let animationGeneration = 0

	canvas.setAttribute('aria-hidden', 'true')
	canvas.setAttribute('data-hanukkah', 'true')
	Object.assign(canvas.style, {
		background:
			'radial-gradient(ellipse at 50% 100%, #c48a3030, transparent 48%), radial-gradient(ellipse at 12% 24%, #3254a42b, transparent 60%), radial-gradient(ellipse at 90% 50%, #28467f20, transparent 58%)',
		inset: '0',
		mixBlendMode: 'screen',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})
	document.body.appendChild(canvas)
	const animationController = createSettingsModalAnimationController()

	const drawScene = () => {
		if (!artwork) return
		context.clearRect(0, 0, width, height)
		const reveal = shouldAnimate ? Math.min(1, elapsed / 1.8) : 1
		const opacity = 1 - (1 - reveal) ** 3
		const scale = Math.min(width / 780, height / 920, 1)
		const sceneWidth = artwork.width * scale
		const sceneHeight = artwork.height * scale
		const sceneX = (width - sceneWidth) / 2
		const sceneY = height - artwork.baseY * scale + 1

		context.fillStyle = '#c5d8f5'
		for (const star of stars) {
			const shimmer = 0.68 + Math.sin(elapsed * 0.55 + star.phase) * 0.2
			context.globalAlpha = opacity * shimmer * 0.4
			context.fillRect(star.x * width, star.y * height, star.size, star.size)
		}

		// A broad pool of reflected candlelight anchors the menorah in the scene.
		context.globalAlpha = opacity * 0.19
		context.drawImage(
			glow,
			width / 2 - sceneWidth * 0.62,
			sceneY + sceneHeight * 0.64,
			sceneWidth * 1.24,
			sceneHeight * 0.57,
		)
		context.globalAlpha = opacity
		context.drawImage(artwork.canvas, sceneX, sceneY, sceneWidth, sceneHeight)

		for (const [index, ember] of embers.entries()) {
			const candle = artwork.candles[index % artwork.candles.length]
			const progress = (ember.y + elapsed * (0.022 + ember.size * 0.005)) % 1
			const rise = progress * Math.min(height * 0.52, 380)
			const drift =
				Math.sin(elapsed * 0.32 + ember.phase) * 14 +
				(ember.x - 0.5) * progress * 110
			const x = sceneX + candle.x * scale + drift
			const y = sceneY + candle.y * scale - rise
			context.globalAlpha = Math.sin(progress * Math.PI) * opacity * 0.32
			context.fillStyle = index % 3 === 0 ? '#c6d7f2' : '#edc783'
			context.beginPath()
			context.arc(x, y, ember.size * 0.6, 0, Math.PI * 2)
			context.fill()
			if (ember.size > 1.1) {
				context.globalAlpha *= 0.28
				context.drawImage(glow, x - 5, y - 5, 10, 10)
			}
		}

		for (const candle of artwork.candles) {
			const x = sceneX + candle.x * scale
			const y = sceneY + candle.y * scale
			const flicker =
				Math.sin(elapsed * 2.3 + candle.phase) * 0.035 +
				Math.sin(elapsed * 3.7 + candle.phase * 2) * 0.02
			const lean = Math.sin(elapsed * 1.6 + candle.phase) * 0.7 * scale
			const flameHeight = 31 * scale * (1 + flicker)
			const flameWidth = 17 * scale * (1 - flicker * 0.6)
			const haloSize = 100 * scale
			context.globalAlpha = opacity * (0.26 + flicker)
			context.drawImage(
				glow,
				x - haloSize / 2,
				y - haloSize * 0.66,
				haloSize,
				haloSize,
			)
			context.globalAlpha = opacity * 0.94
			context.drawImage(
				flame,
				x - flameWidth / 2 + lean,
				y - flameHeight,
				flameWidth,
				flameHeight,
			)
		}
		context.globalAlpha = 1
	}

	const resizeCanvas = () => {
		width = Math.max(1, window.innerWidth)
		height = Math.max(1, window.innerHeight)
		const dpr = getCanvasDpr({ height, maxDpr: 2, width })
		canvas.width = Math.round(width * dpr)
		canvas.height = Math.round(height * dpr)
		canvas.style.width = `${width}px`
		canvas.style.height = `${height}px`
		context.setTransform(dpr, 0, 0, dpr, 0, 0)
		if (!artwork || artworkDpr !== dpr) {
			artwork = createHanukkahArtwork({ dpr })
			artworkDpr = dpr
		}
		drawScene()
	}

	const renderFrame = (time: number, generation: number) => {
		// Resumed settings callbacks can outlive their original queued frame ID.
		if (hasCanceled || generation !== animationGeneration) return
		animationFrameId = null
		if (!shouldAnimate || document.hidden) return
		if (!animationController.isPaused()) {
			elapsed += Math.min((time - lastTime) / 1000, 0.05)
			lastTime = time
			drawScene()
		}
		animationFrameId = animationController.requestAnimationFrame((nextTime) =>
			renderFrame(nextTime, generation),
		)
	}

	const syncAnimation = () => {
		animationGeneration += 1
		if (animationFrameId !== null) {
			animationController.cancelAnimationFrame(animationFrameId)
			animationFrameId = null
		}
		shouldAnimate = !motionPreference.matches
		lastTime = performance.now()
		if (!shouldAnimate) {
			drawScene()
		} else if (!document.hidden) {
			const generation = animationGeneration
			animationFrameId = animationController.requestAnimationFrame((time) =>
				renderFrame(time, generation),
			)
		}
	}

	const cleanup = () => {
		hasCanceled = true
		if (animationFrameId !== null) {
			animationController.cancelAnimationFrame(animationFrameId)
		}
		animationController.dispose()
		window.removeEventListener('resize', resizeCanvas)
		document.removeEventListener('visibilitychange', syncAnimation)
		motionPreference.removeEventListener('change', syncAnimation)
		canvas.remove()
	}

	try {
		resizeCanvas()
		window.addEventListener('resize', resizeCanvas)
		document.addEventListener('visibilitychange', syncAnimation)
		motionPreference.addEventListener('change', syncAnimation)
		syncAnimation()
	} catch (error) {
		cleanup()
		throw error
	}
	return cleanup
}

function createLight(): Light {
	return {
		phase: Math.random() * Math.PI * 2,
		size: randomInRange({ min: 0.5, max: 1.4 }),
		x: Math.random(),
		y: Math.random(),
	}
}

function createFlameSprite(): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = 48
	canvas.height = 88
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Hanukkah candle flame')
	const flame = context.createLinearGradient(0, 0, 0, 88)
	flame.addColorStop(0, '#ffe9a6')
	flame.addColorStop(0.45, '#ffcb5f')
	flame.addColorStop(0.8, '#f5a72f')
	flame.addColorStop(1, '#8fa5e0')
	context.fillStyle = flame
	context.beginPath()
	context.moveTo(25, 2)
	context.bezierCurveTo(26, 28, 44, 46, 42, 64)
	context.bezierCurveTo(40, 91, 7, 92, 6, 67)
	context.bezierCurveTo(3, 46, 22, 31, 25, 2)
	context.fill()
	context.fillStyle = '#fff5cf'
	context.beginPath()
	context.moveTo(23, 33)
	context.bezierCurveTo(21, 51, 35, 63, 32, 75)
	context.bezierCurveTo(30, 86, 15, 85, 15, 75)
	context.bezierCurveTo(14, 60, 21, 49, 23, 33)
	context.fill()
	return canvas
}

function createGlowSprite(): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = 128
	canvas.height = 128
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Hanukkah candle glow')
	const glow = context.createRadialGradient(64, 64, 0, 64, 64, 64)
	glow.addColorStop(0, '#ffd994')
	glow.addColorStop(0.18, '#f4b85f9c')
	glow.addColorStop(0.48, '#d78d342b')
	glow.addColorStop(1, '#d78d3400')
	context.fillStyle = glow
	context.fillRect(0, 0, 128, 128)
	return canvas
}

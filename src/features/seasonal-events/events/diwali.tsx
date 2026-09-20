import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createDiwaliArtwork } from './diwali-artwork'

const DIWALI_MOUNT_DELAY_MS = 900

type DiwaliArtwork = ReturnType<typeof createDiwaliArtwork>

export async function launchDiwaliLights(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountDiwali()
		} catch (error) {
			console.error('Failed to launch Diwali lights', error)
		}
	}, DIWALI_MOUNT_DELAY_MS)

	return () => {
		if (hasCanceled) return
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountDiwali() {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Diwali canvas')
	const atmosphere = document.createElement('canvas')
	const atmosphereContext = atmosphere.getContext('2d')
	if (!atmosphereContext) throw new Error('Unable to create Diwali atmosphere')
	const artwork = createDiwaliArtwork({ dpr: 2 })
	const groundRangoli = createGroundRangoli(artwork.rangoli)
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const embers = Array.from({ length: 42 }, (_, index) => ({
		x:
			index % 5 === 0
				? Math.random()
				: index % 2
					? randomInRange({ min: 0.02, max: 0.27 })
					: randomInRange({ min: 0.73, max: 0.98 }),
		progress: Math.random(),
		phase: Math.random() * Math.PI * 2,
		speed: randomInRange({ min: 0.006, max: 0.018 }),
		size: randomInRange({ min: 4, max: 13 }),
		opacity: randomInRange({ min: 0.2, max: 0.55 }),
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

	canvas.dataset.diwali = 'true'
	canvas.setAttribute('aria-hidden', 'true')
	Object.assign(canvas.style, {
		inset: '0',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})

	const drawScene = () => {
		context.clearRect(0, 0, width, height)
		const reveal = hasRevealed ? 1 : easeOut(elapsed / 3)
		const isCompact = width < 600
		const sceneScale = Math.min(1, height / 650)
		context.globalAlpha = reveal
		context.drawImage(atmosphere, 0, 0, width, height)

		const rangoliScale =
			(Math.min(width * 0.88, 800) * sceneScale) / groundRangoli.planeWidth
		const rangoliWidth = groundRangoli.canvas.width * rangoliScale
		const rangoliHeight = groundRangoli.canvas.height * rangoliScale
		context.globalAlpha = reveal * (isCompact ? 0.54 : 0.46)
		context.drawImage(
			groundRangoli.canvas,
			(width - rangoliWidth) / 2,
			height - 8 * sceneScale - groundRangoli.anchorY * rangoliScale,
			rangoliWidth,
			rangoliHeight,
		)

		const sag = Math.min(height * 0.17, isCompact ? 115 : 150)
		context.globalAlpha = reveal * 0.24
		context.strokeStyle = '#b78148'
		context.lineWidth = 0.8
		context.beginPath()
		context.moveTo(-30, -12)
		context.quadraticCurveTo(width / 2, sag, width + 30, -12)
		context.stroke()
		const lightCount = isCompact ? 15 : Math.min(37, Math.round(width / 38))
		for (let index = 0; index < lightCount; index += 1) {
			const progress = (index + 0.5) / lightCount
			const x = -30 + (width + 60) * progress
			const y = -12 + 2 * (sag + 12) * progress * (1 - progress)
			const pulse = 0.78 + Math.sin(elapsed * 0.65 + index * 2.3) * 0.16
			const size = isCompact ? 38 : 54
			context.globalAlpha = reveal * pulse * 0.44
			context.drawImage(
				artwork.glow.canvas,
				x - size / 2,
				y - size / 2,
				size,
				size,
			)
			context.globalAlpha = reveal * pulse
			context.fillStyle = index % 4 === 0 ? '#f1a0a0' : '#ffe7a0'
			context.beginPath()
			context.ellipse(x, y, 1.65, 2.8, 0, 0, Math.PI * 2)
			context.fill()
		}

		const emberCount = isCompact ? 25 : embers.length
		for (let index = 0; index < emberCount; index += 1) {
			const ember = embers[index]
			const progress = wrap(ember.progress + elapsed * ember.speed)
			const x = ember.x * width + Math.sin(elapsed * 0.28 + ember.phase) * 16
			const y = (1 - progress) * (height + 30)
			const isCentral = ember.x > 0.28 && ember.x < 0.72
			const fade = Math.min(1, progress * 10, (1 - progress) * 5)
			const flicker = 0.72 + Math.sin(elapsed * 1.1 + ember.phase) * 0.28
			const size = ember.size * (isCompact ? 0.8 : 1)
			context.globalAlpha =
				reveal * ember.opacity * fade * flicker * (isCentral ? 0.35 : 1)
			context.drawImage(
				artwork.ember.canvas,
				x - size / 2,
				y - size / 2,
				size,
				size,
			)
		}

		const lamps = isCompact
			? [
					{ x: width * 0.12, size: 78, variant: 0 },
					{ x: width * 0.5, size: 105, variant: 1 },
					{ x: width * 0.88, size: 78, variant: 2 },
				]
			: [
					{ x: width * 0.035, size: 91, variant: 0 },
					{ x: width * 0.15, size: 152, variant: 1 },
					{ x: width * 0.3, size: 86, variant: 2 },
					{ x: width * 0.5, size: 112, variant: 0 },
					{ x: width * 0.7, size: 86, variant: 1 },
					{ x: width * 0.85, size: 148, variant: 2 },
					{ x: width * 0.965, size: 91, variant: 0 },
				]
		for (const [index, lamp] of lamps.entries()) {
			drawDiya({
				context,
				artwork,
				...lamp,
				y: height + 3,
				size: lamp.size * sceneScale,
				hasFlipped: lamp.x > width / 2,
				time: elapsed,
				phase: index * 2.37,
				opacity: reveal,
			})
		}
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
		paintAtmosphere({
			canvas: atmosphere,
			context: atmosphereContext,
			width,
			height,
		})
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
			atmosphere,
			groundRangoli.canvas,
			...artwork.diyas.map((sprite) => sprite.canvas),
			artwork.flame.canvas,
			artwork.rangoli.canvas,
			artwork.glow.canvas,
			artwork.ember.canvas,
		]) {
			surface.width = 0
			surface.height = 0
		}
	}
	const handleFailure = (error: unknown) => {
		cleanup()
		console.error('Failed to render Diwali lights', error)
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

function drawDiya({
	context,
	artwork,
	x,
	y,
	size,
	variant,
	hasFlipped,
	time,
	phase,
	opacity,
}: {
	context: CanvasRenderingContext2D
	artwork: DiwaliArtwork
	x: number
	y: number
	size: number
	variant: number
	hasFlipped: boolean
	time: number
	phase: number
	opacity: number
}) {
	const sprite = artwork.diyas[variant % artwork.diyas.length]
	const scale = size / sprite.width
	const flicker =
		0.94 +
		Math.sin(time * 4.7 + phase) * 0.035 +
		Math.sin(time * 7.1 + phase * 2) * 0.025
	const lightX = sprite.flameX - sprite.width / 2
	const lightY = sprite.flameY - sprite.baseY
	context.save()
	context.translate(x, y)
	context.scale(scale * (hasFlipped ? -1 : 1), scale)
	context.globalAlpha = opacity * flicker * 0.58
	context.drawImage(artwork.glow.canvas, lightX - 240, lightY - 240, 480, 480)
	context.globalAlpha = opacity * 0.24
	context.drawImage(artwork.glow.canvas, -180, -22, 360, 55)
	context.globalAlpha = opacity
	context.drawImage(
		sprite.canvas,
		-sprite.width / 2,
		-sprite.baseY,
		sprite.width,
		sprite.height,
	)
	context.translate(lightX, lightY)
	context.rotate(Math.sin(time * 1.8 + phase) * 0.035)
	context.scale(0.94 + Math.sin(time * 3.4 + phase) * 0.045, flicker)
	const flameWidth = artwork.flame.width * 0.55
	const flameHeight = artwork.flame.height * 0.55
	context.drawImage(
		artwork.flame.canvas,
		-flameWidth / 2,
		-flameHeight,
		flameWidth,
		flameHeight,
	)
	context.restore()
}

function createGroundRangoli(sprite: DiwaliArtwork['rangoli']) {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Diwali ground artwork')
	const planeWidth = 1200
	const halfDepth = planeWidth * 0.12
	const perspective = 0.38
	const farDepth = halfDepth / (1 + perspective)
	const nearDepth = halfDepth / (1 - perspective)
	const anchorY = Math.ceil(farDepth) + 2
	canvas.width = Math.ceil(planeWidth / (1 - perspective)) + 4
	canvas.height = Math.ceil(farDepth + nearDepth) + 4
	// Project a ground plane once; the far half narrows and compresses naturally.
	for (let row = 0; row < canvas.height; row += 1) {
		const top = row - anchorY
		const bottom = top + 1
		const far = Math.max(-1, top / (halfDepth + perspective * top))
		const near = Math.min(1, bottom / (halfDepth + perspective * bottom))
		if (far >= near) continue
		const depth = (far + near) / 2
		const rowWidth = planeWidth / (1 - perspective * depth)
		context.globalAlpha = 0.72 + (depth + 1) * 0.14
		context.drawImage(
			sprite.canvas,
			0,
			((far + 1) / 2) * sprite.canvas.height,
			sprite.canvas.width,
			((near - far) / 2) * sprite.canvas.height,
			(canvas.width - rowWidth) / 2,
			row,
			rowWidth,
			1,
		)
	}
	return { canvas, planeWidth, anchorY }
}

function paintAtmosphere({
	canvas,
	context,
	width,
	height,
}: {
	canvas: HTMLCanvasElement
	context: CanvasRenderingContext2D
	width: number
	height: number
}) {
	const scale = Math.min(1, 900 / Math.max(width, height))
	canvas.width = Math.max(1, Math.round(width * scale))
	canvas.height = Math.max(1, Math.round(height * scale))
	context.setTransform(scale, 0, 0, scale, 0, 0)
	for (const { x, y, radius, color } of [
		{
			x: width * 0.12,
			y: height * 1.03,
			radius: Math.max(width * 0.6, height * 0.65),
			color: '186, 72, 17',
		},
		{
			x: width * 0.89,
			y: height * 0.87,
			radius: Math.max(width * 0.47, height * 0.5),
			color: '140, 35, 89',
		},
		{
			x: width * 0.72,
			y: -height * 0.12,
			radius: Math.max(width * 0.5, height * 0.4),
			color: '101, 44, 116',
		},
	]) {
		const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
		gradient.addColorStop(0, `rgba(${color}, 0.27)`)
		gradient.addColorStop(0.45, `rgba(${color}, 0.11)`)
		gradient.addColorStop(1, `rgba(${color}, 0)`)
		context.fillStyle = gradient
		context.fillRect(0, 0, width, height)
	}
}

function easeOut(progress: number) {
	return 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3
}

function wrap(value: number) {
	return ((value % 1) + 1) % 1
}

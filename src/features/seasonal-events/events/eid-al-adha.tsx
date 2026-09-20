import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createEidAlAdhaArtwork } from './eid-al-adha-artwork'

const EID_MOUNT_DELAY_MS = 900

type EidArtwork = ReturnType<typeof createEidAlAdhaArtwork>

export async function launchEidAlAdhaGlow(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountEidAlAdha()
		} catch (error) {
			console.error('Failed to launch Eid al-Adha glow', error)
		}
	}, EID_MOUNT_DELAY_MS)
	return () => {
		if (hasCanceled) return
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountEidAlAdha() {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Eid al-Adha canvas')
	const artwork = createEidAlAdhaArtwork({ dpr: 2 })
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const stars = Array.from({ length: 110 }, (_, index) => ({
		x: Math.random(),
		y: Math.random(),
		size: randomInRange({ min: 2.5, max: index % 11 === 0 ? 11 : 5.5 }),
		opacity: randomInRange({ min: 0.13, max: 0.56 }),
		phase: Math.random() * Math.PI * 2,
		speed: randomInRange({ min: 0.35, max: 0.75 }),
	}))
	const motes = Array.from({ length: 24 }, (_, index) => ({
		x:
			index % 2
				? randomInRange({ min: 0.04, max: 0.27 })
				: randomInRange({ min: 0.76, max: 0.96 }),
		progress: Math.random(),
		phase: Math.random() * Math.PI * 2,
		size: randomInRange({ min: 7, max: 20 }),
		speed: randomInRange({ min: 0.003, max: 0.007 }),
		opacity: randomInRange({ min: 0.17, max: 0.4 }),
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

	canvas.dataset.eidAlAdha = 'true'
	canvas.setAttribute('aria-hidden', 'true')
	Object.assign(canvas.style, {
		inset: '0',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})

	const drawScene = () => {
		context.clearRect(0, 0, width, height)
		const reveal = hasRevealed ? 1 : easeOut(elapsed / 3.2)
		const isCompact = width < 600
		const sceneScale = Math.min(1, height / 700)
		const drift = Math.sin(elapsed * 0.065) * width * 0.025
		context.globalAlpha = reveal * 0.42
		context.drawImage(
			artwork.haze.canvas,
			-width * 0.6 + drift,
			height * 0.15,
			width * 1.6,
			height * 1.25,
		)
		context.globalAlpha = reveal * 0.24
		context.drawImage(
			artwork.haze.canvas,
			width * 0.22 - drift,
			-height * 0.45,
			width * 1.2,
			height * 1.4,
		)

		const starCount = isCompact ? 64 : stars.length
		for (let index = 0; index < starCount; index += 1) {
			const star = stars[index]
			const isCentral =
				star.x > 0.3 && star.x < 0.7 && star.y > 0.3 && star.y < 0.7
			const twinkle = 0.72 + Math.sin(elapsed * star.speed + star.phase) * 0.28
			const size = star.size * (isCompact ? 0.82 : 1)
			context.globalAlpha =
				reveal * star.opacity * twinkle * (isCentral ? 0.3 : 1)
			context.drawImage(
				artwork.star.canvas,
				star.x * width - size / 2,
				star.y * height - size / 2,
				size,
				size,
			)
		}

		const moonSize =
			(isCompact
				? Math.min(180, width * 0.47)
				: Math.min(330, width * 0.27, height * 0.43)) * sceneScale
		const moonX = width * (isCompact ? 0.75 : 0.81)
		const moonY = height * (isCompact ? 0.16 : 0.23)
		context.globalAlpha = reveal * 0.12
		context.drawImage(
			artwork.glow.canvas,
			moonX - moonSize,
			moonY - moonSize,
			moonSize * 2,
			moonSize * 2,
		)
		context.globalAlpha = reveal * 0.92
		context.drawImage(
			artwork.crescent.canvas,
			moonX - moonSize / 2,
			moonY - moonSize / 2,
			moonSize,
			moonSize,
		)

		const moteCount = isCompact ? 14 : motes.length
		for (let index = 0; index < moteCount; index += 1) {
			const mote = motes[index]
			const progress = wrap(mote.progress + elapsed * mote.speed)
			const x = mote.x * width + Math.sin(elapsed * 0.22 + mote.phase) * 12
			const y = height - progress * height * 0.78
			const edge = Math.min(1, progress * 9, (1 - progress) * 6)
			const pulse = 0.82 + Math.sin(elapsed * 0.65 + mote.phase) * 0.18
			const size = mote.size * (isCompact ? 0.85 : 1)
			context.globalAlpha = reveal * mote.opacity * edge * pulse
			context.drawImage(
				artwork.glow.canvas,
				x - size / 2,
				y - size / 2,
				size,
				size,
			)
		}

		const lanterns = isCompact
			? [
					{ x: width * 0.14, scale: 0.58, variant: 0 },
					{ x: width * 0.88, scale: 0.42, variant: 1 },
				]
			: [
					{ x: width * 0.185, scale: 0.57, variant: 1 },
					{ x: width * 0.078, scale: 0.84, variant: 0 },
					{ x: width * 0.92, scale: 0.65, variant: 2 },
				]
		for (const [index, lantern] of lanterns.entries()) {
			drawStandingLantern({
				context,
				artwork,
				...lantern,
				baseline: height + 3,
				scale: lantern.scale * sceneScale,
				time: elapsed,
				phase: index * 2.1,
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
			...artwork.lanterns.map((sprite) => sprite.canvas),
			artwork.crescent.canvas,
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
		console.error('Failed to render Eid al-Adha glow', error)
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

function drawStandingLantern({
	context,
	artwork,
	x,
	baseline,
	scale,
	variant,
	time,
	phase,
	opacity,
}: {
	context: CanvasRenderingContext2D
	artwork: EidArtwork
	x: number
	baseline: number
	scale: number
	variant: number
	time: number
	phase: number
	opacity: number
}) {
	const sprite = artwork.lanterns[variant % artwork.lanterns.length]
	const left = x - (sprite.width * scale) / 2
	const top = baseline - sprite.baseY * scale
	const lightX = left + sprite.lightX * scale
	const lightY = top + sprite.lightY * scale
	const light =
		0.91 +
		Math.sin(time * 0.9 + phase) * 0.06 +
		Math.sin(time * 2.7 + phase) * 0.03
	const glowSize = 410 * scale
	context.globalAlpha = opacity * light * 0.48
	context.drawImage(
		artwork.glow.canvas,
		lightX - glowSize / 2,
		lightY - glowSize / 2,
		glowSize,
		glowSize,
	)
	context.globalAlpha = opacity * light * 0.32
	context.drawImage(
		artwork.glow.canvas,
		x - glowSize * 0.65,
		baseline - 42 * scale,
		glowSize * 1.3,
		80 * scale,
	)
	context.globalAlpha = opacity
	context.drawImage(
		sprite.canvas,
		left,
		top,
		sprite.width * scale,
		sprite.height * scale,
	)
	context.globalCompositeOperation = 'screen'
	context.globalAlpha = opacity * light * 0.22
	const coreSize = 85 * scale
	context.drawImage(
		artwork.glow.canvas,
		lightX - coreSize / 2,
		lightY - coreSize / 2,
		coreSize,
		coreSize,
	)
	context.globalCompositeOperation = 'source-over'
}

function easeOut(progress: number) {
	return 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3
}

function wrap(value: number) {
	return ((value % 1) + 1) % 1
}

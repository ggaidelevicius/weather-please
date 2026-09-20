import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createEidAlFitrArtwork } from './eid-al-fitr-artwork'

const EID_MOUNT_DELAY_MS = 900

type EidArtwork = ReturnType<typeof createEidAlFitrArtwork>

export async function launchEidAlFitrGlow(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountEidAlFitr()
		} catch (error) {
			console.error('Failed to launch Eid al-Fitr glow', error)
		}
	}, EID_MOUNT_DELAY_MS)
	return () => {
		if (hasCanceled) return
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountEidAlFitr() {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Eid al-Fitr canvas')
	const artwork = createEidAlFitrArtwork({ dpr: 2 })
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const stars = Array.from({ length: 125 }, (_, index) => ({
		x: Math.random(),
		y: Math.random(),
		size: randomInRange({ min: 2.5, max: index % 11 === 0 ? 11 : 5.5 }),
		opacity: randomInRange({ min: 0.13, max: 0.56 }),
		phase: Math.random() * Math.PI * 2,
		speed: randomInRange({ min: 0.35, max: 0.75 }),
	}))
	const motes = Array.from({ length: 22 }, (_, index) => ({
		x:
			index % 2
				? randomInRange({ min: 0.04, max: 0.27 })
				: randomInRange({ min: 0.76, max: 0.96 }),
		progress: Math.random(),
		phase: Math.random() * Math.PI * 2,
		size: randomInRange({ min: 9, max: 24 }),
		speed: randomInRange({ min: 0.004, max: 0.01 }),
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

	canvas.dataset.eidAlFitr = 'true'
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
		const sceneScale = Math.min(1, height / 650)
		const drift = Math.sin(elapsed * 0.075) * width * 0.025
		context.globalAlpha = reveal * 0.35
		context.drawImage(
			artwork.haze.canvas,
			-width * 0.45 + drift,
			height * 0.1,
			width * 1.8,
			height * 1.4,
		)
		context.globalAlpha = reveal * 0.25
		context.drawImage(
			artwork.haze.canvas,
			width * 0.2 - drift,
			-height * 0.7,
			width * 1.1,
			height * 1.35,
		)

		const rosetteSize = (isCompact ? 250 : 410) * sceneScale
		context.globalAlpha = reveal * 0.2
		context.drawImage(
			artwork.rosette.canvas,
			-rosetteSize * 0.52,
			height - rosetteSize * 0.48,
			rosetteSize,
			rosetteSize,
		)
		context.globalAlpha = reveal * 0.13
		context.drawImage(
			artwork.rosette.canvas,
			width - rosetteSize * 0.42,
			height - rosetteSize * 0.46,
			rosetteSize,
			rosetteSize,
		)

		const starCount = isCompact ? 72 : stars.length
		for (let index = 0; index < starCount; index += 1) {
			const star = stars[index]
			const isCentral =
				star.x > 0.3 && star.x < 0.7 && star.y > 0.3 && star.y < 0.7
			const twinkle = 0.68 + Math.sin(elapsed * star.speed + star.phase) * 0.32
			const size = star.size * (isCompact ? 0.82 : 1)
			context.globalAlpha =
				reveal * star.opacity * twinkle * (isCentral ? 0.35 : 1)
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
				? Math.min(148, width * 0.4)
				: Math.min(310, width * 0.24, height * 0.39)) * sceneScale
		const moonX = width * (isCompact ? 0.23 : 0.17)
		const moonY = height * (isCompact ? 0.17 : 0.22)
		context.globalAlpha = reveal * 0.13
		context.drawImage(
			artwork.glow.canvas,
			moonX - moonSize,
			moonY - moonSize,
			moonSize * 2,
			moonSize * 2,
		)
		context.globalAlpha = reveal * 0.87
		context.drawImage(
			artwork.crescent.canvas,
			moonX - moonSize / 2,
			moonY - moonSize / 2,
			moonSize,
			moonSize,
		)

		const moteCount = isCompact ? 13 : motes.length
		for (let index = 0; index < moteCount; index += 1) {
			const mote = motes[index]
			const progress = wrap(mote.progress + elapsed * mote.speed)
			const x = mote.x * width + Math.sin(elapsed * 0.3 + mote.phase) * 14
			const y = (1 - progress) * (height + 50) - 25
			const edge = Math.min(1, progress * 8, (1 - progress) * 8)
			const pulse = 0.78 + Math.sin(elapsed * 0.8 + mote.phase) * 0.22
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
					{ x: width * 0.77, scale: 0.39, cord: 58, variant: 0 },
					{ x: width * 0.945, scale: 0.27, cord: 12, variant: 1 },
				]
			: [
					{ x: width * 0.755, scale: 0.42, cord: 35, variant: 1 },
					{ x: width * 0.865, scale: 0.65, cord: 84, variant: 0 },
					{ x: width * 0.96, scale: 0.39, cord: 16, variant: 2 },
				]
		for (const [index, lantern] of lanterns.entries()) {
			drawHangingLantern({
				context,
				artwork,
				...lantern,
				scale: lantern.scale * sceneScale,
				cord: lantern.cord * sceneScale,
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
			artwork.rosette.canvas,
		]) {
			surface.width = 0
			surface.height = 0
		}
	}
	const handleFailure = (error: unknown) => {
		cleanup()
		console.error('Failed to render Eid al-Fitr glow', error)
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

function drawHangingLantern({
	context,
	artwork,
	x,
	scale,
	cord,
	variant,
	time,
	phase,
	opacity,
}: {
	context: CanvasRenderingContext2D
	artwork: EidArtwork
	x: number
	scale: number
	cord: number
	variant: number
	time: number
	phase: number
	opacity: number
}) {
	const sprite = artwork.lanterns[variant % artwork.lanterns.length]
	const angle =
		Math.sin(time * 0.48 + phase) * 0.018 +
		Math.sin(time * 0.21 + phase) * 0.009
	const light =
		0.92 +
		Math.sin(time * 1.1 + phase) * 0.055 +
		Math.sin(time * 3.5 + phase) * 0.025
	const lightX = (sprite.lightX - sprite.anchorX) * scale
	const lightY = cord + (sprite.lightY - sprite.anchorY) * scale
	const glowSize = 450 * scale
	context.save()
	context.translate(x, -8)
	context.rotate(angle)
	context.globalAlpha = opacity * 0.58
	context.strokeStyle = '#c6a467'
	context.lineWidth = 0.85
	context.beginPath()
	context.moveTo(0, 0)
	context.lineTo(0, cord)
	context.stroke()
	context.globalAlpha = opacity * light * 0.65
	context.drawImage(
		artwork.glow.canvas,
		lightX - glowSize / 2,
		lightY - glowSize / 2,
		glowSize,
		glowSize,
	)
	context.globalAlpha = opacity * light
	context.drawImage(
		sprite.canvas,
		-sprite.anchorX * scale,
		cord - sprite.anchorY * scale,
		sprite.width * scale,
		sprite.height * scale,
	)
	context.restore()
}

function easeOut(progress: number) {
	return 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3
}

function wrap(value: number) {
	return ((value % 1) + 1) % 1
}

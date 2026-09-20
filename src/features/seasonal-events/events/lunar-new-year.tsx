import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createLunarNewYearArtwork } from './lunar-new-year-artwork'

const LUNAR_MOUNT_DELAY_MS = 900
const LUNAR_PARTICLE_COUNT = 58

type LunarArtwork = ReturnType<typeof createLunarNewYearArtwork>

export async function launchLunarNewYear(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountLunarNewYear()
		} catch (error) {
			console.error('Failed to launch Lunar New Year effect', error)
		}
	}, LUNAR_MOUNT_DELAY_MS)

	return () => {
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountLunarNewYear() {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Lunar New Year canvas')
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const particles = Array.from({ length: LUNAR_PARTICLE_COUNT }, (_, index) =>
		createLanternParticle(index),
	)
	let artwork: LunarArtwork | null = null
	let artworkDpr = 0
	let width = Math.max(1, window.innerWidth)
	let height = Math.max(1, window.innerHeight)
	let elapsed = 0
	let hasRevealed = motionPreference.matches
	let lastTime: number | null = null
	let animationFrameId: number | null = null
	let animationGeneration = 0
	let hasCanceled = false
	let unsubscribeSettings = () => {}

	canvas.dataset.lunarNewYear = 'true'
	canvas.setAttribute('aria-hidden', 'true')
	Object.assign(canvas.style, {
		inset: '0',
		mixBlendMode: 'screen',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})

	const drawScene = () => {
		if (!artwork) return
		context.clearRect(0, 0, width, height)
		const reveal = hasRevealed ? 1 : easeOut(elapsed / 3.5)
		const isCompact = width < 600
		const breeze = Math.sin(elapsed * 0.18) * 10
		context.globalAlpha = reveal * 0.38
		context.drawImage(
			artwork.haze,
			-width * 0.55 + breeze,
			height * 0.2,
			width * 2.1,
			height * 1.6,
		)

		const particleCount = isCompact ? 32 : particles.length
		const margin = isCompact ? 55 : 95
		for (let index = 0; index < particleCount; index += 1) {
			const particle = particles[index]
			const appearance = hasRevealed
				? 1
				: easeOut((elapsed - particle.delay) / 1.8)
			if (appearance === 0) continue
			const progress = wrap(particle.progress + elapsed * particle.speed)
			const edge = Math.min(1, progress * 12, (1 - progress) * 12)
			const sway = Math.sin(elapsed * 0.43 + particle.phase)
			const x =
				particle.x * (width + margin * 2) -
				margin +
				breeze * particle.depth +
				sway * particle.sway
			const y = (1 - progress) * (height + margin * 2) - margin
			const scale =
				(particle.size / 160) *
				(isCompact ? 0.85 : 1) *
				(0.78 + (1 - progress) * 0.22) *
				(0.8 + appearance * 0.2)
			const sprite = artwork.lanterns[index % artwork.lanterns.length]
			const light = 0.92 + Math.sin(elapsed * 0.65 + particle.phase) * 0.08
			context.save()
			context.translate(x, y)
			context.rotate(sway * 0.07 + Math.sin(elapsed * 0.18) * 0.025)
			drawLantern({
				context,
				artwork,
				sprite,
				scale,
				opacity: particle.opacity * appearance * edge * light,
				anchorY: -(sprite.lightY - sprite.anchorY) * scale,
			})
			context.restore()
		}

		const hangingScale = Math.min(1, width / 1050, height / 660)
		const inset = isCompact ? Math.max(44, width * 0.12) : width * 0.085
		for (let index = 0; index < 2; index += 1) {
			const isLeft = index === 0
			const scale = Math.max(0.4, hangingScale) * (isLeft ? 0.94 : 0.78)
			const cordLength = (isLeft ? 80 : 48) * Math.max(0.6, hangingScale)
			const angle =
				Math.sin(elapsed * 0.52 + index * 2.1) * 0.027 +
				Math.sin(elapsed * 0.23 + index) * 0.012
			context.save()
			context.translate(isLeft ? inset : width - inset, -8)
			context.rotate(angle)
			context.globalAlpha = reveal * 0.65
			context.strokeStyle = '#ddb36b'
			context.lineWidth = isCompact ? 0.85 : 1.15
			context.beginPath()
			context.moveTo(0, 0)
			context.lineTo(0, cordLength)
			context.stroke()
			drawLantern({
				context,
				artwork,
				sprite: artwork.lanterns[index],
				scale,
				opacity: reveal * 0.92,
				anchorY: cordLength,
			})
			context.restore()
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
		if (!artwork || artworkDpr !== dpr) {
			artwork = createLunarNewYearArtwork({ dpr })
			artworkDpr = dpr
		}
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

function drawLantern({
	context,
	artwork,
	sprite,
	scale,
	opacity,
	anchorY,
}: {
	context: CanvasRenderingContext2D
	artwork: LunarArtwork
	sprite: LunarArtwork['lanterns'][number]
	scale: number
	opacity: number
	anchorY: number
}) {
	const lightX = (sprite.lightX - sprite.anchorX) * scale
	const lightY = anchorY + (sprite.lightY - sprite.anchorY) * scale
	const glowSize = 440 * scale
	context.globalAlpha = opacity * 0.52
	context.drawImage(
		artwork.glow,
		lightX - glowSize / 2,
		lightY - glowSize / 2,
		glowSize,
		glowSize,
	)
	context.globalAlpha = opacity
	context.drawImage(
		sprite.canvas,
		-sprite.anchorX * scale,
		anchorY - sprite.anchorY * scale,
		sprite.width * scale,
		sprite.height * scale,
	)
}

function createLanternParticle(index: number) {
	const depth = index % 4 === 0 ? 1 : index % 3 === 0 ? 0.55 : 0.78
	return {
		depth,
		x: Math.random(),
		progress: Math.random(),
		phase: randomInRange({ min: 0, max: Math.PI * 2 }),
		delay: randomInRange({ min: 0, max: 2.4 }),
		size: randomInRange({ min: 23, max: 43 }) * depth,
		speed: randomInRange({ min: 0.007, max: 0.014 }) * depth,
		sway: randomInRange({ min: 6, max: 20 }) * depth,
		opacity: randomInRange({ min: 0.6, max: 0.88 }) * depth,
	}
}

function easeOut(progress: number) {
	return 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3
}

function wrap(value: number) {
	return ((value % 1) + 1) % 1
}

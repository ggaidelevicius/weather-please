import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createEasterArtwork } from './easter-artwork'

const EASTER_MOUNT_DELAY_MS = 900
const EASTER_PARTICLE_COUNT = 70
const EASTER_PARTICLE_KINDS = [
	'egg',
	'egg',
	'flower',
	'egg',
	'egg',
	'flower',
	'egg',
	'egg',
	'flower',
	'egg',
] as const

type EasterArtwork = ReturnType<typeof createEasterArtwork>

export async function launchEaster(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountEaster()
		} catch (error) {
			console.error('Failed to launch Easter effect', error)
		}
	}, EASTER_MOUNT_DELAY_MS)

	return () => {
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountEaster() {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Easter canvas')
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const particles = Array.from({ length: EASTER_PARTICLE_COUNT }, (_, index) =>
		createParticle(index),
	)
	let artwork: EasterArtwork | null = null
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

	canvas.dataset.easter = 'true'
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
		const reveal = hasRevealed ? 1 : easeOut(elapsed / 4)
		const isCompact = width < 600
		const breeze = Math.sin(elapsed * 0.19) * 12 + Math.sin(elapsed * 0.08) * 6
		context.globalAlpha = reveal * 0.34
		context.drawImage(
			artwork.glow,
			-width * 0.68 + breeze * 0.4,
			-height * 0.65,
			width * 1.8,
			height * 1.8,
		)

		const particleCount = isCompact ? 42 : particles.length
		const margin = isCompact ? 60 : 100
		for (let index = 0; index < particleCount; index += 1) {
			const particle = particles[index]
			const appearance = hasRevealed
				? 1
				: easeOut((elapsed - particle.delay) / 1.8)
			if (appearance === 0) continue
			const horizontal = wrap(particle.x + elapsed * particle.speedX)
			const vertical = wrap(particle.y + elapsed * particle.speedY)
			const edge = Math.min(
				1,
				horizontal * 16,
				(1 - horizontal) * 16,
				vertical * 16,
				(1 - vertical) * 16,
			)
			const sway = Math.sin(elapsed * 0.42 + particle.phase)
			const x =
				horizontal * (width + margin * 2) -
				margin +
				breeze * particle.depth +
				sway * particle.sway
			const y =
				vertical * (height + margin * 2) -
				margin +
				Math.cos(elapsed * 0.32 + particle.phase) * particle.sway * 0.45
			const size =
				particle.size * (isCompact ? 0.82 : 1) * (0.72 + appearance * 0.28)
			const rotation = particle.rotation + sway * 0.14 + breeze * 0.002
			const pulse = 0.94 + Math.sin(elapsed * 0.75 + particle.phase) * 0.06
			const sprites = particle.kind === 'egg' ? artwork.eggs : artwork.flowers
			context.save()
			context.translate(x, y)
			context.rotate(rotation)
			context.globalAlpha = particle.opacity * appearance * edge * pulse
			context.drawImage(
				sprites[particle.variant % sprites.length],
				-size,
				-size,
				size * 2,
				size * 2,
			)
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
			artwork = createEasterArtwork({ dpr })
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

function createParticle(index: number) {
	const kind = EASTER_PARTICLE_KINDS[index % EASTER_PARTICLE_KINDS.length]
	const depth = index % 6 === 0 ? 1.14 : index % 4 === 0 ? 0.64 : 0.9
	return {
		kind,
		depth,
		variant: Math.floor(index / EASTER_PARTICLE_KINDS.length) + index,
		x: Math.random(),
		y: Math.random(),
		phase: randomInRange({ min: 0, max: Math.PI * 2 }),
		delay: randomInRange({ min: 0, max: 2.2 }),
		size:
			randomInRange(
				kind === 'egg' ? { min: 27, max: 44 } : { min: 18, max: 28 },
			) * depth,
		speedX: randomInRange({ min: -0.0015, max: 0.0015 }) * depth,
		speedY: randomInRange({ min: -0.005, max: -0.0015 }) * depth,
		sway: randomInRange({ min: 5, max: 13 }) * depth,
		rotation: randomInRange({ min: -0.2, max: 0.2 }),
		opacity: randomInRange({ min: 0.65, max: 0.9 }) * (0.65 + depth * 0.3),
	}
}

function easeOut(progress: number) {
	return 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3
}

function wrap(value: number) {
	return ((value % 1) + 1) % 1
}

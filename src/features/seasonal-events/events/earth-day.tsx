import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createEarthDayArtwork } from './earth-day-artwork'
import type { EarthParticleKind } from './earth-day-artwork'

const EARTH_MOUNT_DELAY_MS = 900
const EARTH_PARTICLE_COUNT = 90
const EARTH_KINDS: readonly EarthParticleKind[] = [
	'flower',
	'leaf',
	'drop',
	'sprout',
	'flower',
	'leaf',
	'drop',
	'flower',
	'sprout',
	'leaf',
	'drop',
	'flower',
]
const EARTH_SIZES = {
	leaf: { min: 24, max: 48 },
	sprout: { min: 24, max: 44 },
	drop: { min: 20, max: 38 },
	flower: { min: 24, max: 44 },
}
const EARTH_VERTICAL_SPEEDS = {
	leaf: { min: -0.009, max: -0.002 },
	sprout: { min: -0.007, max: -0.001 },
	drop: { min: -0.003, max: 0.006 },
	flower: { min: -0.007, max: 0.003 },
}

export async function launchEarthDay(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountEarthDay()
		} catch (error) {
			console.error('Failed to launch Earth Day effect', error)
		}
	}, EARTH_MOUNT_DELAY_MS)

	return () => {
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountEarthDay() {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Earth Day canvas')
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const artwork = createEarthDayArtwork()
	const nextVariant = { leaf: 0, sprout: 0, drop: 0, flower: 0 }
	const particles = Array.from({ length: EARTH_PARTICLE_COUNT }, (_, index) => {
		const kind = EARTH_KINDS[index % EARTH_KINDS.length]
		const variant = nextVariant[kind] % artwork.sprites[kind].length
		nextVariant[kind] += 1
		return createParticle({
			index,
			kind,
			variant,
		})
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

	canvas.dataset.earthDay = 'true'
	canvas.setAttribute('aria-hidden', 'true')
	Object.assign(canvas.style, {
		inset: '0',
		mixBlendMode: 'screen',
		filter: 'saturate(130%)',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})

	const drawScene = () => {
		context.clearRect(0, 0, width, height)
		const reveal = hasRevealed ? 1 : easeOut(elapsed / 4)
		context.globalAlpha = reveal * 0.35
		context.drawImage(
			artwork.glow,
			-width * 0.6,
			height * 0.35,
			width * 2.2,
			height * 1.6,
		)

		const isCompact = width < 600
		const particleCount = isCompact ? 54 : particles.length
		const margin = isCompact ? 55 : 115
		const breeze = Math.sin(elapsed * 0.22) * 15 + Math.sin(elapsed * 0.09) * 7
		const lift = Math.sin(elapsed * 0.17) * 5
		for (let index = 0; index < particleCount; index += 1) {
			const particle = particles[index]
			const growth = hasRevealed
				? 1
				: easeOut((elapsed - particle.delay) / particle.growthDuration)
			if (growth === 0) continue
			const horizontal = wrap(particle.x + elapsed * particle.speedX)
			const vertical = wrap(particle.y + elapsed * particle.speedY)
			const edge = Math.min(
				1,
				horizontal * 16,
				(1 - horizontal) * 16,
				vertical * 16,
				(1 - vertical) * 16,
			)
			const sway = Math.sin(elapsed * 0.55 + particle.phase)
			const x =
				horizontal * (width + margin * 2) -
				margin +
				breeze * particle.depth +
				sway * particle.sway
			const y =
				vertical * (height + margin * 2) -
				margin +
				lift * particle.depth +
				Math.cos(elapsed * 0.38 + particle.phase) * particle.sway * 0.55
			const size = particle.size * (isCompact ? 0.8 : 1)
			const opening = 0.46 + growth * 0.54
			const pulse = 0.8 + Math.sin(elapsed * 0.8 + particle.phase) * 0.16
			const turn =
				particle.kind === 'leaf'
					? 0.78 + Math.sin(elapsed * 0.6 + particle.phase) * 0.22
					: 1
			const spin =
				particle.kind === 'drop' || particle.kind === 'sprout'
					? Math.sin(elapsed * 0.18 + particle.phase) * particle.spin * 4
					: elapsed * particle.spin
			const rotation = particle.rotation + spin + sway * 0.12 + breeze * 0.003
			context.save()
			context.translate(x, y)
			context.rotate(rotation)
			context.scale(opening * turn, opening)
			context.globalAlpha = 0.78 * particle.opacity * growth * edge * pulse
			context.drawImage(
				artwork.sprites[particle.kind][particle.variant],
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

function easeOut(progress: number) {
	return 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3
}

function createParticle({
	index,
	kind,
	variant,
}: {
	index: number
	kind: EarthParticleKind
	variant: number
}) {
	const depth = index % 6 === 0 ? 1.12 : index % 5 === 0 ? 0.82 : 1
	const isGrowing = kind === 'sprout' || kind === 'flower'
	return {
		kind,
		depth,
		variant,
		x: Math.random(),
		y: Math.random(),
		phase: randomInRange({ min: 0, max: Math.PI * 2 }),
		size: randomInRange(EARTH_SIZES[kind]) * depth,
		delay: randomInRange({ min: 0, max: 2.2 }),
		growthDuration: randomInRange({
			min: isGrowing ? 1.4 : 0.9,
			max: isGrowing ? 2.2 : 1.6,
		}),
		opacity: randomInRange({ min: 0.52, max: 0.88 }) * Math.min(1, depth),
		speedX: randomInRange({ min: -0.004, max: 0.004 }) * depth,
		speedY: randomInRange(EARTH_VERTICAL_SPEEDS[kind]) * depth,
		rotation:
			kind === 'flower'
				? randomInRange({ min: -Math.PI, max: Math.PI })
				: randomInRange({ min: -0.8, max: 0.8 }),
		spin:
			randomInRange({ min: -0.08, max: 0.08 }) * (kind === 'sprout' ? 0.3 : 1),
		sway: randomInRange({ min: 2, max: 6 }),
	}
}

function wrap(value: number) {
	return ((value % 1) + 1) % 1
}

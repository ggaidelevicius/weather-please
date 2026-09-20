import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { randomInRange, getCanvasDpr } from '../core/utils'
import { createWinterCrystalArtwork } from './winter-solstice-artwork'
import type { WinterCrystal } from './winter-solstice-artwork'

const WINTER_MOUNT_DELAY_MS = 900
const WINTER_FIELD_MARGIN = 150
const WINTER_PARTICLE_COUNT = 90
const WINTER_COLORS = [
	'#e0f2fe',
	'#bae6fd',
	'#c7d2fe',
	'#e9d5ff',
	'#f8fafc',
	'#a5f3fc',
]
const WINTER_AURORA_LAYERS = [
	{
		gradient:
			'radial-gradient(70% 50% at 45% 0%, rgba(52, 211, 153, 0.18), rgba(15, 23, 42, 0) 70%)',
		period: 31000,
		x: 1.6,
		y: -0.8,
	},
	{
		gradient:
			'radial-gradient(90% 60% at 80% 8%, rgba(129, 140, 248, 0.22), rgba(15, 23, 42, 0) 70%)',
		period: 37000,
		x: -1.2,
		y: 1,
	},
	{
		gradient:
			'radial-gradient(120% 80% at 15% 0%, rgba(59, 130, 246, 0.3), rgba(14, 116, 144, 0.12) 45%, rgba(15, 23, 42, 0) 72%)',
		period: 24000,
		x: 2,
		y: -1.5,
	},
]

type Particle = WinterCrystal & {
	birthTime: number
	fadeDuration: number
	opacity: number
	phase: number
	rotation: number
	rotationSpeed: number
	sway: number
	vx: number
	vy: number
	x: number
	y: number
}

export async function launchWinterSolstice() {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountWinterSolstice()
		} catch (error) {
			console.error('Failed to launch winter solstice', error)
		}
	}, WINTER_MOUNT_DELAY_MS)

	return () => {
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountWinterSolstice() {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) {
		throw new Error('Unable to create 2D context for winter solstice canvas')
	}
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const overlay = document.createElement('div')
	const aurora = document.createElement('div')
	const auroraLayers = WINTER_AURORA_LAYERS.map(({ gradient }, index) => {
		const layer = document.createElement('div')
		layer.dataset.winterAurora = String(index)
		Object.assign(layer.style, {
			position: 'absolute',
			inset: '0',
			background: gradient,
			filter: 'blur(24px)',
			willChange: 'transform',
		})
		aurora.appendChild(layer)
		return layer
	})

	overlay.dataset.winterSolstice = 'true'
	canvas.dataset.winterSolstice = 'crystals'
	for (const root of [overlay, canvas]) {
		root.setAttribute('aria-hidden', 'true')
		Object.assign(root.style, {
			position: 'fixed',
			inset: '0',
			pointerEvents: 'none',
			mixBlendMode: 'screen',
		})
	}
	overlay.style.zIndex = '0'
	Object.assign(aurora.style, {
		position: 'absolute',
		inset: '-15% -10% 0 -10%',
		opacity: '0',
		willChange: 'opacity, transform',
	})
	overlay.appendChild(aurora)
	Object.assign(canvas.style, {
		zIndex: '1',
		opacity: '0.6',
		filter: 'saturate(115%)',
	})

	let width = window.innerWidth
	let height = window.innerHeight
	let dpr = 0
	let elapsed = 0
	let lastTime: number | null = null
	let animationFrameId: number | null = null
	let animationGeneration = 0
	let hasCanceled = false
	let hasRevealedAurora = false
	let artwork: ReturnType<typeof createWinterCrystalArtwork> = []
	let unsubscribeSettings = () => {}

	const createParticle = (time: number): Particle => ({
		birthTime: time + randomInRange({ max: 2600, min: 0 }),
		color: WINTER_COLORS[Math.floor(Math.random() * WINTER_COLORS.length)],
		fadeDuration: randomInRange({ max: 2100, min: 1200 }),
		glow: randomInRange({ max: 14, min: 6 }),
		opacity: randomInRange({ max: 0.7, min: 0.35 }),
		phase: randomInRange({ max: Math.PI * 2, min: 0 }),
		rotation: randomInRange({ max: Math.PI * 2, min: 0 }),
		rotationSpeed: randomInRange({ max: 0.25, min: -0.25 }),
		size: randomInRange({ max: 11, min: 4 }),
		sway: randomInRange({ max: 6, min: 1.5 }),
		vx: randomInRange({ max: 6, min: -6 }),
		vy: randomInRange({ max: 5, min: -5 }),
		x: randomInRange({
			max: width + WINTER_FIELD_MARGIN,
			min: -WINTER_FIELD_MARGIN,
		}),
		y: randomInRange({
			max: height + WINTER_FIELD_MARGIN,
			min: -WINTER_FIELD_MARGIN,
		}),
	})
	const particles = Array.from({ length: WINTER_PARTICLE_COUNT }, () =>
		createParticle(elapsed),
	)
	const respawnParticle = (particle: Particle) => {
		const { color, size, glow } = particle
		Object.assign(particle, createParticle(elapsed), { color, size, glow })
	}
	const isOutsideField = ({ x, y }: Particle) =>
		x < -WINTER_FIELD_MARGIN ||
		x > width + WINTER_FIELD_MARGIN ||
		y < -WINTER_FIELD_MARGIN ||
		y > height + WINTER_FIELD_MARGIN

	const drawScene = () => {
		const reveal = hasRevealedAurora
			? 1
			: easeOutCubic(Math.max(0, Math.min(1, (elapsed - 800) / 4600)))
		aurora.style.opacity = String(0.55 * reveal)
		aurora.style.transform = `translate3d(${-2 * (1 - reveal)}%, ${-3 * (1 - reveal)}%, 0) scale(${1 + 0.02 * (1 - reveal)})`
		for (let index = 0; index < auroraLayers.length; index += 1) {
			const { period, x, y } = WINTER_AURORA_LAYERS[index]
			const drift = (1 - Math.cos((elapsed / period) * Math.PI * 2)) / 2
			auroraLayers[index].style.transform =
				`translate3d(${drift * x}%, ${drift * y}%, 0)`
		}

		context.clearRect(0, 0, width, height)
		for (let index = 0; index < particles.length; index += 1) {
			const particle = particles[index]
			const lifeProgress =
				(elapsed - particle.birthTime) / particle.fadeDuration
			if (lifeProgress < 0) continue
			const twinkle = 0.6 + Math.sin(elapsed * 0.002 + particle.phase) * 0.4
			const alpha =
				particle.opacity * easeOutCubic(Math.min(1, lifeProgress)) * twinkle
			const { glow, crystal, displaySize } = artwork[index]
			const origin = -displaySize / 2

			context.save()
			context.translate(particle.x, particle.y)
			context.rotate(particle.rotation)
			context.globalAlpha = alpha * 0.35
			context.drawImage(glow, origin, origin, displaySize, displaySize)
			context.globalAlpha = alpha
			context.drawImage(crystal, origin, origin, displaySize, displaySize)
			context.restore()
		}
	}
	const resizeScene = () => {
		const previousWidth = width
		const previousHeight = height
		width = window.innerWidth
		height = window.innerHeight
		const nextDpr = getCanvasDpr({ height, maxDpr: 2, width })
		canvas.width = Math.round(width * nextDpr)
		canvas.height = Math.round(height * nextDpr)
		canvas.style.width = `${width}px`
		canvas.style.height = `${height}px`
		context.setTransform(nextDpr, 0, 0, nextDpr, 0, 0)
		if (dpr !== nextDpr) {
			artwork = createWinterCrystalArtwork({
				dpr: nextDpr,
				crystals: particles,
			})
			dpr = nextDpr
		}
		for (const particle of particles) {
			particle.x *= previousWidth > 0 ? width / previousWidth : 1
			particle.y *= previousHeight > 0 ? height / previousHeight : 1
			if (isOutsideField(particle)) respawnParticle(particle)
			if (motionPreference.matches) {
				particle.birthTime = elapsed - particle.fadeDuration
			}
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
		elapsed += delta
		for (const particle of particles) {
			if (elapsed < particle.birthTime) continue
			const sway = Math.sin(elapsed * 0.00045 + particle.phase) * particle.sway
			const lift =
				Math.cos(elapsed * 0.0004 + particle.phase) * particle.sway * 0.35
			particle.x += ((particle.vx + sway) * delta) / 1000
			particle.y += ((particle.vy + lift) * delta) / 1000
			particle.rotation += (particle.rotationSpeed * delta) / 1000
			if (isOutsideField(particle)) respawnParticle(particle)
		}
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
			hasRevealedAurora = true
			for (const particle of particles) {
				particle.birthTime = elapsed - particle.fadeDuration
			}
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
		overlay.remove()
		artwork = []
	}

	try {
		document.body.append(overlay, canvas)
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

function easeOutCubic(value: number) {
	return 1 - Math.pow(1 - value, 3)
}

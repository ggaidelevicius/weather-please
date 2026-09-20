import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createValentinesArtwork } from './valentines-artwork'

const VALENTINES_MOUNT_DELAY_MS = 900
const VALENTINES_HEART_COUNT = 72
const VALENTINES_COMPACT_HEART_COUNT = 44
const VALENTINES_LIGHT_COUNT = 12
const VALENTINES_CLOUD_DRIFT_RATE = 0.12

type ValentinesArtwork = ReturnType<typeof createValentinesArtwork>
type ParticleKind = 'heart' | 'light'

export async function launchValentinesHearts(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountValentines()
		} catch (error) {
			console.error('Failed to launch Valentine’s Day effect', error)
		}
	}, VALENTINES_MOUNT_DELAY_MS)

	return () => {
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountValentines() {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Valentine’s Day canvas')
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const shouldFormHeartCloud = Math.random() < 0.33
	const cloudAngleOffset = Math.random() * Math.PI * 2
	const particles = [
		...Array.from({ length: VALENTINES_LIGHT_COUNT }, (_, index) =>
			createParticle({ index, kind: 'light', cloudAngleOffset }),
		),
		...Array.from({ length: VALENTINES_HEART_COUNT }, (_, index) =>
			createParticle({ index, kind: 'heart', cloudAngleOffset }),
		),
	]
	let artwork: ValentinesArtwork | null = null
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

	canvas.dataset.valentines = 'true'
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
		const breeze = Math.sin(elapsed * 0.17) * 12 + Math.sin(elapsed * 0.08) * 5
		context.globalAlpha = reveal * 0.36
		context.drawImage(
			artwork.haze,
			-width * 0.5 + breeze,
			height * 0.24,
			width * 2,
			height * 1.55,
		)

		const margin = isCompact ? 65 : 100
		const cloudScale = Math.min(width, height)
		for (const particle of particles) {
			const { kind, index } = particle
			if (
				isCompact &&
				index >= (kind === 'heart' ? VALENTINES_COMPACT_HEART_COUNT : 6)
			)
				continue
			const appearance = hasRevealed
				? 1
				: easeOut((elapsed - particle.delay) / 1.8)
			if (appearance === 0) continue
			const isInHeartCloud = shouldFormHeartCloud && kind === 'heart'
			const cloud = isCompact ? particle.compactCloud : particle.cloud
			const originX = isInHeartCloud
				? width / 2 + cloud.x * cloudScale
				: particle.x * (width + margin * 2) - margin
			const originY = isInHeartCloud
				? height / 2 + cloud.y * cloudScale
				: particle.y * (height + margin * 2) - margin
			const driftTime =
				elapsed * (isInHeartCloud ? VALENTINES_CLOUD_DRIFT_RATE : 1)
			const horizontal = wrap(
				(originX + margin) / (width + margin * 2) + driftTime * particle.speedX,
			)
			const vertical = wrap(
				(originY + margin) / (height + margin * 2) +
					driftTime * particle.speedY,
			)
			const edge = Math.min(
				1,
				horizontal * 16,
				(1 - horizontal) * 16,
				vertical * 16,
				(1 - vertical) * 16,
			)
			const sway = Math.sin(driftTime * 0.42 + particle.phase)
			const swaySize = particle.sway * (isInHeartCloud ? 0.45 : 1)
			const x =
				horizontal * (width + margin * 2) -
				margin +
				breeze * particle.depth +
				sway * swaySize
			const y =
				vertical * (height + margin * 2) -
				margin +
				Math.cos(driftTime * 0.31 + particle.phase) * swaySize * 0.35
			const opening = 0.7 + appearance * 0.3
			const size = particle.size * (isCompact ? 0.8 : 1) * opening
			const turn = 0.96 + Math.sin(elapsed * 0.35 + particle.phase) * 0.04
			const rotation = particle.rotation + sway * 0.16
			const pulse = 0.91 + Math.sin(elapsed * 0.65 + particle.phase) * 0.09
			const sprite =
				kind === 'heart'
					? artwork.hearts[index % artwork.hearts.length]
					: artwork.bokeh
			context.save()
			context.translate(x, y)
			context.rotate(rotation)
			context.scale(turn, 1)
			context.globalAlpha = particle.opacity * appearance * edge * pulse
			context.drawImage(sprite, -size, -size, size * 2, size * 2)
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
			artwork = createValentinesArtwork({ dpr })
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

function createParticle({
	index,
	kind,
	cloudAngleOffset,
}: {
	index: number
	kind: ParticleKind
	cloudAngleOffset: number
}) {
	const depth = index % 6 === 0 ? 1.15 : index % 3 === 0 ? 0.6 : 0.88
	const isLight = kind === 'light'
	const cloudPosition = index + Math.random() * 0.15
	const cloudFill = randomInRange({ min: 0.95, max: 1.02 })
	const cloudJitter = randomInRange({ min: 0.02, max: 0.06 })
	const spreadAngle = Math.random() * Math.PI * 2
	const spread = randomInRange({ min: 0, max: cloudJitter })
	const getCloudPoint = (count: number) => {
		const angle = cloudAngleOffset + (cloudPosition / count) * Math.PI * 2
		const scale = (1.22 / 34) * cloudFill
		return {
			x: 16 * Math.sin(angle) ** 3 * scale + Math.cos(spreadAngle) * spread,
			y:
				(-13 * Math.cos(angle) +
					5 * Math.cos(angle * 2) +
					2 * Math.cos(angle * 3) +
					Math.cos(angle * 4)) *
					scale +
				Math.sin(spreadAngle) * spread,
		}
	}

	return {
		index,
		kind,
		depth,
		x: Math.random(),
		y: Math.random(),
		cloud: getCloudPoint(VALENTINES_HEART_COUNT),
		compactCloud: getCloudPoint(VALENTINES_COMPACT_HEART_COUNT),
		phase: randomInRange({ min: 0, max: Math.PI * 2 }),
		delay: randomInRange({ min: 0, max: 2.2 }),
		size:
			randomInRange(isLight ? { min: 36, max: 78 } : { min: 24, max: 42 }) *
			depth,
		speedX: randomInRange({ min: -0.0011, max: 0.0011 }) * depth,
		speedY: randomInRange({ min: -0.007, max: -0.003 }) * depth,
		sway: randomInRange({ min: 5, max: 15 }) * depth,
		rotation: randomInRange({ min: -0.24, max: 0.24 }),
		opacity:
			randomInRange(
				isLight ? { min: 0.08, max: 0.18 } : { min: 0.64, max: 0.9 },
			) *
			(0.6 + depth * 0.35),
	}
}

function easeOut(progress: number) {
	return 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3
}

function wrap(value: number) {
	return ((value % 1) + 1) % 1
}

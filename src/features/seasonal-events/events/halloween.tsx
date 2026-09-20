import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createHalloweenArtwork } from './halloween-artwork'

const HALLOWEEN_MOUNT_DELAY_MS = 900

export async function launchHalloweenSpirits(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountHalloween()
		} catch (error) {
			console.error('Failed to launch Halloween spirits', error)
		}
	}, HALLOWEEN_MOUNT_DELAY_MS)

	return () => {
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountHalloween() {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Halloween canvas')
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const artwork = createHalloweenArtwork({ dpr: 2 })
	const bats = Array.from({ length: 14 }, (_, index) => ({
		x: Math.random(),
		y: randomInRange({ min: 0.06, max: 0.34 }),
		size: randomInRange({ min: 30, max: 56 }),
		speed: randomInRange({ min: 0.008, max: 0.018 }) * (index % 3 ? 1 : -1),
		phase: Math.random() * Math.PI * 2,
		variant: index % artwork.bats.length,
		opacity: randomInRange({ min: 0.48, max: 0.76 }),
	}))
	const ghosts = Array.from({ length: 9 }, (_, index) => ({
		x:
			index % 2
				? randomInRange({ min: 0.78, max: 0.94 })
				: randomInRange({ min: 0.06, max: 0.22 }),
		y: Math.random(),
		size: randomInRange({ min: 66, max: 104 }),
		speed: randomInRange({ min: 0.002, max: 0.005 }),
		phase: Math.random() * Math.PI * 2,
		variant: index % artwork.ghosts.length,
		opacity: randomInRange({ min: 0.19, max: 0.34 }),
	}))
	const embers = Array.from({ length: 28 }, (_, index) => ({
		x: Math.random(),
		y: Math.random(),
		size: randomInRange({ min: 9, max: 19 }),
		speed: randomInRange({ min: 0.009, max: 0.019 }),
		phase: Math.random() * Math.PI * 2,
		delay: (index % 7) * 0.3,
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

	canvas.dataset.halloween = 'true'
	canvas.setAttribute('aria-hidden', 'true')
	Object.assign(canvas.style, {
		inset: '0',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})

	const drawSprite = (
		sprite: HTMLCanvasElement,
		{
			x,
			y,
			size,
			alpha,
			rotation = 0,
			scaleX = 1,
			scaleY = 1,
		}: {
			x: number
			y: number
			size: number
			alpha: number
			rotation?: number
			scaleX?: number
			scaleY?: number
		},
	) => {
		context.save()
		context.translate(x, y)
		context.rotate(rotation)
		context.scale(scaleX, scaleY)
		context.globalAlpha = alpha
		context.drawImage(sprite, -size / 2, -size / 2, size, size)
		context.restore()
	}
	const drawScene = () => {
		context.clearRect(0, 0, width, height)
		const reveal = hasRevealed ? 1 : easeOut(elapsed / 3.5)
		const isCompact = width < 600
		const sceneScale = Math.min(1, height / 650)
		const hazeDrift = Math.sin(elapsed * 0.07) * width * 0.035
		context.globalAlpha = reveal * 0.25
		context.drawImage(
			artwork.haze,
			-width * 0.4 + hazeDrift,
			-height * 0.4,
			width * 1.4,
			height * 1.1,
		)
		context.globalAlpha = reveal * 0.22
		context.drawImage(
			artwork.haze,
			-width * 0.35 - hazeDrift,
			height * 0.62,
			width * 1.7,
			height * 0.75,
		)

		const moonSize = (isCompact ? 250 : 340) * sceneScale
		drawSprite(artwork.moon, {
			x: width * (isCompact ? 0.78 : 0.84),
			y: Math.max(moonSize * 0.36, height * 0.19),
			size: moonSize,
			alpha: reveal * 0.8,
		})

		const batCount = isCompact ? 8 : bats.length
		for (let index = 0; index < batCount; index += 1) {
			const bat = bats[index]
			const horizontal = wrap(bat.x + elapsed * bat.speed)
			const flap = Math.sin(elapsed * 4.2 + bat.phase)
			drawSprite(artwork.bats[bat.variant], {
				x: horizontal * (width + 100) - 50,
				y: bat.y * height + Math.sin(elapsed * 0.8 + bat.phase) * 12,
				size: bat.size * (isCompact ? 0.8 : 1),
				alpha: reveal * bat.opacity * edgeFade(horizontal),
				rotation: Math.sin(elapsed * 0.9 + bat.phase) * 0.16,
				scaleX: bat.speed < 0 ? -1 : 1,
				scaleY: 0.76 + flap * 0.24,
			})
		}

		const ghostCount = isCompact ? 5 : ghosts.length
		for (let index = 0; index < ghostCount; index += 1) {
			const ghost = ghosts[index]
			const vertical = wrap(ghost.y - elapsed * ghost.speed)
			const sway = Math.sin(elapsed * 0.36 + ghost.phase)
			drawSprite(artwork.ghosts[ghost.variant], {
				x: ghost.x * width + sway * (isCompact ? 10 : 22),
				y: vertical * (height + 150) - 75,
				size: ghost.size * (isCompact ? 0.8 : 1),
				alpha:
					reveal *
					ghost.opacity *
					edgeFade(vertical) *
					(0.83 + Math.sin(elapsed * 0.6 + ghost.phase) * 0.17),
				rotation: sway * 0.12,
				scaleX: 1 + Math.sin(elapsed * 0.5 + ghost.phase) * 0.04,
			})
		}

		const emberCount = isCompact ? 16 : embers.length
		for (let index = 0; index < emberCount; index += 1) {
			const ember = embers[index]
			const vertical = wrap(ember.y - elapsed * ember.speed)
			const fade = hasRevealed ? 1 : easeOut((elapsed - ember.delay) / 2)
			const x = ember.x * width + Math.sin(elapsed * 0.5 + ember.phase) * 18
			const isCentral = x > width * 0.28 && x < width * 0.72
			drawSprite(artwork.ember, {
				x,
				y: height * (0.35 + vertical * 0.7),
				size: ember.size,
				alpha:
					fade *
					edgeFade(vertical) *
					(isCentral ? 0.22 : 0.52) *
					(0.7 + Math.sin(elapsed * 1.2 + ember.phase) * 0.3),
			})
		}

		const pumpkins = isCompact
			? [
					{ x: 57, size: 170, variant: 0 },
					{ x: 145, size: 112, variant: 1 },
				]
			: [
					{ x: 110, size: 244, variant: 0 },
					{ x: 243, size: 160, variant: 1 },
					{ x: width - 94, size: 154, variant: 2 },
				]
		for (const { x, size: baseSize, variant } of pumpkins) {
			const size = baseSize * sceneScale
			const left = x - size / 2
			const top = height + 4 - size * (226 / 256)
			context.globalAlpha = reveal * 0.24
			context.drawImage(
				artwork.ember,
				x - size * 0.7,
				height - size * 0.15,
				size * 1.4,
				size * 0.3,
			)
			context.globalAlpha = reveal * 0.84
			context.drawImage(artwork.pumpkins[variant], left, top, size, size)
			const candle =
				0.55 +
				Math.sin(elapsed * 2.1 + variant * 2) * 0.12 +
				Math.sin(elapsed * 4.3 + variant) * 0.05
			context.globalAlpha = reveal * candle
			context.drawImage(artwork.pumpkinLights[variant], left, top, size, size)
		}
		context.globalAlpha = 1
	}
	const resizeScene = () => {
		if (hasCanceled) return
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
		if (hasCanceled) return
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
		if (hasCanceled) return
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

function wrap(value: number) {
	return ((value % 1) + 1) % 1
}

function edgeFade(position: number) {
	return Math.min(1, position * 12, (1 - position) * 12)
}

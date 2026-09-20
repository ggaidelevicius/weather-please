import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createDayOfTheDeadArtwork } from './day-of-the-dead-artwork'
import { createDayOfTheDeadBanners } from './day-of-the-dead-banners'

const DAY_OF_THE_DEAD_MOUNT_DELAY_MS = 900

export async function launchDayOfTheDead(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountDayOfTheDead()
		} catch (error) {
			console.error('Failed to launch Day of the Dead effect', error)
		}
	}, DAY_OF_THE_DEAD_MOUNT_DELAY_MS)

	return () => {
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountDayOfTheDead() {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Day of the Dead canvas')
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const artwork = createDayOfTheDeadArtwork({ dpr: 2 })
	const banners = createDayOfTheDeadBanners({ dpr: 2 })
	const petals = Array.from({ length: 40 }, (_, index) => ({
		x:
			index % 4 === 0
				? Math.random()
				: index % 2
					? randomInRange({ min: 0.03, max: 0.24 })
					: randomInRange({ min: 0.76, max: 0.97 }),
		y: Math.random(),
		size: randomInRange({ min: 27, max: 48 }),
		speed: randomInRange({ min: 0.01, max: 0.022 }),
		phase: Math.random() * Math.PI * 2,
		rotation: Math.random() * Math.PI * 2,
		spin: randomInRange({ min: -0.2, max: 0.2 }),
		variant: index % artwork.petals.length,
		opacity: randomInRange({ min: 0.32, max: 0.66 }),
	}))
	const butterflies = Array.from({ length: 6 }, (_, index) => ({
		x:
			index % 2
				? randomInRange({ min: 0.76, max: 0.93 })
				: randomInRange({ min: 0.07, max: 0.24 }),
		y: Math.random(),
		size: randomInRange({ min: 48, max: 76 }),
		speed: randomInRange({ min: 0.004, max: 0.009 }),
		phase: Math.random() * Math.PI * 2,
		variant: index % artwork.butterflies.length,
		opacity: randomInRange({ min: 0.5, max: 0.78 }),
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

	canvas.dataset.dayOfTheDead = 'true'
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
	const drawCandle = ({
		x,
		size,
		phase,
		reveal,
	}: {
		x: number
		size: number
		phase: number
		reveal: number
	}) => {
		const scale = size / 256
		const top = height + 4 - 238 * scale
		context.globalAlpha = reveal * 0.84
		context.drawImage(artwork.candle, x - 64 * scale, top, 128 * scale, size)
		const flameSize = 74 * scale
		const flicker =
			Math.sin(elapsed * 2.2 + phase) * 0.6 +
			Math.sin(elapsed * 3.7 + phase) * 0.4
		context.save()
		context.translate(x, top + 74 * scale)
		context.rotate(Math.sin(elapsed * 1.6 + phase) * 0.035)
		context.scale(1 - flicker * 0.05, 1 + flicker * 0.04)
		context.globalAlpha = reveal * (0.91 + flicker * 0.06)
		context.drawImage(
			artwork.flame,
			-flameSize / 2,
			-flameSize * 0.75,
			flameSize,
			flameSize,
		)
		context.restore()
	}
	const drawScene = () => {
		context.clearRect(0, 0, width, height)
		const reveal = hasRevealed ? 1 : easeOut(elapsed / 3.5)
		const isCompact = width < 600
		const sceneScale = Math.min(1, height / 650)
		context.globalAlpha = reveal * 0.17
		context.drawImage(
			artwork.glow,
			-width * 0.35,
			-height * 0.48,
			width * 1.3,
			height,
		)
		context.globalAlpha = reveal * 0.3
		context.drawImage(
			artwork.glow,
			-120,
			height - 250 * sceneScale,
			isCompact ? 390 : 510,
			400 * sceneScale,
		)
		context.globalAlpha = reveal * 0.26
		context.drawImage(
			artwork.glow,
			width - 370,
			height - 250 * sceneScale,
			460,
			400 * sceneScale,
		)

		const bow = (isCompact ? 24 : 36) * sceneScale
		context.globalAlpha = reveal * 0.4
		context.strokeStyle = '#c9a28b'
		context.lineWidth = 1
		context.beginPath()
		context.moveTo(-20, -5)
		context.quadraticCurveTo(width / 2, -5 + bow * 2, width + 20, -5)
		context.stroke()
		const bannerCount = isCompact ? 5 : Math.max(6, Math.ceil(width / 140))
		const bannerWidth =
			Math.min(isCompact ? 58 : 100, (width / bannerCount) * 0.75) * sceneScale
		for (let index = 0; index < bannerCount; index += 1) {
			const x = ((index + 0.5) * width) / bannerCount
			const position = (x + 20) / (width + 40)
			const y = -5 + bow * 4 * position * (1 - position)
			const slope = Math.atan2(bow * 4 * (1 - position * 2), width + 40)
			const flutter = Math.sin(elapsed * 0.7 + index * 0.65)
			context.save()
			context.translate(x, y)
			context.rotate(slope + flutter * 0.014)
			context.scale(1, 0.97 + Math.sin(elapsed * 0.55 + index * 0.45) * 0.03)
			context.globalAlpha = reveal * 0.66
			context.drawImage(
				banners[index % banners.length],
				-bannerWidth / 2,
				-bannerWidth / 16,
				bannerWidth,
				bannerWidth * 1.25,
			)
			context.restore()
		}

		const petalCount = isCompact ? 24 : petals.length
		for (let index = 0; index < petalCount; index += 1) {
			const petal = petals[index]
			const vertical = wrap(petal.y + elapsed * petal.speed)
			const sway = Math.sin(elapsed * 0.45 + petal.phase)
			const isCentral = petal.x > 0.28 && petal.x < 0.72
			drawSprite(artwork.petals[petal.variant], {
				x: petal.x * width + sway * (isCompact ? 12 : 27),
				y: vertical * (height + 110) - 55,
				size: petal.size * (isCompact ? 0.85 : 1),
				alpha:
					reveal * petal.opacity * edgeFade(vertical) * (isCentral ? 0.4 : 1),
				rotation: petal.rotation + elapsed * petal.spin + sway * 0.25,
				scaleX: 0.7 + Math.sin(elapsed * 0.8 + petal.phase) * 0.3,
			})
		}
		const butterflyCount = isCompact ? 3 : butterflies.length
		for (let index = 0; index < butterflyCount; index += 1) {
			const butterfly = butterflies[index]
			const vertical = wrap(butterfly.y - elapsed * butterfly.speed)
			const sway = Math.sin(elapsed * 0.42 + butterfly.phase)
			drawSprite(artwork.butterflies[butterfly.variant], {
				x: butterfly.x * width + sway * (isCompact ? 15 : 34),
				y:
					vertical * (height + 140) -
					70 +
					Math.sin(elapsed * 0.8 + butterfly.phase) * 8,
				size: butterfly.size * (isCompact ? 0.8 : 1),
				alpha: reveal * butterfly.opacity * edgeFade(vertical),
				rotation: sway * 0.2,
				scaleX:
					0.24 + Math.abs(Math.cos(elapsed * 3.5 + butterfly.phase)) * 0.76,
			})
		}

		const candles = isCompact
			? [
					{ x: width - 74, size: 184, phase: 0 },
					{ x: width - 31, size: 132, phase: 2 },
				]
			: [
					{ x: 207, size: 190, phase: 1 },
					{ x: 262, size: 136, phase: 3 },
					{ x: width - 142, size: 177, phase: 2 },
					{ x: width - 90, size: 250, phase: 0 },
					{ x: width - 40, size: 148, phase: 4 },
				]
		for (const candle of candles) {
			drawCandle({ ...candle, size: candle.size * sceneScale, reveal })
		}
		const skulls = isCompact
			? [{ x: 67, size: 172, variant: 0 }]
			: [
					{ x: 103, size: 232, variant: 0 },
					{ x: width - 242, size: 164, variant: 1 },
				]
		for (const { x, size: baseSize, variant } of skulls) {
			const size = baseSize * sceneScale
			context.globalAlpha = reveal * 0.85
			context.drawImage(
				artwork.skulls[variant],
				x - size / 2,
				height + 4 - (size * 236) / 256,
				size,
				size,
			)
		}
		const flowers = isCompact
			? [
					{ x: 11, size: 58, lift: 12 },
					{ x: 115, size: 60, lift: 9 },
					{ x: 153, size: 43, lift: 4 },
					{ x: width - 115, size: 48, lift: 7 },
					{ x: width - 5, size: 54, lift: 10 },
				]
			: [
					{ x: 17, size: 76, lift: 18 },
					{ x: 43, size: 59, lift: 9 },
					{ x: 162, size: 67, lift: 13 },
					{ x: 194, size: 51, lift: 5 },
					{ x: 284, size: 60, lift: 6 },
					{ x: width - 304, size: 62, lift: 11 },
					{ x: width - 185, size: 63, lift: 11 },
					{ x: width - 11, size: 68, lift: 12 },
				]
		for (const [index, flower] of flowers.entries()) {
			drawSprite(artwork.marigolds[index % artwork.marigolds.length], {
				x: flower.x,
				y: height - flower.lift * sceneScale,
				size: flower.size * sceneScale,
				alpha: reveal * 0.94,
				rotation: index * 0.83,
			})
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

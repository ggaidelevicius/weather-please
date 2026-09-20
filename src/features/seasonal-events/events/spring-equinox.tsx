import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createSpringBranchArtwork } from './spring-branch-artwork'
import { createSpringMeadowArtwork } from './spring-meadow-artwork'

type PlantPlacement = {
	x: number
	scale: number
	variant: number
	phase: number
}

const FLOWER_PLACEMENTS: PlantPlacement[] = [
	{ x: 0.01, scale: 0.48, variant: 4, phase: 0.2 },
	{ x: 0.055, scale: 0.61, variant: 5, phase: 1.4 },
	{ x: 0.105, scale: 0.4, variant: 3, phase: 2.6 },
	{ x: 0.16, scale: 0.57, variant: 0, phase: 0.7 },
	{ x: 0.24, scale: 0.39, variant: 2, phase: 3.1 },
	{ x: 0.35, scale: 0.29, variant: 4, phase: 1.1 },
	{ x: 0.52, scale: 0.26, variant: 3, phase: 2.2 },
	{ x: 0.63, scale: 0.35, variant: 4, phase: 0.5 },
	{ x: 0.725, scale: 0.52, variant: 2, phase: 1.8 },
	{ x: 0.785, scale: 0.76, variant: 1, phase: 2.8 },
	{ x: 0.835, scale: 0.65, variant: 3, phase: 0.9 },
	{ x: 0.885, scale: 0.98, variant: 0, phase: 2.1 },
	{ x: 0.935, scale: 0.85, variant: 2, phase: 0.3 },
	{ x: 0.98, scale: 1, variant: 1, phase: 1.3 },
	{ x: 1.025, scale: 0.64, variant: 4, phase: 3.2 },
]

export async function launchSpringEquinoxGrowth(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create spring garden canvas')
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const petals = Array.from({ length: 26 }, (_, index) => ({
		phase: randomInRange({ min: 0, max: Math.PI * 2 }),
		progress: (index + Math.random()) / 26,
		size: randomInRange({ min: 5, max: 10 }),
		speed: randomInRange({ min: 0.009, max: 0.015 }),
		source: index * 7,
	}))
	const petalSprite = createPetalSprite()
	const dawnGlow = createHazeSprite('#e4b08f')
	const meadowGlow = createHazeSprite('#9bbd89')
	let branch: ReturnType<typeof createSpringBranchArtwork> | null = null
	let meadow: ReturnType<typeof createSpringMeadowArtwork> | null = null
	let grasses: PlantPlacement[] = []
	let artworkDpr = 0
	let width = window.innerWidth
	let height = window.innerHeight
	let shouldAnimate = !motionPreference.matches
	let elapsed = shouldAnimate ? 0 : 6
	let lastTime = performance.now()
	let hasCanceled = false
	let animationFrameId: null | number = null
	let animationGeneration = 0

	canvas.setAttribute('aria-hidden', 'true')
	canvas.setAttribute('data-spring-equinox', 'true')
	Object.assign(canvas.style, {
		background:
			'radial-gradient(ellipse at 15% 100%, #efbb8938, transparent 65%), radial-gradient(ellipse at 85% 0%, #779ec430, transparent 65%), radial-gradient(ellipse at 95% 100%, #73935d2c, transparent 50%)',
		inset: '0',
		mixBlendMode: 'screen',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})
	document.body.appendChild(canvas)
	const animationController = createSettingsModalAnimationController()

	const drawScene = () => {
		if (!branch || !meadow) return
		context.clearRect(0, 0, width, height)
		const opacity = easeOut(elapsed / 2.2)
		const breeze = Math.sin(elapsed * 0.55) + Math.sin(elapsed * 0.23) * 0.45
		const branchScale = Math.min(
			0.72,
			(width * 0.8) / branch.width,
			(height * 0.28) / branch.height,
		)
		const meadowScale = Math.min(1, width / 900 + 0.38, height / 650)
		const branchX = -42 * branchScale
		const branchY = -55 * branchScale

		context.globalAlpha = opacity * (0.065 + Math.sin(elapsed * 0.19) * 0.012)
		context.drawImage(
			dawnGlow,
			-width * 0.35 + Math.sin(elapsed * 0.09) * width * 0.025,
			height * 0.39,
			width * 1.25,
			height,
		)
		context.globalAlpha =
			opacity * (0.055 + Math.sin(elapsed * 0.16 + 2) * 0.01)
		context.drawImage(
			meadowGlow,
			width * 0.37,
			height * 0.55 + Math.sin(elapsed * 0.12) * height * 0.015,
			width,
			height * 0.72,
		)
		context.globalAlpha = 1

		context.save()
		context.translate(branchX, branchY)
		context.rotate(breeze * 0.004)
		context.scale(branchScale, branchScale)
		context.globalAlpha = opacity * 0.2
		context.drawImage(branch.canvas, 0, 0, branch.width, branch.height)
		for (const flower of branch.blossoms) {
			const opening = easeOut((elapsed - flower.delay) / 2.1)
			const size = flower.size * (0.28 + opening * 0.72)
			context.save()
			context.translate(flower.x, flower.y)
			context.rotate(flower.rotation)
			context.globalAlpha = opacity * opening * 0.46
			context.drawImage(
				branch.blossomSprites[flower.variant],
				-size / 2,
				-size / 2,
				size,
				size,
			)
			context.restore()
		}
		context.restore()

		for (const [index, grass] of grasses.entries()) {
			const sprite = meadow.grasses[grass.variant]
			const scale = meadowScale * grass.scale * 0.85
			context.save()
			context.translate(grass.x * width, height + 6)
			context.transform(
				1,
				0,
				-(breeze + Math.sin(elapsed * 0.6 + grass.phase) * 0.3) * 0.055,
				1,
				0,
				0,
			)
			context.globalAlpha = opacity * (index % 2 === 0 ? 0.28 : 0.42)
			context.drawImage(
				sprite.canvas,
				-sprite.baseX * scale,
				-sprite.baseY * scale,
				sprite.width * scale,
				sprite.height * scale,
			)
			context.restore()
		}

		for (const plant of FLOWER_PLACEMENTS) {
			const sprite = meadow.flowers[plant.variant]
			const scale = meadowScale * plant.scale * 0.72
			const growth = easeOut((elapsed - 0.3 - plant.phase * 0.25) / 2.4)
			context.save()
			context.translate(plant.x * width, height + 4)
			context.rotate(
				(breeze + Math.sin(elapsed * 0.6 + plant.phase) * 0.35) * 0.016,
			)
			context.scale(1, 0.84 + growth * 0.16)
			context.globalAlpha = opacity * growth * 0.46
			context.drawImage(
				sprite.canvas,
				-sprite.baseX * scale,
				-sprite.baseY * scale,
				sprite.width * scale,
				sprite.height * scale,
			)
			context.restore()
		}

		const petalCount = width < 600 ? 15 : petals.length
		for (let index = 0; index < petalCount; index += 1) {
			const petal = petals[index]
			const source = branch.blossoms[petal.source % branch.blossoms.length]
			const progress = (petal.progress + elapsed * petal.speed) % 1
			const originX = branchX + source.x * branchScale
			const originY = branchY + source.y * branchScale
			const x =
				originX +
				progress * (width - originX + 65) +
				Math.sin(elapsed * 0.65 + petal.phase) * 14
			const y =
				originY +
				progress * (height - originY + 60) +
				Math.sin(elapsed * 0.4 + petal.phase) * 9
			const size = petal.size * (width < 600 ? 0.8 : 1)
			context.save()
			context.translate(x, y)
			context.rotate(elapsed * 0.3 + petal.phase)
			context.scale(
				0.35 + Math.abs(Math.cos(elapsed * 0.9 + petal.phase)) * 0.65,
				1,
			)
			context.globalAlpha =
				opacity * Math.min(1, progress * 12, (1 - progress) * 8) * 0.5
			context.drawImage(petalSprite, -size / 2, -size / 2, size, size)
			context.restore()
		}
	}

	const resizeCanvas = () => {
		width = Math.max(1, window.innerWidth)
		height = Math.max(1, window.innerHeight)
		const dpr = getCanvasDpr({ height, maxDpr: 2, width })
		canvas.width = Math.round(width * dpr)
		canvas.height = Math.round(height * dpr)
		canvas.style.width = `${width}px`
		canvas.style.height = `${height}px`
		context.setTransform(dpr, 0, 0, dpr, 0, 0)
		if (!branch || !meadow || artworkDpr !== dpr) {
			branch = createSpringBranchArtwork({ dpr })
			meadow = createSpringMeadowArtwork({ dpr })
			artworkDpr = dpr
		}
		const grassCount = Math.min(32, Math.ceil(width / 65) + 1)
		const grassVariantCount = meadow.grasses.length
		grasses = Array.from({ length: grassCount }, (_, index) => ({
			x: index / (grassCount - 1),
			scale: 0.48 + ((index * 7) % 9) * 0.04,
			variant: index % grassVariantCount,
			phase: index * 1.7,
		}))
		drawScene()
	}

	const renderFrame = (time: number, generation: number) => {
		// A settings-resume callback may already be queued when visibility changes.
		if (hasCanceled || generation !== animationGeneration) return
		animationFrameId = null
		if (!shouldAnimate || document.hidden) return
		if (!animationController.isPaused()) {
			elapsed += Math.min(Math.max(0, (time - lastTime) / 1000), 0.05)
			lastTime = time
			drawScene()
		}
		animationFrameId = animationController.requestAnimationFrame((nextTime) =>
			renderFrame(nextTime, generation),
		)
	}

	const syncAnimation = () => {
		animationGeneration += 1
		if (animationFrameId !== null) {
			animationController.cancelAnimationFrame(animationFrameId)
			animationFrameId = null
		}
		shouldAnimate = !motionPreference.matches
		lastTime = performance.now()
		if (!shouldAnimate) {
			elapsed = Math.max(elapsed, 6)
			drawScene()
		} else if (!document.hidden) {
			const generation = animationGeneration
			animationFrameId = animationController.requestAnimationFrame((time) =>
				renderFrame(time, generation),
			)
		}
	}

	const cleanup = () => {
		hasCanceled = true
		if (animationFrameId !== null) {
			animationController.cancelAnimationFrame(animationFrameId)
		}
		animationController.dispose()
		window.removeEventListener('resize', resizeCanvas)
		document.removeEventListener('visibilitychange', syncAnimation)
		motionPreference.removeEventListener('change', syncAnimation)
		canvas.remove()
	}

	try {
		resizeCanvas()
		window.addEventListener('resize', resizeCanvas)
		document.addEventListener('visibilitychange', syncAnimation)
		motionPreference.addEventListener('change', syncAnimation)
		syncAnimation()
	} catch (error) {
		cleanup()
		throw error
	}
	return cleanup
}

function easeOut(progress: number) {
	return 1 - (1 - Math.min(1, Math.max(0, progress))) ** 3
}

function createHazeSprite(color: string): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = 128
	canvas.height = 128
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create spring dawn light')
	const glow = context.createRadialGradient(64, 64, 0, 64, 64, 64)
	glow.addColorStop(0, color)
	glow.addColorStop(0.35, `${color}a0`)
	glow.addColorStop(0.7, `${color}35`)
	glow.addColorStop(1, `${color}00`)
	context.fillStyle = glow
	context.fillRect(0, 0, 128, 128)
	return canvas
}

function createPetalSprite(): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = 48
	canvas.height = 48
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create spring petal artwork')
	const blush = context.createLinearGradient(7, 7, 35, 41)
	blush.addColorStop(0, '#fff3e9')
	blush.addColorStop(0.42, '#edc4cc')
	blush.addColorStop(1, '#b97f9a')
	context.fillStyle = blush
	context.beginPath()
	context.moveTo(12, 37)
	context.bezierCurveTo(4, 21, 14, 4, 31, 7)
	context.bezierCurveTo(47, 15, 34, 34, 12, 37)
	context.closePath()
	context.fill()
	context.strokeStyle = '#fff3e95c'
	context.lineWidth = 1.1
	context.beginPath()
	context.moveTo(13, 35)
	context.quadraticCurveTo(25, 24, 29, 11)
	context.stroke()
	return canvas
}

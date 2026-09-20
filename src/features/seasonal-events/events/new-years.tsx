import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'
import { getCanvasDpr, randomInRange } from '../core/utils'
import type { NewYearsFirework } from './new-years-fireworks'
import {
	createNewYearsFirework,
	drawNewYearsFirework,
} from './new-years-fireworks'

const GOLD = '#f8d991'
const CONFETTI_COLORS = [GOLD, '#fff4cf', '#c3b5ff', '#d98d54']
const MAX_FIREWORKS = 8
const SAMPLE_WIDTH = 800
const SAMPLE_HEIGHT = 240
const YEAR_FONT = '600 220px "Helvetica Neue", Arial, sans-serif'
const FOUNTAIN_ORIGINS = [0.04, 0.2, 0.8, 0.96]

type Spark = {
	cosine: number
	sine: number
	phase: number
	size: number
	x: number
	y: number
}

export async function launchNewYearsCelebration(): Promise<() => void> {
	if (typeof window === 'undefined') {
		return () => {}
	}

	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) {
		throw new Error('Unable to create 2D context for New Year celebration')
	}

	const now = new Date()
	// Overrides preview the next celebration; January 1 celebrates the current year.
	const year = String(
		now.getFullYear() + (now.getMonth() === 0 && now.getDate() === 1 ? 0 : 1),
	)
	const { points, textWidth, lettering } = createYearArtwork(year)
	const sparkSprite = createSparkSprite()
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	let shouldAnimate = !motionPreference.matches
	let hasCanceled = false
	let animationFrameId: null | number = null
	let animationGeneration = 0
	let lastTime = performance.now()
	let elapsed = 0
	let nextFirework = 0.15
	let volleyIndex = 0
	let width = window.innerWidth
	let height = window.innerHeight
	let fireworks: NewYearsFirework[] = []
	const dust = Array.from({ length: 100 }, createSpark)
	const confetti = Array.from({ length: 65 }, createSpark)
	const fountains = Array.from({ length: 100 }, createSpark)
	let beamGradient: CanvasGradient

	canvas.setAttribute('aria-hidden', 'true')
	canvas.setAttribute('data-new-years', year)
	Object.assign(canvas.style, {
		background:
			'radial-gradient(ellipse at 50% 4%, #c98b393b, transparent 60%), radial-gradient(ellipse at 5% 34%, #644abd33, transparent 55%), radial-gradient(ellipse at 95% 32%, #3f65c52e, transparent 55%), radial-gradient(ellipse at 50% 115%, #e69b383d, transparent 60%)',
		inset: '0',
		mixBlendMode: 'screen',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})
	document.body.appendChild(canvas)
	const animationController = createSettingsModalAnimationController()

	const drawScene = () => {
		context.clearRect(0, 0, width, height)
		context.globalAlpha = 1
		const reveal = shouldAnimate ? Math.min(1, elapsed / 1.4) : 1
		const yearWidth = Math.min(width * 0.76, height * 1.05, 780)
		const scale = yearWidth / textWidth
		const centerY = Math.min(height * 0.225, 190)
		const spotlightSway = Math.sin(elapsed * 0.12) * 0.06
		const fountainReach = Math.min(height * 0.28, 200)
		const fountainSpread = Math.min(width * 0.22, 190)

		// Broad light fans and a warm horizon give the fireworks a stage.
		context.fillStyle = beamGradient
		for (let index = 0; index < 8; index += 1) {
			const origin = index < 4 ? width * 0.08 : width * 0.92
			const angle = (index % 4) * 0.23 + spotlightSway
			const reach = height * (0.48 + (index % 3) * 0.12)
			const direction = index < 4 ? 1 : -1
			context.globalAlpha = (0.1 + (index % 2) * 0.055) * reveal
			context.beginPath()
			context.moveTo(origin, height)
			context.lineTo(origin + direction * reach * angle, height - reach)
			context.lineTo(
				origin + direction * reach * (angle + 0.14),
				height - reach,
			)
			context.closePath()
			context.fill()
		}

		for (const firework of fireworks) {
			drawNewYearsFirework({ context, firework, height, sparkSprite, width })
		}

		context.globalCompositeOperation = 'lighter'
		for (const spark of dust) {
			const drift = shouldAnimate ? elapsed * (3 + spark.size) : 0
			const x = spark.x * width + Math.sin(elapsed * 0.16 + spark.phase) * 8
			const y = (((spark.y * height - drift) % height) + height) % height
			const twinkle = 0.5 + Math.sin(elapsed * 0.7 + spark.phase) * 0.3
			context.globalAlpha = twinkle * reveal * 0.7
			context.fillStyle = GOLD
			context.fillRect(x, y, spark.size, spark.size)
			if (spark.size > 1.65) {
				context.globalAlpha = twinkle * reveal * 0.23
				context.drawImage(sparkSprite, x - 7, y - 7, 14, 14)
			}
		}

		for (const [index, spark] of fountains.entries()) {
			const progress = (elapsed * 0.24 + spark.phase / (Math.PI * 2)) % 1
			const origin = FOUNTAIN_ORIGINS[index % FOUNTAIN_ORIGINS.length] * width
			const reach = fountainReach * (0.35 + spark.y * 0.65)
			const spread = (spark.x - 0.5) * fountainSpread
			const x = origin + spread * progress
			const y = height + 8 - Math.sin(progress * Math.PI) * reach
			context.globalAlpha = Math.sin(progress * Math.PI) * reveal * 0.85
			context.strokeStyle = GOLD
			context.lineWidth = spark.size * 0.65
			context.beginPath()
			context.moveTo(x - spread * 0.025, y + (1 - progress * 2) * 9)
			context.lineTo(x, y)
			context.stroke()
			context.drawImage(sparkSprite, x - 4, y - 4, 8, 8)
		}
		context.globalCompositeOperation = 'source-over'

		for (const [index, piece] of confetti.entries()) {
			const fall = shouldAnimate ? elapsed * (15 + piece.size * 10) : 0
			const y = ((piece.y * (height + 50) + fall) % (height + 50)) - 25
			const x = piece.x * width + Math.sin(elapsed * 0.7 + piece.phase) * 26
			const flutter = Math.cos(elapsed * 1.8 + piece.phase)
			context.save()
			context.translate(x, y)
			context.rotate(piece.phase + elapsed * 0.35)
			context.globalAlpha = (0.35 + Math.abs(flutter) * 0.45) * reveal
			context.fillStyle = CONFETTI_COLORS[index % CONFETTI_COLORS.length]
			context.fillRect(
				-piece.size,
				-piece.size * 2.5,
				piece.size * 2 * flutter,
				piece.size * 5,
			)
			context.restore()
		}

		context.save()
		context.translate(width / 2, centerY)
		context.scale(scale, scale)
		const letteringReveal = shouldAnimate
			? Math.min(1, Math.max(0, (elapsed - 0.65) / 1.8))
			: 1
		context.globalAlpha = letteringReveal * 0.92
		context.drawImage(lettering, -SAMPLE_WIDTH / 2, -SAMPLE_HEIGHT / 2)

		context.globalCompositeOperation = 'lighter'
		const gather = shouldAnimate ? (1 - reveal) ** 3 : 0
		const sweepPosition = ((elapsed * 0.15) % 1.6) - 0.8
		const shimmerSine = Math.sin(elapsed * 1.25)
		const shimmerCosine = Math.cos(elapsed * 1.25)
		for (const point of points) {
			const shimmer =
				0.5 + (shimmerSine * point.cosine + shimmerCosine * point.sine) * 0.25
			const x = point.x + point.cosine * gather * 160
			const y = point.y + point.sine * gather * 100
			const sweep = Math.max(
				0,
				1 - Math.abs(point.x / textWidth - sweepPosition) * 12,
			)
			context.globalAlpha = (shimmer * 0.45 + sweep * 0.55) * reveal
			context.fillStyle = '#fff2c9'
			context.fillRect(x, y, point.size * 0.7, point.size * 0.7)
			if (point.size > 1.7 && sweep > 0.5) {
				context.globalAlpha = sweep * reveal * 0.65
				context.drawImage(sparkSprite, x - 8, y - 8, 16, 16)
				context.fillRect(x - 5, y, 10, 0.5)
				context.fillRect(x, y - 5, 0.5, 10)
			}
		}
		context.restore()
		context.globalAlpha = 1
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
		beamGradient = context.createLinearGradient(0, height, 0, height * 0.2)
		beamGradient.addColorStop(0, '#ffc568')
		beamGradient.addColorStop(0.5, '#d08b4933')
		beamGradient.addColorStop(1, 'transparent')
		drawScene()
	}

	const renderFrame = (time: number, generation: number) => {
		// Settings can resume a queued callback just before visibility changes.
		if (hasCanceled || generation !== animationGeneration) return
		animationFrameId = null
		if (!shouldAnimate || document.hidden) return
		if (!animationController.isPaused()) {
			const delta = Math.min((time - lastTime) / 1000, 0.05)
			lastTime = time
			elapsed += delta
			if (elapsed >= nextFirework) {
				const isFinale = volleyIndex % 8 === 0
				const count = isFinale ? 3 : 2
				for (
					let index = 0;
					index < count && fireworks.length < MAX_FIREWORKS;
					index += 1
				) {
					const x =
						index === 2
							? 0.5
							: index === 0
								? randomInRange({ min: 0.1, max: 0.27 })
								: randomInRange({ min: 0.73, max: 0.9 })
					fireworks.push(
						createNewYearsFirework({
							delay: index * 0.24,
							paletteIndex: isFinale ? 0 : volleyIndex + index,
							variant: isFinale ? 'willow' : undefined,
							x,
							y: index === 2 ? 0.14 : randomInRange({ min: 0.18, max: 0.48 }),
						}),
					)
				}
				volleyIndex += 1
				nextFirework =
					elapsed + (isFinale ? 2.5 : randomInRange({ min: 1.5, max: 2.1 }))
			}
			fireworks = fireworks.filter((firework) => {
				firework.age += delta
				return firework.age < firework.duration
			})
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
		const wasAnimating = shouldAnimate
		shouldAnimate = !motionPreference.matches
		lastTime = performance.now()
		if (!shouldAnimate) {
			fireworks = [0.15, 0.85, 0.3, 0.7].map((x, index) => ({
				...createNewYearsFirework({
					x,
					y: index < 2 ? 0.32 : 0.65,
					paletteIndex: index,
				}),
				age: 2.3 + index * 0.35,
			}))
			drawScene()
		} else if (!document.hidden) {
			if (!wasAnimating) {
				fireworks = []
				nextFirework = elapsed + 0.15
			}
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

function createYearArtwork(year: string) {
	const sample = document.createElement('canvas')
	sample.width = SAMPLE_WIDTH
	sample.height = SAMPLE_HEIGHT
	const context = sample.getContext('2d')
	if (!context) {
		throw new Error('Unable to create New Year lettering')
	}
	context.font = YEAR_FONT
	context.textAlign = 'center'
	context.textBaseline = 'middle'
	context.fillText(year, SAMPLE_WIDTH / 2, SAMPLE_HEIGHT / 2)
	const { data } = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)
	const points: Spark[] = []
	for (let y = 0; y < SAMPLE_HEIGHT; y += 5) {
		for (let x = 0; x < SAMPLE_WIDTH; x += 5) {
			if (data[(y * SAMPLE_WIDTH + x) * 4 + 3] > 100) {
				points.push({
					...createSpark(),
					x: x - SAMPLE_WIDTH / 2 + randomInRange({ max: 0.8, min: -0.8 }),
					y: y - SAMPLE_HEIGHT / 2 + randomInRange({ max: 0.8, min: -0.8 }),
				})
			}
		}
	}
	context.clearRect(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)
	const gold = context.createLinearGradient(0, 35, 0, 205)
	gold.addColorStop(0, '#fff9df')
	gold.addColorStop(0.27, '#f8d68a')
	gold.addColorStop(0.48, '#b77b31')
	gold.addColorStop(0.53, '#ffeeb5')
	gold.addColorStop(0.8, '#d19b4b')
	gold.addColorStop(1, '#fff2c5')
	context.fillStyle = gold
	context.shadowColor = '#edb84b'
	context.shadowBlur = 18
	context.fillText(year, SAMPLE_WIDTH / 2, SAMPLE_HEIGHT / 2)
	context.shadowBlur = 0
	context.strokeStyle = '#fff0bd'
	context.lineWidth = 0.6
	context.strokeText(year, SAMPLE_WIDTH / 2, SAMPLE_HEIGHT / 2)
	return {
		points,
		textWidth: context.measureText(year).width,
		lettering: sample,
	}
}

function createSpark(): Spark {
	const phase = Math.random() * Math.PI * 2
	return {
		cosine: Math.cos(phase),
		sine: Math.sin(phase),
		phase,
		size: randomInRange({ max: 1.8, min: 0.7 }),
		x: Math.random(),
		y: Math.random(),
	}
}

function createSparkSprite(): HTMLCanvasElement {
	const sprite = document.createElement('canvas')
	sprite.width = 48
	sprite.height = 48
	const context = sprite.getContext('2d')
	if (!context) {
		throw new Error('Unable to create New Year spark glow')
	}
	const glow = context.createRadialGradient(24, 24, 0, 24, 24, 24)
	glow.addColorStop(0, '#fffef5')
	glow.addColorStop(0.12, '#fff4d6e6')
	glow.addColorStop(0.35, '#ffe9b366')
	glow.addColorStop(1, '#ffe9b300')
	context.fillStyle = glow
	context.fillRect(0, 0, 48, 48)
	return sprite
}

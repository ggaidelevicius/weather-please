import { Trans } from '@lingui/react/macro'

import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'
import {
	type SeasonalEvent,
	type SeasonalEventContext,
	SeasonalEventId,
} from '../core/types'
import { getCanvasDpr, randomInRange } from '../core/utils'

const HANUKKAH_START_DATES = new Set([
	'2026-12-04',
	'2027-11-25',
	'2028-12-12',
	'2029-12-01',
	'2030-12-20',
	'2031-12-10',
	'2032-11-28',
	'2033-12-17',
	'2034-12-07',
	'2035-12-26',
	'2036-12-14',
	'2037-12-03',
	'2038-12-22',
	'2039-12-12',
	'2040-11-30',
	'2041-12-19',
	'2042-12-08',
	'2043-12-27',
])
const HANUKKAH_MOUNT_DELAY_MS = 900
const HANUKKAH_OVERLAY_OPACITY = '0.72'
const HANUKKAH_OVERLAY_FILTER = 'saturate(130%)'
const HANUKKAH_MAX_DPR = 2
const HANUKKAH_SCENE_FADE_DELAY_MS = 300
const HANUKKAH_SCENE_FADE_DURATION_MS = 1400
const HANUKKAH_STAR_COUNT = 140
const HANUKKAH_STAR_RADIUS_RANGE = { max: 1.4, min: 0.5 }
const HANUKKAH_STAR_OPACITY_RANGE = { max: 0.6, min: 0.2 }
const HANUKKAH_STAR_TWINKLE_RANGE = { max: 0.0012, min: 0.0005 }
const HANUKKAH_CANDLE_COUNT = 9
const HANUKKAH_CANDLE_SIZE_RANGE = { max: 18, min: 12 }
const HANUKKAH_CANDLE_FLICKER_RANGE = { max: 0.0015, min: 0.0008 }
const HANUKKAH_SPARK_COUNT = 26
const HANUKKAH_SPARK_SIZE_RANGE = { max: 5, min: 2 }
const HANUKKAH_SPARK_SPEED_RANGE = { max: 16, min: 7 }
const HANUKKAH_SPARK_SWAY_RANGE = { max: 14, min: 5 }
const HANUKKAH_SPARK_OPACITY_RANGE = { max: 0.75, min: 0.3 }
const HANUKKAH_SPARK_FADE_IN_DELAY_RANGE = { max: 2200, min: 0 }
const HANUKKAH_SPARK_FADE_IN_DURATION_RANGE = { max: 2000, min: 900 }
const HANUKKAH_SPARK_COLORS = [
	'rgba(226, 232, 240, 0.8)',
	'rgba(191, 219, 254, 0.75)',
	'rgba(96, 165, 250, 0.7)',
	'rgba(251, 191, 36, 0.65)',
]
const HANUKKAH_CANDLE_COLORS = [
	{ core: 'rgba(253, 230, 138, 0.92)', mid: 'rgba(253, 230, 138, 0.45)' },
	{ core: 'rgba(96, 165, 250, 0.78)', mid: 'rgba(96, 165, 250, 0.35)' },
	{ core: 'rgba(248, 250, 252, 0.75)', mid: 'rgba(248, 250, 252, 0.3)' },
	{ core: 'rgba(59, 130, 246, 0.7)', mid: 'rgba(59, 130, 246, 0.3)' },
	{ core: 'rgba(251, 191, 36, 0.82)', mid: 'rgba(251, 191, 36, 0.4)' },
]

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Hanukkah is a Jewish festival of lights, observed over eight nights.
			</Trans>
		</p>
		<p>
			<Trans>
				Each evening, another candle is added to the menorah, gradually building
				the display of light.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The festival commemorates the rededication of the Second Temple in
				Jerusalem.
			</Trans>
		</p>
		<p>
			<Trans>
				According to tradition, a small supply of oil, meant for one day, lasted
				eight.
			</Trans>
		</p>

		<h2>
			<Trans>Traditions</Trans>
		</h2>
		<p>
			<Trans>
				Families gather to light the menorah, sing songs, and play games such as
				dreidel.
			</Trans>
		</p>
		<p>
			<Trans>
				Foods fried in oil, including latkes and sufganiyot, reflect the central
				symbol of the story.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The menorah is placed in a window or doorway so the light faces outward
				— the tradition is specifically about making the flames visible to
				passersby.
			</Trans>
		</p>
		<p>
			<Trans>
				Dreidel, often dismissed as a children&apos;s game, was historically
				used as a cover for Torah study during periods when it was outlawed.
				Each Hebrew letter on its sides forms an acronym: &quot;A great miracle
				happened there.&quot;
			</Trans>
		</p>
	</>
)

export const hanukkahEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Hanukkah,
	isActive: isHanukkah,
	run: launchHanukkahGlow,
	tileAccent: {
		colors: ['#e0f2fe', '#60a5fa', '#fbbf24', '#fde68a', '#e0f2fe'],
	},
}

function isHanukkah({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return HANUKKAH_START_DATES.has(`${year}-${month}-${day}`)
}

async function launchHanukkahGlow() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const animationController = createSettingsModalAnimationController({
			shouldAnimate,
		})
		const overlay = document.createElement('div')
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for Hanukkah canvas')
		}

		type Star = {
			opacity: number
			phase: number
			radius: number
			twinkle: number
			x: number
			y: number
		}
		type Candle = {
			color: { core: string; mid: string }
			flickerPhase: number
			flickerSpeed: number
			isShamash: boolean
			radius: number
			x: number
			y: number
		}
		type Spark = {
			baseX: number
			birthTime: number
			color: string
			fadeDuration: number
			opacity: number
			phase: number
			size: number
			sway: number
			vy: number
			y: number
		}

		let timeoutId: null | number = null
		let animationFrameId: null | number = null
		let width = window.innerWidth
		let height = window.innerHeight
		let stars: Star[] = []
		let candles: Candle[] = []
		let sparks: Spark[] = []
		let lastTime = performance.now()
		let sceneFadeStart = performance.now()

		const createStar = (): Star => ({
			opacity: randomInRange(HANUKKAH_STAR_OPACITY_RANGE),
			phase: Math.random() * Math.PI * 2,
			radius: randomInRange(HANUKKAH_STAR_RADIUS_RANGE),
			twinkle: randomInRange(HANUKKAH_STAR_TWINKLE_RANGE),
			x: Math.random() * width,
			y: Math.random() * height,
		})

		const createCandles = (): Candle[] => {
			const rowWidth = Math.min(width * 0.6, 440)
			const spacing = rowWidth / (HANUKKAH_CANDLE_COUNT - 1)
			const startX = width / 2 - rowWidth / 2
			const baseY = height * 0.78
			const shamashIndex = Math.floor(HANUKKAH_CANDLE_COUNT / 2)

			return Array.from({ length: HANUKKAH_CANDLE_COUNT }, (_, index) => {
				const radius = randomInRange(HANUKKAH_CANDLE_SIZE_RANGE)
				const color =
					HANUKKAH_CANDLE_COLORS[index % HANUKKAH_CANDLE_COLORS.length]
				const yOffset = index === shamashIndex ? radius * 0.65 : 0
				const sizeBoost = index === shamashIndex ? 1.12 : 1

				return {
					color,
					flickerPhase: Math.random() * Math.PI * 2,
					flickerSpeed: randomInRange(HANUKKAH_CANDLE_FLICKER_RANGE),
					isShamash: index === shamashIndex,
					radius: radius * sizeBoost,
					x: startX + spacing * index,
					y: baseY - yOffset,
				}
			})
		}

		const randomSparkColor = () =>
			HANUKKAH_SPARK_COLORS[
				Math.floor(Math.random() * HANUKKAH_SPARK_COLORS.length)
			]

		const createSpark = (time: number): Spark => ({
			baseX: Math.random() * width,
			birthTime: time + randomInRange(HANUKKAH_SPARK_FADE_IN_DELAY_RANGE),
			color: randomSparkColor(),
			fadeDuration: randomInRange(HANUKKAH_SPARK_FADE_IN_DURATION_RANGE),
			opacity: randomInRange(HANUKKAH_SPARK_OPACITY_RANGE),
			phase: Math.random() * Math.PI * 2,
			size: randomInRange(HANUKKAH_SPARK_SIZE_RANGE),
			sway: randomInRange(HANUKKAH_SPARK_SWAY_RANGE),
			vy: randomInRange(HANUKKAH_SPARK_SPEED_RANGE),
			y: height + Math.random() * height * 0.25,
		})

		const resetField = (time: number) => {
			stars = Array.from({ length: HANUKKAH_STAR_COUNT }, createStar)
			candles = createCandles()
			sparks = Array.from({ length: HANUKKAH_SPARK_COUNT }, () =>
				createSpark(time),
			)
		}

		const resizeCanvas = () => {
			width = window.innerWidth
			height = window.innerHeight
			const dpr = getCanvasDpr({ height, maxDpr: HANUKKAH_MAX_DPR, width })
			canvas.width = Math.round(width * dpr)
			canvas.height = Math.round(height * dpr)
			canvas.style.width = `${width}px`
			canvas.style.height = `${height}px`
			context.setTransform(dpr, 0, 0, dpr, 0, 0)
			resetField(performance.now())
		}

		const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)

		const drawStars = (time: number, alpha: number) => {
			context.fillStyle = 'rgba(226, 232, 240, 1)'
			for (const star of stars) {
				const twinkle = 0.6 + 0.4 * Math.sin(time * star.twinkle + star.phase)
				context.globalAlpha = alpha * star.opacity * twinkle
				context.beginPath()
				context.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
				context.fill()
			}
		}

		const drawCandles = (time: number, alpha: number) => {
			const sorted = [...candles].sort((a, b) => a.x - b.x)
			const left = sorted[0]
			const right = sorted[sorted.length - 1]
			const spacing = right.x - left.x
			const baseY = Math.max(
				...candles.map((candle) => candle.y + candle.radius * 0.7),
			)
			const shamash = candles.find((candle) => candle.isShamash)

			if (left && right) {
				const barH = Math.max(6, spacing * 0.025)

				const shamashIndex = Math.floor(HANUKKAH_CANDLE_COUNT / 2)
				const pairCount = Math.floor(HANUKKAH_CANDLE_COUNT / 2)
				for (let pair = 1; pair <= pairCount; pair += 1) {
					const leftCandle = sorted[shamashIndex - pair]
					const rightCandle = sorted[shamashIndex + pair]
					if (!leftCandle || !rightCandle) {
						continue
					}

					const endY = baseY + barH * 0.25
					const archDepth = spacing * (0.4 + pair * 0.12)
					const midY = baseY + archDepth
					const inset = spacing * 0.12

					context.save()
					context.globalAlpha = alpha * 0.42
					context.strokeStyle = 'rgba(148, 163, 184, 0.55)'
					context.lineWidth = Math.max(2, spacing * 0.014)
					context.shadowColor = 'rgba(59, 130, 246, 0.35)'
					context.shadowBlur = barH * 1.6
					context.lineCap = 'round'
					context.beginPath()
					context.moveTo(leftCandle.x, endY)
					context.quadraticCurveTo(
						leftCandle.x,
						midY,
						leftCandle.x + inset,
						midY,
					)
					context.lineTo(rightCandle.x - inset, midY)
					context.quadraticCurveTo(rightCandle.x, midY, rightCandle.x, endY)
					context.stroke()
					context.restore()
				}

				if (shamash) {
					const stemTop = shamash.y + shamash.radius * 1.8
					const stemBottom = baseY + spacing * 0.95
					context.save()
					context.globalAlpha = alpha * 0.8
					context.strokeStyle = 'rgba(226, 232, 240, 0.7)'
					context.lineWidth = Math.max(3.5, spacing * 0.024)
					context.lineCap = 'round'
					context.beginPath()
					context.moveTo(shamash.x, stemTop)
					context.lineTo(shamash.x, stemBottom)
					context.stroke()
					context.restore()
				}
			}

			for (const candle of candles) {
				const stemHeight = candle.radius * 1.6
				context.globalAlpha = alpha * (candle.isShamash ? 0.8 : 0.6)
				context.strokeStyle = candle.isShamash
					? 'rgba(226, 232, 240, 0.65)'
					: 'rgba(147, 197, 253, 0.45)'
				context.lineWidth = Math.max(3, candle.radius * 0.28)
				context.lineCap = 'round'
				context.beginPath()
				context.moveTo(candle.x, baseY)
				context.lineTo(candle.x, candle.y + stemHeight * 0.75)
				context.stroke()
			}

			for (const candle of candles) {
				const flicker =
					0.85 +
					0.15 * Math.sin(time * candle.flickerSpeed + candle.flickerPhase)
				const glowRadius = candle.radius * (1.7 + flicker * 0.45)
				const gradient = context.createRadialGradient(
					candle.x,
					candle.y,
					0,
					candle.x,
					candle.y,
					glowRadius,
				)
				gradient.addColorStop(0, candle.color.core)
				gradient.addColorStop(0.5, candle.color.mid)
				gradient.addColorStop(1, 'rgba(15, 23, 42, 0)')
				context.globalAlpha = alpha * (0.75 + flicker * 0.25)
				context.fillStyle = gradient
				context.beginPath()
				context.arc(candle.x, candle.y, glowRadius, 0, Math.PI * 2)
				context.fill()
			}
		}

		const drawSpark = (
			spark: Spark,
			time: number,
			alpha: number,
			sceneAlpha: number,
		) => {
			const sway = Math.sin(time * 0.0006 + spark.phase) * spark.sway
			const x = spark.baseX + sway
			const y = spark.y
			const radius = spark.size * 2.2
			const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
			gradient.addColorStop(0, spark.color)
			gradient.addColorStop(0.6, spark.color.replace('0.', '0.25'))
			gradient.addColorStop(1, 'rgba(15, 23, 42, 0)')
			context.globalAlpha = alpha * sceneAlpha
			context.fillStyle = gradient
			context.beginPath()
			context.arc(x, y, radius, 0, Math.PI * 2)
			context.fill()
		}

		const tick = (time: number) => {
			const delta = Math.min(time - lastTime, 48)
			lastTime = time
			const sceneFadeProgress = Math.min(
				Math.max((time - sceneFadeStart) / HANUKKAH_SCENE_FADE_DURATION_MS, 0),
				1,
			)
			const sceneAlpha = easeOutCubic(sceneFadeProgress)
			context.clearRect(0, 0, width, height)
			context.globalCompositeOperation = 'lighter'
			drawCandles(time, sceneAlpha)
			drawStars(time, sceneAlpha)

			for (const spark of sparks) {
				spark.y -= (spark.vy * delta) / 1000
				if (spark.y < -spark.size * 2) {
					Object.assign(spark, createSpark(time))
				}

				const fadeProgress = Math.min(
					Math.max((time - spark.birthTime) / spark.fadeDuration, 0),
					1,
				)
				const fade = easeOutCubic(fadeProgress)
				drawSpark(spark, time, spark.opacity * fade, sceneAlpha)
			}

			if (shouldAnimate) {
				animationFrameId = animationController.requestAnimationFrame(tick)
			}
		}

		const drawStatic = () => {
			const now = performance.now()
			context.clearRect(0, 0, width, height)
			context.globalCompositeOperation = 'lighter'
			drawCandles(now, 1)
			drawStars(now, 1)
			for (let i = 0; i < Math.min(8, sparks.length); i += 1) {
				const spark = createSpark(now)
				spark.baseX = width * (0.2 + i * 0.08)
				spark.y = height * (0.7 - i * 0.03)
				drawSpark(spark, now, spark.opacity, 1)
			}
		}

		overlay.style.position = 'fixed'
		overlay.style.inset = '0'
		overlay.style.pointerEvents = 'none'
		overlay.style.zIndex = '0'
		overlay.style.opacity = HANUKKAH_OVERLAY_OPACITY
		overlay.style.filter = HANUKKAH_OVERLAY_FILTER
		overlay.appendChild(canvas)

		const mount = () => {
			document.body.appendChild(overlay)
			resizeCanvas()
			sceneFadeStart = performance.now() + HANUKKAH_SCENE_FADE_DELAY_MS
			if (shouldAnimate) {
				lastTime = performance.now()
				animationFrameId = animationController.requestAnimationFrame(tick)
			} else {
				drawStatic()
			}
		}

		timeoutId = window.setTimeout(mount, HANUKKAH_MOUNT_DELAY_MS)

		const handleResize = () => {
			resizeCanvas()
			if (!shouldAnimate) {
				drawStatic()
			}
		}
		window.addEventListener('resize', handleResize)

		return () => {
			animationController.dispose()
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId)
			}
			if (animationFrameId !== null) {
				animationController.cancelAnimationFrame(animationFrameId)
			}
			window.removeEventListener('resize', handleResize)
			if (overlay.parentElement) {
				overlay.parentElement.removeChild(overlay)
			}
		}
	} catch (error) {
		console.error('Failed to launch Hanukkah glow', error)
		return () => {}
	}
}

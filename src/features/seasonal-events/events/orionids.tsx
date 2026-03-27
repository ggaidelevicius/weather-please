import { Trans } from '@lingui/react/macro'

import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'
import {
	type SeasonalEvent,
	type SeasonalEventContext,
	SeasonalEventId,
} from '../core/types'
import { createAdaptiveDprController, randomInRange } from '../core/utils'

const ORIONIDS_PEAK_DATES = new Set([
	'2026-10-21',
	'2026-10-22',
	'2027-10-21',
	'2027-10-22',
	'2028-10-21',
	'2028-10-22',
	'2029-10-21',
	'2029-10-22',
	'2030-10-21',
	'2030-10-22',
	'2031-10-21',
	'2031-10-22',
	'2032-10-21',
	'2032-10-22',
	'2033-10-21',
	'2033-10-22',
	'2034-10-21',
	'2034-10-22',
	'2035-10-21',
	'2035-10-22',
	'2036-10-21',
	'2036-10-22',
	'2037-10-21',
	'2037-10-22',
	'2038-10-21',
	'2038-10-22',
	'2039-10-21',
	'2039-10-22',
	'2040-10-21',
	'2040-10-22',
	'2041-10-21',
	'2041-10-22',
	'2042-10-21',
	'2042-10-22',
	'2043-10-21',
	'2043-10-22',
])
const ORIONIDS_MOUNT_DELAY_MS = 900
const ORIONIDS_OVERLAY_OPACITY = '0.78'
const ORIONIDS_OVERLAY_FILTER = 'saturate(130%)'
const ORIONIDS_MAX_DPR = 2
const ORIONIDS_METEOR_COUNT = 11
const ORIONIDS_STAR_COUNT = 140
const ORIONIDS_METEOR_LENGTH_RANGE = { max: 260, min: 150 }
const ORIONIDS_METEOR_WIDTH_RANGE = { max: 2.4, min: 1 }
const ORIONIDS_METEOR_SPEED_RANGE = { max: 900, min: 600 }
const ORIONIDS_METEOR_ANGLE_RANGE = { max: 0.42, min: 0.24 }
const ORIONIDS_METEOR_SPAWN_DELAY_RANGE = { max: 2200, min: 760 }
const ORIONIDS_METEOR_LIFETIME_RANGE = { max: 2100, min: 1300 }
const ORIONIDS_METEOR_SPAWN_X = { max: 0.6, min: -0.2 }
const ORIONIDS_METEOR_SPAWN_Y = { max: 0.2, min: -0.35 }
const ORIONIDS_METEOR_GLOW_RANGE = { max: 24, min: 12 }
const ORIONIDS_METEOR_COLORS = [
	'rgba(254, 215, 170, 1)',
	'rgba(253, 186, 116, 1)',
	'rgba(251, 146, 60, 1)',
	'rgba(148, 163, 184, 1)',
]
const ORIONIDS_STAR_COLOR = 'rgba(226, 232, 240, 1)'
const ORIONIDS_STAR_RADIUS_RANGE = { max: 1.4, min: 0.5 }
const ORIONIDS_STAR_OPACITY_RANGE = { max: 0.55, min: 0.2 }
const ORIONIDS_STAR_TWINKLE_RANGE = { max: 0.0014, min: 0.0006 }
const ORIONIDS_STAR_FADE_IN_DELAY_RANGE = { max: 2200, min: 0 }
const ORIONIDS_STAR_FADE_IN_DURATION_RANGE = { max: 2200, min: 1200 }

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The Orionids are an annual meteor shower formed from debris left by
				Halley’s Comet, reaching their peak in October.
			</Trans>
		</p>
		<p>
			<Trans>
				Their meteors appear to radiate from the region near the constellation
				Orion, a figure long woven into myth and storytelling.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The Orionids are visible from both hemispheres and are known for
				producing bright, fast-moving meteors.
			</Trans>
		</p>
		<p>
			<Trans>
				Their peak often coincides with long, dark viewing hours, when observing
				conditions are especially favourable.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Each Orionid meteor is a tiny grain of dust shed by Halley&apos;s Comet
				— the same object that people have been watching and recording since at
				least 240 BC.
			</Trans>
		</p>
		<p>
			<Trans>
				The meteors enter the atmosphere at about 66 km/s, among the fastest of
				any annual shower, which is why they often leave persistent glowing
				trails.
			</Trans>
		</p>
	</>
)

export const orionidsEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Orionids,
	isActive: isOrionidsPeak,
	run: launchOrionidsShower,
	tileAccent: {
		colors: ['#fed7aa', '#fdba74', '#fb923c', '#94a3b8', '#fed7aa'],
	},
}

function isOrionidsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return ORIONIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

async function launchOrionidsShower() {
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
			throw new Error('Unable to create 2D context for orionids canvas')
		}

		type Meteor = {
			age: number
			color: string
			glow: number
			length: number
			lifetime: number
			nextSpawn: number
			opacity: number
			vx: number
			vy: number
			width: number
			x: number
			y: number
		}
		type Star = {
			birthTime: number
			fadeDuration: number
			opacity: number
			phase: number
			radius: number
			twinkle: number
			x: number
			y: number
		}

		let timeoutId: null | number = null
		let animationFrameId: null | number = null
		let width = window.innerWidth
		let height = window.innerHeight
		let meteors: Meteor[] = []
		let stars: Star[] = []
		let lastTime = performance.now()

		const dprController = createAdaptiveDprController({
			maxDpr: ORIONIDS_MAX_DPR,
			minScale: 0.4,
		})
		const randomMeteorColor = () =>
			ORIONIDS_METEOR_COLORS[
				Math.floor(Math.random() * ORIONIDS_METEOR_COLORS.length)
			]

		const createStar = (time: number): Star => ({
			birthTime: time + randomInRange(ORIONIDS_STAR_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(ORIONIDS_STAR_FADE_IN_DURATION_RANGE),
			opacity: randomInRange(ORIONIDS_STAR_OPACITY_RANGE),
			phase: Math.random() * Math.PI * 2,
			radius: randomInRange(ORIONIDS_STAR_RADIUS_RANGE),
			twinkle: randomInRange(ORIONIDS_STAR_TWINKLE_RANGE),
			x: Math.random() * width,
			y: Math.random() * height,
		})

		const createMeteor = (time: number): Meteor => {
			const speed = randomInRange(ORIONIDS_METEOR_SPEED_RANGE)
			const angle = randomInRange(ORIONIDS_METEOR_ANGLE_RANGE)
			return {
				age: 0,
				color: randomMeteorColor(),
				glow: randomInRange(ORIONIDS_METEOR_GLOW_RANGE),
				length: randomInRange(ORIONIDS_METEOR_LENGTH_RANGE),
				lifetime: randomInRange(ORIONIDS_METEOR_LIFETIME_RANGE),
				nextSpawn: time + randomInRange(ORIONIDS_METEOR_SPAWN_DELAY_RANGE),
				opacity: randomInRange({ max: 0.85, min: 0.45 }),
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				width: randomInRange(ORIONIDS_METEOR_WIDTH_RANGE),
				x: width * randomInRange(ORIONIDS_METEOR_SPAWN_X),
				y: height * randomInRange(ORIONIDS_METEOR_SPAWN_Y),
			}
		}

		const resetField = (time: number) => {
			meteors = Array.from({ length: ORIONIDS_METEOR_COUNT }, () =>
				createMeteor(time),
			)
			stars = Array.from({ length: ORIONIDS_STAR_COUNT }, () =>
				createStar(time),
			)
		}

		const resizeCanvas = () => {
			const nextWidth = window.innerWidth
			const nextHeight = window.innerHeight
			const prevWidth = width
			const prevHeight = height
			width = nextWidth
			height = nextHeight
			const dpr = dprController.getDpr({ height, width })
			canvas.width = Math.round(width * dpr)
			canvas.height = Math.round(height * dpr)
			canvas.style.width = `${width}px`
			canvas.style.height = `${height}px`
			context.setTransform(dpr, 0, 0, dpr, 0, 0)
			if (meteors.length === 0 && stars.length === 0) {
				resetField(performance.now())
				return
			}
			const scaleX = prevWidth > 0 ? width / prevWidth : 1
			const scaleY = prevHeight > 0 ? height / prevHeight : 1
			if (scaleX !== 1 || scaleY !== 1) {
				for (const star of stars) {
					star.x *= scaleX
					star.y *= scaleY
				}
				for (const meteor of meteors) {
					meteor.x *= scaleX
					meteor.y *= scaleY
				}
			}
		}

		const getStarFade = (star: Star, time: number) => {
			if (!shouldAnimate) {
				return 1
			}

			const progress = (time - star.birthTime) / star.fadeDuration
			if (progress <= 0) {
				return 0
			}
			if (progress >= 1) {
				return 1
			}

			return 1 - Math.pow(1 - progress, 3)
		}

		const drawStars = (time: number) => {
			context.fillStyle = ORIONIDS_STAR_COLOR
			for (const star of stars) {
				const fade = getStarFade(star, time)
				if (fade <= 0) {
					continue
				}

				const twinkle = 0.65 + 0.35 * Math.sin(time * star.twinkle + star.phase)
				context.globalAlpha = star.opacity * twinkle * fade
				context.beginPath()
				context.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
				context.fill()
			}
		}

		const drawMeteor = (meteor: Meteor, alpha: number) => {
			context.save()
			context.translate(meteor.x, meteor.y)
			context.rotate(Math.atan2(meteor.vy, meteor.vx))
			context.globalAlpha = alpha
			context.lineWidth = meteor.width
			context.lineCap = 'round'
			context.shadowColor = meteor.color
			context.shadowBlur = meteor.glow

			const gradient = context.createLinearGradient(-meteor.length, 0, 0, 0)
			gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
			gradient.addColorStop(0.6, meteor.color.replace('1)', '0.25)'))
			gradient.addColorStop(1, meteor.color)
			context.strokeStyle = gradient
			context.beginPath()
			context.moveTo(-meteor.length, 0)
			context.lineTo(0, 0)
			context.stroke()
			context.restore()
		}

		const tick = (time: number) => {
			if (dprController.reportFrame(time)) {
				resizeCanvas()
			}
			const delta = Math.min(time - lastTime, 48)
			lastTime = time
			context.clearRect(0, 0, width, height)
			context.globalCompositeOperation = 'lighter'
			drawStars(time)

			for (const meteor of meteors) {
				if (time < meteor.nextSpawn) {
					continue
				}

				meteor.age += delta
				const progress = meteor.age / meteor.lifetime

				if (progress >= 1) {
					Object.assign(meteor, createMeteor(time))
					continue
				}

				meteor.x += (meteor.vx * delta) / 1000
				meteor.y += (meteor.vy * delta) / 1000

				if (
					meteor.x > width + meteor.length ||
					meteor.y > height + meteor.length
				) {
					Object.assign(meteor, createMeteor(time))
					continue
				}

				const fade = Math.sin(progress * Math.PI)
				drawMeteor(meteor, meteor.opacity * fade)
			}

			if (shouldAnimate) {
				animationFrameId = animationController.requestAnimationFrame(tick)
			}
		}

		const drawStatic = () => {
			const now = performance.now()
			context.clearRect(0, 0, width, height)
			context.globalCompositeOperation = 'lighter'
			drawStars(now)
			for (let i = 0; i < Math.min(4, meteors.length); i += 1) {
				const meteor = createMeteor(now)
				meteor.x = width * (0.2 + i * 0.15)
				meteor.y = height * (0.22 + i * 0.1)
				drawMeteor(meteor, meteor.opacity)
			}
		}

		overlay.style.position = 'fixed'
		overlay.style.inset = '0'
		overlay.style.pointerEvents = 'none'
		overlay.style.zIndex = '0'
		overlay.style.opacity = ORIONIDS_OVERLAY_OPACITY
		overlay.style.filter = ORIONIDS_OVERLAY_FILTER
		overlay.appendChild(canvas)

		const mount = () => {
			document.body.appendChild(overlay)
			resizeCanvas()
			if (shouldAnimate) {
				lastTime = performance.now()
				animationFrameId = animationController.requestAnimationFrame(tick)
			} else {
				drawStatic()
			}
		}

		timeoutId = window.setTimeout(mount, ORIONIDS_MOUNT_DELAY_MS)

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
		console.error('Failed to launch Orionids meteor shower', error)
		return () => {}
	}
}

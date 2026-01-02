import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'
import { createAdaptiveDprController, randomInRange } from './utils'

const ETA_AQUARIIDS_PEAK_DATES = new Set([
	'2026-05-05',
	'2026-05-06',
	'2027-05-05',
	'2027-05-06',
	'2028-05-05',
	'2028-05-06',
	'2029-05-05',
	'2029-05-06',
	'2030-05-05',
	'2030-05-06',
	'2031-05-05',
	'2031-05-06',
	'2032-05-05',
	'2032-05-06',
	'2033-05-05',
	'2033-05-06',
	'2034-05-05',
	'2034-05-06',
	'2035-05-05',
	'2035-05-06',
	'2036-05-05',
	'2036-05-06',
	'2037-05-05',
	'2037-05-06',
	'2038-05-05',
	'2038-05-06',
	'2039-05-05',
	'2039-05-06',
	'2040-05-05',
	'2040-05-06',
	'2041-05-05',
	'2041-05-06',
	'2042-05-05',
	'2042-05-06',
	'2043-05-05',
	'2043-05-06',
])
const ETA_AQUARIIDS_MOUNT_DELAY_MS = 900
const ETA_AQUARIIDS_OVERLAY_OPACITY = '0.78'
const ETA_AQUARIIDS_OVERLAY_FILTER = 'saturate(130%)'
const ETA_AQUARIIDS_MAX_DPR = 2
const ETA_AQUARIIDS_METEOR_COUNT = 11
const ETA_AQUARIIDS_STAR_COUNT = 140
const ETA_AQUARIIDS_METEOR_LENGTH_RANGE = { min: 140, max: 250 }
const ETA_AQUARIIDS_METEOR_WIDTH_RANGE = { min: 1, max: 2.3 }
const ETA_AQUARIIDS_METEOR_SPEED_RANGE = { min: 560, max: 860 }
const ETA_AQUARIIDS_METEOR_ANGLE_RANGE = { min: 0.25, max: 0.42 }
const ETA_AQUARIIDS_METEOR_SPAWN_DELAY_RANGE = { min: 760, max: 2200 }
const ETA_AQUARIIDS_METEOR_LIFETIME_RANGE = { min: 1300, max: 2100 }
const ETA_AQUARIIDS_METEOR_SPAWN_X = { min: -0.2, max: 0.6 }
const ETA_AQUARIIDS_METEOR_SPAWN_Y = { min: -0.35, max: 0.2 }
const ETA_AQUARIIDS_METEOR_GLOW_RANGE = { min: 12, max: 24 }
const ETA_AQUARIIDS_METEOR_COLORS = [
	'rgba(191, 219, 254, 1)',
	'rgba(125, 211, 252, 1)',
	'rgba(96, 165, 250, 1)',
	'rgba(59, 130, 246, 1)',
]
const ETA_AQUARIIDS_STAR_COLOR = 'rgba(226, 232, 240, 1)'
const ETA_AQUARIIDS_STAR_RADIUS_RANGE = { min: 0.5, max: 1.4 }
const ETA_AQUARIIDS_STAR_OPACITY_RANGE = { min: 0.2, max: 0.55 }
const ETA_AQUARIIDS_STAR_TWINKLE_RANGE = { min: 0.0006, max: 0.0014 }
const ETA_AQUARIIDS_STAR_FADE_IN_DELAY_RANGE = { min: 0, max: 2200 }
const ETA_AQUARIIDS_STAR_FADE_IN_DURATION_RANGE = { min: 1200, max: 2200 }

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The Eta Aquariids are a major meteor shower formed from the debris of
				Halley’s Comet.
			</Trans>
		</p>
		<p>
			<Trans>
				They peak in early May and are especially well seen from the southern
				hemisphere, though northern skies still catch their share of streaks.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Halley’s Comet itself returns roughly every seventy-six years, but the
				stream of dust it leaves behind crosses Earth’s path each year.
			</Trans>
		</p>
		<p>
			<Trans>
				The shower’s radiant lies near the constellation Aquarius, rising before
				dawn when viewing conditions are at their best.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				Watching the Eta Aquariids can feel like receiving a message from a
				distant traveller, carried on light across the dark.
			</Trans>
		</p>
		<p>
			<Trans>
				The meteors are exceptionally fast and often leave long, delicate trains
				that linger in the sky.
			</Trans>
		</p>
	</>
)

export const etaAquariidsEvent: SeasonalEvent = {
	id: 'eta-aquariids',
	isActive: isEtaAquariidsPeak,
	run: launchEtaAquariidsShower,
	details: EventDetails,
	tileAccent: {
		colors: ['#bae6fd', '#7dd3fc', '#60a5fa', '#3b82f6', '#bae6fd'],
	},
}

function isEtaAquariidsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return ETA_AQUARIIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

async function launchEtaAquariidsShower() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const overlay = document.createElement('div')
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for eta aquariids canvas')
		}

		type Meteor = {
			x: number
			y: number
			vx: number
			vy: number
			length: number
			width: number
			opacity: number
			glow: number
			color: string
			age: number
			lifetime: number
			nextSpawn: number
		}
		type Star = {
			x: number
			y: number
			radius: number
			opacity: number
			twinkle: number
			phase: number
			birthTime: number
			fadeDuration: number
		}

		let timeoutId: number | null = null
		let animationFrameId: number | null = null
		let width = window.innerWidth
		let height = window.innerHeight
		let meteors: Meteor[] = []
		let stars: Star[] = []
		let lastTime = performance.now()

		const dprController = createAdaptiveDprController({
			maxDpr: ETA_AQUARIIDS_MAX_DPR,
			minScale: 0.4,
		})
		const randomMeteorColor = () =>
			ETA_AQUARIIDS_METEOR_COLORS[
				Math.floor(Math.random() * ETA_AQUARIIDS_METEOR_COLORS.length)
			]

		const createStar = (time: number): Star => ({
			x: Math.random() * width,
			y: Math.random() * height,
			radius: randomInRange(ETA_AQUARIIDS_STAR_RADIUS_RANGE),
			opacity: randomInRange(ETA_AQUARIIDS_STAR_OPACITY_RANGE),
			twinkle: randomInRange(ETA_AQUARIIDS_STAR_TWINKLE_RANGE),
			phase: Math.random() * Math.PI * 2,
			birthTime: time + randomInRange(ETA_AQUARIIDS_STAR_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(ETA_AQUARIIDS_STAR_FADE_IN_DURATION_RANGE),
		})

		const createMeteor = (time: number): Meteor => {
			const speed = randomInRange(ETA_AQUARIIDS_METEOR_SPEED_RANGE)
			const angle = randomInRange(ETA_AQUARIIDS_METEOR_ANGLE_RANGE)
			return {
				x: width * randomInRange(ETA_AQUARIIDS_METEOR_SPAWN_X),
				y: height * randomInRange(ETA_AQUARIIDS_METEOR_SPAWN_Y),
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				length: randomInRange(ETA_AQUARIIDS_METEOR_LENGTH_RANGE),
				width: randomInRange(ETA_AQUARIIDS_METEOR_WIDTH_RANGE),
				opacity: randomInRange({ min: 0.45, max: 0.85 }),
				glow: randomInRange(ETA_AQUARIIDS_METEOR_GLOW_RANGE),
				color: randomMeteorColor(),
				age: 0,
				lifetime: randomInRange(ETA_AQUARIIDS_METEOR_LIFETIME_RANGE),
				nextSpawn: time + randomInRange(ETA_AQUARIIDS_METEOR_SPAWN_DELAY_RANGE),
			}
		}

		const resetField = (time: number) => {
			meteors = Array.from({ length: ETA_AQUARIIDS_METEOR_COUNT }, () =>
				createMeteor(time),
			)
			stars = Array.from({ length: ETA_AQUARIIDS_STAR_COUNT }, () =>
				createStar(time),
			)
		}

		const resizeCanvas = () => {
			width = window.innerWidth
			height = window.innerHeight
			const dpr = dprController.getDpr({ width, height })
			canvas.width = Math.round(width * dpr)
			canvas.height = Math.round(height * dpr)
			canvas.style.width = `${width}px`
			canvas.style.height = `${height}px`
			context.setTransform(dpr, 0, 0, dpr, 0, 0)
			resetField(performance.now())
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
			context.fillStyle = ETA_AQUARIIDS_STAR_COLOR
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
				animationFrameId = window.requestAnimationFrame(tick)
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
		overlay.style.opacity = ETA_AQUARIIDS_OVERLAY_OPACITY
		overlay.style.filter = ETA_AQUARIIDS_OVERLAY_FILTER
		overlay.appendChild(canvas)

		const mount = () => {
			document.body.appendChild(overlay)
			resizeCanvas()
			if (shouldAnimate) {
				lastTime = performance.now()
				animationFrameId = window.requestAnimationFrame(tick)
			} else {
				drawStatic()
			}
		}

		timeoutId = window.setTimeout(mount, ETA_AQUARIIDS_MOUNT_DELAY_MS)

		const handleResize = () => {
			resizeCanvas()
			if (!shouldAnimate) {
				drawStatic()
			}
		}
		window.addEventListener('resize', handleResize)

		return () => {
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId)
			}
			if (animationFrameId !== null) {
				window.cancelAnimationFrame(animationFrameId)
			}
			window.removeEventListener('resize', handleResize)
			if (overlay.parentElement) {
				overlay.parentElement.removeChild(overlay)
			}
		}
	} catch (error) {
		console.error('Failed to launch Eta Aquariids meteor shower', error)
		return () => {}
	}
}

import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'
import { getCanvasDpr, randomInRange } from './utils'

const GEMINIDS_PEAK_DATES = new Set([
	'2026-12-13',
	'2027-12-13',
	'2028-12-13',
	'2029-12-13',
	'2030-12-13',
	'2031-12-13',
	'2032-12-13',
	'2033-12-13',
	'2034-12-13',
	'2035-12-13',
	'2036-12-13',
	'2037-12-13',
	'2038-12-13',
	'2039-12-13',
	'2040-12-13',
	'2041-12-13',
	'2042-12-13',
	'2043-12-13',
	'2026-12-14',
	'2027-12-14',
	'2028-12-14',
	'2029-12-14',
	'2030-12-14',
	'2031-12-14',
	'2032-12-14',
	'2033-12-14',
	'2034-12-14',
	'2035-12-14',
	'2036-12-14',
	'2037-12-14',
	'2038-12-14',
	'2039-12-14',
	'2040-12-14',
	'2041-12-14',
	'2042-12-14',
	'2043-12-14',
])
const GEMINIDS_MOUNT_DELAY_MS = 900
const GEMINIDS_OVERLAY_OPACITY = '0.78'
const GEMINIDS_OVERLAY_FILTER = 'saturate(120%)'
const GEMINIDS_MAX_DPR = 2
const GEMINIDS_METEOR_COUNT = 12
const GEMINIDS_STAR_COUNT = 140
const GEMINIDS_METEOR_LENGTH_RANGE = { min: 120, max: 230 }
const GEMINIDS_METEOR_WIDTH_RANGE = { min: 1, max: 2.3 }
const GEMINIDS_METEOR_SPEED_RANGE = { min: 460, max: 760 }
const GEMINIDS_METEOR_ANGLE_RANGE = { min: 0.28, max: 0.46 }
const GEMINIDS_METEOR_SPAWN_DELAY_RANGE = { min: 820, max: 2200 }
const GEMINIDS_METEOR_LIFETIME_RANGE = { min: 1500, max: 2400 }
const GEMINIDS_METEOR_SPAWN_X = { min: -0.15, max: 0.65 }
const GEMINIDS_METEOR_SPAWN_Y = { min: -0.3, max: 0.15 }
const GEMINIDS_METEOR_GLOW_RANGE = { min: 12, max: 22 }
const GEMINIDS_METEOR_COLORS = [
	'rgba(226, 232, 240, 1)',
	'rgba(191, 219, 254, 1)',
	'rgba(148, 163, 184, 1)',
	'rgba(129, 140, 248, 1)',
]
const GEMINIDS_STAR_COLOR = 'rgba(226, 232, 240, 1)'
const GEMINIDS_STAR_RADIUS_RANGE = { min: 0.5, max: 1.4 }
const GEMINIDS_STAR_OPACITY_RANGE = { min: 0.18, max: 0.55 }
const GEMINIDS_STAR_TWINKLE_RANGE = { min: 0.0005, max: 0.0012 }
const GEMINIDS_STAR_FADE_IN_DELAY_RANGE = { min: 0, max: 2200 }
const GEMINIDS_STAR_FADE_IN_DURATION_RANGE = { min: 1200, max: 2200 }

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The Geminids are one of the strongest and most reliable meteor showers
				of the year, appearing each December with frequent, bright meteors.
			</Trans>
		</p>
		<p>
			<Trans>
				They are especially known for their steady rates and vivid, often
				colourful trails.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Unlike most meteor showers, the Geminids originate from the asteroid
				3200 Phaethon rather than a comet.
			</Trans>
		</p>
		<p>
			<Trans>
				Because it behaves like both an asteroid and a comet, it is sometimes
				described as a “rock comet”.
			</Trans>
		</p>

		<h2>
			<Trans>Skywatching tips</Trans>
		</h2>
		<p>
			<Trans>
				Find a wide view of the sky, allow your eyes time to adjust, and settle
				in — the display often strengthens after midnight.
			</Trans>
		</p>
		<p>
			<Trans>
				Whether your night air is warm or cool, a comfortable place to sit or
				lie back makes the experience far more enjoyable.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				The meteors are often bright and steady, tracing slow, colourful paths
				across the night.
			</Trans>
		</p>
		<p>
			<Trans>
				Under clear skies, the show can feel both calm and exhilarating at once.
			</Trans>
		</p>
	</>
)

export const geminidsEvent: SeasonalEvent = {
	id: 'geminids',
	isActive: isGeminidsPeak,
	run: launchGeminidsShower,
	details: EventDetails,
	tileAccent: {
		colors: ['#e2e8f0', '#93c5fd', '#818cf8', '#cbd5f5', '#e2e8f0'],
	},
}

function isGeminidsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return GEMINIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

async function launchGeminidsShower() {
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
			throw new Error('Unable to create 2D context for geminids canvas')
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

		const randomMeteorColor = () =>
			GEMINIDS_METEOR_COLORS[
				Math.floor(Math.random() * GEMINIDS_METEOR_COLORS.length)
			]

		const createStar = (time: number): Star => ({
			x: Math.random() * width,
			y: Math.random() * height,
			radius: randomInRange(GEMINIDS_STAR_RADIUS_RANGE),
			opacity: randomInRange(GEMINIDS_STAR_OPACITY_RANGE),
			twinkle: randomInRange(GEMINIDS_STAR_TWINKLE_RANGE),
			phase: Math.random() * Math.PI * 2,
			birthTime: time + randomInRange(GEMINIDS_STAR_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(GEMINIDS_STAR_FADE_IN_DURATION_RANGE),
		})

		const createMeteor = (time: number): Meteor => {
			const speed = randomInRange(GEMINIDS_METEOR_SPEED_RANGE)
			const angle = randomInRange(GEMINIDS_METEOR_ANGLE_RANGE)
			return {
				x: width * randomInRange(GEMINIDS_METEOR_SPAWN_X),
				y: height * randomInRange(GEMINIDS_METEOR_SPAWN_Y),
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				length: randomInRange(GEMINIDS_METEOR_LENGTH_RANGE),
				width: randomInRange(GEMINIDS_METEOR_WIDTH_RANGE),
				opacity: randomInRange({ min: 0.45, max: 0.85 }),
				glow: randomInRange(GEMINIDS_METEOR_GLOW_RANGE),
				color: randomMeteorColor(),
				age: 0,
				lifetime: randomInRange(GEMINIDS_METEOR_LIFETIME_RANGE),
				nextSpawn: time + randomInRange(GEMINIDS_METEOR_SPAWN_DELAY_RANGE),
			}
		}

		const resetField = (time: number) => {
			meteors = Array.from({ length: GEMINIDS_METEOR_COUNT }, () =>
				createMeteor(time),
			)
			stars = Array.from({ length: GEMINIDS_STAR_COUNT }, () =>
				createStar(time),
			)
		}

		const resizeCanvas = () => {
			width = window.innerWidth
			height = window.innerHeight
			const dpr = getCanvasDpr({ width, height, maxDpr: GEMINIDS_MAX_DPR })
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
			context.fillStyle = GEMINIDS_STAR_COLOR
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
			gradient.addColorStop(0.6, meteor.color.replace('1)', '0.24)'))
			gradient.addColorStop(1, meteor.color)
			context.strokeStyle = gradient
			context.beginPath()
			context.moveTo(-meteor.length, 0)
			context.lineTo(0, 0)
			context.stroke()
			context.restore()
		}

		const tick = (time: number) => {
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
		overlay.style.opacity = GEMINIDS_OVERLAY_OPACITY
		overlay.style.filter = GEMINIDS_OVERLAY_FILTER
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

		timeoutId = window.setTimeout(mount, GEMINIDS_MOUNT_DELAY_MS)

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
		console.error('Failed to launch Geminids meteor shower', error)
		return () => {}
	}
}

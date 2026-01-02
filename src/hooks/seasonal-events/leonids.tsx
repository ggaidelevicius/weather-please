import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'

const LEONIDS_PEAK_DATES = new Set([
	'2026-11-17',
	'2026-11-18',
	'2027-11-17',
	'2027-11-18',
	'2028-11-17',
	'2028-11-18',
	'2029-11-17',
	'2029-11-18',
	'2030-11-17',
	'2030-11-18',
	'2031-11-17',
	'2031-11-18',
	'2032-11-17',
	'2032-11-18',
	'2033-11-17',
	'2033-11-18',
	'2034-11-17',
	'2034-11-18',
	'2035-11-17',
	'2035-11-18',
	'2036-11-17',
	'2036-11-18',
	'2037-11-17',
	'2037-11-18',
	'2038-11-17',
	'2038-11-18',
	'2039-11-17',
	'2039-11-18',
	'2040-11-17',
	'2040-11-18',
	'2041-11-17',
	'2041-11-18',
	'2042-11-17',
	'2042-11-18',
	'2043-11-17',
	'2043-11-18',
])
const LEONIDS_MOUNT_DELAY_MS = 900
const LEONIDS_OVERLAY_OPACITY = '0.78'
const LEONIDS_OVERLAY_FILTER = 'saturate(132%)'
const LEONIDS_MAX_DPR = 2
const LEONIDS_METEOR_COUNT = 12
const LEONIDS_STAR_COUNT = 140
const LEONIDS_METEOR_LENGTH_RANGE = { min: 150, max: 260 }
const LEONIDS_METEOR_WIDTH_RANGE = { min: 1, max: 2.4 }
const LEONIDS_METEOR_SPEED_RANGE = { min: 620, max: 940 }
const LEONIDS_METEOR_ANGLE_RANGE = { min: 0.24, max: 0.42 }
const LEONIDS_METEOR_SPAWN_DELAY_RANGE = { min: 700, max: 2000 }
const LEONIDS_METEOR_LIFETIME_RANGE = { min: 1200, max: 2000 }
const LEONIDS_METEOR_SPAWN_X = { min: -0.2, max: 0.6 }
const LEONIDS_METEOR_SPAWN_Y = { min: -0.35, max: 0.2 }
const LEONIDS_METEOR_GLOW_RANGE = { min: 12, max: 26 }
const LEONIDS_METEOR_COLORS = [
	'rgba(252, 211, 77, 1)',
	'rgba(251, 191, 36, 1)',
	'rgba(249, 115, 22, 1)',
	'rgba(148, 163, 184, 1)',
]
const LEONIDS_STAR_COLOR = 'rgba(226, 232, 240, 1)'
const LEONIDS_STAR_RADIUS_RANGE = { min: 0.5, max: 1.4 }
const LEONIDS_STAR_OPACITY_RANGE = { min: 0.2, max: 0.55 }
const LEONIDS_STAR_TWINKLE_RANGE = { min: 0.0006, max: 0.0014 }
const LEONIDS_STAR_FADE_IN_DELAY_RANGE = { min: 0, max: 2200 }
const LEONIDS_STAR_FADE_IN_DURATION_RANGE = { min: 1200, max: 2200 }

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The Leonids are a November meteor shower, named for their radiant in the
				constellation Leo.
			</Trans>
		</p>
		<p>
			<Trans>
				Most years the display is modest, but the shower is famous for its
				capacity to produce rare and spectacular surprises.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The Leonids are renowned for historic meteor storms, most notably in
				1833 and 1966, when observers described the sky as seeming to rain
				stars.
			</Trans>
		</p>
		<p>
			<Trans>
				These events played an important role in the development of scientific
				understanding of meteor showers.
			</Trans>
		</p>

		<h2>
			<Trans>Why it can storm</Trans>
		</h2>
		<p>
			<Trans>
				The Leonids originate from Comet Tempel–Tuttle, and every few decades
				Earth passes through especially dense streams of its debris.
			</Trans>
		</p>
		<p>
			<Trans>
				When this occurs, meteor rates can rise dramatically for a short period
				of time.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				In most years the Leonids unfold gently, yet they always carry the
				possibility of a sudden, breathtaking encore.
			</Trans>
		</p>
		<p>
			<Trans>
				They serve as a quiet reminder that the sky still holds the power to
				surprise.
			</Trans>
		</p>
	</>
)

export const leonidsEvent: SeasonalEvent = {
	id: 'leonids',
	isActive: isLeonidsPeak,
	run: launchLeonidsShower,
	details: EventDetails,
	tileAccent: {
		colors: ['#fcd34d', '#fbbf24', '#f97316', '#94a3b8', '#fcd34d'],
	},
}

function isLeonidsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return LEONIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

async function launchLeonidsShower() {
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
			throw new Error('Unable to create 2D context for leonids canvas')
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
			LEONIDS_METEOR_COLORS[
				Math.floor(Math.random() * LEONIDS_METEOR_COLORS.length)
			]

		const createStar = (time: number): Star => ({
			x: Math.random() * width,
			y: Math.random() * height,
			radius: randomInRange(LEONIDS_STAR_RADIUS_RANGE),
			opacity: randomInRange(LEONIDS_STAR_OPACITY_RANGE),
			twinkle: randomInRange(LEONIDS_STAR_TWINKLE_RANGE),
			phase: Math.random() * Math.PI * 2,
			birthTime: time + randomInRange(LEONIDS_STAR_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(LEONIDS_STAR_FADE_IN_DURATION_RANGE),
		})

		const createMeteor = (time: number): Meteor => {
			const speed = randomInRange(LEONIDS_METEOR_SPEED_RANGE)
			const angle = randomInRange(LEONIDS_METEOR_ANGLE_RANGE)
			return {
				x: width * randomInRange(LEONIDS_METEOR_SPAWN_X),
				y: height * randomInRange(LEONIDS_METEOR_SPAWN_Y),
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				length: randomInRange(LEONIDS_METEOR_LENGTH_RANGE),
				width: randomInRange(LEONIDS_METEOR_WIDTH_RANGE),
				opacity: randomInRange({ min: 0.45, max: 0.88 }),
				glow: randomInRange(LEONIDS_METEOR_GLOW_RANGE),
				color: randomMeteorColor(),
				age: 0,
				lifetime: randomInRange(LEONIDS_METEOR_LIFETIME_RANGE),
				nextSpawn: time + randomInRange(LEONIDS_METEOR_SPAWN_DELAY_RANGE),
			}
		}

		const resetField = (time: number) => {
			meteors = Array.from({ length: LEONIDS_METEOR_COUNT }, () =>
				createMeteor(time),
			)
			stars = Array.from({ length: LEONIDS_STAR_COUNT }, () => createStar(time))
		}

		const resizeCanvas = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, LEONIDS_MAX_DPR)
			width = window.innerWidth
			height = window.innerHeight
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
			context.fillStyle = LEONIDS_STAR_COLOR
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
		overlay.style.opacity = LEONIDS_OVERLAY_OPACITY
		overlay.style.filter = LEONIDS_OVERLAY_FILTER
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

		timeoutId = window.setTimeout(mount, LEONIDS_MOUNT_DELAY_MS)

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
		console.error('Failed to launch Leonids meteor shower', error)
		return () => {}
	}
}

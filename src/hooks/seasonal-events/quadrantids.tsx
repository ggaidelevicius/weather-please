import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'
import { getCanvasDpr, randomInRange } from './utils'

const QUADRANTIDS_PEAK_DATES = new Set([
	'2026-01-03',
	'2026-01-04',
	'2027-01-03',
	'2027-01-04',
	'2028-01-03',
	'2028-01-04',
	'2029-01-03',
	'2029-01-04',
	'2030-01-03',
	'2030-01-04',
	'2031-01-03',
	'2031-01-04',
	'2032-01-03',
	'2032-01-04',
	'2033-01-03',
	'2033-01-04',
	'2034-01-03',
	'2034-01-04',
	'2035-01-03',
	'2035-01-04',
	'2036-01-03',
	'2036-01-04',
	'2037-01-03',
	'2037-01-04',
	'2038-01-03',
	'2038-01-04',
	'2039-01-03',
	'2039-01-04',
	'2040-01-03',
	'2040-01-04',
	'2041-01-03',
	'2041-01-04',
	'2042-01-03',
	'2042-01-04',
	'2043-01-03',
	'2043-01-04',
])
const QUADRANTIDS_MOUNT_DELAY_MS = 900
const QUADRANTIDS_OVERLAY_OPACITY = '0.82'
const QUADRANTIDS_OVERLAY_FILTER = 'saturate(135%)'
const QUADRANTIDS_MAX_DPR = 2
const QUADRANTIDS_METEOR_COUNT = 14
const QUADRANTIDS_STAR_COUNT = 140
const QUADRANTIDS_METEOR_LENGTH_RANGE = { min: 150, max: 260 }
const QUADRANTIDS_METEOR_WIDTH_RANGE = { min: 1.1, max: 2.5 }
const QUADRANTIDS_METEOR_SPEED_RANGE = { min: 620, max: 900 }
const QUADRANTIDS_METEOR_ANGLE_RANGE = { min: 0.24, max: 0.4 }
const QUADRANTIDS_METEOR_SPAWN_DELAY_RANGE = { min: 520, max: 1600 }
const QUADRANTIDS_METEOR_LIFETIME_RANGE = { min: 1200, max: 2000 }
const QUADRANTIDS_METEOR_SPAWN_X = { min: -0.25, max: 0.6 }
const QUADRANTIDS_METEOR_SPAWN_Y = { min: -0.4, max: 0.15 }
const QUADRANTIDS_METEOR_GLOW_RANGE = { min: 14, max: 26 }
const QUADRANTIDS_METEOR_COLORS = [
	'rgba(224, 242, 254, 1)',
	'rgba(191, 219, 254, 1)',
	'rgba(147, 197, 253, 1)',
	'rgba(129, 140, 248, 1)',
]
const QUADRANTIDS_STAR_COLOR = 'rgba(226, 232, 240, 1)'
const QUADRANTIDS_STAR_RADIUS_RANGE = { min: 0.5, max: 1.5 }
const QUADRANTIDS_STAR_OPACITY_RANGE = { min: 0.2, max: 0.6 }
const QUADRANTIDS_STAR_TWINKLE_RANGE = { min: 0.0006, max: 0.0014 }
const QUADRANTIDS_STAR_FADE_IN_DELAY_RANGE = { min: 0, max: 2200 }
const QUADRANTIDS_STAR_FADE_IN_DURATION_RANGE = { min: 1200, max: 2200 }

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The Quadrantids are a meteor shower that peaks in early January and is
				known for being brief yet often intense.
			</Trans>
		</p>
		<p>
			<Trans>
				When conditions are favourable, they produce sharp, fast-moving meteors
				in high numbers.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The shower takes its name from Quadrans Muralis, a former constellation
				that no longer appears on modern star charts.
			</Trans>
		</p>
		<p>
			<Trans>
				Although the radiant now lies within the constellation Boötes, the older
				name preserves a small piece of astronomical history.
			</Trans>
		</p>

		<h2>
			<Trans>Why the peak is brief</Trans>
		</h2>
		<p>
			<Trans>
				The stream of debris that creates the Quadrantids is unusually narrow,
				so Earth passes through it quickly.
			</Trans>
		</p>
		<p>
			<Trans>
				This makes the period of strongest activity short, but it can be
				especially spectacular.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				Their likely parent body is the asteroid 2003 EH1, a reminder that even
				an unassuming rock can paint the sky with light.
			</Trans>
		</p>
		<p>
			<Trans>
				The peak often arrives suddenly, like a secret performance unfolding
				before dawn.
			</Trans>
		</p>
	</>
)

export const quadrantidsEvent: SeasonalEvent = {
	id: 'quadrantids',
	isActive: isQuadrantidsPeak,
	run: launchQuadrantidsShower,
	details: EventDetails,
	tileAccent: {
		colors: ['#e0f2fe', '#93c5fd', '#60a5fa', '#818cf8', '#e0f2fe'],
	},
}

function isQuadrantidsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return QUADRANTIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

async function launchQuadrantidsShower() {
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
			throw new Error('Unable to create 2D context for quadrantids canvas')
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
			QUADRANTIDS_METEOR_COLORS[
				Math.floor(Math.random() * QUADRANTIDS_METEOR_COLORS.length)
			]

		const createStar = (time: number): Star => ({
			x: Math.random() * width,
			y: Math.random() * height,
			radius: randomInRange(QUADRANTIDS_STAR_RADIUS_RANGE),
			opacity: randomInRange(QUADRANTIDS_STAR_OPACITY_RANGE),
			twinkle: randomInRange(QUADRANTIDS_STAR_TWINKLE_RANGE),
			phase: Math.random() * Math.PI * 2,
			birthTime: time + randomInRange(QUADRANTIDS_STAR_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(QUADRANTIDS_STAR_FADE_IN_DURATION_RANGE),
		})

		const createMeteor = (time: number): Meteor => {
			const speed = randomInRange(QUADRANTIDS_METEOR_SPEED_RANGE)
			const angle = randomInRange(QUADRANTIDS_METEOR_ANGLE_RANGE)
			return {
				x: width * randomInRange(QUADRANTIDS_METEOR_SPAWN_X),
				y: height * randomInRange(QUADRANTIDS_METEOR_SPAWN_Y),
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				length: randomInRange(QUADRANTIDS_METEOR_LENGTH_RANGE),
				width: randomInRange(QUADRANTIDS_METEOR_WIDTH_RANGE),
				opacity: randomInRange({ min: 0.5, max: 0.92 }),
				glow: randomInRange(QUADRANTIDS_METEOR_GLOW_RANGE),
				color: randomMeteorColor(),
				age: 0,
				lifetime: randomInRange(QUADRANTIDS_METEOR_LIFETIME_RANGE),
				nextSpawn: time + randomInRange(QUADRANTIDS_METEOR_SPAWN_DELAY_RANGE),
			}
		}

		const resetField = (time: number) => {
			meteors = Array.from({ length: QUADRANTIDS_METEOR_COUNT }, () =>
				createMeteor(time),
			)
			stars = Array.from({ length: QUADRANTIDS_STAR_COUNT }, () =>
				createStar(time),
			)
		}

		const resizeCanvas = () => {
			width = window.innerWidth
			height = window.innerHeight
			const dpr = getCanvasDpr({ width, height, maxDpr: QUADRANTIDS_MAX_DPR })
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
			context.fillStyle = QUADRANTIDS_STAR_COLOR
			for (const star of stars) {
				const fade = getStarFade(star, time)
				if (fade <= 0) {
					continue
				}

				const twinkle = 0.6 + 0.4 * Math.sin(time * star.twinkle + star.phase)
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
			for (let i = 0; i < Math.min(5, meteors.length); i += 1) {
				const meteor = createMeteor(now)
				meteor.x = width * (0.18 + i * 0.14)
				meteor.y = height * (0.18 + i * 0.09)
				drawMeteor(meteor, meteor.opacity)
			}
		}

		overlay.style.position = 'fixed'
		overlay.style.inset = '0'
		overlay.style.pointerEvents = 'none'
		overlay.style.zIndex = '0'
		overlay.style.opacity = QUADRANTIDS_OVERLAY_OPACITY
		overlay.style.filter = QUADRANTIDS_OVERLAY_FILTER
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

		timeoutId = window.setTimeout(mount, QUADRANTIDS_MOUNT_DELAY_MS)

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
		console.error('Failed to launch Quadrantids meteor shower', error)
		return () => {}
	}
}

import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'

const PERSEIDS_PEAK_DATES = new Set([
	'2026-08-13',
	'2027-08-12',
	'2027-08-13',
	'2028-08-12',
	'2028-08-13',
	'2029-08-12',
	'2029-08-13',
	'2030-08-12',
	'2030-08-13',
	'2031-08-12',
	'2031-08-13',
	'2032-08-12',
	'2032-08-13',
	'2033-08-12',
	'2033-08-13',
	'2034-08-12',
	'2034-08-13',
	'2035-08-12',
	'2035-08-13',
	'2036-08-12',
	'2036-08-13',
	'2037-08-12',
	'2037-08-13',
	'2038-08-12',
	'2038-08-13',
	'2039-08-12',
	'2039-08-13',
	'2040-08-12',
	'2040-08-13',
	'2041-08-12',
	'2041-08-13',
	'2042-08-12',
	'2042-08-13',
	'2043-08-12',
	'2043-08-13',
])
const PERSEIDS_MOUNT_DELAY_MS = 900
const PERSEIDS_OVERLAY_OPACITY = '0.8'
const PERSEIDS_OVERLAY_FILTER = 'saturate(130%)'
const PERSEIDS_MAX_DPR = 2
const PERSEIDS_METEOR_COUNT = 12
const PERSEIDS_STAR_COUNT = 140
const PERSEIDS_METEOR_LENGTH_RANGE = { min: 140, max: 260 }
const PERSEIDS_METEOR_WIDTH_RANGE = { min: 1.1, max: 2.6 }
const PERSEIDS_METEOR_SPEED_RANGE = { min: 520, max: 820 }
const PERSEIDS_METEOR_ANGLE_RANGE = { min: 0.25, max: 0.42 }
const PERSEIDS_METEOR_SPAWN_DELAY_RANGE = { min: 720, max: 2000 }
const PERSEIDS_METEOR_LIFETIME_RANGE = { min: 1400, max: 2200 }
const PERSEIDS_METEOR_SPAWN_X = { min: -0.2, max: 0.6 }
const PERSEIDS_METEOR_SPAWN_Y = { min: -0.35, max: 0.2 }
const PERSEIDS_METEOR_GLOW_RANGE = { min: 12, max: 22 }
const PERSEIDS_METEOR_COLORS = [
	'rgba(248, 250, 252, 1)',
	'rgba(191, 219, 254, 1)',
	'rgba(129, 140, 248, 1)',
	'rgba(167, 139, 250, 1)',
]
const PERSEIDS_STAR_COLOR = 'rgba(226, 232, 240, 1)'
const PERSEIDS_STAR_RADIUS_RANGE = { min: 0.6, max: 1.6 }
const PERSEIDS_STAR_OPACITY_RANGE = { min: 0.2, max: 0.6 }
const PERSEIDS_STAR_TWINKLE_RANGE = { min: 0.0006, max: 0.0014 }
const PERSEIDS_STAR_FADE_IN_DELAY_RANGE = { min: 0, max: 2200 }
const PERSEIDS_STAR_FADE_IN_DURATION_RANGE = { min: 1200, max: 2200 }

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The Perseids are a bright annual meteor shower formed from debris left
				by Comet Swift–Tuttle.
			</Trans>
		</p>
		<p>
			<Trans>
				Their radiant lies in the constellation Perseus, and the shower is
				especially prominent in the northern hemisphere, though visible
				worldwide.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The Perseids are sometimes known as the Tears of Saint Lawrence, as
				their peak often falls near the feast day of Saint Lawrence in
				mid-August.
			</Trans>
		</p>
		<p>
			<Trans>
				Historical records of the Perseids extend back nearly two thousand
				years, making them one of the longest observed meteor showers.
			</Trans>
		</p>

		<h2>
			<Trans>Skywatching tips</Trans>
		</h2>
		<p>
			<Trans>
				Allow your eyes about twenty minutes to adjust, turn away from city
				lights, and let the wide sky do the work.
			</Trans>
		</p>
		<p>
			<Trans>
				A comfortable chair or blanket is more useful than a telescope, as
				meteors can appear anywhere overhead.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				Fast and bright, the Perseids often produce spectacular fireballs that
				leave glowing trails behind them.
			</Trans>
		</p>
		<p>
			<Trans>
				Under a dark sky, it can feel as though the universe itself is writing
				with light.
			</Trans>
		</p>
	</>
)

export const perseidsEvent: SeasonalEvent = {
	id: 'perseids',
	isActive: isPerseidsPeak,
	run: launchPerseidsShower,
	details: EventDetails,
	tileAccent: {
		colors: ['#e0f2fe', '#7dd3fc', '#60a5fa', '#a78bfa', '#e0f2fe'],
	},
}

function isPerseidsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return PERSEIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

async function launchPerseidsShower() {
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
			throw new Error('Unable to create 2D context for perseids canvas')
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
			PERSEIDS_METEOR_COLORS[
				Math.floor(Math.random() * PERSEIDS_METEOR_COLORS.length)
			]

		const createStar = (time: number): Star => ({
			x: Math.random() * width,
			y: Math.random() * height,
			radius: randomInRange(PERSEIDS_STAR_RADIUS_RANGE),
			opacity: randomInRange(PERSEIDS_STAR_OPACITY_RANGE),
			twinkle: randomInRange(PERSEIDS_STAR_TWINKLE_RANGE),
			phase: Math.random() * Math.PI * 2,
			birthTime: time + randomInRange(PERSEIDS_STAR_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(PERSEIDS_STAR_FADE_IN_DURATION_RANGE),
		})

		const createMeteor = (time: number): Meteor => {
			const speed = randomInRange(PERSEIDS_METEOR_SPEED_RANGE)
			const angle = randomInRange(PERSEIDS_METEOR_ANGLE_RANGE)
			return {
				x: width * randomInRange(PERSEIDS_METEOR_SPAWN_X),
				y: height * randomInRange(PERSEIDS_METEOR_SPAWN_Y),
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				length: randomInRange(PERSEIDS_METEOR_LENGTH_RANGE),
				width: randomInRange(PERSEIDS_METEOR_WIDTH_RANGE),
				opacity: randomInRange({ min: 0.5, max: 0.9 }),
				glow: randomInRange(PERSEIDS_METEOR_GLOW_RANGE),
				color: randomMeteorColor(),
				age: 0,
				lifetime: randomInRange(PERSEIDS_METEOR_LIFETIME_RANGE),
				nextSpawn: time + randomInRange(PERSEIDS_METEOR_SPAWN_DELAY_RANGE),
			}
		}

		const resetField = (time: number) => {
			meteors = Array.from({ length: PERSEIDS_METEOR_COUNT }, () =>
				createMeteor(time),
			)
			stars = Array.from({ length: PERSEIDS_STAR_COUNT }, () =>
				createStar(time),
			)
		}

		const resizeCanvas = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, PERSEIDS_MAX_DPR)
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
			context.fillStyle = PERSEIDS_STAR_COLOR
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
				meteor.x = width * (0.2 + i * 0.12)
				meteor.y = height * (0.2 + i * 0.08)
				drawMeteor(meteor, meteor.opacity)
			}
		}

		overlay.style.position = 'fixed'
		overlay.style.inset = '0'
		overlay.style.pointerEvents = 'none'
		overlay.style.zIndex = '0'
		overlay.style.opacity = PERSEIDS_OVERLAY_OPACITY
		overlay.style.filter = PERSEIDS_OVERLAY_FILTER
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

		timeoutId = window.setTimeout(mount, PERSEIDS_MOUNT_DELAY_MS)

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
		console.error('Failed to launch Perseids meteor shower', error)
		return () => {}
	}
}

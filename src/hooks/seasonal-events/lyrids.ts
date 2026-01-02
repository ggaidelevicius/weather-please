import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'

const LYRIDS_PEAK_DATES = new Set([
	'2025-04-22',
	'2025-04-23',
	'2026-04-22',
	'2026-04-23',
	'2027-04-22',
	'2027-04-23',
	'2028-04-22',
	'2028-04-23',
	'2029-04-22',
	'2029-04-23',
	'2030-04-22',
	'2030-04-23',
	'2031-04-22',
	'2031-04-23',
	'2032-04-22',
	'2032-04-23',
	'2033-04-22',
	'2033-04-23',
	'2034-04-22',
	'2034-04-23',
	'2035-04-22',
	'2035-04-23',
	'2036-04-22',
	'2036-04-23',
	'2037-04-22',
	'2037-04-23',
	'2038-04-22',
	'2038-04-23',
	'2039-04-22',
	'2039-04-23',
	'2040-04-22',
	'2040-04-23',
	'2041-04-22',
	'2041-04-23',
	'2042-04-22',
	'2042-04-23',
	'2043-04-22',
	'2043-04-23',
])
const LYRIDS_MOUNT_DELAY_MS = 900
const LYRIDS_OVERLAY_OPACITY = '0.78'
const LYRIDS_OVERLAY_FILTER = 'saturate(125%)'
const LYRIDS_MAX_DPR = 2
const LYRIDS_METEOR_COUNT = 10
const LYRIDS_STAR_COUNT = 140
const LYRIDS_METEOR_LENGTH_RANGE = { min: 130, max: 240 }
const LYRIDS_METEOR_WIDTH_RANGE = { min: 1, max: 2.2 }
const LYRIDS_METEOR_SPEED_RANGE = { min: 480, max: 780 }
const LYRIDS_METEOR_ANGLE_RANGE = { min: 0.26, max: 0.44 }
const LYRIDS_METEOR_SPAWN_DELAY_RANGE = { min: 900, max: 2400 }
const LYRIDS_METEOR_LIFETIME_RANGE = { min: 1400, max: 2300 }
const LYRIDS_METEOR_SPAWN_X = { min: -0.2, max: 0.6 }
const LYRIDS_METEOR_SPAWN_Y = { min: -0.35, max: 0.2 }
const LYRIDS_METEOR_GLOW_RANGE = { min: 12, max: 22 }
const LYRIDS_METEOR_COLORS = [
	'rgba(226, 232, 240, 1)',
	'rgba(191, 219, 254, 1)',
	'rgba(148, 163, 184, 1)',
	'rgba(252, 211, 77, 1)',
]
const LYRIDS_STAR_COLOR = 'rgba(226, 232, 240, 1)'
const LYRIDS_STAR_RADIUS_RANGE = { min: 0.5, max: 1.4 }
const LYRIDS_STAR_OPACITY_RANGE = { min: 0.2, max: 0.55 }
const LYRIDS_STAR_TWINKLE_RANGE = { min: 0.0006, max: 0.0014 }
const LYRIDS_STAR_FADE_IN_DELAY_RANGE = { min: 0, max: 2200 }
const LYRIDS_STAR_FADE_IN_DURATION_RANGE = { min: 1200, max: 2200 }

export const lyridsEvent: SeasonalEvent = {
	id: 'lyrids',
	isActive: isLyridsPeak,
	run: launchLyridsShower,
	tileAccent: {
		colors: ['#e2e8f0', '#fcd34d', '#93c5fd', '#60a5fa', '#e2e8f0'],
	},
}

function isLyridsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return LYRIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

async function launchLyridsShower() {
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
			throw new Error('Unable to create 2D context for lyrids canvas')
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
			LYRIDS_METEOR_COLORS[
				Math.floor(Math.random() * LYRIDS_METEOR_COLORS.length)
			]

		const createStar = (time: number): Star => ({
			x: Math.random() * width,
			y: Math.random() * height,
			radius: randomInRange(LYRIDS_STAR_RADIUS_RANGE),
			opacity: randomInRange(LYRIDS_STAR_OPACITY_RANGE),
			twinkle: randomInRange(LYRIDS_STAR_TWINKLE_RANGE),
			phase: Math.random() * Math.PI * 2,
			birthTime: time + randomInRange(LYRIDS_STAR_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(LYRIDS_STAR_FADE_IN_DURATION_RANGE),
		})

		const createMeteor = (time: number): Meteor => {
			const speed = randomInRange(LYRIDS_METEOR_SPEED_RANGE)
			const angle = randomInRange(LYRIDS_METEOR_ANGLE_RANGE)
			return {
				x: width * randomInRange(LYRIDS_METEOR_SPAWN_X),
				y: height * randomInRange(LYRIDS_METEOR_SPAWN_Y),
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				length: randomInRange(LYRIDS_METEOR_LENGTH_RANGE),
				width: randomInRange(LYRIDS_METEOR_WIDTH_RANGE),
				opacity: randomInRange({ min: 0.45, max: 0.85 }),
				glow: randomInRange(LYRIDS_METEOR_GLOW_RANGE),
				color: randomMeteorColor(),
				age: 0,
				lifetime: randomInRange(LYRIDS_METEOR_LIFETIME_RANGE),
				nextSpawn: time + randomInRange(LYRIDS_METEOR_SPAWN_DELAY_RANGE),
			}
		}

		const resetField = (time: number) => {
			meteors = Array.from({ length: LYRIDS_METEOR_COUNT }, () =>
				createMeteor(time),
			)
			stars = Array.from({ length: LYRIDS_STAR_COUNT }, () => createStar(time))
		}

		const resizeCanvas = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, LYRIDS_MAX_DPR)
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
			context.fillStyle = LYRIDS_STAR_COLOR
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
		overlay.style.opacity = LYRIDS_OVERLAY_OPACITY
		overlay.style.filter = LYRIDS_OVERLAY_FILTER
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

		timeoutId = window.setTimeout(mount, LYRIDS_MOUNT_DELAY_MS)

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
		console.error('Failed to launch Lyrids meteor shower', error)
		return () => {}
	}
}

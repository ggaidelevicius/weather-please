import { createAdaptiveDprController, randomInRange } from '../core/utils'
import { startMeteorShowerAnimation } from './meteor-shower-animation'
import type { MeteorShowerFrame } from './meteor-shower-animation'

const PERSEIDS_MOUNT_DELAY_MS = 900

const PERSEIDS_OVERLAY_OPACITY = '0.8'

const PERSEIDS_OVERLAY_FILTER = 'saturate(130%)'

const PERSEIDS_MAX_DPR = 2

const PERSEIDS_METEOR_COUNT = 12

const PERSEIDS_STAR_COUNT = 140

const PERSEIDS_METEOR_LENGTH_RANGE = { max: 260, min: 140 }

const PERSEIDS_METEOR_WIDTH_RANGE = { max: 2.6, min: 1.1 }

const PERSEIDS_METEOR_SPEED_RANGE = { max: 820, min: 520 }

const PERSEIDS_METEOR_ANGLE_RANGE = { max: 0.42, min: 0.25 }

const PERSEIDS_METEOR_SPAWN_DELAY_RANGE = { max: 2000, min: 720 }

const PERSEIDS_METEOR_LIFETIME_RANGE = { max: 2200, min: 1400 }

const PERSEIDS_METEOR_SPAWN_X = { max: 0.6, min: -0.2 }

const PERSEIDS_METEOR_SPAWN_Y = { max: 0.2, min: -0.35 }

const PERSEIDS_METEOR_GLOW_RANGE = { max: 22, min: 12 }

const PERSEIDS_METEOR_COLORS = [
	'rgba(248, 250, 252, 1)',
	'rgba(191, 219, 254, 1)',
	'rgba(129, 140, 248, 1)',
	'rgba(167, 139, 250, 1)',
]

const PERSEIDS_STAR_COLOR = 'rgba(226, 232, 240, 1)'

const PERSEIDS_STAR_RADIUS_RANGE = { max: 1.6, min: 0.6 }

const PERSEIDS_STAR_OPACITY_RANGE = { max: 0.6, min: 0.2 }

const PERSEIDS_STAR_TWINKLE_RANGE = { max: 0.0014, min: 0.0006 }

const PERSEIDS_STAR_FADE_IN_DELAY_RANGE = { max: 2200, min: 0 }

const PERSEIDS_STAR_FADE_IN_DURATION_RANGE = { max: 2200, min: 1200 }

export async function launchPerseidsShower() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const overlay = document.createElement('div')
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for perseids canvas')
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

		let width = window.innerWidth
		let height = window.innerHeight
		let meteors: Meteor[] = []
		let stars: Star[] = []
		let staticMeteors: Meteor[] = []

		const dprController = createAdaptiveDprController({
			maxDpr: PERSEIDS_MAX_DPR,
			minScale: 0.4,
		})
		const randomMeteorColor = () =>
			PERSEIDS_METEOR_COLORS[
				Math.floor(Math.random() * PERSEIDS_METEOR_COLORS.length)
			]

		const createStar = (time: number): Star => ({
			birthTime: time + randomInRange(PERSEIDS_STAR_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(PERSEIDS_STAR_FADE_IN_DURATION_RANGE),
			opacity: randomInRange(PERSEIDS_STAR_OPACITY_RANGE),
			phase: Math.random() * Math.PI * 2,
			radius: randomInRange(PERSEIDS_STAR_RADIUS_RANGE),
			twinkle: randomInRange(PERSEIDS_STAR_TWINKLE_RANGE),
			x: Math.random() * width,
			y: Math.random() * height,
		})

		const createMeteor = (time: number): Meteor => {
			const speed = randomInRange(PERSEIDS_METEOR_SPEED_RANGE)
			const angle = randomInRange(PERSEIDS_METEOR_ANGLE_RANGE)
			return {
				age: 0,
				color: randomMeteorColor(),
				glow: randomInRange(PERSEIDS_METEOR_GLOW_RANGE),
				length: randomInRange(PERSEIDS_METEOR_LENGTH_RANGE),
				lifetime: randomInRange(PERSEIDS_METEOR_LIFETIME_RANGE),
				nextSpawn: time + randomInRange(PERSEIDS_METEOR_SPAWN_DELAY_RANGE),
				opacity: randomInRange({ max: 0.9, min: 0.5 }),
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				width: randomInRange(PERSEIDS_METEOR_WIDTH_RANGE),
				x: width * randomInRange(PERSEIDS_METEOR_SPAWN_X),
				y: height * randomInRange(PERSEIDS_METEOR_SPAWN_Y),
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

		const resizeCanvas = (time: number) => {
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
				resetField(time)
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

		const getStarFade = (
			star: Star,
			time: number,
			isReducedMotion: boolean,
		) => {
			if (isReducedMotion) {
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

		const drawStars = (time: number, isReducedMotion: boolean) => {
			context.fillStyle = PERSEIDS_STAR_COLOR
			for (const star of stars) {
				const fade = getStarFade(star, time, isReducedMotion)
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

		const drawFrame = ({ delta, isReducedMotion, time }: MeteorShowerFrame) => {
			if (isReducedMotion) {
				drawStatic(time)
				return
			}
			if (delta > 0 && dprController.reportFrame(time)) {
				resizeCanvas(time)
			}
			context.clearRect(0, 0, width, height)
			context.globalCompositeOperation = 'lighter'
			drawStars(time, false)

			for (const meteor of meteors) {
				if (time < meteor.nextSpawn) {
					continue
				}

				if (delta > 0) {
					meteor.age += delta
					if (meteor.age >= meteor.lifetime) {
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
				}
				const progress = meteor.age / meteor.lifetime

				const fade = Math.sin(progress * Math.PI)
				drawMeteor(meteor, meteor.opacity * fade)
			}
		}

		const drawStatic = (time: number) => {
			context.clearRect(0, 0, width, height)
			context.globalCompositeOperation = 'lighter'
			drawStars(time, true)
			if (staticMeteors.length === 0) {
				staticMeteors = Array.from(
					{ length: Math.min(5, meteors.length) },
					() => createMeteor(time),
				)
			}
			for (const [i, meteor] of staticMeteors.entries()) {
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

		return startMeteorShowerAnimation({
			mountDelayMs: PERSEIDS_MOUNT_DELAY_MS,
			onFrame: drawFrame,
			onResize: resizeCanvas,
			overlay,
		})
	} catch (error) {
		console.error('Failed to launch Perseids meteor shower', error)
		return () => {}
	}
}

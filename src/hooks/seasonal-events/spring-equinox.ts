import { randomInRange } from './utils'
import type { SeasonalEvent } from './types'

const SPRING_EQUINOX_DATES = new Set([
	'2026-03-20',
	'2027-03-20',
	'2028-03-20',
	'2029-03-20',
	'2030-03-20',
	'2031-03-20',
	'2032-03-20',
	'2033-03-20',
	'2034-03-20',
	'2035-03-20',
	'2036-03-20',
	'2037-03-20',
	'2038-03-20',
	'2039-03-20',
	'2040-03-20',
	'2041-03-20',
	'2042-03-20',
	'2043-03-20',
])
const SPRING_DURATION_MS = 10000
const SPRING_INTERVAL_MS = 175
const SPRING_PARTICLE_COUNT = 1
const SPRING_SCALAR = 1.4
const SPRING_GRAVITY = 0.007
const SPRING_DECAY = 0.987
const SPRING_TICKS_RANGE = { min: 320, max: 460 }
const SPRING_SPREAD = 18
const SPRING_ORIGIN_X_RANGE = { min: 0.05, max: 0.95 }
const SPRING_ORIGIN_Y = 1.05
const SPRING_ANGLE = 90
const SPRING_TARGET_Y_RANGE = { min: 0.33, max: 0.5 }
const SPRING_VELOCITY_FACTOR = 6.6
const SPRING_VELOCITY_JITTER = { min: -0.4, max: 0.4 }
const SPRING_DRIFT_RANGE = { min: -0.1, max: 0.1 }
const SPRING_GLOW_FILTER = 'drop-shadow(0 0 10px rgba(248, 200, 220, 0.6))'

export const springEquinoxEvent: SeasonalEvent = {
	id: 'spring-equinox',
	isActive: isSpringEquinox,
	run: launchSpringEquinoxPetals,
	tileAccent: {
		colors: ['#f7c9df', '#f3a6c8', '#b7e4c7', '#95d5b2', '#f7c9df'],
	},
}

function isSpringEquinox(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return SPRING_EQUINOX_DATES.has(`${year}-${month}-${day}`)
}

async function launchSpringEquinoxPetals() {
	try {
		const { default: confetti } = await import('canvas-confetti')
		const canvas = document.createElement('canvas')

		canvas.style.position = 'fixed'
		canvas.style.inset = '0'
		canvas.style.width = '100%'
		canvas.style.height = '100%'
		canvas.style.pointerEvents = 'none'
		canvas.style.zIndex = '1'
		canvas.style.filter = SPRING_GLOW_FILTER

		document.body.appendChild(canvas)

		const confettiInstance = confetti.create(canvas, {
			resize: true,
			disableForReducedMotion: true,
		})
		const leafShape = confetti.shapeFromText({
			text: '🍃',
			scalar: SPRING_SCALAR,
		})
		const sproutShape = confetti.shapeFromText({
			text: '🌿',
			scalar: SPRING_SCALAR,
		})
		let intervalId: number | null = null
		const animationEnd = Date.now() + SPRING_DURATION_MS

		intervalId = window.setInterval(() => {
			const timeLeft = animationEnd - Date.now()

			if (timeLeft <= 0) {
				if (intervalId !== null) {
					window.clearInterval(intervalId)
					intervalId = null
				}
				return
			}

			const targetY = randomInRange(SPRING_TARGET_Y_RANGE)
			const distance = SPRING_ORIGIN_Y - targetY
			const startVelocity =
				distance * SPRING_VELOCITY_FACTOR +
				randomInRange(SPRING_VELOCITY_JITTER)

			confettiInstance({
				angle: SPRING_ANGLE,
				spread: SPRING_SPREAD,
				startVelocity,
				gravity: SPRING_GRAVITY,
				decay: SPRING_DECAY,
				ticks: Math.round(randomInRange(SPRING_TICKS_RANGE)),
				particleCount: SPRING_PARTICLE_COUNT,
				scalar: SPRING_SCALAR,
				shapes: [leafShape, sproutShape],
				origin: {
					x: randomInRange(SPRING_ORIGIN_X_RANGE),
					y: SPRING_ORIGIN_Y,
				},
				drift: randomInRange(SPRING_DRIFT_RANGE),
				flat: true,
				zIndex: 1,
			})
		}, SPRING_INTERVAL_MS)

		return () => {
			if (intervalId !== null) {
				window.clearInterval(intervalId)
			}
			confettiInstance.reset()
			if (document.body.contains(canvas)) {
				document.body.removeChild(canvas)
			}
		}
	} catch (error) {
		console.error('Failed to launch spring equinox petals', error)
		return () => {}
	}
}

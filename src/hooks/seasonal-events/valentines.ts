import { randomInRange } from './utils'
import type { SeasonalEvent } from './types'

const VALENTINES_MONTH = 1
const VALENTINES_DAY = 14
const HEARTS_DURATION_MS = 8000
const HEARTS_INTERVAL_MS = 350
const HEARTS_PARTICLE_COUNT = 3
const HEARTS_SCALAR = 1.4
const HEARTS_START_VELOCITY = 8
const HEARTS_GRAVITY = 0.35
const HEARTS_DECAY = 0.94
const HEARTS_TICKS = 260
const HEARTS_ANGLE = 270
const HEARTS_SPREAD = 18
const HEARTS_ORIGIN_Y = -0.1
const HEARTS_GLOW_FILTER = 'drop-shadow(0 0 8px rgba(255, 155, 190, 0.65))'
const HEARTS_COLOR = '#ff7aa8'
const HEARTS_DRIFT_RANGE = { min: -0.45, max: 0.45 }

export const valentinesEvent: SeasonalEvent = {
	id: 'valentines-day',
	isActive: isValentinesDay,
	run: launchValentinesHearts,
	tileAccent: {
		colors: ['#fbcfe8', '#f9a8d4', '#f472b6', '#fb7185', '#fbcfe8'],
	},
}

function isValentinesDay(date: Date) {
	return (
		date.getMonth() === VALENTINES_MONTH && date.getDate() === VALENTINES_DAY
	)
}

async function launchValentinesHearts() {
	const { default: confetti } = await import('canvas-confetti')
	const canvas = document.createElement('canvas')

	canvas.style.position = 'fixed'
	canvas.style.inset = '0'
	canvas.style.width = '100%'
	canvas.style.height = '100%'
	canvas.style.pointerEvents = 'none'
	canvas.style.zIndex = '1'
	canvas.style.filter = HEARTS_GLOW_FILTER

	document.body.appendChild(canvas)

	const confettiInstance = confetti.create(canvas, {
		resize: true,
		disableForReducedMotion: true,
	})
	const heartShape = confetti.shapeFromText({
		text: '❤',
		scalar: HEARTS_SCALAR,
		color: HEARTS_COLOR,
	})
	let intervalId: number | null = null
	const animationEnd = Date.now() + HEARTS_DURATION_MS

	intervalId = window.setInterval(() => {
		const timeLeft = animationEnd - Date.now()

		if (timeLeft <= 0) {
			if (intervalId !== null) {
				window.clearInterval(intervalId)
				intervalId = null
			}
			return
		}

		confettiInstance({
			angle: HEARTS_ANGLE,
			spread: HEARTS_SPREAD,
			startVelocity: HEARTS_START_VELOCITY,
			gravity: HEARTS_GRAVITY,
			decay: HEARTS_DECAY,
			ticks: HEARTS_TICKS,
			particleCount: HEARTS_PARTICLE_COUNT,
			scalar: HEARTS_SCALAR,
			shapes: [heartShape],
			origin: {
				x: Math.random(),
				y: HEARTS_ORIGIN_Y,
			},
			drift: randomInRange(HEARTS_DRIFT_RANGE),
			flat: true,
			zIndex: 1,
		})
	}, HEARTS_INTERVAL_MS)

	return () => {
		if (intervalId !== null) {
			window.clearInterval(intervalId)
		}
		confettiInstance.reset()
		if (document.body.contains(canvas)) {
			document.body.removeChild(canvas)
		}
	}
}

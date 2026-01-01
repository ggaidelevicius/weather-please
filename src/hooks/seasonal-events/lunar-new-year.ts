import { randomInRange } from './utils'
import type { SeasonalEvent } from './types'

const LUNAR_NEW_YEAR_DATES = new Set([
	'2024-02-10',
	'2025-01-29',
	'2026-02-17',
	'2027-02-06',
	'2028-01-26',
	'2029-02-13',
	'2030-02-03',
	'2031-01-23',
	'2032-02-11',
	'2033-01-31',
	'2034-02-19',
	'2035-02-08',
	'2036-01-28',
	'2037-02-15',
	'2038-02-04',
	'2039-01-24',
	'2040-02-12',
	'2041-02-01',
	'2042-01-22',
	'2043-02-10',
])
const LUNAR_DURATION_MS = 11000
const LUNAR_INTERVAL_MS = 900
const LUNAR_PARTICLE_MIN = 1
const LUNAR_PARTICLE_MAX = 1
const LUNAR_SCALAR = 1.8
const LUNAR_START_VELOCITY = 1.6
const LUNAR_GRAVITY = -0.02
const LUNAR_DECAY = 0.997
const LUNAR_TICKS = 420
const LUNAR_ANGLE = 90
const LUNAR_SPREAD = 22
const LUNAR_ORIGIN_Y = 1.05
const LUNAR_DRIFT_RANGE = { min: -0.15, max: 0.15 }
const LUNAR_ORIGIN_X_RANGE = { min: 0.08, max: 0.92 }
const LUNAR_LANTERN_FILTER = 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.7))'

export const lunarNewYearEvent: SeasonalEvent = {
	id: 'lunar-new-year',
	isActive: isLunarNewYear,
	run: launchLunarNewYear,
	tileAccent: {
		colors: ['#f5e3c1', '#e6b26a', '#c9854a', '#8f5a3a', '#f5e3c1'],
	},
}

function isLunarNewYear(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return LUNAR_NEW_YEAR_DATES.has(`${year}-${month}-${day}`)
}

async function launchLunarNewYear() {
	const { default: confetti } = await import('canvas-confetti')
	const canvas = document.createElement('canvas')

	canvas.style.position = 'fixed'
	canvas.style.inset = '0'
	canvas.style.width = '100%'
	canvas.style.height = '100%'
	canvas.style.pointerEvents = 'none'
	canvas.style.zIndex = '1'
	canvas.style.filter = LUNAR_LANTERN_FILTER

	document.body.appendChild(canvas)

	const confettiInstance = confetti.create(canvas, {
		resize: true,
		disableForReducedMotion: true,
	})
	const lanternShape = confetti.shapeFromText({
		text: '🏮',
		scalar: LUNAR_SCALAR,
	})
	let intervalId: number | null = null
	const animationEnd = Date.now() + LUNAR_DURATION_MS

	intervalId = window.setInterval(() => {
		const timeLeft = animationEnd - Date.now()

		if (timeLeft <= 0) {
			if (intervalId !== null) {
				window.clearInterval(intervalId)
				intervalId = null
			}
			return
		}

		const particleCount =
			Math.random() > 0.5 ? LUNAR_PARTICLE_MAX : LUNAR_PARTICLE_MIN

		confettiInstance({
			angle: LUNAR_ANGLE,
			spread: LUNAR_SPREAD,
			startVelocity: LUNAR_START_VELOCITY,
			gravity: LUNAR_GRAVITY,
			decay: LUNAR_DECAY,
			ticks: LUNAR_TICKS,
			particleCount,
			scalar: LUNAR_SCALAR,
			shapes: [lanternShape],
			origin: {
				x: randomInRange(LUNAR_ORIGIN_X_RANGE),
				y: LUNAR_ORIGIN_Y,
			},
			drift: randomInRange(LUNAR_DRIFT_RANGE),
			flat: true,
			zIndex: 1,
		})
	}, LUNAR_INTERVAL_MS)

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

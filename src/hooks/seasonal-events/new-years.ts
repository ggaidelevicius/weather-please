import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'

const NEW_YEARS_MONTH = 0
const NEW_YEARS_DAY = 1
const FIREWORKS_DURATION_MS = 6000
const FIREWORKS_INTERVAL_MS = 400
const FIREWORKS_BASE_PARTICLE_COUNT = 50
const FIREWORKS_ORIGIN_Y_OFFSET = 0.2
const FIREWORKS_DEFAULTS = {
	startVelocity: 30,
	spread: 360,
	ticks: 60,
	zIndex: 0,
	disableForReducedMotion: true,
}
const FIREWORKS_LEFT_ORIGIN_RANGE = { min: 0.1, max: 0.3 }
const FIREWORKS_RIGHT_ORIGIN_RANGE = { min: 0.7, max: 0.9 }

export const newYearsEvent: SeasonalEvent = {
	id: 'new-years-day',
	isActive: isNewYearsDay,
	run: launchNewYearsFireworks,
	tileAccent: {
		colors: ['#e2e8f0', '#c7d2fe', '#bae6fd', '#e0f2fe', '#e2e8f0'],
	},
}

function isNewYearsDay({ date }: SeasonalEventContext) {
	return date.getMonth() === NEW_YEARS_MONTH && date.getDate() === NEW_YEARS_DAY
}

async function launchNewYearsFireworks() {
	const { default: confetti } = await import('canvas-confetti')
	let intervalId: number | null = null

	const animationEnd = Date.now() + FIREWORKS_DURATION_MS

	intervalId = window.setInterval(() => {
		const timeLeft = animationEnd - Date.now()

		if (timeLeft <= 0) {
			if (intervalId !== null) {
				window.clearInterval(intervalId)
				intervalId = null
			}
			return
		}

		const particleCount = Math.ceil(
			FIREWORKS_BASE_PARTICLE_COUNT * (timeLeft / FIREWORKS_DURATION_MS),
		)

		confetti({
			...FIREWORKS_DEFAULTS,
			particleCount,
			origin: {
				x: randomInRange(FIREWORKS_LEFT_ORIGIN_RANGE),
				y: Math.random() - FIREWORKS_ORIGIN_Y_OFFSET,
			},
		})

		confetti({
			...FIREWORKS_DEFAULTS,
			particleCount,
			origin: {
				x: randomInRange(FIREWORKS_RIGHT_ORIGIN_RANGE),
				y: Math.random() - FIREWORKS_ORIGIN_Y_OFFSET,
			},
		})
	}, FIREWORKS_INTERVAL_MS)

	return () => {
		if (intervalId !== null) {
			window.clearInterval(intervalId)
		}
	}
}

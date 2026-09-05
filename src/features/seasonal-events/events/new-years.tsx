import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'
import { randomInRange } from '../core/utils'

const FIREWORKS_DURATION_MS = 6000

const FIREWORKS_INTERVAL_MS = 400

const FIREWORKS_BASE_PARTICLE_COUNT = 50

const FIREWORKS_ORIGIN_Y_OFFSET = 0.2

const FIREWORKS_DEFAULTS = {
	disableForReducedMotion: true,
	spread: 360,
	startVelocity: 30,
	ticks: 60,
	zIndex: 0,
}

const FIREWORKS_LEFT_ORIGIN_RANGE = { max: 0.3, min: 0.1 }

const FIREWORKS_RIGHT_ORIGIN_RANGE = { max: 0.9, min: 0.7 }

export async function launchNewYearsFireworks() {
	const { default: confetti } = await import('canvas-confetti')
	const animationController = createSettingsModalAnimationController()
	let intervalId: null | number = null

	const animationEnd = Date.now() + FIREWORKS_DURATION_MS

	intervalId = animationController.setInterval(() => {
		const timeLeft = animationEnd - Date.now()

		if (timeLeft <= 0) {
			if (intervalId !== null) {
				animationController.clearInterval(intervalId)
				intervalId = null
			}
			return
		}

		const particleCount = Math.ceil(
			FIREWORKS_BASE_PARTICLE_COUNT * (timeLeft / FIREWORKS_DURATION_MS),
		)

		confetti({
			...FIREWORKS_DEFAULTS,
			origin: {
				x: randomInRange(FIREWORKS_LEFT_ORIGIN_RANGE),
				y: Math.random() - FIREWORKS_ORIGIN_Y_OFFSET,
			},
			particleCount,
		})

		confetti({
			...FIREWORKS_DEFAULTS,
			origin: {
				x: randomInRange(FIREWORKS_RIGHT_ORIGIN_RANGE),
				y: Math.random() - FIREWORKS_ORIGIN_Y_OFFSET,
			},
			particleCount,
		})
	}, FIREWORKS_INTERVAL_MS)

	return () => {
		animationController.dispose()
		if (intervalId !== null) {
			animationController.clearInterval(intervalId)
		}
	}
}

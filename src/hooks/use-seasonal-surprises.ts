import { useEffect, useRef } from 'react'

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
}
const FIREWORKS_LEFT_ORIGIN_RANGE = { min: 0.1, max: 0.3 }
const FIREWORKS_RIGHT_ORIGIN_RANGE = { min: 0.7, max: 0.9 }

type UseSeasonalSurprisesOptions = {
	isEnabled: boolean
	isHydrated?: boolean
	isOnboarded?: boolean
}

export const useSeasonalSurprises = ({
	isEnabled,
	isHydrated = true,
	isOnboarded = true,
}: Readonly<UseSeasonalSurprisesOptions>) => {
	const hasTriggeredNewYearsConfetti = useRef(false)

	useEffect(() => {
		if (!isHydrated || !isEnabled || !isOnboarded) return
		if (hasTriggeredNewYearsConfetti.current) return
		if (!isNewYearsDay(new Date())) return

		hasTriggeredNewYearsConfetti.current = true

		let intervalId: number | null = null
		let hasCanceled = false

		const runConfetti = async () => {
			try {
				const { default: confetti } = await import('canvas-confetti')

				if (hasCanceled) return

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
			} catch (error) {
				console.error('Failed to load New Year confetti', error)
			}
		}

		void runConfetti()

		return () => {
			hasCanceled = true
			if (intervalId !== null) {
				window.clearInterval(intervalId)
			}
		}
	}, [isEnabled, isHydrated])
}

function isNewYearsDay(date: Date) {
	return date.getMonth() === NEW_YEARS_MONTH && date.getDate() === NEW_YEARS_DAY
}

function randomInRange({ min, max }: { min: number; max: number }) {
	return Math.random() * (max - min) + min
}

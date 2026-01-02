import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'

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

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				New Year’s Day serves as the calendar’s reset, marked by the first
				sunrise of the year and a shared moment of looking forward.
			</Trans>
		</p>
		<p>
			<Trans>
				Although many cultures follow different calendars and celebrate the new
				year at other times, January 1 remains a widely recognised global
				marker.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The month of January is named after Janus, the Roman god of doorways and
				beginnings, traditionally depicted as facing both the past and the
				future.
			</Trans>
		</p>
		<p>
			<Trans>
				Over centuries of calendar reform, January 1 gradually became
				established as the start of the year for much of the world.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				As the Earth turns, the new year arrives in a slow-moving wave that
				travels across time zones for nearly a full day.
			</Trans>
		</p>
		<p>
			<Trans>
				Fireworks, bells, and wishes seem to ride that wave, scattering light
				and sound across the night.
			</Trans>
		</p>
	</>
)

export const newYearsEvent: SeasonalEvent = {
	id: 'new-years-day',
	isActive: isNewYearsDay,
	run: launchNewYearsFireworks,
	details: EventDetails,
	tileAccent: {
		colors: ['#fde68a', '#f59e0b', '#60a5fa', '#a78bfa', '#fde68a'],
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

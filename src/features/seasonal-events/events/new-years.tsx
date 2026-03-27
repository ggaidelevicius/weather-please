import { Trans } from '@lingui/react/macro'

import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'
import {
	type SeasonalEvent,
	type SeasonalEventContext,
	SeasonalEventId,
} from '../core/types'
import { randomInRange } from '../core/utils'

const NEW_YEARS_MONTH = 0
const NEW_YEARS_DAY = 1
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
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The new year doesn&apos;t arrive all at once — it rolls across the
				planet over the course of a full day, time zone by time zone.
			</Trans>
		</p>
		<p>
			<Trans>
				At each boundary, fireworks go up, bells ring, and strangers count down
				together. The same moment of anticipation, repeated twenty-four times.
			</Trans>
		</p>
	</>
)

export const newYearsEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.NewYearsDay,
	isActive: isNewYearsDay,
	run: launchNewYearsFireworks,
	tileAccent: {
		colors: ['#fde68a', '#f59e0b', '#60a5fa', '#a78bfa', '#fde68a'],
	},
}

function isNewYearsDay({ date }: SeasonalEventContext) {
	return date.getMonth() === NEW_YEARS_MONTH && date.getDate() === NEW_YEARS_DAY
}

async function launchNewYearsFireworks() {
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

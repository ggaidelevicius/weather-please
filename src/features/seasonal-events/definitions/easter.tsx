import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Easter centres on themes of renewal and, in Christian tradition, the
				resurrection of Jesus.
			</Trans>
		</p>
		<p>
			<Trans>
				It is a movable feast, its date determined by the cycle of the moon and
				the arrival of spring in the northern hemisphere.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				From its earliest observances, Christian calendars aligned Easter with
				the spring season and the full moon following the equinox.
			</Trans>
		</p>
		<p>
			<Trans>
				Across many cultures, older symbols of rebirth — such as eggs, blossoms,
				and new growth — became woven into the celebration.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Sunrise services draw people outdoors before the day has fully started,
				and egg hunts send children tearing across gardens and parks.
			</Trans>
		</p>
		<p>
			<Trans>
				There&apos;s a reason the holiday lands in spring — it borrows heavily
				from the season&apos;s own sense of things starting over.
			</Trans>
		</p>
	</>
)

export const easterEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Easter,
	isActive: isEaster,
	run: () => import('../events/easter').then((module) => module.launchEaster()),
	tileAccent: {
		colors: ['#fce7f3', '#fbcfe8', '#a5b4fc', '#93c5fd', '#fce7f3'],
	},
}

function getWesternEasterDate(
	year: number,
): null | { day: number; month: number } {
	if (!Number.isFinite(year)) {
		return null
	}

	const a = year % 19
	const b = Math.floor(year / 100)
	const c = year % 100
	const d = Math.floor(b / 4)
	const e = b % 4
	const f = Math.floor((b + 8) / 25)
	const g = Math.floor((b - f + 1) / 3)
	const h = (19 * a + b - d - g + 15) % 30
	const i = Math.floor(c / 4)
	const k = c % 4
	const l = (32 + 2 * e + 2 * i - h - k) % 7
	const m = Math.floor((a + 11 * h + 22 * l) / 451)
	const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
	const day = ((h + l - 7 * m + 114) % 31) + 1

	if (month < 0 || month > 11) {
		return null
	}

	return { day, month }
}

function isEaster({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const easterDate = getWesternEasterDate(year)
	if (!easterDate) {
		return false
	}

	return (
		date.getMonth() === easterDate.month && date.getDate() === easterDate.day
	)
}

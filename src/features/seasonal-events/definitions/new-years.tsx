import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const NEW_YEARS_MONTH = 0

const NEW_YEARS_DAY = 1

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
	run: () =>
		import('../events/new-years').then((module) =>
			module.launchNewYearsFireworks(),
		),
	tileAccent: {
		colors: ['#fde68a', '#f59e0b', '#60a5fa', '#a78bfa', '#fde68a'],
	},
}

function isNewYearsDay({ date }: SeasonalEventContext) {
	return date.getMonth() === NEW_YEARS_MONTH && date.getDate() === NEW_YEARS_DAY
}

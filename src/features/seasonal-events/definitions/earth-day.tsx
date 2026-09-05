import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const EARTH_DAY_DATES = new Set([
	'2026-04-22',
	'2027-04-22',
	'2028-04-22',
	'2029-04-22',
	'2030-04-22',
	'2031-04-22',
	'2032-04-22',
	'2033-04-22',
	'2034-04-22',
	'2035-04-22',
	'2036-04-22',
	'2037-04-22',
	'2038-04-22',
	'2039-04-22',
	'2040-04-22',
	'2041-04-22',
	'2042-04-22',
	'2043-04-22',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Earth Day invites a pause to notice the planet that sustains us, and to
				consider how we care for it.
			</Trans>
		</p>
		<p>
			<Trans>
				It stands as both a celebration of the natural world and a call to
				responsible action.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The first Earth Day, held in 1970, grew out of environmental activism
				and nationwide teach-ins across the United States.
			</Trans>
		</p>
		<p>
			<Trans>
				It has since become a global observance, often drawing attention to
				local ecosystems, conservation efforts, and environmental challenges.
			</Trans>
		</p>

		<h2>
			<Trans>Ways to observe</Trans>
		</h2>
		<p>
			<Trans>
				Community cleanups, tree planting, and habitat restoration are among the
				most common activities.
			</Trans>
		</p>
		<p>
			<Trans>
				Even small choices — repairing, reusing, conserving, or simply walking a
				familiar trail — reflect its underlying spirit.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The math is oddly encouraging — the trees planted on Earth Day since
				1970 now number in the billions.
			</Trans>
		</p>
		<p>
			<Trans>
				Most environmental gains start small and local: a restored wetland, a
				cleaner stretch of river, a species given just enough room to recover.
			</Trans>
		</p>
	</>
)

export const earthDayEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.EarthDay,
	isActive: isEarthDay,
	run: () =>
		import('../events/earth-day').then((module) => module.launchEarthDay()),
	tileAccent: {
		colors: ['#bbf7d0', '#5eead4', '#60a5fa', '#34d399', '#bbf7d0'],
	},
}

function isEarthDay({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return EARTH_DAY_DATES.has(`${year}-${month}-${day}`)
}

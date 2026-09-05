import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const LEONIDS_PEAK_DATES = new Set([
	'2026-11-17',
	'2026-11-18',
	'2027-11-17',
	'2027-11-18',
	'2028-11-17',
	'2028-11-18',
	'2029-11-17',
	'2029-11-18',
	'2030-11-17',
	'2030-11-18',
	'2031-11-17',
	'2031-11-18',
	'2032-11-17',
	'2032-11-18',
	'2033-11-17',
	'2033-11-18',
	'2034-11-17',
	'2034-11-18',
	'2035-11-17',
	'2035-11-18',
	'2036-11-17',
	'2036-11-18',
	'2037-11-17',
	'2037-11-18',
	'2038-11-17',
	'2038-11-18',
	'2039-11-17',
	'2039-11-18',
	'2040-11-17',
	'2040-11-18',
	'2041-11-17',
	'2041-11-18',
	'2042-11-17',
	'2042-11-18',
	'2043-11-17',
	'2043-11-18',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The Leonids are a November meteor shower, named for their radiant in the
				constellation Leo.
			</Trans>
		</p>
		<p>
			<Trans>
				Most years the display is modest, but the shower is famous for its
				capacity to produce rare and spectacular surprises.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The Leonids are renowned for historic meteor storms, most notably in
				1833 and 1966, when observers described the sky as seeming to rain
				stars.
			</Trans>
		</p>
		<p>
			<Trans>
				These events played an important role in the development of scientific
				understanding of meteor showers.
			</Trans>
		</p>

		<h2>
			<Trans>Why it can storm</Trans>
		</h2>
		<p>
			<Trans>
				The Leonids originate from Comet Tempel–Tuttle, and every few decades
				Earth passes through especially dense streams of its debris.
			</Trans>
		</p>
		<p>
			<Trans>
				When this occurs, meteor rates can rise dramatically for a short period
				of time.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				In most years, the Leonids produce only 10–15 meteors per hour. But
				during the 1966 storm, observers reported rates of thousands per minute
				— so many that some people thought the world was ending.
			</Trans>
		</p>
		<p>
			<Trans>
				The next potential Leonid storm window is in the 2030s, when Earth is
				expected to pass through a particularly dense ribbon of Tempel–Tuttle
				debris.
			</Trans>
		</p>
	</>
)

export const leonidsEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Leonids,
	isActive: isLeonidsPeak,
	run: () =>
		import('../events/leonids').then((module) => module.launchLeonidsShower()),
	tileAccent: {
		colors: ['#fcd34d', '#fbbf24', '#f97316', '#94a3b8', '#fcd34d'],
	},
}

function isLeonidsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return LEONIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

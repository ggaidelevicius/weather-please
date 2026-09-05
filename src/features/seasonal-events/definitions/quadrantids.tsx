import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const QUADRANTIDS_PEAK_DATES = new Set([
	'2026-01-03',
	'2026-01-04',
	'2027-01-03',
	'2027-01-04',
	'2028-01-03',
	'2028-01-04',
	'2029-01-03',
	'2029-01-04',
	'2030-01-03',
	'2030-01-04',
	'2031-01-03',
	'2031-01-04',
	'2032-01-03',
	'2032-01-04',
	'2033-01-03',
	'2033-01-04',
	'2034-01-03',
	'2034-01-04',
	'2035-01-03',
	'2035-01-04',
	'2036-01-03',
	'2036-01-04',
	'2037-01-03',
	'2037-01-04',
	'2038-01-03',
	'2038-01-04',
	'2039-01-03',
	'2039-01-04',
	'2040-01-03',
	'2040-01-04',
	'2041-01-03',
	'2041-01-04',
	'2042-01-03',
	'2042-01-04',
	'2043-01-03',
	'2043-01-04',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The Quadrantids are a meteor shower that peaks in early January and is
				known for being brief yet often intense.
			</Trans>
		</p>
		<p>
			<Trans>
				When conditions are favourable, they produce sharp, fast-moving meteors
				in high numbers.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The shower takes its name from Quadrans Muralis, a former constellation
				that no longer appears on modern star charts.
			</Trans>
		</p>
		<p>
			<Trans>
				Although the radiant now lies within the constellation Boötes, the older
				name preserves a small piece of astronomical history.
			</Trans>
		</p>

		<h2>
			<Trans>Why the peak is brief</Trans>
		</h2>
		<p>
			<Trans>
				The stream of debris that creates the Quadrantids is unusually narrow,
				so Earth passes through it quickly.
			</Trans>
		</p>
		<p>
			<Trans>
				This makes the period of strongest activity short, but it can be
				especially spectacular.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Their likely parent body, asteroid 2003 EH1, may be a dead comet — one
				that exhausted its volatile ices and now orbits as a dark, quiet rock.
			</Trans>
		</p>
		<p>
			<Trans>
				The Quadrantid peak is one of the narrowest of any major shower,
				sometimes lasting only six hours. Catching it is partly a matter of luck
				and geography.
			</Trans>
		</p>
	</>
)

export const quadrantidsEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Quadrantids,
	isActive: isQuadrantidsPeak,
	run: () =>
		import('../events/quadrantids').then((module) =>
			module.launchQuadrantidsShower(),
		),
	tileAccent: {
		colors: ['#e0f2fe', '#93c5fd', '#60a5fa', '#818cf8', '#e0f2fe'],
	},
}

function isQuadrantidsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return QUADRANTIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

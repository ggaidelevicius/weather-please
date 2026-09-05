import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const ETA_AQUARIIDS_PEAK_DATES = new Set([
	'2026-05-05',
	'2026-05-06',
	'2027-05-05',
	'2027-05-06',
	'2028-05-05',
	'2028-05-06',
	'2029-05-05',
	'2029-05-06',
	'2030-05-05',
	'2030-05-06',
	'2031-05-05',
	'2031-05-06',
	'2032-05-05',
	'2032-05-06',
	'2033-05-05',
	'2033-05-06',
	'2034-05-05',
	'2034-05-06',
	'2035-05-05',
	'2035-05-06',
	'2036-05-05',
	'2036-05-06',
	'2037-05-05',
	'2037-05-06',
	'2038-05-05',
	'2038-05-06',
	'2039-05-05',
	'2039-05-06',
	'2040-05-05',
	'2040-05-06',
	'2041-05-05',
	'2041-05-06',
	'2042-05-05',
	'2042-05-06',
	'2043-05-05',
	'2043-05-06',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The Eta Aquariids are a major meteor shower formed from the debris of
				Halley’s Comet.
			</Trans>
		</p>
		<p>
			<Trans>
				They peak in early May and are especially well seen from the southern
				hemisphere, though northern skies still catch their share of streaks.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Halley’s Comet itself returns roughly every seventy-six years, but the
				stream of dust it leaves behind crosses Earth’s path each year.
			</Trans>
		</p>
		<p>
			<Trans>
				The shower’s radiant lies near the constellation Aquarius, rising before
				dawn when viewing conditions are at their best.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The Eta Aquariids and the Orionids are sibling showers — both are born
				from Halley&apos;s Comet, but Earth crosses different parts of the
				debris trail six months apart.
			</Trans>
		</p>
		<p>
			<Trans>
				At 66 km/s, these are among the fastest meteors you&apos;ll see. Their
				trails can persist for several seconds after the meteor itself is gone.
			</Trans>
		</p>
	</>
)

export const etaAquariidsEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.EtaAquariids,
	isActive: isEtaAquariidsPeak,
	run: () =>
		import('../events/eta-aquariids').then((module) =>
			module.launchEtaAquariidsShower(),
		),
	tileAccent: {
		colors: ['#bae6fd', '#7dd3fc', '#60a5fa', '#3b82f6', '#bae6fd'],
	},
}

function isEtaAquariidsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return ETA_AQUARIIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

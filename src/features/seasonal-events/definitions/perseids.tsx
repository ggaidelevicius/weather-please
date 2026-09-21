import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const PERSEIDS_PEAK_DATES = new Set([
	'2026-08-13',
	'2027-08-12',
	'2027-08-13',
	'2028-08-12',
	'2028-08-13',
	'2029-08-12',
	'2029-08-13',
	'2030-08-12',
	'2030-08-13',
	'2031-08-12',
	'2031-08-13',
	'2032-08-12',
	'2032-08-13',
	'2033-08-12',
	'2033-08-13',
	'2034-08-12',
	'2034-08-13',
	'2035-08-12',
	'2035-08-13',
	'2036-08-12',
	'2036-08-13',
	'2037-08-12',
	'2037-08-13',
	'2038-08-12',
	'2038-08-13',
	'2039-08-12',
	'2039-08-13',
	'2040-08-12',
	'2040-08-13',
	'2041-08-12',
	'2041-08-13',
	'2042-08-12',
	'2042-08-13',
	'2043-08-12',
	'2043-08-13',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The Perseids are a bright annual meteor shower formed from debris left
				by Comet Swift–Tuttle.
			</Trans>
		</p>
		<p>
			<Trans>
				Their radiant lies in the constellation Perseus. The shower is best
				placed in the northern hemisphere, with visibility decreasing farther
				south.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The Perseids are sometimes known as the Tears of Saint Lawrence, as
				their peak often falls near the feast day of Saint Lawrence in
				mid-August.
			</Trans>
		</p>
		<p>
			<Trans>
				Historical records of the Perseids extend back nearly two thousand
				years, making them one of the longest observed meteor showers.
			</Trans>
		</p>

		<h2>
			<Trans>Skywatching tips</Trans>
		</h2>
		<p>
			<Trans>
				Allow your eyes about twenty minutes to adjust, turn away from city
				lights, and let the wide sky do the work.
			</Trans>
		</p>
		<p>
			<Trans>
				A comfortable chair or blanket is more useful than a telescope, as
				meteors can appear anywhere overhead.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Perseid meteors enter the atmosphere at roughly 60 km/s — fast enough
				that the larger ones compress the air ahead of them into a bright,
				explosive fireball.
			</Trans>
		</p>
		<p>
			<Trans>
				The number of meteors you see depends on your location, the darkness and
				clarity of the sky, and the shower's activity that year. A high radiant
				and a dark sky usually offer better viewing.
			</Trans>
		</p>
	</>
)

export const perseidsEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Perseids,
	isActive: isPerseidsPeak,
	run: () =>
		import('../events/perseids').then((module) =>
			module.launchPerseidsShower(),
		),
	tileAccent: {
		colors: ['#e0f2fe', '#7dd3fc', '#60a5fa', '#a78bfa', '#e0f2fe'],
	},
}

function isPerseidsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return PERSEIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

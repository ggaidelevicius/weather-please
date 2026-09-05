import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const GEMINIDS_PEAK_DATES = new Set([
	'2026-12-13',
	'2026-12-14',
	'2027-12-13',
	'2027-12-14',
	'2028-12-13',
	'2028-12-14',
	'2029-12-13',
	'2029-12-14',
	'2030-12-13',
	'2030-12-14',
	'2031-12-13',
	'2031-12-14',
	'2032-12-13',
	'2032-12-14',
	'2033-12-13',
	'2033-12-14',
	'2034-12-13',
	'2034-12-14',
	'2035-12-13',
	'2035-12-14',
	'2036-12-13',
	'2036-12-14',
	'2037-12-13',
	'2037-12-14',
	'2038-12-13',
	'2038-12-14',
	'2039-12-13',
	'2039-12-14',
	'2040-12-13',
	'2040-12-14',
	'2041-12-13',
	'2041-12-14',
	'2042-12-13',
	'2042-12-14',
	'2043-12-13',
	'2043-12-14',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The Geminids are one of the strongest and most reliable meteor showers
				of the year, appearing each December with frequent, bright meteors.
			</Trans>
		</p>
		<p>
			<Trans>
				They are especially known for their steady rates and vivid, often
				colourful trails.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Unlike most meteor showers, the Geminids originate from the asteroid
				3200 Phaethon rather than a comet.
			</Trans>
		</p>
		<p>
			<Trans>
				Because it behaves like both an asteroid and a comet, it is sometimes
				described as a “rock comet”.
			</Trans>
		</p>

		<h2>
			<Trans>Skywatching tips</Trans>
		</h2>
		<p>
			<Trans>
				Find a wide view of the sky, allow your eyes time to adjust, and settle
				in — the display often strengthens after midnight.
			</Trans>
		</p>
		<p>
			<Trans>
				Whether your night air is warm or cool, a comfortable place to sit or
				lie back makes the experience far more enjoyable.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Geminid meteors move slower than most showers, which is part of what
				makes them so striking — they linger long enough to actually follow with
				your eyes.
			</Trans>
		</p>
		<p>
			<Trans>
				Some appear white, others yellow or blue-green. The colour depends on
				the mineral composition of each grain of dust as it burns up.
			</Trans>
		</p>
	</>
)

export const geminidsEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Geminids,
	isActive: isGeminidsPeak,
	run: () =>
		import('../events/geminids').then((module) =>
			module.launchGeminidsShower(),
		),
	tileAccent: {
		colors: ['#e2e8f0', '#93c5fd', '#818cf8', '#cbd5f5', '#e2e8f0'],
	},
}

function isGeminidsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return GEMINIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

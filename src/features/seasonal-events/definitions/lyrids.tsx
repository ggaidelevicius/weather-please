import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const LYRIDS_PEAK_DATES = new Set([
	'2026-04-22',
	'2026-04-23',
	'2027-04-22',
	'2027-04-23',
	'2028-04-22',
	'2028-04-23',
	'2029-04-22',
	'2029-04-23',
	'2030-04-22',
	'2030-04-23',
	'2031-04-22',
	'2031-04-23',
	'2032-04-22',
	'2032-04-23',
	'2033-04-22',
	'2033-04-23',
	'2034-04-22',
	'2034-04-23',
	'2035-04-22',
	'2035-04-23',
	'2036-04-22',
	'2036-04-23',
	'2037-04-22',
	'2037-04-23',
	'2038-04-22',
	'2038-04-23',
	'2039-04-22',
	'2039-04-23',
	'2040-04-22',
	'2040-04-23',
	'2041-04-22',
	'2041-04-23',
	'2042-04-22',
	'2042-04-23',
	'2043-04-22',
	'2043-04-23',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The Lyrids appear each year in late April, with meteors radiating from
				the constellation Lyra.
			</Trans>
		</p>
		<p>
			<Trans>
				They are typically a gentle shower that rewards patient skywatching.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Historical Chinese records describe displays of Lyrid meteors more than
				two thousand six hundred years ago.
			</Trans>
		</p>
		<p>
			<Trans>
				The shower originates from Comet Thatcher, which returns to the inner
				solar system roughly every four hundred and fifteen years.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Chinese records from 687 BC describe &quot;stars falling like rain&quot;
				— the oldest known account of the Lyrids, and one of the oldest
				documented meteor observations of any kind.
			</Trans>
		</p>
		<p>
			<Trans>
				Comet Thatcher, the shower&apos;s parent body, won&apos;t return to the
				inner solar system until roughly the year 2283.
			</Trans>
		</p>
	</>
)

export const lyridsEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Lyrids,
	isActive: isLyridsPeak,
	run: () =>
		import('../events/lyrids').then((module) => module.launchLyridsShower()),
	tileAccent: {
		colors: ['#e2e8f0', '#fcd34d', '#93c5fd', '#60a5fa', '#e2e8f0'],
	},
}

function isLyridsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return LYRIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

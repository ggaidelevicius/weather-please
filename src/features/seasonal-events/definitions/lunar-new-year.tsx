import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const LUNAR_NEW_YEAR_DATES = new Set([
	'2026-02-17',
	'2027-02-06',
	'2028-01-26',
	'2029-02-13',
	'2030-02-03',
	'2031-01-23',
	'2032-02-11',
	'2033-01-31',
	'2034-02-19',
	'2035-02-08',
	'2036-01-28',
	'2037-02-15',
	'2038-02-04',
	'2039-01-24',
	'2040-02-12',
	'2041-02-01',
	'2042-01-22',
	'2043-02-10',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Lunar New Year begins with the first new moon of the lunar calendar and
				unfolds across a festival season lasting up to fifteen days.
			</Trans>
		</p>
		<p>
			<Trans>
				It is marked by family reunions, travel, and the renewal of long-held
				bonds.
			</Trans>
		</p>

		<h2>
			<Trans>Legends and customs</Trans>
		</h2>
		<p>
			<Trans>
				Traditional stories of the monster Nian are said to have inspired the
				use of loud sounds, firecrackers, and the colour red as symbols of
				protection and good fortune.
			</Trans>
		</p>
		<p>
			<Trans>
				Homes are carefully cleaned and decorated to clear away old luck and
				welcome prosperity for the year ahead.
			</Trans>
		</p>

		<h2>
			<Trans>Symbols of luck</Trans>
		</h2>
		<p>
			<Trans>
				Red envelopes, tangerines, and calligraphy couplets express wishes for
				abundance, happiness, and fresh beginnings.
			</Trans>
		</p>
		<p>
			<Trans>
				The zodiac animal associated with the year is believed to shape its
				character and fortunes.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The season builds toward the Lantern Festival on the fifteenth night,
				when thousands of lanterns are released into the sky.
			</Trans>
		</p>
		<p>
			<Trans>
				Dragon and lion dances wind through streets packed with spectators,
				firecrackers, and the smell of street food — a finale that can last well
				past midnight.
			</Trans>
		</p>
	</>
)

export const lunarNewYearEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.LunarNewYear,
	isActive: isLunarNewYear,
	run: () =>
		import('../events/lunar-new-year').then((module) =>
			module.launchLunarNewYear(),
		),
	tileAccent: {
		colors: ['#f5e3c1', '#e6b26a', '#c9854a', '#8f5a3a', '#f5e3c1'],
	},
}

function isLunarNewYear({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return LUNAR_NEW_YEAR_DATES.has(`${year}-${month}-${day}`)
}

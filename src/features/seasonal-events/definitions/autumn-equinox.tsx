import { Trans } from '@lingui/react/macro'

import type { SeasonalEvent, SeasonalEventContext } from '../core/types'

import { Hemisphere, SeasonalEventId } from '../core/types'

const AUTUMN_EQUINOX_DATES_NORTHERN = new Set([
	'2026-09-23',
	'2027-09-23',
	'2028-09-22',
	'2029-09-23',
	'2030-09-23',
	'2031-09-23',
	'2032-09-22',
	'2033-09-23',
	'2034-09-23',
	'2035-09-23',
	'2036-09-22',
	'2037-09-22',
	'2038-09-23',
	'2039-09-23',
	'2040-09-22',
	'2041-09-22',
	'2042-09-22',
	'2043-09-23',
])

const AUTUMN_EQUINOX_DATES_SOUTHERN = new Set([
	'2026-03-20',
	'2027-03-20',
	'2028-03-20',
	'2029-03-20',
	'2030-03-20',
	'2031-03-20',
	'2032-03-20',
	'2033-03-20',
	'2034-03-20',
	'2035-03-20',
	'2036-03-20',
	'2037-03-20',
	'2038-03-20',
	'2039-03-20',
	'2040-03-20',
	'2041-03-20',
	'2042-03-20',
	'2043-03-20',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The autumn equinox marks a moment of near-perfect balance, when day and
				night stand equal before the long shift toward darker evenings.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Across many ancient cultures, this point in the year was closely tied to
				harvest celebrations, gratitude, and preparation for winter.
			</Trans>
		</p>
		<p>
			<Trans>
				It has often been observed alongside lunar cycles, communal feasts, and
				rituals honouring both abundance and change.
			</Trans>
		</p>

		<h2>
			<Trans>A time of turning</Trans>
		</h2>
		<p>
			<Trans>
				In many traditions, the equinox is not only about what has been
				gathered, but about what lies ahead — a pause to take stock before the
				quieter months arrive.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The colour change in autumn leaves isn’t new pigment appearing — it’s
				the green chlorophyll withdrawing, revealing yellows and oranges that
				were there all along.
			</Trans>
		</p>
		<p>
			<Trans>
				Meanwhile, billions of birds are mid-migration, navigating by stars,
				magnetic fields, and landmarks passed down through generations.
			</Trans>
		</p>
	</>
)

export const autumnEquinoxEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.AutumnEquinox,
	isActive: isAutumnEquinox,
	run: () =>
		import('../events/autumn-equinox').then((module) =>
			module.launchAutumnEquinoxLeaves(),
		),
	tileAccent: {
		colors: ['#fed7aa', '#f97316', '#fb7185', '#facc15', '#fed7aa'],
	},
}

function isAutumnEquinox({ date, hemisphere }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const equinoxDates =
		hemisphere === Hemisphere.Southern
			? AUTUMN_EQUINOX_DATES_SOUTHERN
			: AUTUMN_EQUINOX_DATES_NORTHERN
	return equinoxDates.has(`${year}-${month}-${day}`)
}

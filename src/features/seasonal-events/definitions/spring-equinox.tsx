import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId, Hemisphere } from '../core/types'

const SPRING_EQUINOX_DATES_NORTHERN = new Set([
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

const SPRING_EQUINOX_DATES_SOUTHERN = new Set([
	'2026-09-22',
	'2027-09-22',
	'2028-09-22',
	'2029-09-22',
	'2030-09-22',
	'2031-09-22',
	'2032-09-22',
	'2033-09-22',
	'2034-09-22',
	'2035-09-22',
	'2036-09-22',
	'2037-09-22',
	'2038-09-22',
	'2039-09-22',
	'2040-09-22',
	'2041-09-22',
	'2042-09-22',
	'2043-09-22',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The spring equinox marks the moment when day and night stand in
				near-perfect balance.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Ancient observatories carefully tracked this turning point of the year
				to guide planting cycles, calendars, and seasonal festivals.
			</Trans>
		</p>
		<p>
			<Trans>
				Traditions such as Nowruz continue to celebrate themes of renewal on or
				around the equinox.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				From this point, each day gains a few minutes of light — a shift
				that&apos;s barely noticeable day to day, but adds up to hours within
				weeks.
			</Trans>
		</p>
		<p>
			<Trans>
				The old tradition of balancing an egg on its end at the equinox is a
				myth (you can do it any day of the year), but people keep trying anyway.
				It&apos;s become its own kind of ritual.
			</Trans>
		</p>
	</>
)

export const springEquinoxEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.SpringEquinox,
	isActive: isSpringEquinox,
	run: () =>
		import('../events/spring-equinox').then((module) =>
			module.launchSpringEquinoxGrowth(),
		),
	tileAccent: {
		colors: ['#f7c9df', '#f3a6c8', '#b7e4c7', '#95d5b2', '#f7c9df'],
	},
}

function isSpringEquinox({ date, hemisphere }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const equinoxDates =
		hemisphere === Hemisphere.Southern
			? SPRING_EQUINOX_DATES_SOUTHERN
			: SPRING_EQUINOX_DATES_NORTHERN
	return equinoxDates.has(`${year}-${month}-${day}`)
}

import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId, Hemisphere } from '../core/types'

const WINTER_SOLSTICE_DATES_NORTHERN = new Set([
	'2026-12-21',
	'2027-12-22',
	'2028-12-21',
	'2029-12-21',
	'2030-12-21',
	'2031-12-22',
	'2032-12-21',
	'2033-12-21',
	'2034-12-21',
	'2035-12-22',
	'2036-12-21',
	'2037-12-21',
	'2038-12-21',
	'2039-12-22',
	'2040-12-21',
	'2041-12-21',
	'2042-12-21',
	'2043-12-22',
])

const WINTER_SOLSTICE_DATES_SOUTHERN = new Set([
	'2026-06-21',
	'2027-06-21',
	'2028-06-20',
	'2029-06-21',
	'2030-06-21',
	'2031-06-21',
	'2032-06-20',
	'2033-06-21',
	'2034-06-21',
	'2035-06-21',
	'2036-06-20',
	'2037-06-21',
	'2038-06-21',
	'2039-06-21',
	'2040-06-20',
	'2041-06-20',
	'2042-06-21',
	'2043-06-21',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The winter solstice marks the shortest day and longest night of the
				year, and the turning point toward gradually longer daylight.
			</Trans>
		</p>
		<p>
			<Trans>
				It signals the beginning of winter in the northern hemisphere and the
				start of summer in the southern hemisphere.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Across many cultures, traditions such as Yule and Saturnalia developed
				around this moment, gathering warmth, light, and community during the
				darkest part of the year in the regions where they first formed.
			</Trans>
		</p>
		<p>
			<Trans>
				Monuments and ancient sites around the world are aligned to mark the
				solstice and the return of the Sun’s path.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The day after the solstice is only about a second longer — the shift is
				imperceptible at first, then gradually accelerates through January and
				February.
			</Trans>
		</p>
		<p>
			<Trans>
				Newgrange, a 5,000-year-old passage tomb in Ireland, was built so
				precisely that sunlight floods its inner chamber for just seventeen
				minutes around the winter solstice each year.
			</Trans>
		</p>
	</>
)

export const winterSolsticeEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.WinterSolstice,
	isActive: isWinterSolstice,
	run: () =>
		import('../events/winter-solstice').then((module) =>
			module.launchWinterSolstice(),
		),
	tileAccent: {
		colors: ['#e2e8f0', '#c7d2fe', '#bae6fd', '#e0f2fe', '#e2e8f0'],
	},
}

function isWinterSolstice({ date, hemisphere }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const solsticeDates =
		hemisphere === Hemisphere.Southern
			? WINTER_SOLSTICE_DATES_SOUTHERN
			: WINTER_SOLSTICE_DATES_NORTHERN
	return solsticeDates.has(`${year}-${month}-${day}`)
}

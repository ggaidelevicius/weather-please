import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const EVENT_HORIZON_DAY_DATES = new Set([
	'2026-04-10',
	'2027-04-10',
	'2028-04-10',
	'2029-04-10',
	'2030-04-10',
	'2031-04-10',
	'2032-04-10',
	'2033-04-10',
	'2034-04-10',
	'2035-04-10',
	'2036-04-10',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Event Horizon Day highlights the first direct image of a black hole,
				captured in 2019 by the Event Horizon Telescope collaboration.
			</Trans>
		</p>
		<p>
			<Trans>
				It represents a major milestone in astronomy, combining global
				cooperation, radio interferometry, and years of data processing.
			</Trans>
		</p>

		<h2>
			<Trans>What you are seeing</Trans>
		</h2>
		<p>
			<Trans>
				The dark center is the event horizon silhouette, while the bright ring
				is light from superheated material in the accretion flow around it.
			</Trans>
		</p>
		<p>
			<Trans>
				Because gravity bends light paths, parts of the disk appear warped and
				wrapped above and below the black hole.
			</Trans>
		</p>

		<h2>
			<Trans>Why it matters</Trans>
		</h2>
		<p>
			<Trans>
				This observation gave direct visual evidence of extreme spacetime
				curvature near a supermassive black hole and strongly matched the
				predictions of general relativity.
			</Trans>
		</p>
		<p>
			<Trans>
				It also opened a new era of black-hole imaging, with continued work on
				sharper reconstructions and time-varying dynamics.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The original image was not a conventional photograph. It was computed
				from synchronized radio data recorded by observatories around Earth.
			</Trans>
		</p>
		<p>
			<Trans>
				The target was M87*, a black hole with a mass of billions of Suns,
				located about 55 million light-years away.
			</Trans>
		</p>
	</>
)

export const blackHoleEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.EventHorizonDay,
	isActive: isEventHorizonDay,
	run: () =>
		import('../events/black-hole').then((module) =>
			module.launchBlackHoleEvent(),
		),
	tileAccent: {
		colors: ['#020617', '#1e293b', '#f97316', '#f8fafc', '#020617'],
	},
}

function isEventHorizonDay({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return EVENT_HORIZON_DAY_DATES.has(`${year}-${month}-${day}`)
}

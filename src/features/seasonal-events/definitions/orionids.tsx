import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const ORIONIDS_PEAK_DATES = new Set([
	'2026-10-21',
	'2026-10-22',
	'2027-10-21',
	'2027-10-22',
	'2028-10-21',
	'2028-10-22',
	'2029-10-21',
	'2029-10-22',
	'2030-10-21',
	'2030-10-22',
	'2031-10-21',
	'2031-10-22',
	'2032-10-21',
	'2032-10-22',
	'2033-10-21',
	'2033-10-22',
	'2034-10-21',
	'2034-10-22',
	'2035-10-21',
	'2035-10-22',
	'2036-10-21',
	'2036-10-22',
	'2037-10-21',
	'2037-10-22',
	'2038-10-21',
	'2038-10-22',
	'2039-10-21',
	'2039-10-22',
	'2040-10-21',
	'2040-10-22',
	'2041-10-21',
	'2041-10-22',
	'2042-10-21',
	'2042-10-22',
	'2043-10-21',
	'2043-10-22',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The Orionids are an annual meteor shower formed from debris left by
				Halley’s Comet, reaching their peak in October.
			</Trans>
		</p>
		<p>
			<Trans>
				Their meteors appear to radiate from the region near the constellation
				Orion, a figure long woven into myth and storytelling.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The Orionids are visible from both hemispheres and are known for
				producing bright, fast-moving meteors.
			</Trans>
		</p>
		<p>
			<Trans>
				Their peak often coincides with long, dark viewing hours, when observing
				conditions are especially favourable.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Each Orionid meteor is a tiny grain of dust shed by Halley&apos;s Comet
				— the same object that people have been watching and recording since at
				least 240 BC.
			</Trans>
		</p>
		<p>
			<Trans>
				The meteors enter the atmosphere at about 66 km/s, among the fastest of
				any annual shower, which is why they often leave persistent glowing
				trails.
			</Trans>
		</p>
	</>
)

export const orionidsEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Orionids,
	isActive: isOrionidsPeak,
	run: () =>
		import('../events/orionids').then((module) =>
			module.launchOrionidsShower(),
		),
	tileAccent: {
		colors: ['#fed7aa', '#fdba74', '#fb923c', '#94a3b8', '#fed7aa'],
	},
}

function isOrionidsPeak({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return ORIONIDS_PEAK_DATES.has(`${year}-${month}-${day}`)
}

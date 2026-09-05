import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const HANUKKAH_START_DATES = new Set([
	'2026-12-04',
	'2027-11-25',
	'2028-12-12',
	'2029-12-01',
	'2030-12-20',
	'2031-12-10',
	'2032-11-28',
	'2033-12-17',
	'2034-12-07',
	'2035-12-26',
	'2036-12-14',
	'2037-12-03',
	'2038-12-22',
	'2039-12-12',
	'2040-11-30',
	'2041-12-19',
	'2042-12-08',
	'2043-12-27',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Hanukkah is a Jewish festival of lights, observed over eight nights.
			</Trans>
		</p>
		<p>
			<Trans>
				Each evening, another candle is added to the menorah, gradually building
				the display of light.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The festival commemorates the rededication of the Second Temple in
				Jerusalem.
			</Trans>
		</p>
		<p>
			<Trans>
				According to tradition, a small supply of oil, meant for one day, lasted
				eight.
			</Trans>
		</p>

		<h2>
			<Trans>Traditions</Trans>
		</h2>
		<p>
			<Trans>
				Families gather to light the menorah, sing songs, and play games such as
				dreidel.
			</Trans>
		</p>
		<p>
			<Trans>
				Foods fried in oil, including latkes and sufganiyot, reflect the central
				symbol of the story.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The menorah is placed in a window or doorway so the light faces outward
				— the tradition is specifically about making the flames visible to
				passersby.
			</Trans>
		</p>
		<p>
			<Trans>
				Dreidel, often dismissed as a children&apos;s game, was historically
				used as a cover for Torah study during periods when it was outlawed.
				Each Hebrew letter on its sides forms an acronym: &quot;A great miracle
				happened there.&quot;
			</Trans>
		</p>
	</>
)

export const hanukkahEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Hanukkah,
	isActive: isHanukkah,
	run: () =>
		import('../events/hanukkah').then((module) => module.launchHanukkahGlow()),
	tileAccent: {
		colors: ['#e0f2fe', '#60a5fa', '#fbbf24', '#fde68a', '#e0f2fe'],
	},
}

function isHanukkah({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return HANUKKAH_START_DATES.has(`${year}-${month}-${day}`)
}

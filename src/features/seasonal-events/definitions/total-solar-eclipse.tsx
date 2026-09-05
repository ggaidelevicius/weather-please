import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const TOTAL_SOLAR_ECLIPSE_DATES = new Set([
	'2026-08-12',
	'2027-08-02',
	'2028-07-22',
	'2030-11-25',
	'2031-11-14',
	'2033-03-30',
	'2034-03-20',
	'2035-09-01',
	'2035-09-02',
	'2037-07-13',
	'2038-12-26',
	'2039-12-15',
	'2041-04-30',
	'2042-04-20',
	'2043-04-09',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				A total solar eclipse occurs when the Moon moves directly in front of
				the Sun, briefly transforming daylight into twilight.
			</Trans>
		</p>
		<p>
			<Trans>
				The phase of totality is short and can only be seen from a narrow path
				across the Earth’s surface.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Solar eclipses have been recorded for thousands of years, inspiring awe,
				uncertainty, and careful study.
			</Trans>
		</p>
		<p>
			<Trans>
				Today, many people travel great distances to stand within the path of
				totality.
			</Trans>
		</p>

		<h2>
			<Trans>What it feels like</Trans>
		</h2>
		<p>
			<Trans>
				Light shifts to a silvery tone, shadows sharpen, and temperatures may
				drop noticeably within minutes.
			</Trans>
		</p>
		<p>
			<Trans>
				Animals can grow quiet, while the horizon glows like a complete circle
				of sunset.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				During totality, the Sun’s corona — normally invisible — appears as a
				shimmering halo of white light. Bright stars and planets become visible
				in the middle of the day.
			</Trans>
		</p>
		<p>
			<Trans>
				Eclipse glasses are essential during all partial phases. Only during the
				brief seconds of total coverage is it safe to look with the naked eye.
			</Trans>
		</p>
	</>
)

export const totalSolarEclipseEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.TotalSolarEclipse,
	isActive: isTotalSolarEclipse,
	run: () =>
		import('../events/total-solar-eclipse').then((module) =>
			module.launchTotalSolarEclipse(),
		),
	tileAccent: {
		colors: ['#0f172a', '#334155', '#fbbf24', '#fde68a', '#0f172a'],
	},
}

function isTotalSolarEclipse({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return TOTAL_SOLAR_ECLIPSE_DATES.has(`${year}-${month}-${day}`)
}

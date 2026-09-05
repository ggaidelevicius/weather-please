import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const TOTAL_LUNAR_ECLIPSE_DATES = new Set([
	'2026-03-03',
	'2028-12-31',
	'2029-01-01',
	'2029-06-25',
	'2029-06-26',
	'2029-12-20',
	'2029-12-21',
	'2032-04-25',
	'2032-04-26',
	'2032-10-18',
	'2032-10-19',
	'2033-04-14',
	'2033-04-15',
	'2033-10-07',
	'2033-10-08',
	'2036-02-11',
	'2036-02-12',
	'2040-05-26',
	'2040-11-18',
	'2040-11-19',
	'2043-03-25',
	'2043-03-26',
	'2043-09-18',
	'2043-09-19',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				A total lunar eclipse occurs when the Earth moves directly between the
				Sun and the Moon, fully shading the lunar surface.
			</Trans>
		</p>
		<p>
			<Trans>
				The event unfolds gradually, often lasting several hours from beginning
				to end.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Across many cultures, the deep red colour of the eclipsed Moon inspired
				myths and the name “Blood Moon”.
			</Trans>
		</p>
		<p>
			<Trans>
				While eclipses were once viewed as omens, today they are widely
				appreciated as shared moments of skywatching and wonder.
			</Trans>
		</p>

		<h2>
			<Trans>Why it turns red</Trans>
		</h2>
		<p>
			<Trans>
				As sunlight passes through Earth’s atmosphere, the shorter blue
				wavelengths scatter away while the longer red wavelengths bend toward
				the Moon.
			</Trans>
		</p>
		<p>
			<Trans>
				This same atmospheric filtering that produces red sunsets gives the Moon
				its copper and crimson tones during totality.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Unlike a solar eclipse, a lunar eclipse needs no special equipment — you
				just look up. The whole event unfolds over several hours, visible to
				anyone on the nightside of Earth.
			</Trans>
		</p>
		<p>
			<Trans>
				The exact shade of red depends on what&apos;s in Earth&apos;s atmosphere
				at the time. After major volcanic eruptions, the Moon can turn an
				especially dark, almost brownish red.
			</Trans>
		</p>
	</>
)

export const totalLunarEclipseEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.TotalLunarEclipse,
	isActive: isTotalLunarEclipse,
	run: () =>
		import('../events/total-lunar-eclipse').then((module) =>
			module.launchTotalLunarEclipse(),
		),
	tileAccent: {
		colors: ['#1f2937', '#7f1d1d', '#ef4444', '#fca5a5', '#1f2937'],
	},
}

function isTotalLunarEclipse({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return TOTAL_LUNAR_ECLIPSE_DATES.has(`${year}-${month}-${day}`)
}

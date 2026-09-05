import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const EID_AL_FITR_DATES = new Set([
	'2026-03-20',
	'2027-03-09',
	'2028-02-26',
	'2029-02-14',
	'2030-02-04',
	'2031-01-24',
	'2032-01-14',
	'2033-01-02',
	'2033-12-23',
	'2034-12-12',
	'2035-12-01',
	'2036-11-20',
	'2037-11-09',
	'2038-10-28',
	'2039-10-17',
	'2040-10-06',
	'2041-09-25',
	'2042-09-14',
	'2043-09-05',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Eid al-Fitr marks the end of Ramadan, celebrating renewal, gratitude,
				and the strength of shared community.
			</Trans>
		</p>
		<p>
			<Trans>
				It begins with the sighting of the new moon, followed by a special
				morning prayer.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Zakat al-Fitr, a form of charitable giving, is a central obligation of
				the day, ensuring that all can take part in the celebration.
			</Trans>
		</p>
		<p>
			<Trans>
				Families and friends gather, visit neighbours, exchange gifts, and greet
				one another with wishes of peace.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The first meal of Eid, eaten after a month of fasting, carries a
				significance that&apos;s hard to overstate — it&apos;s often dates and
				something sweet, shared before the morning prayer.
			</Trans>
		</p>
		<p>
			<Trans>
				In many communities, everyone wears new clothes, children receive money
				or gifts, and doors stay open all day for visitors.
			</Trans>
		</p>
	</>
)

export const eidAlFitrEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.EidAlFitr,
	isActive: isEidAlFitr,
	run: () =>
		import('../events/eid-al-fitr').then((module) =>
			module.launchEidAlFitrGlow(),
		),
	tileAccent: {
		colors: ['#fef3c7', '#facc15', '#38bdf8', '#a78bfa', '#fef3c7'],
	},
}

function isEidAlFitr({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return EID_AL_FITR_DATES.has(`${year}-${month}-${day}`)
}

import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const EID_AL_ADHA_DATES = new Set([
	'2026-05-27',
	'2027-05-17',
	'2028-05-05',
	'2029-04-24',
	'2030-04-14',
	'2031-04-02',
	'2032-03-22',
	'2033-03-11',
	'2034-03-01',
	'2035-02-18',
	'2036-02-07',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Eid al-Adha is one of the most important festivals in Islam, closely
				linked to the season of the Hajj pilgrimage.
			</Trans>
		</p>
		<p>
			<Trans>
				It centres on devotion, sacrifice, and the responsibility of generosity
				toward others.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The holiday commemorates the story of Ibrahim and his willingness to
				sacrifice in obedience to God.
			</Trans>
		</p>
		<p>
			<Trans>
				Acts of charity, the sharing of food, and care for family, neighbours,
				and those in need form the heart of the celebration.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The meat from the sacrifice is traditionally divided into three equal
				parts: one for the family, one for friends and neighbours, and one for
				those in need.
			</Trans>
		</p>
		<p>
			<Trans>
				This three-way split is central to the holiday&apos;s meaning — the act
				of giving is built directly into the ritual itself.
			</Trans>
		</p>
	</>
)

export const eidAlAdhaEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.EidAlAdha,
	isActive: isEidAlAdha,
	run: () =>
		import('../events/eid-al-adha').then((module) =>
			module.launchEidAlAdhaGlow(),
		),
	tileAccent: {
		colors: ['#fef3c7', '#fbbf24', '#f59e0b', '#34d399', '#fef3c7'],
	},
}

function isEidAlAdha({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return EID_AL_ADHA_DATES.has(`${year}-${month}-${day}`)
}

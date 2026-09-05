import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const HOLI_DATES = new Set([
	'2026-03-04',
	'2027-03-22',
	'2028-03-11',
	'2029-03-01',
	'2030-03-20',
	'2031-03-09',
	'2032-03-27',
	'2033-03-16',
	'2034-03-05',
	'2035-03-24',
	'2036-03-12',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Holi is a joyful festival of colour, celebrated with laughter, music,
				and shared community.
			</Trans>
		</p>
		<p>
			<Trans>
				It is closely associated with the arrival of spring in much of the world
				where the tradition first formed.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Stories surrounding Holi vary by region, including the tale of Prahlad
				and Holika, which speaks to the triumph of devotion and good over harm.
			</Trans>
		</p>
		<p>
			<Trans>
				Another widely told story celebrates Krishna, whose playful exchanges of
				colour are said to have inspired the festival’s most famous custom.
			</Trans>
		</p>

		<h2>
			<Trans>Symbols and rituals</Trans>
		</h2>
		<p>
			<Trans>
				The night before Holi features Holika Dahan, a ceremonial bonfire that
				symbolises the passing of winter and the renewal of life.
			</Trans>
		</p>
		<p>
			<Trans>
				On the following day, coloured powders fill the air as people cross
				social boundaries in a shared expression of joy.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Within minutes of stepping outside, everyone looks the same — drenched
				head to toe in colour, impossible to tell apart.
			</Trans>
		</p>
		<p>
			<Trans>
				By midday, the streets, the walls, and every surface in sight are
				stained in layers of pink, green, yellow, and blue. It takes days to
				wash out.
			</Trans>
		</p>
	</>
)

export const holiEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Holi,
	isActive: isHoli,
	run: () =>
		import('../events/holi').then((module) => module.launchHoliColors()),
	tileAccent: {
		colors: ['#fbcfe8', '#bfdbfe', '#fde68a', '#bbf7d0', '#fbcfe8'],
	},
}

function isHoli({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return HOLI_DATES.has(`${year}-${month}-${day}`)
}

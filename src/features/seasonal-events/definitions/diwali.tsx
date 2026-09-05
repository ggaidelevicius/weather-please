import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const DIWALI_DATES = new Set([
	'2026-11-08',
	'2027-10-29',
	'2028-10-17',
	'2029-11-05',
	'2030-10-26',
	'2031-11-14',
	'2032-11-02',
	'2033-10-22',
	'2034-11-10',
	'2035-10-30',
	'2036-10-19',
	'2037-11-07',
	'2038-10-27',
	'2039-10-17',
	'2040-11-04',
	'2041-10-25',
	'2042-11-12',
	'2043-11-01',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Diwali is the festival of lights, celebrating renewal, hope, and the
				enduring triumph of light over darkness.
			</Trans>
		</p>
		<p>
			<Trans>
				It is observed by millions across India and by communities around the
				world.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				For many Hindus, the festival marks the return of Rama, Sita, Lakshmana,
				and Hanuman to Ayodhya after their long exile.
			</Trans>
		</p>
		<p>
			<Trans>
				Other traditions honour Lakshmi, the goddess of prosperity and fortune,
				while Jain and Sikh communities observe Diwali through their own sacred
				histories.
			</Trans>
		</p>

		<h2>
			<Trans>Symbols and rituals</Trans>
		</h2>
		<p>
			<Trans>
				Diyas and candles glow along doorways and windows, while rangoli
				patterns bloom across thresholds in colour and light.
			</Trans>
		</p>
		<p>
			<Trans>
				Families exchange sweets and gifts, clean and decorate their homes, and
				offer prayers for health, prosperity, and a bright year ahead.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Seen from above, cities during Diwali are transformed — rooftops,
				balconies, and streets are outlined in light, and the effect is visible
				from space in satellite imagery.
			</Trans>
		</p>
		<p>
			<Trans>
				The festival is also one of the biggest shopping seasons in India, with
				markets staying open late and fireworks continuing well past midnight.
			</Trans>
		</p>
	</>
)

export const diwaliEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Diwali,
	isActive: isDiwali,
	run: () =>
		import('../events/diwali').then((module) => module.launchDiwaliLights()),
	tileAccent: {
		colors: ['#fde68a', '#f59e0b', '#fb7185', '#f97316', '#fde68a'],
	},
}

function isDiwali({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return DIWALI_DATES.has(`${year}-${month}-${day}`)
}

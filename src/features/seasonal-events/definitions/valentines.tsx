import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const VALENTINES_MONTH = 1

const VALENTINES_DAY = 14

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Valentine’s Day celebrates affection in many forms, from romantic love
				to friendship and quiet acts of care.
			</Trans>
		</p>
		<p>
			<Trans>
				It&apos;s often less about grand gestures and more about letting someone
				know they&apos;re on your mind.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The holiday draws on legends of Saint Valentine and the traditions of
				medieval courtly love.
			</Trans>
		</p>
		<p>
			<Trans>
				By the eighteenth century, handwritten notes and printed cards had
				helped turn the day into a ritual of letters and messages.
			</Trans>
		</p>

		<h2>
			<Trans>Symbols and rituals</Trans>
		</h2>
		<p>
			<Trans>
				Hearts, roses, and red ribbons became familiar symbols of devotion,
				warmth, and connection.
			</Trans>
		</p>
		<p>
			<Trans>
				Shared sweets, flowers, and small gifts keep the celebration intimate
				and personal.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The oldest known Valentine is a fifteenth-century poem, written from a
				cell in the Tower of London — a love letter composed under the worst
				possible circumstances.
			</Trans>
		</p>
		<p>
			<Trans>
				Centuries later, people still reach for pen and paper when a text
				won&apos;t do.
			</Trans>
		</p>
	</>
)

export const valentinesEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.ValentinesDay,
	isActive: isValentinesDay,
	run: () =>
		import('../events/valentines').then((module) =>
			module.launchValentinesHearts(),
		),
	tileAccent: {
		colors: ['#fbcfe8', '#f9a8d4', '#f472b6', '#fb7185', '#fbcfe8'],
	},
}

function isValentinesDay({ date }: SeasonalEventContext) {
	return (
		date.getMonth() === VALENTINES_MONTH && date.getDate() === VALENTINES_DAY
	)
}

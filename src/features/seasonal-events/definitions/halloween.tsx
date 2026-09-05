import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const HALLOWEEN_MONTH = 9

const HALLOWEEN_DAY = 31

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Halloween is a night shaped by costumes, stories, and a playful sense of
				unease.
			</Trans>
		</p>
		<p>
			<Trans>
				It invites friendly fear, shared laughter, and a little mischief.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The celebration grew from the ancient festival of Samhain and the later
				observance of All Hallows’ Eve, blending seasonal rites with remembrance
				of the dead.
			</Trans>
		</p>
		<p>
			<Trans>
				Over time it evolved into a community tradition of visiting, disguises,
				and shared treats.
			</Trans>
		</p>

		<h2>
			<Trans>Symbols and rituals</Trans>
		</h2>
		<p>
			<Trans>
				Carved pumpkins, sweets, and playful scares echo much older customs of
				lanterns, bonfires, and protective charms.
			</Trans>
		</p>
		<p>
			<Trans>
				Costumes may be heroic, humorous, or unsettling, allowing people to step
				briefly into different roles.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Jack-o&apos;-lanterns were originally carved from turnips in Ireland and
				Scotland — the pumpkin version is a North American adaptation, chosen
				because pumpkins were bigger and easier to hollow out.
			</Trans>
		</p>
		<p>
			<Trans>
				The tradition of trick-or-treating in its modern form only became
				widespread in the 1950s, though the custom of going door to door in
				disguise is centuries older.
			</Trans>
		</p>
	</>
)

export const halloweenEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.Halloween,
	isActive: isHalloween,
	run: () =>
		import('../events/halloween').then((module) =>
			module.launchHalloweenSpirits(),
		),
	tileAccent: {
		colors: ['#f8fafc', '#e2e8f0', '#94a3b8', '#cbd5f5', '#f8fafc'],
	},
}

function isHalloween({ date }: SeasonalEventContext) {
	return date.getMonth() === HALLOWEEN_MONTH && date.getDate() === HALLOWEEN_DAY
}

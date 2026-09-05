import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const CHRISTMAS_MONTH = 11

const CHRISTMAS_DAY = 25

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Christmas Day marks the celebration of the birth of Jesus, and for many
				people it has also become a broader season of generosity, reflection,
				and togetherness.
			</Trans>
		</p>
		<p>
			<Trans>
				It is observed around the world in both deeply religious and entirely
				secular ways, often blending the two.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The holiday we recognise today grew from early Christian tradition,
				layered over much older European midwinter customs tied to light,
				renewal, and community.
			</Trans>
		</p>
		<p>
			<Trans>
				Across centuries and cultures, distinctive local practices emerged —
				from midnight services and carolling to bustling festive markets and
				public celebrations.
			</Trans>
		</p>

		<h2>
			<Trans>Symbols and rituals</Trans>
		</h2>
		<p>
			<Trans>
				Evergreens, candles, bells, and stars echo a shared theme drawn from
				those early traditions: light enduring through the darkest part of the
				year in the cultures where the holiday first formed.
			</Trans>
		</p>
		<p>
			<Trans>
				Decorated trees, stockings, gift-giving, and shared meals now connect
				people across many climates and continents in a sense of home and
				continuity.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The tradition of a decorated Christmas tree only became widespread in
				the English-speaking world after an 1848 illustration of Queen Victoria
				and Prince Albert’s tree was published — and went viral, by Victorian
				standards.
			</Trans>
		</p>
		<p>
			<Trans>
				Today, an estimated 350 million real Christmas trees are grown across
				Europe alone, most of them farmed specifically for the season.
			</Trans>
		</p>
	</>
)

export const christmasEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.ChristmasDay,
	isActive: isChristmasDay,
	run: () =>
		import('../events/christmas').then((module) =>
			module.launchChristmasSnowfall(),
		),
	tileAccent: {
		colors: ['#fef3c7', '#fca5a5', '#86efac', '#fde68a', '#fef3c7'],
	},
}

function isChristmasDay({ date }: SeasonalEventContext) {
	return date.getMonth() === CHRISTMAS_MONTH && date.getDate() === CHRISTMAS_DAY
}

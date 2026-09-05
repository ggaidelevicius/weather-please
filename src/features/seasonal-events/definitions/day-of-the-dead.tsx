import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId } from '../core/types'

const DAY_OF_THE_DEAD_MONTH = 10

const DAY_OF_THE_DEAD_DAYS = new Set([1, 2])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Day of the Dead is a celebration of life, memory, and the enduring bond
				between the living and those who have passed.
			</Trans>
		</p>
		<p>
			<Trans>
				Rather than a solemn farewell, it treats remembrance as something
				vibrant, communal, and alive.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The tradition grows from Indigenous Mexican beliefs about death and the
				afterlife, later blending with Catholic observances of All Saints’ and
				All Souls’ Days.
			</Trans>
		</p>
		<p>
			<Trans>
				It is observed across November 1 and 2, with the first day often
				honouring children and the second devoted to adults.
			</Trans>
		</p>

		<h2>
			<Trans>Symbols and offerings</Trans>
		</h2>
		<p>
			<Trans>
				Marigolds, papel picado, sugar skulls, candles, and favourite foods form
				a visual language of welcome and connection.
			</Trans>
		</p>
		<p>
			<Trans>
				Ofrendas commonly include water, salt, and cherished photographs,
				creating a space where memory feels both intimate and shared.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Families spend the night in cemeteries, cleaning graves, laying marigold
				paths, and sharing meals beside the headstones. It&apos;s social, warm,
				and often funny — people tell stories and play music until morning.
			</Trans>
		</p>
		<p>
			<Trans>
				The marigold paths (cempasúchil) aren&apos;t just decorative. Their
				strong scent is believed to guide the dead back to the living world for
				the night.
			</Trans>
		</p>
	</>
)

export const dayOfTheDeadEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.DayOfTheDead,
	isActive: isDayOfTheDead,
	run: () =>
		import('../events/day-of-the-dead').then((module) =>
			module.launchDayOfTheDead(),
		),
	tileAccent: {
		colors: ['#fef3c7', '#fdba74', '#fb7185', '#f59e0b', '#fef3c7'],
	},
}

function isDayOfTheDead({ date }: SeasonalEventContext) {
	return (
		date.getMonth() === DAY_OF_THE_DEAD_MONTH &&
		DAY_OF_THE_DEAD_DAYS.has(date.getDate())
	)
}

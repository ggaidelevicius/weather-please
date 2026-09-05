import { Trans } from '@lingui/react/macro'
import type { SeasonalEvent, SeasonalEventContext } from '../core/types'
import { SeasonalEventId, Hemisphere } from '../core/types'

const SUMMER_SOLSTICE_DATES_NORTHERN = new Set([
	'2026-06-21',
	'2027-06-21',
	'2028-06-20',
	'2029-06-21',
	'2030-06-21',
	'2031-06-21',
	'2032-06-20',
	'2033-06-21',
	'2034-06-21',
	'2035-06-21',
	'2036-06-20',
	'2037-06-21',
	'2038-06-21',
	'2039-06-21',
	'2040-06-20',
	'2041-06-20',
	'2042-06-21',
	'2043-06-21',
])

const SUMMER_SOLSTICE_DATES_SOUTHERN = new Set([
	'2026-12-21',
	'2027-12-21',
	'2028-12-21',
	'2029-12-21',
	'2030-12-21',
	'2031-12-21',
	'2032-12-21',
	'2033-12-21',
	'2034-12-21',
	'2035-12-21',
	'2036-12-21',
	'2037-12-21',
	'2038-12-21',
	'2039-12-21',
	'2040-12-21',
	'2041-12-21',
	'2042-12-21',
	'2043-12-21',
])

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The summer solstice marks the longest day of the year, when the sun
				reaches its highest path across the sky.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Ancient monuments such as Stonehenge are aligned with the solstice
				sunrise, and midsummer festivals across many cultures celebrate light
				and abundance.
			</Trans>
		</p>
		<p>
			<Trans>
				Bonfires, late gatherings, and all-night vigils have long been part of
				welcoming this turning point of the year.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				On the longest day, twilight stretches out for hours and full darkness
				may never arrive.
			</Trans>
		</p>
		<p>
			<Trans>
				Above the Arctic Circle, the sun doesn&apos;t set at all — it traces a
				low circle along the horizon and starts climbing again. This is the
				midnight sun, and it lasts for weeks.
			</Trans>
		</p>
	</>
)

export const summerSolsticeEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.SummerSolstice,
	isActive: isSummerSolstice,
	run: () =>
		import('../events/summer-solstice').then((module) =>
			module.launchSummerSolstice(),
		),
	tileAccent: {
		colors: ['#fef3c7', '#fde68a', '#fdba74', '#f59e0b', '#fef3c7'],
	},
}

function isSummerSolstice({ date, hemisphere }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const solsticeDates =
		hemisphere === Hemisphere.Southern
			? SUMMER_SOLSTICE_DATES_SOUTHERN
			: SUMMER_SOLSTICE_DATES_NORTHERN
	return solsticeDates.has(`${year}-${month}-${day}`)
}

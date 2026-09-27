const UPCOMING_EVENTS_WINDOW_DAYS = 3
const SATURDAY = 6

export const getUpcomingEventsWindowEnd = ({
	now,
}: Readonly<{
	now: Temporal.ZonedDateTime
}>): Temporal.ZonedDateTime => {
	const threeDaysFromNow = now.add({ days: UPCOMING_EVENTS_WINDOW_DAYS })
	const daysUntilSaturday = (SATURDAY - now.dayOfWeek + 7) % 7
	const endOfWeek = now
		.add({ days: daysUntilSaturday + 1 })
		.startOfDay()
		.subtract({ milliseconds: 1 })

	return Temporal.ZonedDateTime.compare(endOfWeek, threeDaysFromNow) > 0
		? endOfWeek
		: threeDaysFromNow
}

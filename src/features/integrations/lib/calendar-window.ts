const UPCOMING_EVENTS_WINDOW_DAYS = 3
const SATURDAY = 6

export const getUpcomingEventsWindowEnd = ({
	now,
}: Readonly<{
	now: Date
}>): Date => {
	const threeDaysFromNow = addDays(now, UPCOMING_EVENTS_WINDOW_DAYS)
	const endOfWeek = getEndOfSundayStartedWeek(now)

	return endOfWeek.getTime() > threeDaysFromNow.getTime()
		? endOfWeek
		: threeDaysFromNow
}

const getEndOfSundayStartedWeek = (date: Date) => {
	const endOfWeek = new Date(date)
	const daysUntilSaturday = (SATURDAY - endOfWeek.getDay() + 7) % 7
	endOfWeek.setDate(endOfWeek.getDate() + daysUntilSaturday)
	endOfWeek.setHours(23, 59, 59, 999)

	return endOfWeek
}

const addDays = (date: Date, days: number) =>
	new Date(date.getTime() + days * 24 * 60 * 60 * 1000)

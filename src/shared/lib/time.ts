export const getCurrentInstant = (): Temporal.Instant => Temporal.Now.instant()

export const getCurrentTimestamp = (): number =>
	getCurrentInstant().epochMilliseconds

export const getSystemTimeZone = (): string => Temporal.Now.timeZoneId()

export const getCurrentDateTime = (
	timeZone = getSystemTimeZone(),
): Temporal.ZonedDateTime => getCurrentInstant().toZonedDateTimeISO(timeZone)

export const getCurrentDate = (
	timeZone = getSystemTimeZone(),
): Temporal.PlainDate => getCurrentDateTime(timeZone).toPlainDate()

export const getDateTime = ({
	timestamp,
	timeZone = getSystemTimeZone(),
}: Readonly<{
	timestamp: number
	timeZone?: string
}>): Temporal.ZonedDateTime =>
	Temporal.Instant.fromEpochMilliseconds(timestamp).toZonedDateTimeISO(timeZone)

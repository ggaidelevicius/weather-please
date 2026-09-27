import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSpoofedCalendarData } from '../spoofed-calendar'

afterEach(() => vi.restoreAllMocks())

describe('spoofed calendar dates', () => {
	it.each([
		['2026-03-07T23:30', '2026-03-08', 23],
		['2026-10-31T23:30', '2026-11-01', 25],
	])(
		'uses tomorrow and local appointment times after %s',
		(start, tomorrow, hours) => {
			const timeZone = 'America/New_York'
			const now = Temporal.ZonedDateTime.from(`${start}[${timeZone}]`)
			vi.spyOn(Temporal.Now, 'instant').mockReturnValue(now.toInstant())
			vi.spyOn(Temporal.Now, 'timeZoneId').mockReturnValue(timeZone)

			const { events } = createSpoofedCalendarData()
			const conference = events.find(
				(event) => event.id === 'spoof-conference',
			)!
			const coffee = events.find((event) => event.id === 'spoof-coffee')!
			const conferenceStart = Temporal.Instant.fromEpochMilliseconds(
				conference.startTimestamp,
			).toZonedDateTimeISO(timeZone)
			const coffeeStart = Temporal.Instant.fromEpochMilliseconds(
				coffee.startTimestamp,
			).toZonedDateTimeISO(timeZone)

			expect(conferenceStart.toPlainDate().toString()).toBe(tomorrow)
			expect(conferenceStart.hour).toBe(0)
			expect(conference.endTimestamp - conference.startTimestamp).toBe(
				hours * 60 * 60_000,
			)
			expect(coffeeStart.toPlainDate().toString()).toBe(tomorrow)
			expect(coffeeStart.hour).toBe(9)
			expect(coffeeStart.minute).toBe(30)
		},
	)
})

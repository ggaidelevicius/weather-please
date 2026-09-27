import { afterEach, describe, expect, it, vi } from 'vitest'

import {
	getCurrentDate,
	getCurrentDateTime,
	getCurrentInstant,
	getCurrentTimestamp,
	getDateTime,
} from '../time'

afterEach(() => vi.useRealTimers())

describe('Temporal clock and timezone helpers', () => {
	it('uses the same instant for timestamps and dates in different zones', () => {
		vi.useFakeTimers()
		const instant = Temporal.Instant.from('2026-01-01T00:30:00Z')
		vi.setSystemTime(instant.epochMilliseconds)

		expect(getCurrentInstant().equals(instant)).toBe(true)
		expect(getCurrentTimestamp()).toBe(instant.epochMilliseconds)
		expect(getCurrentDate('America/Los_Angeles').toString()).toBe('2025-12-31')
		expect(getCurrentDate('Asia/Tokyo').toString()).toBe('2026-01-01')
		expect(getCurrentDateTime('Asia/Kathmandu').toPlainTime().toString()).toBe(
			'06:15:00',
		)
	})

	it.each([
		['2026-03-08T06:30:00Z', '01:30:00', '-05:00'],
		['2026-03-08T07:30:00Z', '03:30:00', '-04:00'],
		['2026-11-01T05:30:00Z', '01:30:00', '-04:00'],
		['2026-11-01T06:30:00Z', '01:30:00', '-05:00'],
	])('preserves the instant across DST: %s', (source, time, offset) => {
		const instant = Temporal.Instant.from(source)
		const local = getDateTime({
			timestamp: instant.epochMilliseconds,
			timeZone: 'America/New_York',
		})
		expect(local.toPlainTime().toString()).toBe(time)
		expect(local.offset).toBe(offset)
		expect(local.toInstant().equals(instant)).toBe(true)
	})

	it('rejects an invalid timestamp or timezone instead of returning an invalid date', () => {
		expect(() => getDateTime({ timestamp: Number.NaN })).toThrow(RangeError)
		expect(() =>
			getDateTime({ timestamp: 0, timeZone: 'Invalid/TimeZone' }),
		).toThrow(RangeError)
	})
})

import { describe, expect, it } from 'vitest'

import { epochMillisecondsSchema, epochSecondsSchema } from '../time-schema'

describe.each([
	['milliseconds', epochMillisecondsSchema, 8_640_000_000_000_000, 1],
	['seconds', epochSecondsSchema, 8_640_000_000_000, 1000],
] as const)('epoch %s validation', (_, schema, limit, scale) => {
	it.each([-1, 0, 1])(
		'accepts representable timestamps at direction %s',
		(direction) => {
			const timestamp = direction * limit
			expect(schema.parse(timestamp)).toBe(timestamp)
			expect(() =>
				Temporal.Instant.fromEpochMilliseconds(timestamp * scale),
			).not.toThrow()
		},
	)

	it('rejects values that cannot be converted into an instant', () => {
		for (const timestamp of [
			0.5,
			-0.5,
			limit + 1,
			-limit - 1,
			Number.MAX_SAFE_INTEGER + 1,
			Number.NaN,
			Infinity,
			'0',
		]) {
			expect(schema.safeParse(timestamp).success).toBe(false)
		}
	})
})

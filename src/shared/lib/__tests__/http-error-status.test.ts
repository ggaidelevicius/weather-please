import { describe, expect, it } from 'vitest'

import {
	getHttpErrorStatusCode,
	isServerErrorStatusCode,
} from '../http-error-status'

describe('getHttpErrorStatusCode', () => {
	it('returns a provider status code from error messages', () => {
		expect(
			getHttpErrorStatusCode(
				'Network location provider returned error code 502.',
			),
		).toBe(502)
		expect(getHttpErrorStatusCode('Weather fetch failed: 504')).toBe(504)
	})

	it('ignores non-http status values', () => {
		expect(
			getHttpErrorStatusCode(
				'Location lookup failed after 10000 milliseconds.',
			),
		).toBeNull()
		expect(
			getHttpErrorStatusCode('Provider responded with status 200.'),
		).toBeNull()
	})
})

describe('isServerErrorStatusCode', () => {
	it('returns true only for 5xx responses', () => {
		expect(isServerErrorStatusCode(502)).toBe(true)
		expect(isServerErrorStatusCode(404)).toBe(false)
		expect(isServerErrorStatusCode(null)).toBe(false)
	})
})

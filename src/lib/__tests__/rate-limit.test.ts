import { rateLimit } from '../rate-limit'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('rateLimit', () => {
	let testCounter = 0

	beforeEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
		testCounter++
	})

	// Helper to generate unique IPs for each test
	const getUniqueIP = (suffix: number = 1) => `192.168.${testCounter}.${suffix}`

	it('allows first request from new IP', () => {
		const ip = getUniqueIP()
		const result = rateLimit(ip)
		expect(result).toBe(false) // false means not rate limited
	})

	it('allows multiple requests under the limit', () => {
		const ip = getUniqueIP()

		// Make 5 requests (which is the limit)
		for (let i = 0; i < 5; i++) {
			const result = rateLimit(ip)
			expect(result).toBe(false)
		}
	})

	it('blocks requests when limit is exceeded', () => {
		const ip = getUniqueIP()

		// Make 5 requests (up to the limit)
		for (let i = 0; i < 5; i++) {
			rateLimit(ip)
		}

		// 6th request should be blocked
		const result = rateLimit(ip)
		expect(result).toBe(true) // true means rate limited
	})

	it('continues to block subsequent requests after limit exceeded', () => {
		const ip = getUniqueIP()

		// Exceed the limit
		for (let i = 0; i < 6; i++) {
			rateLimit(ip)
		}

		// Multiple subsequent requests should be blocked
		expect(rateLimit(ip)).toBe(true)
		expect(rateLimit(ip)).toBe(true)
		expect(rateLimit(ip)).toBe(true)
	})

	it('resets rate limit after time window expires', () => {
		vi.useFakeTimers()
		const ip = getUniqueIP()

		// Exceed the limit
		for (let i = 0; i < 6; i++) {
			rateLimit(ip)
		}

		// Should be blocked
		expect(rateLimit(ip)).toBe(true)

		// Fast forward past the 1 hour window (60 * 60 * 1000 + 1 ms)
		vi.advanceTimersByTime(60 * 60 * 1000 + 1)

		// Should be allowed again
		const result = rateLimit(ip)
		expect(result).toBe(false)

		vi.useRealTimers()
	})

	it('handles different IPs independently', () => {
		const ip1 = getUniqueIP(1)
		const ip2 = getUniqueIP(2)

		// Exceed limit for ip1
		for (let i = 0; i < 6; i++) {
			rateLimit(ip1)
		}

		// ip1 should be blocked
		expect(rateLimit(ip1)).toBe(true)

		// ip2 should still be allowed
		expect(rateLimit(ip2)).toBe(false)
	})

	it('properly tracks count increments', () => {
		const ip = getUniqueIP()

		// Make requests and verify they're allowed
		expect(rateLimit(ip)).toBe(false) // 1st request
		expect(rateLimit(ip)).toBe(false) // 2nd request
		expect(rateLimit(ip)).toBe(false) // 3rd request
		expect(rateLimit(ip)).toBe(false) // 4th request
		expect(rateLimit(ip)).toBe(false) // 5th request
		expect(rateLimit(ip)).toBe(true) // 6th request - blocked
	})

	it('resets window when expired even with previous requests', () => {
		vi.useFakeTimers()
		const ip = getUniqueIP()

		// Make some requests but don't exceed limit
		rateLimit(ip) // 1st request
		rateLimit(ip) // 2nd request
		rateLimit(ip) // 3rd request

		// Fast forward past window
		vi.advanceTimersByTime(60 * 60 * 1000 + 1)

		// Should reset and allow new requests
		expect(rateLimit(ip)).toBe(false) // Should be treated as 1st request in new window

		vi.useRealTimers()
	})
})

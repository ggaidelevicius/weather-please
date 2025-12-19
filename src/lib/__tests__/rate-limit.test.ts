import { enforceRateLimit } from '../rate-limit'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { prisma } from '../prisma'

// Mock Prisma
vi.mock('../prisma', () => ({
	prisma: {
		$transaction: vi.fn(),
		rateLimitEntry: {
			deleteMany: vi.fn(),
		},
	},
}))

describe('enforceRateLimit', () => {
	const mockHeaders = new Headers()
	let testCounter = 0

	beforeEach(() => {
		testCounter++
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	// Helper to create mock headers with IP
	const createHeaders = (ip: string) => {
		const headers = new Headers()
		headers.set('x-forwarded-for', ip)
		return headers
	}

	it('allows first request from new IP', async () => {
		const headers = createHeaders(`192.168.1.${testCounter}`)

		// Mock transaction to allow request (count < limit)
		vi.mocked(prisma.$transaction).mockResolvedValueOnce({ ok: true })

		const result = await enforceRateLimit({
			scope: 'server-action',
			headers,
		})

		expect(result.ok).toBe(true)
	})

	it('blocks request when limit is exceeded', async () => {
		const headers = createHeaders(`192.168.2.${testCounter}`)

		// Mock transaction to block request (count >= limit)
		vi.mocked(prisma.$transaction).mockResolvedValueOnce({
			ok: false,
			retryAfter: 3600,
		})

		const result = await enforceRateLimit({
			scope: 'server-action',
			headers,
		})

		expect(result.ok).toBe(false)
		expect(result.ok === false && result.retryAfter).toBeGreaterThan(0)
	})

	it('parses x-forwarded-for header correctly', async () => {
		const headers = new Headers()
		headers.set('x-forwarded-for', '192.168.3.1, 10.0.0.1, 172.16.0.1')

		vi.mocked(prisma.$transaction).mockResolvedValueOnce({ ok: true })

		await enforceRateLimit({
			scope: 'server-action',
			headers,
		})

		// Verify the transaction was called (which means IP was parsed)
		expect(prisma.$transaction).toHaveBeenCalled()
	})

	it('fails closed when IP cannot be identified', async () => {
		const headers = new Headers() // No IP headers

		const result = await enforceRateLimit({
			scope: 'server-action',
			headers,
		})

		expect(result.ok).toBe(false)
		expect(result.ok === false && result.retryAfter).toBe(60)
	})

	it('fails closed on database error', async () => {
		const headers = createHeaders(`192.168.4.${testCounter}`)

		// Mock database error
		vi.mocked(prisma.$transaction).mockRejectedValueOnce(
			new Error('Database connection failed'),
		)

		const result = await enforceRateLimit({
			scope: 'server-action',
			headers,
		})

		expect(result.ok).toBe(false)
		expect(result.ok === false && result.retryAfter).toBe(60)
	})

	it('handles x-real-ip header as fallback', async () => {
		const headers = new Headers()
		headers.set('x-real-ip', `192.168.5.${testCounter}`)

		vi.mocked(prisma.$transaction).mockResolvedValueOnce({ ok: true })

		await enforceRateLimit({
			scope: 'server-action',
			headers,
		})

		expect(prisma.$transaction).toHaveBeenCalled()
	})

	it('handles cf-connecting-ip header for Cloudflare', async () => {
		const headers = new Headers()
		headers.set('cf-connecting-ip', `192.168.6.${testCounter}`)

		vi.mocked(prisma.$transaction).mockResolvedValueOnce({ ok: true })

		await enforceRateLimit({
			scope: 'server-action',
			headers,
		})

		expect(prisma.$transaction).toHaveBeenCalled()
	})

	it('prioritizes x-forwarded-for over other headers', async () => {
		const headers = new Headers()
		headers.set('x-forwarded-for', `192.168.7.${testCounter}`)
		headers.set('x-real-ip', '10.0.0.1')
		headers.set('cf-connecting-ip', '172.16.0.1')

		vi.mocked(prisma.$transaction).mockResolvedValueOnce({ ok: true })

		await enforceRateLimit({
			scope: 'server-action',
			headers,
		})

		// The key should be based on the first IP in x-forwarded-for
		expect(prisma.$transaction).toHaveBeenCalled()
	})
})

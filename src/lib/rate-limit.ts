import { prisma } from '@/lib/prisma'

type RateLimitScope = 'server-action'

type RateLimitRule = {
	windowMs: number
	maxRequests: number
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number }

type RateLimitOptions = {
	scope: RateLimitScope
	headers: Headers
}

const RATE_LIMIT_RULES: Record<RateLimitScope, RateLimitRule> = {
	'server-action': {
		// Server action limiter for form submissions
		windowMs: 60 * 60 * 1000, // 1 hour
		maxRequests: 5,
	},
}

const getClientIdentifier = (headers: Headers): string | null => {
	const forwardedFor = headers.get('x-forwarded-for')
	if (forwardedFor) {
		const [ip] = forwardedFor.split(',')
		if (ip?.trim()) return ip.trim()
	}

	const realIp = headers.get('x-real-ip') || headers.get('cf-connecting-ip')
	return realIp?.trim() || null
}

const buildRateLimitKey = ({
	scope,
	headers,
}: RateLimitOptions): string | null => {
	const ip = getClientIdentifier(headers)
	if (!ip) {
		return null
	}

	return `${scope}:ip:${ip}`
}

export const enforceRateLimit = async (
	options: RateLimitOptions,
): Promise<RateLimitResult> => {
	const key = buildRateLimitKey(options)

	// Fail closed: if we can't identify the client, reject the request
	if (!key) {
		return { ok: false, retryAfter: 60 }
	}

	const rule = RATE_LIMIT_RULES[options.scope]
	const now = new Date()
	const windowStart = new Date(now.getTime() - rule.windowMs)

	try {
		// Use a transaction to ensure atomicity
		const result = await prisma.$transaction(async (tx) => {
			// Count requests in the current window
			const recentCount = await tx.rateLimitEntry.count({
				where: {
					key,
					createdAt: { gte: windowStart },
				},
			})

			if (recentCount >= rule.maxRequests) {
				// Find the oldest entry in the window to calculate retry time
				const oldestEntry = await tx.rateLimitEntry.findFirst({
					where: {
						key,
						createdAt: { gte: windowStart },
					},
					orderBy: { createdAt: 'asc' },
				})

				const retryAfter = oldestEntry
					? Math.max(
							1,
							Math.ceil(
								(oldestEntry.createdAt.getTime() +
									rule.windowMs -
									now.getTime()) /
									1000,
							),
						)
					: Math.ceil(rule.windowMs / 1000)

				return { ok: false as const, retryAfter }
			}

			// Record this request
			await tx.rateLimitEntry.create({
				data: { key },
			})

			return { ok: true as const }
		})

		// Probabilistic cleanup: ~1% of requests trigger cleanup
		// This spreads the cleanup load across requests
		if (Math.random() < 0.01) {
			cleanupExpiredEntries().catch(() => {
				// Ignore cleanup errors - they shouldn't affect the request
			})
		}

		return result
	} catch (error) {
		// If database fails, fail closed for security
		console.error('Rate limit check failed:', error)
		return { ok: false, retryAfter: 60 }
	}
}

/**
 * Cleanup expired rate limit entries.
 * Called probabilistically during normal requests.
 */
const cleanupExpiredEntries = async (): Promise<void> => {
	// Delete entries older than the longest window (1 hour currently)
	const maxWindowMs = Math.max(
		...Object.values(RATE_LIMIT_RULES).map((r) => r.windowMs),
	)
	const cutoff = new Date(Date.now() - maxWindowMs)

	await prisma.rateLimitEntry.deleteMany({
		where: {
			createdAt: { lt: cutoff },
		},
	})
}

export type { RateLimitScope }

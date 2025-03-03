interface RateLimitInfo {
	count: number
	windowStart: number
}

const idToRequestCount = new Map<string, RateLimitInfo>()

const WINDOW_SIZE = 60 * 60 * 1000 // 1 hour in milliseconds
const MAX_REQUESTS = 5

export const rateLimit = (ip: string): boolean => {
	const now = Date.now()
	const rateInfo = idToRequestCount.get(ip)

	if (!rateInfo) {
		// No record for this IP, so create one
		idToRequestCount.set(ip, { count: 1, windowStart: now })
		return false
	}

	// Check if this IP's current window has expired
	if (now - rateInfo.windowStart > WINDOW_SIZE) {
		// Reset the window for this IP
		idToRequestCount.set(ip, { count: 1, windowStart: now })
		return false
	}

	// Check if the maximum requests have been exceeded
	if (rateInfo.count >= MAX_REQUESTS) return true

	// Increment the count
	rateInfo.count++
	return false
}

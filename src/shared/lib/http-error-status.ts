const HTTP_ERROR_STATUS_PATTERNS = [
	/returned error code\s+(\d{3})\b/i,
	/status code(?:\s+of)?\s+(\d{3})\b/i,
	/\bhttp\s+(\d{3})\b/i,
	/\bstatus\s+(\d{3})\b/i,
	/failed:\s*(\d{3})\b/i,
]

export const getHttpErrorStatusCode = (
	message: null | string | undefined,
): null | number => {
	if (!message) {
		return null
	}

	for (const pattern of HTTP_ERROR_STATUS_PATTERNS) {
		const matchedStatusCode = message.match(pattern)?.[1]

		if (!matchedStatusCode) {
			continue
		}

		const parsedStatusCode = Number.parseInt(matchedStatusCode, 10)

		if (parsedStatusCode >= 400 && parsedStatusCode <= 599) {
			return parsedStatusCode
		}
	}

	return null
}

export const isServerErrorStatusCode = (statusCode: null | number) =>
	Boolean(statusCode && statusCode >= 500 && statusCode <= 599)

import { z } from 'zod'

export const NEXT_24_HOURS_SCROLL_HINT_STORAGE_KEY =
	'weather-please:next-24-hours-scroll-hint-dismissed'

export const scrollHintDismissedSchema = z.boolean()

export const getHasDismissedScrollHint = () => {
	if (typeof window === 'undefined') {
		return true
	}

	try {
		const storedValue = localStorage.getItem(
			NEXT_24_HOURS_SCROLL_HINT_STORAGE_KEY,
		)
		if (!storedValue) {
			return false
		}

		const parsedValue = JSON.parse(storedValue)
		const dismissed = scrollHintDismissedSchema.safeParse(parsedValue)
		return dismissed.success ? dismissed.data : false
	} catch {
		return false
	}
}

export const persistScrollHintDismissed = () => {
	if (typeof window === 'undefined') {
		return
	}

	try {
		localStorage.setItem(
			NEXT_24_HOURS_SCROLL_HINT_STORAGE_KEY,
			JSON.stringify(true),
		)
	} catch {
		// The hint is non-critical; failing to persist should not affect navigation.
	}
}

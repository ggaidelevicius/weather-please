import { z } from 'zod'

export const getHasDismissedCalendarPromo = () =>
	readPromoFlag(CALENDAR_PROMO_DISMISSED_STORAGE_KEY)

export const persistCalendarPromoDismissed = () => {
	writePromoFlag(CALENDAR_PROMO_DISMISSED_STORAGE_KEY)
}

export const getHasSeenIntegrationsTab = () =>
	readPromoFlag(INTEGRATIONS_TAB_SEEN_STORAGE_KEY)

export const persistIntegrationsTabSeen = () => {
	writePromoFlag(INTEGRATIONS_TAB_SEEN_STORAGE_KEY)
}

const CALENDAR_PROMO_DISMISSED_STORAGE_KEY =
	'weather-please:calendar-promo-dismissed'
const INTEGRATIONS_TAB_SEEN_STORAGE_KEY = 'weather-please:integrations-tab-seen'

const promoFlagSchema = z.boolean()

const readPromoFlag = (key: string) => {
	if (typeof window === 'undefined') {
		return true
	}

	try {
		const storedValue = localStorage.getItem(key)
		if (!storedValue) {
			return false
		}

		const parsed = promoFlagSchema.safeParse(JSON.parse(storedValue))

		return parsed.success ? parsed.data : false
	} catch {
		return false
	}
}

const writePromoFlag = (key: string) => {
	if (typeof window === 'undefined') {
		return
	}

	try {
		localStorage.setItem(key, JSON.stringify(true))
	} catch {
		// The promo is non-critical; failing to persist only means it may
		// reappear.
	}
}

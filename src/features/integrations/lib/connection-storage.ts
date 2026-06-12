import { z } from 'zod'

import { CalendarAccountCategory } from '../model/account-category'

export type PendingWebAuth = z.infer<typeof pendingWebAuthSchema>

export type StoredCalendarAccount = z.infer<typeof storedAccountSchema>

export const readStoredCalendarAccounts = (): StoredCalendarAccount[] => {
	if (typeof window === 'undefined') {
		return []
	}

	const storedConnections = readStoredValue(
		localStorage,
		CONNECTION_STORAGE_KEY,
		storedConnectionsSchema,
	)
	if (storedConnections) {
		return storedConnections.accounts
	}

	const legacyTokens = readStoredValue(
		localStorage,
		CONNECTION_STORAGE_KEY,
		legacyStoredTokensSchema,
	)
	if (legacyTokens) {
		return [
			{
				...legacyTokens,
				accountId: `legacy:${legacyTokens.accountLabel ?? 'account'}`,
				category: CalendarAccountCategory.Personal,
				isSessionExpired: false,
			},
		]
	}

	return []
}

export const writeStoredCalendarAccounts = (
	accounts: readonly StoredCalendarAccount[],
) => {
	if (accounts.length === 0) {
		removeStoredValue(localStorage, CONNECTION_STORAGE_KEY)
		return
	}

	writeStoredValue(localStorage, CONNECTION_STORAGE_KEY, { accounts })
}

// The pending web auth state lives in sessionStorage because it only needs to
// survive the round trip to Microsoft's consent page in the same tab.
export const readPendingWebAuth = (): null | PendingWebAuth =>
	typeof window === 'undefined'
		? null
		: readStoredValue(
				sessionStorage,
				PENDING_AUTH_STORAGE_KEY,
				pendingWebAuthSchema,
			)

export const writePendingWebAuth = (pendingAuth: PendingWebAuth) => {
	writeStoredValue(sessionStorage, PENDING_AUTH_STORAGE_KEY, pendingAuth)
}

export const clearPendingWebAuth = () => {
	removeStoredValue(sessionStorage, PENDING_AUTH_STORAGE_KEY)
}

const CONNECTION_STORAGE_KEY = 'weather-please:microsoft-calendar-connection'
const PENDING_AUTH_STORAGE_KEY = 'weather-please:microsoft-auth-pending'

const storedAccountSchema = z.object({
	accessToken: z.string().min(1),
	accountId: z.string().min(1),
	accountLabel: z.string().nullable(),
	category: z.enum(CalendarAccountCategory),
	expiresAt: z.number(),
	isSessionExpired: z.boolean(),
	refreshToken: z.string().nullable(),
})

const storedConnectionsSchema = z.object({
	accounts: z.array(storedAccountSchema),
})

// Shape persisted by versions that supported a single connection.
const legacyStoredTokensSchema = z.object({
	accessToken: z.string().min(1),
	accountLabel: z.string().nullable(),
	expiresAt: z.number(),
	refreshToken: z.string().nullable(),
})

const pendingWebAuthSchema = z.object({
	codeVerifier: z.string().min(1),
	redirectUri: z.string().min(1),
	state: z.string().min(1),
})

const readStoredValue = <T>(
	storage: Storage,
	key: string,
	schema: z.ZodType<T>,
): null | T => {
	try {
		const storedValue = storage.getItem(key)
		if (!storedValue) {
			return null
		}

		const parsed = schema.safeParse(JSON.parse(storedValue))

		return parsed.success ? parsed.data : null
	} catch {
		return null
	}
}

const writeStoredValue = (storage: Storage, key: string, value: unknown) => {
	if (typeof window === 'undefined') {
		return
	}

	try {
		storage.setItem(key, JSON.stringify(value))
	} catch {
		// Storage can be unavailable (private browsing, quota); the connection
		// then simply does not persist across new tabs.
	}
}

const removeStoredValue = (storage: Storage, key: string) => {
	if (typeof window === 'undefined') {
		return
	}

	try {
		storage.removeItem(key)
	} catch {
		// Ignore unavailable storage; nothing to remove in that case.
	}
}

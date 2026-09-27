import { afterEach, describe, expect, it, vi } from 'vitest'

import { CalendarAccountCategory } from '../../model/account-category'
import { CalendarProvider } from '../../model/calendar-provider'
import {
	CALENDAR_CONNECTION_STORAGE_KEY,
	clearPendingWebAuth,
	readPendingWebAuth,
	readStoredCalendarAccounts,
	writePendingWebAuth,
	writeStoredCalendarAccounts,
} from '../connection-storage'

afterEach(() => {
	vi.restoreAllMocks()
	localStorage.clear()
	sessionStorage.clear()
})

describe('stored calendar accounts', () => {
	const account = {
		accessToken: 'access-token',
		accountId: 'tenant-id.object-id',
		accountLabel: 'gus@example.com',
		category: CalendarAccountCategory.Work,
		expiresAt: 1765500000000,
		isSessionExpired: false,
		provider: CalendarProvider.Microsoft,
		refreshToken: 'refresh-token',
	}

	it('round-trips accounts through localStorage', () => {
		expect(writeStoredCalendarAccounts([account])).toBe(true)

		expect(readStoredCalendarAccounts()).toEqual([account])

		expect(writeStoredCalendarAccounts([])).toBe(true)

		expect(readStoredCalendarAccounts()).toEqual([])
		expect(localStorage.getItem(CALENDAR_CONNECTION_STORAGE_KEY)).toBeNull()
	})

	it('migrates a legacy single-connection value', () => {
		localStorage.setItem(
			CALENDAR_CONNECTION_STORAGE_KEY,
			JSON.stringify({
				accessToken: 'access-token',
				accountLabel: 'gus@example.com',
				expiresAt: 1765500000000,
				refreshToken: 'refresh-token',
			}),
		)

		expect(readStoredCalendarAccounts()).toEqual([
			{
				accessToken: 'access-token',
				accountId: 'legacy:gus@example.com',
				accountLabel: 'gus@example.com',
				category: CalendarAccountCategory.Personal,
				expiresAt: 1765500000000,
				isSessionExpired: false,
				provider: CalendarProvider.Microsoft,
				refreshToken: 'refresh-token',
			},
		])
	})

	it('defaults accounts stored before multi-provider support to Microsoft', () => {
		// `undefined` drops the key during serialisation.
		const accountWithoutProvider = { ...account, provider: undefined }
		localStorage.setItem(
			CALENDAR_CONNECTION_STORAGE_KEY,
			JSON.stringify({ accounts: [accountWithoutProvider] }),
		)

		expect(readStoredCalendarAccounts()).toEqual([account])
	})

	it('returns an empty list for malformed stored values', () => {
		localStorage.setItem(CALENDAR_CONNECTION_STORAGE_KEY, 'not json')

		expect(readStoredCalendarAccounts()).toEqual([])

		localStorage.setItem(
			CALENDAR_CONNECTION_STORAGE_KEY,
			JSON.stringify({ accounts: 'nope' }),
		)

		expect(readStoredCalendarAccounts()).toEqual([])
	})

	it('preserves the fallback accounts when storage cannot be read', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new DOMException('Storage is blocked', 'SecurityError')
		})

		expect(readStoredCalendarAccounts({ fallbackAccounts: [account] })).toEqual(
			[account],
		)
	})

	it('preserves the fallback accounts when stored data is invalid', () => {
		localStorage.setItem(CALENDAR_CONNECTION_STORAGE_KEY, 'not json')

		expect(readStoredCalendarAccounts({ fallbackAccounts: [account] })).toEqual(
			[account],
		)
	})

	it('recognizes a removed connection even when fallback accounts exist', () => {
		expect(readStoredCalendarAccounts({ fallbackAccounts: [account] })).toEqual(
			[],
		)
	})

	it('reports when account persistence fails', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Storage is full', 'QuotaExceededError')
		})

		expect(writeStoredCalendarAccounts([account])).toBe(false)
	})

	it('reports when removing persisted accounts fails', () => {
		vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
			throw new DOMException('Storage is blocked', 'SecurityError')
		})

		expect(writeStoredCalendarAccounts([])).toBe(false)
	})
})

describe('pending web auth state', () => {
	it('round-trips pending auth through sessionStorage', () => {
		const pendingAuth = {
			codeVerifier: 'verifier',
			provider: CalendarProvider.Google,
			redirectUri: 'https://weather-please.app/',
			state: 'state-value',
		}

		writePendingWebAuth(pendingAuth)

		expect(readPendingWebAuth()).toEqual(pendingAuth)

		clearPendingWebAuth()

		expect(readPendingWebAuth()).toBeNull()
	})
})

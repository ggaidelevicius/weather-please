import { afterEach, describe, expect, it } from 'vitest'

import { CalendarAccountCategory } from '../../model/account-category'
import { CalendarProvider } from '../../model/calendar-provider'
import {
	clearPendingWebAuth,
	readPendingWebAuth,
	readStoredCalendarAccounts,
	writePendingWebAuth,
	writeStoredCalendarAccounts,
} from '../connection-storage'

const STORAGE_KEY = 'weather-please:microsoft-calendar-connection'

afterEach(() => {
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
		writeStoredCalendarAccounts([account])

		expect(readStoredCalendarAccounts()).toEqual([account])

		writeStoredCalendarAccounts([])

		expect(readStoredCalendarAccounts()).toEqual([])
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
	})

	it('migrates a legacy single-connection value', () => {
		localStorage.setItem(
			STORAGE_KEY,
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
			STORAGE_KEY,
			JSON.stringify({ accounts: [accountWithoutProvider] }),
		)

		expect(readStoredCalendarAccounts()).toEqual([account])
	})

	it('returns an empty list for malformed stored values', () => {
		localStorage.setItem(STORAGE_KEY, 'not json')

		expect(readStoredCalendarAccounts()).toEqual([])

		localStorage.setItem(STORAGE_KEY, JSON.stringify({ accounts: 'nope' }))

		expect(readStoredCalendarAccounts()).toEqual([])
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

import { act, renderHook, waitFor } from '@testing-library/react'
import { type ReactNode, StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { StoredCalendarAccount } from '../../lib/connection-storage'
import type { ProviderTokens } from '../../lib/provider-tokens'
import type { CalendarEvent } from '../../model/calendar-event'

import { AsyncStatus } from '../../../../shared/hooks/async-status'
import { CalendarReauthRequiredError } from '../../lib/calendar-reauth-error'
import {
	CALENDAR_CONNECTION_STORAGE_KEY,
	readStoredCalendarAccounts,
	writeStoredCalendarAccounts,
} from '../../lib/connection-storage'
import { CalendarAccountCategory } from '../../model/account-category'
import { CalendarProvider } from '../../model/calendar-provider'
import {
	CalendarConnectionError,
	useCalendarConnection,
} from '../use-calendar-connection'

const { fetchEvents, refreshTokens } = vi.hoisted(() => ({
	fetchEvents: vi.fn(),
	refreshTokens: vi.fn(),
}))
vi.mock('../../lib/google-calendar', () => ({
	fetchUpcomingGoogleCalendarEvents: fetchEvents,
}))
vi.mock('../../lib/microsoft-calendar', () => ({
	fetchUpcomingCalendarEvents: fetchEvents,
}))
vi.mock(import('../../lib/google-auth'), async (importOriginal) => ({
	...(await importOriginal()),
	refreshGoogleTokens: refreshTokens,
}))
vi.mock(import('../../lib/microsoft-auth'), async (importOriginal) => ({
	...(await importOriginal()),
	refreshMicrosoftTokens: refreshTokens,
}))

const createDeferred = () => {
	let resolve!: (events: CalendarEvent[]) => void
	let reject!: (error: Error) => void
	const promise = new Promise<CalendarEvent[]>((complete, fail) => {
		resolve = complete
		reject = fail
	})
	return { promise, resolve, reject }
}
const event = (id: string): CalendarEvent => ({
	accountId: 'account-a',
	description: null,
	endTimestamp: Date.now() + 3600000,
	icalUid: null,
	id,
	isAllDay: false,
	location: null,
	startTimestamp: Date.now(),
	subject: id,
	webLink: null,
})
const createAccount = (
	overrides: Partial<StoredCalendarAccount> = {},
): StoredCalendarAccount => ({
	accessToken: 'test-token',
	accountId: 'account-a',
	accountLabel: 'Example',
	category: CalendarAccountCategory.Personal,
	expiresAt: Date.now() + 3600000,
	isSessionExpired: false,
	provider: CalendarProvider.Google,
	refreshToken: 'refresh-token',
	...overrides,
})
const seedAccount = (overrides: Partial<StoredCalendarAccount> = {}) =>
	writeStoredCalendarAccounts([createAccount(overrides)])
const refreshedTokens = (): ProviderTokens => ({
	accessToken: 'fresh-access-token',
	accountId: 'account-a',
	accountLabel: 'Example',
	expiresAt: Date.now() + 3600000,
	refreshToken: 'rotated-refresh-token',
})
const notifyStorageChange = (
	key: string | null = CALENDAR_CONNECTION_STORAGE_KEY,
) =>
	window.dispatchEvent(
		new StorageEvent('storage', { key, storageArea: localStorage }),
	)

beforeEach(() => {
	localStorage.clear()
	sessionStorage.clear()
	vi.resetAllMocks()
	seedAccount()
})

afterEach(() => vi.restoreAllMocks())

describe('calendar request lifecycle', () => {
	it('does not restore disconnected events after a pending request completes', async () => {
		const pending = createDeferred()
		fetchEvents.mockReturnValue(pending.promise)
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		act(() => result.current.disconnect('account-a'))
		await act(async () => pending.resolve([event('removed')]))
		expect(result.current.accounts).toEqual([])
		expect(result.current.events).toEqual([])
		expect(readStoredCalendarAccounts()).toEqual([])
	})

	it('preserves a category edited while events are loading', async () => {
		const pending = createDeferred()
		fetchEvents.mockReturnValue(pending.promise)
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		act(() =>
			result.current.setAccountCategory(
				'account-a',
				CalendarAccountCategory.Work,
			),
		)
		await act(async () => pending.resolve([event('updated')]))
		expect(result.current.accounts[0].category).toBe(
			CalendarAccountCategory.Work,
		)
		expect(readStoredCalendarAccounts()[0].category).toBe(
			CalendarAccountCategory.Work,
		)
	})

	it('ignores an older response that arrives after a retry', async () => {
		const older = createDeferred()
		const newer = createDeferred()
		fetchEvents
			.mockReturnValueOnce(older.promise)
			.mockReturnValueOnce(newer.promise)
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		act(() => result.current.retryEvents())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledTimes(2))
		await act(async () => newer.resolve([event('newer')]))
		await act(async () => older.resolve([event('older')]))
		expect(result.current.events.map((event) => event.id)).toEqual(['newer'])
	})

	it('does not persist an obsolete response after unmounting', async () => {
		const pending = createDeferred()
		fetchEvents.mockReturnValue(pending.promise)
		const { unmount } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		unmount()
		writeStoredCalendarAccounts([])
		await act(async () => pending.resolve([event('obsolete')]))
		expect(readStoredCalendarAccounts()).toEqual([])
	})

	it('loads events after Strict Mode effect cleanup and setup', async () => {
		fetchEvents.mockResolvedValue([event('strict')])
		const { result } = renderHook(() => useCalendarConnection(), {
			wrapper: ({ children }: { children: ReactNode }) => (
				<StrictMode>{children}</StrictMode>
			),
		})
		await waitFor(() =>
			expect(result.current.events.map((event) => event.id)).toEqual([
				'strict',
			]),
		)
	})
})

describe.each([CalendarProvider.Google, CalendarProvider.Microsoft])(
	'calendar credential recovery (%s)',
	(provider) => {
		beforeEach(() => seedAccount({ provider }))

		it('refreshes and retries once when the calendar rejects an unexpired access token', async () => {
			const tokens = refreshedTokens()
			refreshTokens.mockResolvedValue(tokens)
			fetchEvents
				.mockRejectedValueOnce(new CalendarReauthRequiredError())
				.mockResolvedValueOnce([event('recovered')])
			const { result } = renderHook(() => useCalendarConnection())

			await waitFor(() =>
				expect(result.current.events[0]?.id).toBe('recovered'),
			)
			expect(refreshTokens).toHaveBeenCalledOnce()
			expect(fetchEvents).toHaveBeenCalledTimes(2)
			expect(fetchEvents).toHaveBeenLastCalledWith(
				expect.objectContaining({ accessToken: tokens.accessToken }),
			)
			expect(readStoredCalendarAccounts()[0]).toMatchObject({
				...tokens,
				isSessionExpired: false,
			})
		})

		it('requires reconnection when the forced refresh is rejected without retrying it', async () => {
			refreshTokens.mockRejectedValue(new CalendarReauthRequiredError())
			fetchEvents.mockRejectedValue(new CalendarReauthRequiredError())
			const { result } = renderHook(() => useCalendarConnection())

			await waitFor(() =>
				expect(result.current.accounts[0].isSessionExpired).toBe(true),
			)
			expect(refreshTokens).toHaveBeenCalledOnce()
			expect(fetchEvents).toHaveBeenCalledOnce()
			expect(readStoredCalendarAccounts()[0].isSessionExpired).toBe(true)
		})

		it('stops after the calendar also rejects the refreshed access token', async () => {
			refreshTokens.mockResolvedValue(refreshedTokens())
			fetchEvents.mockRejectedValue(new CalendarReauthRequiredError())
			const { result } = renderHook(() => useCalendarConnection())

			await waitFor(() =>
				expect(result.current.accounts[0].isSessionExpired).toBe(true),
			)
			expect(refreshTokens).toHaveBeenCalledOnce()
			expect(fetchEvents).toHaveBeenCalledTimes(2)
			expect(readStoredCalendarAccounts()[0].refreshToken).toBe(
				'rotated-refresh-token',
			)
		})

		it('does not require reconnection for a temporary refresh failure', async () => {
			vi.spyOn(console, 'error').mockImplementation(() => {})
			refreshTokens.mockRejectedValue(new Error('Temporarily unavailable'))
			fetchEvents.mockRejectedValue(new CalendarReauthRequiredError())
			const { result } = renderHook(() => useCalendarConnection())

			await waitFor(() =>
				expect(result.current.eventsStatus).toBe(AsyncStatus.Error),
			)
			expect(result.current.error).toBe(CalendarConnectionError.EventsFailed)
			expect(result.current.accounts[0].isSessionExpired).toBe(false)
			expect(refreshTokens).toHaveBeenCalledOnce()
		})

		it('keeps rotated credentials when event loading fails after an expiry refresh', async () => {
			seedAccount({ provider, expiresAt: Date.now() - 1000 })
			vi.spyOn(console, 'error').mockImplementation(() => {})
			const tokens = refreshedTokens()
			refreshTokens.mockResolvedValue(tokens)
			fetchEvents.mockRejectedValueOnce(new Error('Temporary calendar outage'))
			const { result } = renderHook(() => useCalendarConnection())

			await waitFor(() =>
				expect(result.current.eventsStatus).toBe(AsyncStatus.Error),
			)
			expect(readStoredCalendarAccounts()[0]).toMatchObject({
				...tokens,
				isSessionExpired: false,
			})
			fetchEvents.mockResolvedValueOnce([event('retried')])
			act(() => result.current.retryEvents())
			await waitFor(() => expect(result.current.events[0]?.id).toBe('retried'))
			expect(refreshTokens).toHaveBeenCalledOnce()
			expect(fetchEvents).toHaveBeenLastCalledWith(
				expect.objectContaining({ accessToken: tokens.accessToken }),
			)
		})

		it('does not retry an expiry refresh when its refresh token is rejected', async () => {
			seedAccount({ provider, expiresAt: Date.now() - 1000 })
			refreshTokens.mockRejectedValue(new CalendarReauthRequiredError())
			const { result } = renderHook(() => useCalendarConnection())

			await waitFor(() =>
				expect(result.current.accounts[0].isSessionExpired).toBe(true),
			)
			expect(refreshTokens).toHaveBeenCalledOnce()
			expect(fetchEvents).not.toHaveBeenCalled()
		})
	},
)

describe('calendar connections across tabs', () => {
	it('does not overwrite a reconnection when an older request fails before its storage event arrives', async () => {
		const pending = createDeferred()
		fetchEvents
			.mockReturnValueOnce(pending.promise)
			.mockResolvedValueOnce([event('reconnected')])
		refreshTokens.mockRejectedValue(new CalendarReauthRequiredError())
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		const reconnected = createAccount({
			...refreshedTokens(),
			accountId: 'account-a',
		})
		writeStoredCalendarAccounts([reconnected])
		await act(async () => pending.reject(new CalendarReauthRequiredError()))

		await waitFor(() =>
			expect(result.current.events[0]?.id).toBe('reconnected'),
		)
		expect(result.current.accounts[0].isSessionExpired).toBe(false)
		expect(readStoredCalendarAccounts()).toEqual([reconnected])
		expect(fetchEvents).toHaveBeenLastCalledWith(
			expect.objectContaining({ accessToken: reconnected.accessToken }),
		)
	})

	it('does not restore an account disconnected elsewhere while events are pending', async () => {
		const pending = createDeferred()
		fetchEvents.mockReturnValueOnce(pending.promise)
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		writeStoredCalendarAccounts([])
		await act(async () => pending.resolve([event('removed')]))

		expect(result.current.accounts).toEqual([])
		expect(result.current.events).toEqual([])
		expect(readStoredCalendarAccounts()).toEqual([])
	})

	it('loads renewed credentials on a storage event and ignores the superseded request', async () => {
		const pending = createDeferred()
		fetchEvents
			.mockReturnValueOnce(pending.promise)
			.mockResolvedValueOnce([event('renewed')])
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		const renewed = createAccount({
			...refreshedTokens(),
			accountId: 'account-a',
		})
		writeStoredCalendarAccounts([renewed])
		act(() => notifyStorageChange())
		await waitFor(() => expect(result.current.events[0]?.id).toBe('renewed'))
		await act(async () => pending.resolve([event('superseded')]))

		expect(result.current.events[0]?.id).toBe('renewed')
		expect(readStoredCalendarAccounts()).toEqual([renewed])
	})

	it('synchronizes category changes without refetching unchanged credentials', async () => {
		fetchEvents.mockResolvedValue([event('existing')])
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(result.current.events[0]?.id).toBe('existing'))
		const current = readStoredCalendarAccounts()[0]
		writeStoredCalendarAccounts([
			{ ...current, category: CalendarAccountCategory.Work },
		])
		act(() => notifyStorageChange())

		expect(result.current.accounts[0].category).toBe(
			CalendarAccountCategory.Work,
		)
		expect(fetchEvents).toHaveBeenCalledOnce()
	})

	it('clears connected accounts and events when another tab clears storage', async () => {
		fetchEvents.mockResolvedValue([event('existing')])
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(result.current.events[0]?.id).toBe('existing'))
		localStorage.clear()
		act(() => notifyStorageChange(null))

		expect(result.current.accounts).toEqual([])
		expect(result.current.events).toEqual([])
		expect(result.current.eventsStatus).toBe(AsyncStatus.Idle)
	})

	it('preserves external credentials and new accounts when changing a category from a stale tab', async () => {
		fetchEvents.mockResolvedValue([event('existing')])
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(result.current.events[0]?.id).toBe('existing'))
		const renewed = createAccount({
			...refreshedTokens(),
			accountId: 'account-a',
		})
		const added = createAccount({ accountId: 'account-b' })
		writeStoredCalendarAccounts([renewed, added])
		act(() =>
			result.current.setAccountCategory(
				'account-a',
				CalendarAccountCategory.Work,
			),
		)

		expect(readStoredCalendarAccounts()).toEqual([
			{ ...renewed, category: CalendarAccountCategory.Work },
			added,
		])
	})

	it('preserves accounts added elsewhere when disconnecting from a stale tab', async () => {
		fetchEvents.mockResolvedValue([event('existing')])
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(result.current.events[0]?.id).toBe('existing'))
		const added = createAccount({ accountId: 'account-b' })
		writeStoredCalendarAccounts([...readStoredCalendarAccounts(), added])
		act(() => result.current.disconnect('account-a'))

		expect(readStoredCalendarAccounts()).toEqual([added])
		expect(result.current.accounts.map((account) => account.accountId)).toEqual(
			['account-b'],
		)
	})

	it('keeps refreshed credentials in memory when saving to storage fails', async () => {
		seedAccount({ expiresAt: Date.now() - 1000 })
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Storage is full', 'QuotaExceededError')
		})
		refreshTokens.mockResolvedValue(refreshedTokens())
		fetchEvents.mockResolvedValue([event('available')])
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(result.current.events[0]?.id).toBe('available'))
		act(() => result.current.retryEvents())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledTimes(2))

		expect(refreshTokens).toHaveBeenCalledOnce()
		expect(fetchEvents).toHaveBeenLastCalledWith(
			expect.objectContaining({ accessToken: 'fresh-access-token' }),
		)
		expect(result.current.accounts[0].isSessionExpired).toBe(false)
	})
})

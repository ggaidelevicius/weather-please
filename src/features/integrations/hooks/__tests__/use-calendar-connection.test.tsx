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

const { exchangeTokens, fetchEvents, refreshTokens } = vi.hoisted(() => ({
	exchangeTokens: vi.fn(),
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
	exchangeGoogleAuthorizationCode: exchangeTokens,
	refreshGoogleTokens: refreshTokens,
}))
vi.mock(import('../../lib/microsoft-auth'), async (importOriginal) => ({
	...(await importOriginal()),
	exchangeMicrosoftAuthorizationCode: exchangeTokens,
	refreshMicrosoftTokens: refreshTokens,
}))
vi.mock(import('../../lib/pkce'), async (importOriginal) => ({
	...(await importOriginal()),
	createPkcePair: async () => ({
		codeChallenge: 'challenge',
		codeVerifier: 'verifier',
	}),
}))

const createDeferred = () => {
	let resolve!: (events: CalendarEvent[]) => void
	let reject!: (error: Error) => void
	const promise = new Promise<CalendarEvent[]>((complete, fail) => {
		resolve = complete
		reject = fail
	})
	return { promise, reject, resolve }
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
	key: null | string = CALENDAR_CONNECTION_STORAGE_KEY,
) =>
	window.dispatchEvent(
		new StorageEvent('storage', { key, storageArea: localStorage }),
	)

const configureExtensionAuth = () => {
	vi.stubEnv('NEXT_PUBLIC_MICROSOFT_CLIENT_ID', 'test-client-id')
	vi.stubGlobal('chrome', {
		identity: {
			getRedirectURL: () => 'https://test.chromiumapp.org/',
			launchWebAuthFlow: (
				{ url }: { url: string },
				callback: (url: string) => void,
			) => {
				const state = new URL(url).searchParams.get('state')
				callback(`https://test.chromiumapp.org/?code=test-code&state=${state}`)
			},
		},
	})
}

const deferAccountMutations = () => {
	const pending: Array<() => void> = []
	const request = vi.fn(
		<T,>(
			name: string,
			options: LockOptions,
			callback: (lock: Lock) => PromiseLike<T> | T,
		): Promise<T> =>
			new Promise((resolve, reject) => {
				const grant = () => {
					try {
						options.signal?.throwIfAborted()
						Promise.resolve(callback({ mode: 'exclusive', name })).then(
							resolve,
							reject,
						)
					} catch (caughtError) {
						reject(caughtError)
					}
				}
				if (name.endsWith(CALENDAR_CONNECTION_STORAGE_KEY)) pending.push(grant)
				else grant()
			}),
	)
	vi.stubGlobal(
		'navigator',
		Object.create(navigator, {
			locks: { value: { request } },
		}),
	)
	return {
		grantAll: () => pending.splice(0).forEach((grant) => grant()),
		pending,
	}
}

beforeEach(() => {
	localStorage.clear()
	sessionStorage.clear()
	vi.resetAllMocks()
	seedAccount()
})

afterEach(() => {
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
	vi.unstubAllEnvs()
})

describe('calendar request lifecycle', () => {
	it('does not restore disconnected events after a pending request completes', async () => {
		const pending = createDeferred()
		fetchEvents.mockReturnValue(pending.promise)
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		await act(async () => result.current.disconnect('account-a'))
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
		await act(async () =>
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
			seedAccount({ expiresAt: Date.now() - 1000, provider })
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
			seedAccount({ expiresAt: Date.now() - 1000, provider })
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
		await act(async () =>
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
		await act(async () => result.current.disconnect('account-a'))

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

describe('shared calendar fetching', () => {
	it('shares one event request between mounted consumers and newly opened consumers', async () => {
		const pending = createDeferred()
		fetchEvents.mockReturnValueOnce(pending.promise)
		const first = renderHook(() => useCalendarConnection())
		const second = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		await act(async () => pending.resolve([event('shared')]))
		await waitFor(() => {
			expect(first.result.current.events[0]?.id).toBe('shared')
			expect(second.result.current.events[0]?.id).toBe('shared')
		})
		const third = renderHook(() => useCalendarConnection())
		await waitFor(() =>
			expect(third.result.current.events[0]?.id).toBe('shared'),
		)
		expect(fetchEvents).toHaveBeenCalledOnce()
	})

	it('saves rotated credentials before event loading and refreshes them only once', async () => {
		seedAccount({ expiresAt: Date.now() - 1000 })
		const tokens = refreshedTokens()
		refreshTokens.mockResolvedValue(tokens)
		const pending = createDeferred()
		fetchEvents.mockImplementationOnce(() => {
			expect(readStoredCalendarAccounts()[0]).toMatchObject(tokens)
			return pending.promise
		})
		const first = renderHook(() => useCalendarConnection())
		const second = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		await act(async () => pending.resolve([event('rotated')]))
		await waitFor(() => {
			expect(first.result.current.events[0]?.id).toBe('rotated')
			expect(second.result.current.events[0]?.id).toBe('rotated')
		})
		expect(refreshTokens).toHaveBeenCalledOnce()
	})

	it('propagates a manual refresh to a consumer that already has events', async () => {
		fetchEvents.mockResolvedValueOnce([event('initial')])
		const first = renderHook(() => useCalendarConnection())
		const second = renderHook(() => useCalendarConnection())
		await waitFor(() =>
			expect(second.result.current.events[0]?.id).toBe('initial'),
		)
		fetchEvents.mockResolvedValueOnce([event('updated')])
		act(() => first.result.current.retryEvents())
		await waitFor(() => {
			expect(first.result.current.events[0]?.id).toBe('updated')
			expect(second.result.current.events[0]?.id).toBe('updated')
		})
		expect(fetchEvents).toHaveBeenCalledTimes(2)
	})

	it('takes over an abandoned fetch without publishing its late result', async () => {
		const abandoned = createDeferred()
		const replacement = createDeferred()
		fetchEvents
			.mockReturnValueOnce(abandoned.promise)
			.mockReturnValueOnce(replacement.promise)
		const first = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		const second = renderHook(() => useCalendarConnection())
		first.unmount()
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledTimes(2))
		await act(async () => replacement.resolve([event('replacement')]))
		await waitFor(() =>
			expect(second.result.current.events[0]?.id).toBe('replacement'),
		)
		await act(async () => abandoned.resolve([event('abandoned')]))
		expect(second.result.current.events[0]?.id).toBe('replacement')
	})

	it('releases a hidden tab request and refreshes immediately when visible again', async () => {
		const abandoned = createDeferred()
		const resumed = createDeferred()
		fetchEvents
			.mockReturnValueOnce(abandoned.promise)
			.mockReturnValueOnce(resumed.promise)
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		const visibility = vi.spyOn(document, 'visibilityState', 'get')
		visibility.mockReturnValue('hidden')
		await act(async () => document.dispatchEvent(new Event('visibilitychange')))
		expect(result.current.eventsStatus).not.toBe(AsyncStatus.Error)
		visibility.mockReturnValue('visible')
		act(() => document.dispatchEvent(new Event('visibilitychange')))
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledTimes(2))
		await act(async () => resumed.resolve([event('visible')]))
		await waitFor(() => expect(result.current.events[0]?.id).toBe('visible'))
		await act(async () => abandoned.resolve([event('hidden')]))
		expect(result.current.events[0]?.id).toBe('visible')
	})

	it('merges concurrent account rotations, category edits, and external additions under the mutation lock', async () => {
		const firstAccount = createAccount({ expiresAt: Date.now() - 1000 })
		const secondAccount = createAccount({
			accountId: 'account-b',
			expiresAt: Date.now() - 1000,
		})
		writeStoredCalendarAccounts([firstAccount, secondAccount])
		const mutations = deferAccountMutations()
		refreshTokens.mockImplementation(
			async ({ previousTokens }: { previousTokens: ProviderTokens }) => ({
				...previousTokens,
				accessToken: `renewed-${previousTokens.accountId}`,
				expiresAt: Date.now() + 3600000,
				refreshToken: `rotated-${previousTokens.accountId}`,
			}),
		)
		fetchEvents.mockResolvedValue([])
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(mutations.pending).toHaveLength(2))
		const addedAccount = createAccount({ accountId: 'account-c' })
		writeStoredCalendarAccounts([firstAccount, secondAccount, addedAccount])
		act(() =>
			result.current.setAccountCategory(
				'account-a',
				CalendarAccountCategory.Work,
			),
		)
		expect(mutations.pending).toHaveLength(3)
		await act(async () => mutations.grantAll())
		await waitFor(() =>
			expect(result.current.eventsStatus).toBe(AsyncStatus.Success),
		)
		expect(readStoredCalendarAccounts()).toEqual([
			expect.objectContaining({
				accessToken: 'renewed-account-a',
				accountId: 'account-a',
				category: CalendarAccountCategory.Work,
				refreshToken: 'rotated-account-a',
			}),
			expect.objectContaining({
				accessToken: 'renewed-account-b',
				accountId: 'account-b',
				refreshToken: 'rotated-account-b',
			}),
			addedAccount,
		])
	})

	it('cancels queued credential persistence when the account is disconnected', async () => {
		seedAccount({ expiresAt: Date.now() - 1000 })
		const mutations = deferAccountMutations()
		refreshTokens.mockResolvedValue(refreshedTokens())
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(mutations.pending).toHaveLength(1))
		act(() => result.current.disconnect('account-a'))
		expect(mutations.pending).toHaveLength(2)
		await act(async () => mutations.grantAll())
		await waitFor(() => expect(result.current.accounts).toEqual([]))
		expect(readStoredCalendarAccounts()).toEqual([])
		expect(fetchEvents).not.toHaveBeenCalled()
	})

	it('merges a newly connected account with additions made before its mutation lock is acquired', async () => {
		writeStoredCalendarAccounts([])
		configureExtensionAuth()
		const mutations = deferAccountMutations()
		exchangeTokens.mockResolvedValue(refreshedTokens())
		fetchEvents.mockResolvedValue([])
		const { result } = renderHook(() => useCalendarConnection())
		let connecting: Promise<void> | undefined
		act(() => {
			connecting = result.current.connect(CalendarProvider.Microsoft)
		})
		await waitFor(() => expect(mutations.pending).toHaveLength(1))
		const addedAccount = createAccount({ accountId: 'account-b' })
		writeStoredCalendarAccounts([addedAccount])
		await act(async () => {
			mutations.grantAll()
			await connecting
		})
		expect(readStoredCalendarAccounts()).toEqual([
			addedAccount,
			expect.objectContaining({
				accessToken: 'fresh-access-token',
				accountId: 'account-a',
				sessionId: expect.any(String),
			}),
		])
	})

	it.each(['here', 'elsewhere'])(
		'does not restore an account disconnected %s during reconnection',
		async (location) => {
			seedAccount({ provider: CalendarProvider.Microsoft })
			configureExtensionAuth()
			let resolveTokens!: (tokens: ProviderTokens) => void
			exchangeTokens.mockReturnValue(
				new Promise<ProviderTokens>((resolve) => {
					resolveTokens = resolve
				}),
			)
			fetchEvents.mockResolvedValue([])
			const { result } = renderHook(() => useCalendarConnection())
			let connecting: Promise<void> | undefined
			act(() => {
				connecting = result.current.connect(CalendarProvider.Microsoft)
			})
			await waitFor(() => expect(exchangeTokens).toHaveBeenCalledOnce())
			await act(async () => {
				if (location === 'here') result.current.disconnect('account-a')
				else {
					writeStoredCalendarAccounts([])
					notifyStorageChange()
				}
			})
			await act(async () => {
				resolveTokens(refreshedTokens())
				await connecting
			})
			expect(readStoredCalendarAccounts()).toEqual([])
			expect(result.current.accounts).toEqual([])
			expect(result.current.error).toBeNull()
		},
	)

	it('does not retain credentials in the shared event cache', async () => {
		fetchEvents.mockResolvedValueOnce([event('cached')])
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(result.current.events[0]?.id).toBe('cached'))
		const cacheValues = Array.from(
			{ length: localStorage.length },
			(_, index) => localStorage.key(index),
		)
			.filter((key) => key !== null && key !== CALENDAR_CONNECTION_STORAGE_KEY)
			.map((key) => (key === null ? null : localStorage.getItem(key)))
		expect(cacheValues.join('')).toContain('cached')
		expect(cacheValues.join('')).not.toContain('test-token')
		expect(cacheValues.join('')).not.toContain('refresh-token')
	})

	it('invalidates shared events on disconnect and rejects a pending response', async () => {
		fetchEvents.mockResolvedValueOnce([event('initial')])
		const first = renderHook(() => useCalendarConnection())
		const second = renderHook(() => useCalendarConnection())
		await waitFor(() =>
			expect(second.result.current.events[0]?.id).toBe('initial'),
		)
		const pending = createDeferred()
		fetchEvents.mockReturnValueOnce(pending.promise)
		act(() => first.result.current.retryEvents())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledTimes(2))
		act(() => second.result.current.disconnect('account-a'))
		act(() => notifyStorageChange())
		await act(async () => pending.resolve([event('removed')]))
		expect(first.result.current.events).toEqual([])
		expect(second.result.current.events).toEqual([])
		expect(readStoredCalendarAccounts()).toEqual([])
	})

	it('rejects a previous connection cache even when the new connection has the same expiry', async () => {
		seedAccount({ sessionId: 'old-session' })
		fetchEvents
			.mockResolvedValueOnce([event('old')])
			.mockResolvedValueOnce([event('new')])
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(result.current.events[0]?.id).toBe('old'))
		writeStoredCalendarAccounts([
			{ ...readStoredCalendarAccounts()[0], sessionId: 'new-session' },
		])
		act(() => notifyStorageChange())
		await waitFor(() => expect(result.current.events[0]?.id).toBe('new'))
		expect(fetchEvents).toHaveBeenCalledTimes(2)
	})
})

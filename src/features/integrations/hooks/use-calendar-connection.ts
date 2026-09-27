import type { Dispatch, RefObject, SetStateAction } from 'react'

import {
	useEffect,
	useEffectEvent,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react'

import type { ProviderTokens } from '../lib/provider-tokens'
import type { CalendarEventsUpdate } from '../lib/shared-calendar-events'
import type { CalendarEvent } from '../model/calendar-event'

import { AsyncStatus } from '../../../shared/hooks/async-status'
import {
	invalidateSharedResource,
	readSharedResource,
	requestSharedResource,
	runWithSharedLock,
} from '../../../shared/lib/shared-resource'
import {
	getCurrentTimestamp,
	getSystemTimeZone,
} from '../../../shared/lib/time'
import {
	getAuthRedirectUri,
	hasExtensionAuthSupport,
	launchExtensionAuthFlow,
} from '../lib/auth-environment'
import { CalendarReauthRequiredError } from '../lib/calendar-reauth-error'
import {
	CALENDAR_CONNECTION_STORAGE_KEY,
	clearPendingWebAuth,
	readPendingWebAuth,
	readStoredCalendarAccounts,
	type StoredCalendarAccount,
	writePendingWebAuth,
	writeStoredCalendarAccounts,
} from '../lib/connection-storage'
import {
	buildGoogleAuthorizeUrl,
	exchangeGoogleAuthorizationCode,
	isGoogleAuthConfigured,
	refreshGoogleTokens,
} from '../lib/google-auth'
import { fetchUpcomingGoogleCalendarEvents } from '../lib/google-calendar'
import {
	buildMicrosoftAuthorizeUrl,
	exchangeMicrosoftAuthorizationCode,
	isMicrosoftAuthConfigured,
	refreshMicrosoftTokens,
} from '../lib/microsoft-auth'
import { fetchUpcomingCalendarEvents } from '../lib/microsoft-calendar'
import { parseAuthCallbackCode } from '../lib/oauth-callback'
import { createPkcePair, createRandomState } from '../lib/pkce'
import {
	createCalendarEventsStore,
	getAccountEventsKey,
	getCalendarEventsIdentity,
	isAccountEventsCurrent,
	sharedAccountEventsSchema,
} from '../lib/shared-calendar-events'
import { CalendarAccountCategory } from '../model/account-category'
import {
	CALENDAR_PROVIDERS,
	CalendarProvider,
} from '../model/calendar-provider'

export enum CalendarConnectionError {
	AuthFailed = 'auth-failed',
	EventsFailed = 'events-failed',
}

export type CalendarAccountSummary = {
	accountId: string
	accountLabel: null | string
	category: CalendarAccountCategory
	isSessionExpired: boolean
	provider: CalendarProvider
}

export type CalendarConnection = {
	accounts: CalendarAccountSummary[]
	configuredProviders: CalendarProvider[]
	connect: (provider: CalendarProvider) => Promise<void>
	disconnect: (accountId: string) => void
	error: CalendarConnectionError | null
	events: CalendarEvent[]
	eventsStatus: AsyncStatus
	isConnecting: boolean
	retryEvents: () => void
	setAccountCategory: (
		accountId: string,
		category: CalendarAccountCategory,
	) => void
}

export const useCalendarConnection = (): CalendarConnection => {
	const [accounts, setAccounts] = useState<StoredCalendarAccount[]>(
		readStoredCalendarAccounts,
	)
	const [isConnecting, setIsConnecting] = useState(false)
	const [error, setError] = useState<CalendarConnectionError | null>(null)
	const [eventsStatus, setEventsStatus] = useState(AsyncStatus.Idle)
	const accountsRef = useRef(accounts)
	const storedAccountsRef = useRef(accounts)
	const lastEventsFetchAtRef = useRef(0)
	const hasHydratedRef = useRef(false)
	const requestsRef = useRef({
		controller: null as AbortController | null,
		generation: 0,
		isMounted: true,
	})

	useEffect(() => {
		const requests = requestsRef.current
		requests.isMounted = true
		const connectionState = {
			accountsRef,
			lastEventsFetchAtRef,
			requestsRef,
			setAccounts,
			setError,
			setEventsStatus,
			setIsConnecting,
			storedAccountsRef,
		}
		const handleStorage = (event: StorageEvent) => {
			if (
				event.storageArea !== localStorage ||
				(event.key !== null && event.key !== CALENDAR_CONNECTION_STORAGE_KEY)
			) {
				return
			}

			const previousAccounts = accountsRef.current
			const currentAccounts = synchronizeAccounts(connectionState)
			if (!hasSameAccountSessions(previousAccounts, currentAccounts)) {
				void loadEvents(connectionState)
			}
		}
		window.addEventListener('storage', handleStorage)
		if (accountsRef.current.length > 0) {
			void loadEvents(connectionState)
		}

		if (!hasHydratedRef.current) {
			hasHydratedRef.current = true
			void completePendingWebAuth(connectionState)
		}
		return () => {
			window.removeEventListener('storage', handleStorage)
			requests.isMounted = false
			requests.generation += 1
			requests.controller?.abort()
		}
	}, [])

	// Long-lived tabs would otherwise keep showing the events fetched at
	// mount. Stale data is refreshed once it ages past the refresh interval,
	// checked periodically and whenever the tab becomes visible again.
	useEffect(() => {
		const connectionState = {
			accountsRef,
			lastEventsFetchAtRef,
			requestsRef,
			setAccounts,
			setError,
			setEventsStatus,
			setIsConnecting,
			storedAccountsRef,
		}
		const refreshEventsIfStale = () => {
			const isStale =
				getCurrentTimestamp() - lastEventsFetchAtRef.current >
				EVENTS_REFRESH_INTERVAL_MS
			if (
				document.visibilityState === 'visible' &&
				isStale &&
				accountsRef.current.length > 0
			) {
				void loadEvents(connectionState)
			}
		}

		const staleCheckInterval = setInterval(
			refreshEventsIfStale,
			EVENTS_STALE_CHECK_INTERVAL_MS,
		)
		document.addEventListener('visibilitychange', refreshEventsIfStale)
		document.addEventListener('resume', refreshEventsIfStale)
		window.addEventListener('pageshow', refreshEventsIfStale)

		return () => {
			clearInterval(staleCheckInterval)
			document.removeEventListener('visibilitychange', refreshEventsIfStale)
			document.removeEventListener('resume', refreshEventsIfStale)
			window.removeEventListener('pageshow', refreshEventsIfStale)
		}
	}, [])

	const connectionState: ConnectionState = {
		accountsRef,
		lastEventsFetchAtRef,
		requestsRef,
		setAccounts,
		setError,
		setEventsStatus,
		setIsConnecting,
		storedAccountsRef,
	}
	const handleSharedEventsUpdate = useEffectEvent(
		({ account, snapshot }: Readonly<CalendarEventsUpdate>) => {
			const current = synchronizeAccounts(connectionState).find(
				(candidate) =>
					candidate.accountId === account.accountId &&
					candidate.provider === account.provider,
			)
			if (
				!current ||
				!isAccountEventsCurrent({ account: current, result: snapshot.value }) ||
				getCurrentTimestamp() - snapshot.updatedAt > EVENTS_REFRESH_INTERVAL_MS
			)
				return
			lastEventsFetchAtRef.current = snapshot.updatedAt
			setEventsStatus(AsyncStatus.Success)
			setError(null)
		},
	)
	const timeZone = getSystemTimeZone()
	const [eventsStore, setEventsStore] = useState(() =>
		createCalendarEventsStore({
			accounts,
			timeZone,
		}),
	)
	if (
		eventsStore.identity !== getCalendarEventsIdentity({ accounts, timeZone })
	) {
		setEventsStore(
			createCalendarEventsStore({
				accounts,
				timeZone,
			}),
		)
	}
	const { events } = useSyncExternalStore(
		eventsStore.subscribe,
		eventsStore.getSnapshot,
		eventsStore.getServerSnapshot,
	)

	useEffect(
		() =>
			eventsStore.subscribeToUpdates((update) =>
				handleSharedEventsUpdate(update),
			),
		[eventsStore],
	)

	const connect = async (provider: CalendarProvider) => {
		if (isConnecting) {
			return
		}

		await startConnect(connectionState, provider)
	}

	const disconnect = (accountId: string) => {
		const removedAccounts = synchronizeAccounts(connectionState).filter(
			(account) => account.accountId === accountId,
		)
		for (const account of removedAccounts) {
			invalidateSharedResource({
				key: getAccountEventsKey({
					account,
					timeZone: getSystemTimeZone(),
				}),
			})
		}
		setError(null)
		void applyAccounts(connectionState, (currentAccounts) =>
			currentAccounts.filter((account) => account.accountId !== accountId),
		)
			.then((currentAccounts) => {
				if (currentAccounts.length === 0) setEventsStatus(AsyncStatus.Idle)
			})
			.catch((caughtError: unknown) => {
				console.error('Calendar disconnect error:', caughtError)
				setError(CalendarConnectionError.EventsFailed)
			})
	}

	const setAccountCategory = (
		accountId: string,
		category: CalendarAccountCategory,
	) => {
		void applyAccounts(connectionState, (currentAccounts) =>
			currentAccounts.map((account) =>
				account.accountId === accountId ? { ...account, category } : account,
			),
		).catch((caughtError: unknown) => {
			console.error('Calendar category update error:', caughtError)
			setError(CalendarConnectionError.EventsFailed)
		})
	}

	const retryEvents = () => {
		void loadEvents(connectionState, { shouldForceRefresh: true })
	}

	return {
		accounts: accounts.map(
			({ accountId, accountLabel, category, isSessionExpired, provider }) => ({
				accountId,
				accountLabel,
				category,
				isSessionExpired,
				provider,
			}),
		),
		configuredProviders: CALENDAR_PROVIDERS.filter((provider) =>
			CALENDAR_PROVIDER_ADAPTERS[provider].isConfigured(),
		),
		connect,
		disconnect,
		error,
		events,
		eventsStatus,
		isConnecting,
		retryEvents,
		setAccountCategory,
	}
}

const TOKEN_EXPIRY_SKEW_MS = 60_000
const EVENTS_REFRESH_INTERVAL_MS = 10 * 60_000
const EVENTS_STALE_CHECK_INTERVAL_MS = 60_000

type AccountLoadResult = {
	account: StoredCalendarAccount
	status: 'error' | 'obsolete' | 'paused' | 'reauth' | 'success'
}

type CalendarProviderAdapter = {
	buildAuthorizeUrl: (params: {
		codeChallenge: string
		redirectUri: string
		state: string
	}) => string
	exchangeAuthorizationCode: (params: {
		code: string
		codeVerifier: string
		redirectUri: string
	}) => Promise<ProviderTokens>
	fetchUpcomingEvents: (params: {
		accessToken: string
		accountId: string
		signal?: AbortSignal
		timeZone: string
	}) => Promise<CalendarEvent[]>
	isConfigured: () => boolean
	refreshTokens: (params: {
		previousTokens: ProviderTokens
		signal?: AbortSignal
	}) => Promise<ProviderTokens>
}

const CALENDAR_PROVIDER_ADAPTERS: Record<
	CalendarProvider,
	CalendarProviderAdapter
> = {
	[CalendarProvider.Google]: {
		buildAuthorizeUrl: buildGoogleAuthorizeUrl,
		exchangeAuthorizationCode: exchangeGoogleAuthorizationCode,
		fetchUpcomingEvents: fetchUpcomingGoogleCalendarEvents,
		isConfigured: isGoogleAuthConfigured,
		refreshTokens: refreshGoogleTokens,
	},
	[CalendarProvider.Microsoft]: {
		buildAuthorizeUrl: buildMicrosoftAuthorizeUrl,
		exchangeAuthorizationCode: exchangeMicrosoftAuthorizationCode,
		fetchUpcomingEvents: fetchUpcomingCalendarEvents,
		isConfigured: isMicrosoftAuthConfigured,
		refreshTokens: refreshMicrosoftTokens,
	},
}

type ConnectionState = {
	accountsRef: RefObject<StoredCalendarAccount[]>
	lastEventsFetchAtRef: RefObject<number>
	requestsRef: RefObject<{
		controller: AbortController | null
		generation: number
		isMounted: boolean
	}>
	setAccounts: Dispatch<SetStateAction<StoredCalendarAccount[]>>
	setError: Dispatch<SetStateAction<CalendarConnectionError | null>>
	setEventsStatus: Dispatch<SetStateAction<AsyncStatus>>
	setIsConnecting: Dispatch<SetStateAction<boolean>>
	storedAccountsRef: RefObject<StoredCalendarAccount[]>
}

// All accounts share one stored document, including credentials refreshed
// independently, so its latest read, merge, and write use one short lock.
const applyAccounts = (
	connectionState: ConnectionState,
	updateAccounts: (
		accounts: StoredCalendarAccount[],
	) => StoredCalendarAccount[],
	signal?: AbortSignal,
) =>
	runWithSharedLock({
		key: CALENDAR_CONNECTION_STORAGE_KEY,
		signal,
		work: () => {
			signal?.throwIfAborted()
			const nextAccounts = updateAccounts(synchronizeAccounts(connectionState))
			connectionState.accountsRef.current = nextAccounts
			connectionState.setAccounts(nextAccounts)
			if (
				!hasSameAccounts(
					nextAccounts,
					connectionState.storedAccountsRef.current,
				) &&
				writeStoredCalendarAccounts(nextAccounts)
			) {
				connectionState.storedAccountsRef.current = nextAccounts
			}
			return nextAccounts
		},
	})

const synchronizeAccounts = (connectionState: ConnectionState) => {
	const storedAccounts = readStoredCalendarAccounts({
		fallbackAccounts: connectionState.storedAccountsRef.current,
	})
	// Unchanged storage must not discard an in-memory connection when saving
	// is unavailable, while changes from another tab remain authoritative.
	if (
		!hasSameAccounts(storedAccounts, connectionState.storedAccountsRef.current)
	) {
		const previousAccounts = connectionState.accountsRef.current
		connectionState.storedAccountsRef.current = storedAccounts
		connectionState.accountsRef.current = storedAccounts
		connectionState.setAccounts(storedAccounts)
		if (storedAccounts.every((account) => account.isSessionExpired)) {
			connectionState.setEventsStatus(AsyncStatus.Idle)
		}
		for (const previous of previousAccounts) {
			if (
				!storedAccounts.some(
					(account) =>
						account.accountId === previous.accountId &&
						account.provider === previous.provider,
				)
			) {
				invalidateSharedResource({
					key: getAccountEventsKey({
						account: previous,
						timeZone: getSystemTimeZone(),
					}),
				})
			}
		}
	}
	return connectionState.accountsRef.current
}

const hasSameAccountCredentials = (
	account: StoredCalendarAccount,
	other: StoredCalendarAccount,
) =>
	account.accountId === other.accountId &&
	account.provider === other.provider &&
	account.accessToken === other.accessToken &&
	account.refreshToken === other.refreshToken &&
	account.expiresAt === other.expiresAt &&
	account.isSessionExpired === other.isSessionExpired &&
	account.sessionId === other.sessionId

const hasSameAccountSessions = (
	accounts: StoredCalendarAccount[],
	otherAccounts: StoredCalendarAccount[],
) =>
	accounts.length === otherAccounts.length &&
	accounts.every((account, index) =>
		hasSameAccountCredentials(account, otherAccounts[index]),
	)

const hasSameAccounts = (
	accounts: StoredCalendarAccount[],
	otherAccounts: StoredCalendarAccount[],
) =>
	hasSameAccountSessions(accounts, otherAccounts) &&
	accounts.every(
		(account, index) =>
			account.accountLabel === otherAccounts[index].accountLabel &&
			account.category === otherAccounts[index].category,
	)

const loadEvents = async (
	connectionState: ConnectionState,
	{
		shouldForceRefresh = false,
	}: Readonly<{ shouldForceRefresh?: boolean }> = {},
) => {
	const requests = connectionState.requestsRef.current
	if (!requests.isMounted) return
	const generation = ++requests.generation
	requests.controller?.abort()
	const controller = new AbortController()
	requests.controller = controller
	const activeAccounts = synchronizeAccounts(connectionState).filter(
		(account) => !account.isSessionExpired,
	)
	if (activeAccounts.length === 0) {
		connectionState.setEventsStatus(AsyncStatus.Idle)
		return
	}

	connectionState.lastEventsFetchAtRef.current = getCurrentTimestamp()
	connectionState.setEventsStatus(AsyncStatus.Loading)
	const timeZone = getSystemTimeZone()
	const results = await Promise.all(
		activeAccounts.map((account) =>
			loadAccountEvents({
				account,
				connectionState,
				shouldForceRefresh,
				signal: controller.signal,
				timeZone,
			}),
		),
	)

	if (!requests.isMounted || requests.generation !== generation) return
	if (controller.signal.aborted) return
	const currentAccounts = synchronizeAccounts(connectionState)
	const acceptedResults = results.filter((result) => {
		const current = currentAccounts.find(
			(account) =>
				account.accountId === result.account.accountId &&
				account.provider === result.account.provider,
		)
		return (
			result.status !== 'obsolete' &&
			result.status !== 'paused' &&
			current &&
			hasSameAccountCredentials(current, result.account)
		)
	})
	const resultsByAccountId = new Map(
		acceptedResults.map((result) => [result.account.accountId, result]),
	)
	const shouldReloadAccounts = currentAccounts.some(
		(account) =>
			!account.isSessionExpired &&
			!resultsByAccountId.has(account.accountId) &&
			!results.some(
				(result) =>
					result.account.accountId === account.accountId &&
					result.status === 'paused',
			),
	)

	const hasSuccess = acceptedResults.some(
		(result) => result.status === 'success',
	)
	const hasError = acceptedResults.some((result) => result.status === 'error')
	if (hasSuccess) {
		const freshness = acceptedResults.flatMap((result) => {
			if (result.status !== 'success') return []
			const cached = readSharedResource({
				key: getAccountEventsKey({ account: result.account, timeZone }),
				schema: sharedAccountEventsSchema,
			})
			return cached ? [cached.updatedAt] : []
		})
		if (freshness.length > 0)
			connectionState.lastEventsFetchAtRef.current = Math.min(...freshness)
		connectionState.setEventsStatus(AsyncStatus.Success)
		connectionState.setError(
			hasError ? CalendarConnectionError.EventsFailed : null,
		)
	} else if (hasError) {
		connectionState.setEventsStatus(AsyncStatus.Error)
		connectionState.setError(CalendarConnectionError.EventsFailed)
	} else {
		// Every remaining account needs to be reconnected; the per-account
		// session-expired state covers the messaging.
		connectionState.setEventsStatus(AsyncStatus.Idle)
	}
	if (results.some((result) => result.status === 'paused')) {
		connectionState.lastEventsFetchAtRef.current = 0
	}
	if (shouldReloadAccounts) {
		void loadEvents(connectionState)
	}
}

const loadAccountEvents = async ({
	account,
	connectionState,
	shouldForceRefresh,
	signal,
	timeZone,
}: Readonly<{
	account: StoredCalendarAccount
	connectionState: ConnectionState
	shouldForceRefresh: boolean
	signal: AbortSignal
	timeZone: string
}>): Promise<AccountLoadResult> => {
	let freshAccount = account
	try {
		const result = await requestSharedResource({
			fetcher: async ({ signal: requestSignal }) => {
				const latestAccount = synchronizeAccounts(connectionState).find(
					(candidate) =>
						candidate.accountId === account.accountId &&
						candidate.provider === account.provider,
				)
				if (!latestAccount) throw new CalendarAccountChangedError()
				freshAccount = latestAccount
				try {
					if (freshAccount.isSessionExpired)
						throw new CalendarReauthRequiredError()
					const adapter = CALENDAR_PROVIDER_ADAPTERS[account.provider]
					freshAccount = await ensureFreshAccount({
						account: freshAccount,
						connectionState,
						signal: requestSignal,
					})
					let events: CalendarEvent[]
					try {
						events = await adapter.fetchUpcomingEvents({
							accessToken: freshAccount.accessToken,
							accountId: freshAccount.accountId,
							signal: requestSignal,
							timeZone,
						})
					} catch (caughtError) {
						if (
							!(caughtError instanceof CalendarReauthRequiredError) ||
							requestSignal.aborted
						) {
							throw caughtError
						}
						freshAccount = await ensureFreshAccount({
							account: freshAccount,
							connectionState,
							shouldForceRefresh: true,
							signal: requestSignal,
						})
						events = await adapter.fetchUpcomingEvents({
							accessToken: freshAccount.accessToken,
							accountId: freshAccount.accountId,
							signal: requestSignal,
							timeZone,
						})
					}
					requestSignal.throwIfAborted()
					requireCurrentAccount({ account: freshAccount, connectionState })
					return {
						events,
						expiresAt: freshAccount.expiresAt,
						sessionId: freshAccount.sessionId ?? null,
					}
				} catch (caughtError) {
					requestSignal.throwIfAborted()
					requireCurrentAccount({ account: freshAccount, connectionState })
					if (caughtError instanceof CalendarReauthRequiredError) {
						freshAccount = await persistAccountIfCurrent({
							account: freshAccount,
							connectionState,
							signal: requestSignal,
							updatedAccount: { ...freshAccount, isSessionExpired: true },
						})
					}
					throw caughtError
				}
			},
			force: shouldForceRefresh,
			isFresh: (result) => {
				const current = synchronizeAccounts(connectionState).find(
					(candidate) =>
						candidate.accountId === account.accountId &&
						candidate.provider === account.provider,
				)
				return Boolean(
					current && isAccountEventsCurrent({ account: current, result }),
				)
			},
			key: getAccountEventsKey({ account, timeZone }),
			lockKey: `calendar-account:${account.provider}:${account.accountId}`,
			maxAgeMs: EVENTS_REFRESH_INTERVAL_MS,
			schema: sharedAccountEventsSchema,
			signal,
			validate: (result) => {
				requireCurrentAccount({ account: freshAccount, connectionState })
				if (!isAccountEventsCurrent({ account: freshAccount, result })) {
					throw new Error(
						'Calendar events did not match the connected account.',
					)
				}
			},
		})
		const current = synchronizeAccounts(connectionState).find(
			(candidate) =>
				candidate.accountId === account.accountId &&
				candidate.provider === account.provider,
		)
		if (!current || !isAccountEventsCurrent({ account: current, result })) {
			throw new CalendarAccountChangedError()
		}
		return { account: current, status: 'success' }
	} catch (caughtError) {
		if (signal.aborted) return { account: freshAccount, status: 'obsolete' }
		if (caughtError instanceof CalendarAccountChangedError) {
			return { account: freshAccount, status: 'obsolete' }
		}
		if (caughtError instanceof Error && caughtError.name === 'AbortError') {
			return { account: freshAccount, status: 'paused' }
		}
		try {
			requireCurrentAccount({ account: freshAccount, connectionState })
		} catch {
			return { account: freshAccount, status: 'obsolete' }
		}
		if (caughtError instanceof CalendarReauthRequiredError) {
			return { account: freshAccount, status: 'reauth' }
		}
		console.error('Calendar events fetch error:', caughtError)
		return { account: freshAccount, status: 'error' }
	}
}

class CalendarAccountChangedError extends Error {
	// A superseded session must not delay its replacement with retry backoff.
	name = 'AbortError'
}

const requireCurrentAccount = ({
	account,
	connectionState,
}: Readonly<{
	account: StoredCalendarAccount
	connectionState: ConnectionState
}>) => {
	const current = synchronizeAccounts(connectionState).find(
		(candidate) =>
			candidate.accountId === account.accountId &&
			candidate.provider === account.provider,
	)
	if (!current || !hasSameAccountCredentials(current, account))
		throw new CalendarAccountChangedError()
	return current
}

const persistAccountIfCurrent = async ({
	account,
	connectionState,
	signal,
	updatedAccount,
}: Readonly<{
	account: StoredCalendarAccount
	connectionState: ConnectionState
	signal: AbortSignal
	updatedAccount: StoredCalendarAccount
}>) => {
	await applyAccounts(
		connectionState,
		(accounts) => {
			const current = accounts.find(
				(candidate) =>
					candidate.accountId === account.accountId &&
					candidate.provider === account.provider,
			)
			if (!current || !hasSameAccountCredentials(current, account))
				throw new CalendarAccountChangedError()
			return accounts.map((candidate) =>
				candidate === current
					? { ...updatedAccount, category: current.category }
					: candidate,
			)
		},
		signal,
	)
	return updatedAccount
}

const startConnect = async (
	connectionState: ConnectionState,
	provider: CalendarProvider,
) => {
	const adapter = CALENDAR_PROVIDER_ADAPTERS[provider]
	if (!adapter.isConfigured()) {
		return
	}

	const previousAccounts = synchronizeAccounts(connectionState)
	connectionState.setError(null)
	connectionState.setIsConnecting(true)
	try {
		const { codeChallenge, codeVerifier } = await createPkcePair()
		const state = createRandomState()
		const redirectUri = getAuthRedirectUri()
		const authorizeUrl = adapter.buildAuthorizeUrl({
			codeChallenge,
			redirectUri,
			state,
		})

		if (!hasExtensionAuthSupport()) {
			// On the web build, the page round-trips through the provider's
			// consent screen; the mount effect completes the exchange after the
			// redirect.
			writePendingWebAuth({ codeVerifier, provider, redirectUri, state })
			window.location.assign(authorizeUrl)
			return
		}

		const callbackUrl = await launchExtensionAuthFlow({ url: authorizeUrl })
		const code = parseAuthCallbackCode({
			expectedState: state,
			url: callbackUrl,
		})
		const newTokens = await adapter.exchangeAuthorizationCode({
			code,
			codeVerifier,
			redirectUri,
		})
		await addConnectedAccount(connectionState, {
			newTokens,
			previousAccounts,
			provider,
		})
		void loadEvents(connectionState)
	} catch (caughtError) {
		if (!isUserCancelledAuthError(caughtError)) {
			console.error('Calendar sign-in error:', caughtError)
			connectionState.setError(CalendarConnectionError.AuthFailed)
		}
	} finally {
		connectionState.setIsConnecting(false)
	}
}

const completePendingWebAuth = async (connectionState: ConnectionState) => {
	const pendingAuth = readPendingWebAuth()
	if (!pendingAuth || hasExtensionAuthSupport()) {
		return
	}

	clearPendingWebAuth()

	const callbackUrl = window.location.href
	const callbackParams = new URL(callbackUrl).searchParams
	if (!callbackParams.has('code') && !callbackParams.has('error')) {
		return
	}

	window.history.replaceState(null, '', window.location.pathname)

	const adapter = CALENDAR_PROVIDER_ADAPTERS[pendingAuth.provider]
	const previousAccounts = synchronizeAccounts(connectionState)
	connectionState.setIsConnecting(true)
	try {
		const code = parseAuthCallbackCode({
			expectedState: pendingAuth.state,
			url: callbackUrl,
		})
		const newTokens = await adapter.exchangeAuthorizationCode({
			code,
			codeVerifier: pendingAuth.codeVerifier,
			redirectUri: pendingAuth.redirectUri,
		})
		await addConnectedAccount(connectionState, {
			newTokens,
			previousAccounts,
			provider: pendingAuth.provider,
		})
		void loadEvents(connectionState)
	} catch (caughtError) {
		if (!isUserCancelledAuthError(caughtError)) {
			console.error('Calendar sign-in error:', caughtError)
			connectionState.setError(CalendarConnectionError.AuthFailed)
		}
	} finally {
		connectionState.setIsConnecting(false)
	}
}

// Reconnecting an already-connected account replaces its tokens and keeps its
// category; legacy entries without a real account id are matched by label
// within the same provider.
const addConnectedAccount = async (
	connectionState: ConnectionState,
	{
		newTokens,
		previousAccounts,
		provider,
	}: Readonly<{
		newTokens: ProviderTokens
		previousAccounts: StoredCalendarAccount[]
		provider: CalendarProvider
	}>,
) => {
	if (!connectionState.requestsRef.current.isMounted) return
	const accountId = newTokens.accountId ?? `account:${createRandomState()}`
	await applyAccounts(connectionState, (accounts) => {
		if (!connectionState.requestsRef.current.isMounted) {
			throw new CalendarAccountChangedError()
		}
		const existingAccount = accounts.find(
			(account) =>
				account.accountId === accountId ||
				(account.provider === provider &&
					account.accountLabel !== null &&
					account.accountLabel === newTokens.accountLabel),
		)
		const previousAccount = previousAccounts.find(
			(account) =>
				account.accountId === accountId ||
				(account.provider === provider &&
					account.accountLabel !== null &&
					account.accountLabel === newTokens.accountLabel),
		)
		if (
			previousAccount &&
			(!existingAccount ||
				previousAccount.sessionId !== existingAccount.sessionId)
		) {
			throw new CalendarAccountChangedError()
		}
		const connectedAccount: StoredCalendarAccount = {
			accessToken: newTokens.accessToken,
			accountId,
			accountLabel: newTokens.accountLabel,
			category: existingAccount?.category ?? CalendarAccountCategory.Personal,
			expiresAt: newTokens.expiresAt,
			isSessionExpired: false,
			provider,
			refreshToken: newTokens.refreshToken,
			sessionId: createRandomState(),
		}

		return existingAccount
			? accounts.map((account) =>
					account === existingAccount ? connectedAccount : account,
				)
			: [...accounts, connectedAccount]
	})
}

const ensureFreshAccount = async ({
	account,
	connectionState,
	shouldForceRefresh = false,
	signal,
}: Readonly<{
	account: StoredCalendarAccount
	connectionState: ConnectionState
	shouldForceRefresh?: boolean
	signal: AbortSignal
}>) => {
	signal.throwIfAborted()
	requireCurrentAccount({ account, connectionState })
	if (
		!shouldForceRefresh &&
		account.expiresAt - TOKEN_EXPIRY_SKEW_MS > getCurrentTimestamp()
	)
		return account

	const refreshedTokens = await CALENDAR_PROVIDER_ADAPTERS[
		account.provider
	].refreshTokens({ previousTokens: account, signal })
	signal.throwIfAborted()
	// Rotation must reach storage before event loading, while this account's
	// cross-tab lock is held, so its next owner always reads the latest token.
	return persistAccountIfCurrent({
		account,
		connectionState,
		signal,
		updatedAccount: {
			...account,
			accessToken: refreshedTokens.accessToken,
			expiresAt: refreshedTokens.expiresAt,
			refreshToken: refreshedTokens.refreshToken,
		},
	})
}

const isUserCancelledAuthError = (caughtError: unknown) =>
	caughtError instanceof CalendarAccountChangedError ||
	(caughtError instanceof Error &&
		/did not approve|cancel|access_denied/i.test(caughtError.message))

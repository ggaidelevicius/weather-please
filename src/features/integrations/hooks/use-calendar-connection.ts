import type { Dispatch, RefObject, SetStateAction } from 'react'

import { useEffect, useRef, useState } from 'react'

import type { ProviderTokens } from '../lib/provider-tokens'
import type { CalendarEvent } from '../model/calendar-event'

import { AsyncStatus } from '../../../shared/hooks/async-status'
import {
	getAuthRedirectUri,
	hasExtensionAuthSupport,
	launchExtensionAuthFlow,
} from '../lib/auth-environment'
import { CalendarReauthRequiredError } from '../lib/calendar-reauth-error'
import {
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
import { CalendarAccountCategory } from '../model/account-category'
import { mergeCalendarEvents } from '../model/calendar-event'
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
	const [events, setEvents] = useState<CalendarEvent[]>([])
	const [eventsStatus, setEventsStatus] = useState(AsyncStatus.Idle)
	const accountsRef = useRef(accounts)
	const lastEventsFetchAtRef = useRef(0)
	const hasHydratedRef = useRef(false)

	useEffect(() => {
		if (hasHydratedRef.current) {
			return
		}
		hasHydratedRef.current = true

		const connectionState = {
			accountsRef,
			lastEventsFetchAtRef,
			setAccounts,
			setError,
			setEvents,
			setEventsStatus,
			setIsConnecting,
		}
		if (accountsRef.current.length > 0) {
			void loadEvents(connectionState)
		}

		void completePendingWebAuth(connectionState)
	}, [])

	// Long-lived tabs would otherwise keep showing the events fetched at
	// mount. Stale data is refreshed once it ages past the refresh interval,
	// checked periodically and whenever the tab becomes visible again.
	useEffect(() => {
		const connectionState = {
			accountsRef,
			lastEventsFetchAtRef,
			setAccounts,
			setError,
			setEvents,
			setEventsStatus,
			setIsConnecting,
		}
		const refreshEventsIfStale = () => {
			const isStale =
				Date.now() - lastEventsFetchAtRef.current > EVENTS_REFRESH_INTERVAL_MS
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

		return () => {
			clearInterval(staleCheckInterval)
			document.removeEventListener('visibilitychange', refreshEventsIfStale)
		}
	}, [])

	const connectionState: ConnectionState = {
		accountsRef,
		lastEventsFetchAtRef,
		setAccounts,
		setError,
		setEvents,
		setEventsStatus,
		setIsConnecting,
	}

	const connect = async (provider: CalendarProvider) => {
		if (isConnecting) {
			return
		}

		await startConnect(connectionState, provider)
	}

	const disconnect = (accountId: string) => {
		applyAccounts(
			connectionState,
			accountsRef.current.filter((account) => account.accountId !== accountId),
		)
		setEvents((currentEvents) =>
			currentEvents.filter((event) => event.accountId !== accountId),
		)
		setError(null)
		if (accountsRef.current.length === 0) {
			setEventsStatus(AsyncStatus.Idle)
		}
	}

	const setAccountCategory = (
		accountId: string,
		category: CalendarAccountCategory,
	) => {
		applyAccounts(
			connectionState,
			accountsRef.current.map((account) =>
				account.accountId === accountId ? { ...account, category } : account,
			),
		)
	}

	const retryEvents = () => {
		void loadEvents(connectionState)
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
	events: CalendarEvent[]
	status: 'error' | 'reauth' | 'success'
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
		timeZone: string
	}) => Promise<CalendarEvent[]>
	isConfigured: () => boolean
	refreshTokens: (params: {
		previousTokens: ProviderTokens
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
	setAccounts: Dispatch<SetStateAction<StoredCalendarAccount[]>>
	setError: Dispatch<SetStateAction<CalendarConnectionError | null>>
	setEvents: Dispatch<SetStateAction<CalendarEvent[]>>
	setEventsStatus: Dispatch<SetStateAction<AsyncStatus>>
	setIsConnecting: Dispatch<SetStateAction<boolean>>
}

const applyAccounts = (
	connectionState: ConnectionState,
	nextAccounts: StoredCalendarAccount[],
) => {
	connectionState.accountsRef.current = nextAccounts
	connectionState.setAccounts(nextAccounts)
	writeStoredCalendarAccounts(nextAccounts)
}

const loadEvents = async (connectionState: ConnectionState) => {
	const activeAccounts = connectionState.accountsRef.current.filter(
		(account) => !account.isSessionExpired,
	)
	if (activeAccounts.length === 0) {
		connectionState.setEvents([])
		connectionState.setEventsStatus(AsyncStatus.Idle)
		return
	}

	connectionState.lastEventsFetchAtRef.current = Date.now()
	connectionState.setEventsStatus(AsyncStatus.Loading)
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
	const results = await Promise.all(
		activeAccounts.map((account) => loadAccountEvents({ account, timeZone })),
	)

	// Accounts may have been added or removed while the fetches were in
	// flight; merge results back into the current list instead of replacing.
	const resultsByAccountId = new Map(
		results.map((result) => [result.account.accountId, result]),
	)
	applyAccounts(
		connectionState,
		connectionState.accountsRef.current.map(
			(account) =>
				resultsByAccountId.get(account.accountId)?.account ?? account,
		),
	)
	connectionState.setEvents(
		mergeCalendarEvents(results.map((result) => result.events)),
	)

	const hasSuccess = results.some((result) => result.status === 'success')
	const hasError = results.some((result) => result.status === 'error')
	if (hasSuccess) {
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
}

const loadAccountEvents = async ({
	account,
	timeZone,
}: Readonly<{
	account: StoredCalendarAccount
	timeZone: string
}>): Promise<AccountLoadResult> => {
	const adapter = CALENDAR_PROVIDER_ADAPTERS[account.provider]

	try {
		const freshAccount = await ensureFreshAccount(account)
		const events = await adapter.fetchUpcomingEvents({
			accessToken: freshAccount.accessToken,
			accountId: freshAccount.accountId,
			timeZone,
		})

		return { account: freshAccount, events, status: 'success' }
	} catch (caughtError) {
		if (caughtError instanceof CalendarReauthRequiredError) {
			return {
				account: { ...account, isSessionExpired: true },
				events: [],
				status: 'reauth',
			}
		}

		console.error('Calendar events fetch error:', caughtError)
		return { account, events: [], status: 'error' }
	}
}

const startConnect = async (
	connectionState: ConnectionState,
	provider: CalendarProvider,
) => {
	const adapter = CALENDAR_PROVIDER_ADAPTERS[provider]
	if (!adapter.isConfigured()) {
		return
	}

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
		addConnectedAccount(connectionState, { newTokens, provider })
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
		addConnectedAccount(connectionState, {
			newTokens,
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
const addConnectedAccount = (
	connectionState: ConnectionState,
	{
		newTokens,
		provider,
	}: Readonly<{ newTokens: ProviderTokens; provider: CalendarProvider }>,
) => {
	const accounts = connectionState.accountsRef.current
	const accountId = newTokens.accountId ?? `account:${createRandomState()}`
	const existingAccount = accounts.find(
		(account) =>
			account.accountId === accountId ||
			(account.provider === provider &&
				account.accountLabel !== null &&
				account.accountLabel === newTokens.accountLabel),
	)
	const connectedAccount: StoredCalendarAccount = {
		accessToken: newTokens.accessToken,
		accountId,
		accountLabel: newTokens.accountLabel,
		category: existingAccount?.category ?? CalendarAccountCategory.Personal,
		expiresAt: newTokens.expiresAt,
		isSessionExpired: false,
		provider,
		refreshToken: newTokens.refreshToken,
	}

	applyAccounts(
		connectionState,
		existingAccount
			? accounts.map((account) =>
					account === existingAccount ? connectedAccount : account,
				)
			: [...accounts, connectedAccount],
	)
}

const ensureFreshAccount = async (account: StoredCalendarAccount) => {
	if (account.expiresAt - TOKEN_EXPIRY_SKEW_MS > Date.now()) {
		return account
	}

	const refreshedTokens = await CALENDAR_PROVIDER_ADAPTERS[
		account.provider
	].refreshTokens({ previousTokens: account })

	return {
		...account,
		accessToken: refreshedTokens.accessToken,
		expiresAt: refreshedTokens.expiresAt,
		refreshToken: refreshedTokens.refreshToken,
	}
}

const isUserCancelledAuthError = (caughtError: unknown) =>
	caughtError instanceof Error &&
	/did not approve|cancel|access_denied/i.test(caughtError.message)

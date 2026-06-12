import type { Dispatch, RefObject, SetStateAction } from 'react'

import { useEffect, useRef, useState } from 'react'

import type { MicrosoftTokens } from '../lib/microsoft-auth'
import type { CalendarEvent } from '../model/calendar-event'

import { AsyncStatus } from '../../../shared/hooks/async-status'
import {
	getAuthRedirectUri,
	hasExtensionAuthSupport,
	launchExtensionAuthFlow,
} from '../lib/auth-environment'
import {
	clearPendingWebAuth,
	readPendingWebAuth,
	readStoredCalendarAccounts,
	type StoredCalendarAccount,
	writePendingWebAuth,
	writeStoredCalendarAccounts,
} from '../lib/connection-storage'
import {
	buildMicrosoftAuthorizeUrl,
	exchangeMicrosoftAuthorizationCode,
	isMicrosoftAuthConfigured,
	MicrosoftReauthRequiredError,
	parseAuthCallbackCode,
	refreshMicrosoftTokens,
} from '../lib/microsoft-auth'
import { fetchUpcomingCalendarEvents } from '../lib/microsoft-calendar'
import { createPkcePair, createRandomState } from '../lib/pkce'
import { CalendarAccountCategory } from '../model/account-category'
import { mergeCalendarEvents } from '../model/calendar-event'

export enum CalendarConnectionError {
	AuthFailed = 'auth-failed',
	EventsFailed = 'events-failed',
}

export type CalendarAccountSummary = {
	accountId: string
	accountLabel: null | string
	category: CalendarAccountCategory
	isSessionExpired: boolean
}

export type CalendarConnection = {
	accounts: CalendarAccountSummary[]
	connect: () => Promise<void>
	disconnect: (accountId: string) => void
	error: CalendarConnectionError | null
	events: CalendarEvent[]
	eventsStatus: AsyncStatus
	isConfigured: boolean
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

	const connect = async () => {
		if (isConnecting) {
			return
		}

		await startConnect(connectionState)
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
			({ accountId, accountLabel, category, isSessionExpired }) => ({
				accountId,
				accountLabel,
				category,
				isSessionExpired,
			}),
		),
		connect,
		disconnect,
		error,
		events,
		eventsStatus,
		isConfigured: isMicrosoftAuthConfigured(),
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
	try {
		const freshAccount = await ensureFreshAccount(account)
		const events = await fetchUpcomingCalendarEvents({
			accessToken: freshAccount.accessToken,
			accountId: freshAccount.accountId,
			timeZone,
		})

		return { account: freshAccount, events, status: 'success' }
	} catch (caughtError) {
		if (caughtError instanceof MicrosoftReauthRequiredError) {
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

const startConnect = async (connectionState: ConnectionState) => {
	if (!isMicrosoftAuthConfigured()) {
		return
	}

	connectionState.setError(null)
	connectionState.setIsConnecting(true)
	try {
		const { codeChallenge, codeVerifier } = await createPkcePair()
		const state = createRandomState()
		const redirectUri = getAuthRedirectUri()
		const authorizeUrl = buildMicrosoftAuthorizeUrl({
			codeChallenge,
			redirectUri,
			state,
		})

		if (!hasExtensionAuthSupport()) {
			// On the web build, the page round-trips through Microsoft's consent
			// screen; the mount effect completes the exchange after the redirect.
			writePendingWebAuth({ codeVerifier, redirectUri, state })
			window.location.assign(authorizeUrl)
			return
		}

		const callbackUrl = await launchExtensionAuthFlow({ url: authorizeUrl })
		const code = parseAuthCallbackCode({
			expectedState: state,
			url: callbackUrl,
		})
		const newTokens = await exchangeMicrosoftAuthorizationCode({
			code,
			codeVerifier,
			redirectUri,
		})
		addConnectedAccount(connectionState, newTokens)
		void loadEvents(connectionState)
	} catch (caughtError) {
		if (!isUserCancelledAuthError(caughtError)) {
			console.error('Microsoft sign-in error:', caughtError)
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

	connectionState.setIsConnecting(true)
	try {
		const code = parseAuthCallbackCode({
			expectedState: pendingAuth.state,
			url: callbackUrl,
		})
		const newTokens = await exchangeMicrosoftAuthorizationCode({
			code,
			codeVerifier: pendingAuth.codeVerifier,
			redirectUri: pendingAuth.redirectUri,
		})
		addConnectedAccount(connectionState, newTokens)
		void loadEvents(connectionState)
	} catch (caughtError) {
		if (!isUserCancelledAuthError(caughtError)) {
			console.error('Microsoft sign-in error:', caughtError)
			connectionState.setError(CalendarConnectionError.AuthFailed)
		}
	} finally {
		connectionState.setIsConnecting(false)
	}
}

// Reconnecting an already-connected account replaces its tokens and keeps its
// category; legacy entries without a real account id are matched by label.
const addConnectedAccount = (
	connectionState: ConnectionState,
	newTokens: MicrosoftTokens,
) => {
	const accounts = connectionState.accountsRef.current
	const accountId = newTokens.accountId ?? `account:${createRandomState()}`
	const existingAccount = accounts.find(
		(account) =>
			account.accountId === accountId ||
			(account.accountLabel !== null &&
				account.accountLabel === newTokens.accountLabel),
	)
	const connectedAccount: StoredCalendarAccount = {
		accessToken: newTokens.accessToken,
		accountId,
		accountLabel: newTokens.accountLabel,
		category: existingAccount?.category ?? CalendarAccountCategory.Personal,
		expiresAt: newTokens.expiresAt,
		isSessionExpired: false,
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

	const refreshedTokens = await refreshMicrosoftTokens({
		previousTokens: account,
	})

	return {
		...account,
		accessToken: refreshedTokens.accessToken,
		expiresAt: refreshedTokens.expiresAt,
		refreshToken: refreshedTokens.refreshToken,
	}
}

const isUserCancelledAuthError = (caughtError: unknown) =>
	caughtError instanceof Error &&
	/did not approve|cancel/i.test(caughtError.message)

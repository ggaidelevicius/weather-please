import { z } from 'zod'

import type { ProviderTokens } from './provider-tokens'

import { CalendarReauthRequiredError } from './calendar-reauth-error'
import { decodeJwtPayload } from './jwt'

export const GOOGLE_AUTH_SCOPES =
	'openid email https://www.googleapis.com/auth/calendar.events.readonly'

export const getGoogleClientId = () =>
	process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''

// Google requires the client secret on token exchange even for public
// clients. For installed applications Google treats it as non-confidential —
// it cannot be kept secret in client-side code and the redirect-uri allowlist
// is what protects the flow.
export const getGoogleClientSecret = () =>
	process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET ?? ''

export const isGoogleAuthConfigured = () =>
	getGoogleClientId().length > 0 && getGoogleClientSecret().length > 0

export const buildGoogleAuthorizeUrl = ({
	codeChallenge,
	redirectUri,
	state,
}: Readonly<{
	codeChallenge: string
	redirectUri: string
	state: string
}>) => {
	const params = new URLSearchParams({
		access_type: 'offline',
		client_id: getGoogleClientId(),
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
		// `consent` guarantees a refresh token on every connect, including
		// reconnects after expiry; Google only issues one on consent.
		prompt: 'consent select_account',
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: GOOGLE_AUTH_SCOPES,
		state,
	})

	return `${AUTHORIZE_ENDPOINT}?${params.toString()}`
}

export const exchangeGoogleAuthorizationCode = async ({
	code,
	codeVerifier,
	redirectUri,
}: Readonly<{
	code: string
	codeVerifier: string
	redirectUri: string
}>): Promise<ProviderTokens> =>
	requestGoogleTokens({
		client_id: getGoogleClientId(),
		client_secret: getGoogleClientSecret(),
		code,
		code_verifier: codeVerifier,
		grant_type: 'authorization_code',
		redirect_uri: redirectUri,
	})

export const refreshGoogleTokens = async ({
	previousTokens,
}: Readonly<{
	previousTokens: ProviderTokens
}>): Promise<ProviderTokens> => {
	if (!previousTokens.refreshToken) {
		throw new CalendarReauthRequiredError()
	}

	const refreshedTokens = await requestGoogleTokens({
		client_id: getGoogleClientId(),
		client_secret: getGoogleClientSecret(),
		grant_type: 'refresh_token',
		refresh_token: previousTokens.refreshToken,
	})

	return {
		...refreshedTokens,
		accountId: refreshedTokens.accountId ?? previousTokens.accountId,
		accountLabel: refreshedTokens.accountLabel ?? previousTokens.accountLabel,
		refreshToken: refreshedTokens.refreshToken ?? previousTokens.refreshToken,
	}
}

const AUTHORIZE_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

const tokenResponseSchema = z.object({
	access_token: z.string().min(1),
	expires_in: z.number(),
	id_token: z.string().optional(),
	refresh_token: z.string().optional(),
})

const tokenErrorSchema = z.object({
	error: z.string().optional(),
})

// `sub` is Google's stable account identifier.
const idTokenClaimsSchema = z.object({
	email: z.string().optional(),
	name: z.string().optional(),
	sub: z.string().optional(),
})

const requestGoogleTokens = async (
	body: Record<string, string>,
): Promise<ProviderTokens> => {
	const response = await fetch(TOKEN_ENDPOINT, {
		body: new URLSearchParams(body).toString(),
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		method: 'POST',
	})

	if (!response.ok) {
		const errorBody = tokenErrorSchema.safeParse(
			await response.json().catch(() => null),
		)
		if (errorBody.success && errorBody.data.error === 'invalid_grant') {
			throw new CalendarReauthRequiredError()
		}

		throw new Error(`Google token request failed: ${response.status}`)
	}

	const parsed = tokenResponseSchema.safeParse(await response.json())
	if (!parsed.success) {
		throw new Error('Invalid Google token response')
	}

	const accountInfo = decodeGoogleAccountInfo(parsed.data.id_token)

	return {
		accessToken: parsed.data.access_token,
		accountId: accountInfo.accountId,
		accountLabel: accountInfo.accountLabel,
		expiresAt: Date.now() + parsed.data.expires_in * 1000,
		refreshToken: parsed.data.refresh_token ?? null,
	}
}

const decodeGoogleAccountInfo = (
	idToken: string | undefined,
): { accountId: null | string; accountLabel: null | string } => {
	const claims = idTokenClaimsSchema.safeParse(
		idToken ? decodeJwtPayload(idToken) : null,
	)
	if (!claims.success) {
		return { accountId: null, accountLabel: null }
	}

	return {
		accountId: claims.data.sub ?? null,
		accountLabel: claims.data.email ?? claims.data.name ?? null,
	}
}

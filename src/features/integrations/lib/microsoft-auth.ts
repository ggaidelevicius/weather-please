import { z } from 'zod'

import type { ProviderTokens } from './provider-tokens'

import { CalendarReauthRequiredError } from './calendar-reauth-error'
import { decodeJwtPayload } from './jwt'

export const MICROSOFT_AUTH_SCOPES =
	'openid profile email offline_access Calendars.Read'

// The application (client) id is public by design — PKCE keeps the flow
// secure without a client secret.
export const getMicrosoftClientId = () =>
	process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID ?? ''

export const isMicrosoftAuthConfigured = () => getMicrosoftClientId().length > 0

export const buildMicrosoftAuthorizeUrl = ({
	codeChallenge,
	redirectUri,
	state,
}: Readonly<{
	codeChallenge: string
	redirectUri: string
	state: string
}>) => {
	const params = new URLSearchParams({
		client_id: getMicrosoftClientId(),
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
		prompt: 'select_account',
		redirect_uri: redirectUri,
		response_mode: 'query',
		response_type: 'code',
		scope: MICROSOFT_AUTH_SCOPES,
		state,
	})

	return `${AUTHORIZE_ENDPOINT}?${params.toString()}`
}

export const exchangeMicrosoftAuthorizationCode = async ({
	code,
	codeVerifier,
	redirectUri,
}: Readonly<{
	code: string
	codeVerifier: string
	redirectUri: string
}>): Promise<ProviderTokens> =>
	requestMicrosoftTokens({
		client_id: getMicrosoftClientId(),
		code,
		code_verifier: codeVerifier,
		grant_type: 'authorization_code',
		redirect_uri: redirectUri,
		scope: MICROSOFT_AUTH_SCOPES,
	})

export const refreshMicrosoftTokens = async ({
	previousTokens,
	signal,
}: Readonly<{
	previousTokens: ProviderTokens
	signal?: AbortSignal
}>): Promise<ProviderTokens> => {
	if (!previousTokens.refreshToken) {
		throw new CalendarReauthRequiredError()
	}

	const refreshedTokens = await requestMicrosoftTokens(
		{
			client_id: getMicrosoftClientId(),
			grant_type: 'refresh_token',
			refresh_token: previousTokens.refreshToken,
			scope: MICROSOFT_AUTH_SCOPES,
		},
		signal,
	)

	return {
		...refreshedTokens,
		accountId: refreshedTokens.accountId ?? previousTokens.accountId,
		accountLabel: refreshedTokens.accountLabel ?? previousTokens.accountLabel,
		refreshToken: refreshedTokens.refreshToken ?? previousTokens.refreshToken,
	}
}

const AUTHORIZE_ENDPOINT =
	'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
const TOKEN_ENDPOINT =
	'https://login.microsoftonline.com/common/oauth2/v2.0/token'

const tokenResponseSchema = z.object({
	access_token: z.string().min(1),
	expires_in: z.number(),
	id_token: z.string().optional(),
	refresh_token: z.string().optional(),
})

const tokenErrorSchema = z.object({
	error: z.string().optional(),
})

// `tid` + `oid` uniquely identify an account across tenants; `sub` is a
// stable per-app fallback.
const idTokenClaimsSchema = z.object({
	name: z.string().optional(),
	oid: z.string().optional(),
	preferred_username: z.string().optional(),
	sub: z.string().optional(),
	tid: z.string().optional(),
})

const requestMicrosoftTokens = async (
	body: Record<string, string>,
	signal?: AbortSignal,
): Promise<ProviderTokens> => {
	const response = await fetch(TOKEN_ENDPOINT, {
		body: new URLSearchParams(body).toString(),
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		method: 'POST',
		signal,
	})

	if (!response.ok) {
		const errorBody = tokenErrorSchema.safeParse(
			await response.json().catch(() => null),
		)
		if (errorBody.success && errorBody.data.error === 'invalid_grant') {
			throw new CalendarReauthRequiredError()
		}

		throw new Error(`Microsoft token request failed: ${response.status}`)
	}

	const parsed = tokenResponseSchema.safeParse(await response.json())
	if (!parsed.success) {
		throw new Error('Invalid Microsoft token response')
	}

	const accountInfo = decodeMicrosoftAccountInfo(parsed.data.id_token)

	return {
		accessToken: parsed.data.access_token,
		accountId: accountInfo.accountId,
		accountLabel: accountInfo.accountLabel,
		expiresAt: Date.now() + parsed.data.expires_in * 1000,
		refreshToken: parsed.data.refresh_token ?? null,
	}
}

const decodeMicrosoftAccountInfo = (
	idToken: string | undefined,
): { accountId: null | string; accountLabel: null | string } => {
	const claims = idTokenClaimsSchema.safeParse(
		idToken ? decodeJwtPayload(idToken) : null,
	)
	if (!claims.success) {
		return { accountId: null, accountLabel: null }
	}

	const { name, oid, preferred_username, sub, tid } = claims.data

	return {
		accountId: oid && tid ? `${tid}.${oid}` : (sub ?? null),
		accountLabel: preferred_username ?? name ?? null,
	}
}

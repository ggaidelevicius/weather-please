import { z } from 'zod'

export const MICROSOFT_AUTH_SCOPES =
	'openid profile email offline_access Calendars.Read'

export type MicrosoftTokens = {
	accessToken: string
	accountId: null | string
	accountLabel: null | string
	expiresAt: number
	refreshToken: null | string
}

// Narrow error case to distinguish "user must sign in again" from transient
// failures. Thrown when a refresh token is missing, rejected, or an access
// token is no longer accepted.
export class MicrosoftReauthRequiredError extends Error {
	constructor() {
		super('Microsoft sign-in has expired and reauthorisation is required')
		this.name = 'MicrosoftReauthRequiredError'
	}
}

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

export const parseAuthCallbackCode = ({
	expectedState,
	url,
}: Readonly<{ expectedState: string; url: string }>) => {
	const params = new URL(url).searchParams
	const errorDescription =
		params.get('error_description') ?? params.get('error')

	if (errorDescription) {
		throw new Error(`Microsoft sign-in failed: ${errorDescription}`)
	}

	const code = params.get('code')
	if (!code) {
		throw new Error('Microsoft sign-in failed: no authorization code returned')
	}

	if (params.get('state') !== expectedState) {
		throw new Error('Microsoft sign-in failed: state mismatch')
	}

	return code
}

export const exchangeMicrosoftAuthorizationCode = async ({
	code,
	codeVerifier,
	redirectUri,
}: Readonly<{
	code: string
	codeVerifier: string
	redirectUri: string
}>): Promise<MicrosoftTokens> =>
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
}: Readonly<{
	previousTokens: MicrosoftTokens
}>): Promise<MicrosoftTokens> => {
	if (!previousTokens.refreshToken) {
		throw new MicrosoftReauthRequiredError()
	}

	const refreshedTokens = await requestMicrosoftTokens({
		client_id: getMicrosoftClientId(),
		grant_type: 'refresh_token',
		refresh_token: previousTokens.refreshToken,
		scope: MICROSOFT_AUTH_SCOPES,
	})

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

const idTokenClaimsSchema = z.object({
	name: z.string().optional(),
	oid: z.string().optional(),
	preferred_username: z.string().optional(),
	sub: z.string().optional(),
	tid: z.string().optional(),
})

const requestMicrosoftTokens = async (
	body: Record<string, string>,
): Promise<MicrosoftTokens> => {
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
			throw new MicrosoftReauthRequiredError()
		}

		throw new Error(`Microsoft token request failed: ${response.status}`)
	}

	const parsed = tokenResponseSchema.safeParse(await response.json())
	if (!parsed.success) {
		throw new Error('Invalid Microsoft token response')
	}

	const accountInfo = decodeIdTokenAccountInfo(parsed.data.id_token)

	return {
		accessToken: parsed.data.access_token,
		accountId: accountInfo.accountId,
		accountLabel: accountInfo.accountLabel,
		expiresAt: Date.now() + parsed.data.expires_in * 1000,
		refreshToken: parsed.data.refresh_token ?? null,
	}
}

// Identification-only decode; the token is consumed by Microsoft's own APIs,
// so signature validation is not required here. `tid` + `oid` uniquely
// identify an account across tenants; `sub` is a stable per-app fallback.
const decodeIdTokenAccountInfo = (
	idToken: string | undefined,
): { accountId: null | string; accountLabel: null | string } => {
	if (!idToken) {
		return { accountId: null, accountLabel: null }
	}

	try {
		const payloadSegment = idToken.split('.')[1] ?? ''
		const payload = JSON.parse(
			atob(payloadSegment.replace(/-/g, '+').replace(/_/g, '/')),
		)
		const claims = idTokenClaimsSchema.safeParse(payload)
		if (!claims.success) {
			return { accountId: null, accountLabel: null }
		}

		const { name, oid, preferred_username, sub, tid } = claims.data

		return {
			accountId: oid && tid ? `${tid}.${oid}` : (sub ?? null),
			accountLabel: preferred_username ?? name ?? null,
		}
	} catch {
		return { accountId: null, accountLabel: null }
	}
}

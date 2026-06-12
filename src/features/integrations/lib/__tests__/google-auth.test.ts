import { afterEach, describe, expect, it, vi } from 'vitest'

import { CalendarReauthRequiredError } from '../calendar-reauth-error'
import {
	buildGoogleAuthorizeUrl,
	exchangeGoogleAuthorizationCode,
	isGoogleAuthConfigured,
	refreshGoogleTokens,
} from '../google-auth'

const CLIENT_ID = 'client-id.apps.googleusercontent.com'
const CLIENT_SECRET = 'client-secret'
const REDIRECT_URI = 'https://abcdefgh.chromiumapp.org/'

const encodeIdTokenPayload = (payload: Record<string, unknown>) =>
	`header.${btoa(JSON.stringify(payload))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')}.signature`

const stubGoogleAuthEnv = () => {
	vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', CLIENT_ID)
	vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_SECRET', CLIENT_SECRET)
}

const stubTokenResponse = (body: unknown, status = 200) => {
	const fetchMock = vi.fn(async () => ({
		json: async () => body,
		ok: status >= 200 && status <= 299,
		status,
	}))
	vi.stubGlobal('fetch', fetchMock)

	return fetchMock
}

afterEach(() => {
	vi.unstubAllEnvs()
	vi.unstubAllGlobals()
})

describe('isGoogleAuthConfigured', () => {
	it('requires both the client id and the client secret', () => {
		expect(isGoogleAuthConfigured()).toBe(false)

		vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', CLIENT_ID)

		expect(isGoogleAuthConfigured()).toBe(false)

		vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_SECRET', CLIENT_SECRET)

		expect(isGoogleAuthConfigured()).toBe(true)
	})
})

describe('buildGoogleAuthorizeUrl', () => {
	it('builds a PKCE authorize url requesting offline access', () => {
		stubGoogleAuthEnv()

		const url = new URL(
			buildGoogleAuthorizeUrl({
				codeChallenge: 'challenge-value',
				redirectUri: REDIRECT_URI,
				state: 'state-value',
			}),
		)

		expect(url.origin).toBe('https://accounts.google.com')
		expect(url.pathname).toBe('/o/oauth2/v2/auth')
		expect(url.searchParams.get('access_type')).toBe('offline')
		expect(url.searchParams.get('client_id')).toBe(CLIENT_ID)
		expect(url.searchParams.get('code_challenge')).toBe('challenge-value')
		expect(url.searchParams.get('code_challenge_method')).toBe('S256')
		expect(url.searchParams.get('prompt')).toBe('consent select_account')
		expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT_URI)
		expect(url.searchParams.get('response_type')).toBe('code')
		expect(url.searchParams.get('scope')).toContain('calendar.events.readonly')
		expect(url.searchParams.get('state')).toBe('state-value')
	})
})

describe('exchangeGoogleAuthorizationCode', () => {
	it('maps the token response and decodes the account label and id', async () => {
		stubGoogleAuthEnv()
		const fetchMock = stubTokenResponse({
			access_token: 'access-token',
			expires_in: 3600,
			id_token: encodeIdTokenPayload({
				email: 'gus@gmail.com',
				sub: 'google-subject',
			}),
			refresh_token: 'refresh-token',
		})

		const tokens = await exchangeGoogleAuthorizationCode({
			code: 'auth-code',
			codeVerifier: 'verifier',
			redirectUri: REDIRECT_URI,
		})

		expect(tokens.accessToken).toBe('access-token')
		expect(tokens.accountId).toBe('google-subject')
		expect(tokens.accountLabel).toBe('gus@gmail.com')
		expect(tokens.refreshToken).toBe('refresh-token')
		expect(tokens.expiresAt).toBeGreaterThan(Date.now())

		const [requestUrl, requestInit] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		]

		expect(requestUrl).toBe('https://oauth2.googleapis.com/token')
		expect(String(requestInit.body)).toContain('code_verifier=verifier')
		expect(String(requestInit.body)).toContain(`client_secret=${CLIENT_SECRET}`)
	})

	it('throws on a malformed token response', async () => {
		stubGoogleAuthEnv()
		stubTokenResponse({ unexpected: true })

		await expect(
			exchangeGoogleAuthorizationCode({
				code: 'auth-code',
				codeVerifier: 'verifier',
				redirectUri: REDIRECT_URI,
			}),
		).rejects.toThrow(/Invalid Google token response/)
	})
})

describe('refreshGoogleTokens', () => {
	const previousTokens = {
		accessToken: 'stale-access-token',
		accountId: 'google-subject',
		accountLabel: 'gus@gmail.com',
		expiresAt: 0,
		refreshToken: 'refresh-token',
	}

	it('preserves account identity and refresh token when absent from the response', async () => {
		stubGoogleAuthEnv()
		stubTokenResponse({
			access_token: 'new-access-token',
			expires_in: 3600,
		})

		const tokens = await refreshGoogleTokens({ previousTokens })

		expect(tokens.accessToken).toBe('new-access-token')
		expect(tokens.accountId).toBe('google-subject')
		expect(tokens.accountLabel).toBe('gus@gmail.com')
		expect(tokens.refreshToken).toBe('refresh-token')
	})

	it('requires reauthorisation when no refresh token is held', async () => {
		await expect(
			refreshGoogleTokens({
				previousTokens: { ...previousTokens, refreshToken: null },
			}),
		).rejects.toBeInstanceOf(CalendarReauthRequiredError)
	})

	it('requires reauthorisation when the refresh token is rejected', async () => {
		stubGoogleAuthEnv()
		stubTokenResponse({ error: 'invalid_grant' }, 400)

		await expect(
			refreshGoogleTokens({ previousTokens }),
		).rejects.toBeInstanceOf(CalendarReauthRequiredError)
	})
})

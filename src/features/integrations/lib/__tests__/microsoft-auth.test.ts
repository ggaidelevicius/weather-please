import { afterEach, describe, expect, it, vi } from 'vitest'

import { CalendarReauthRequiredError } from '../calendar-reauth-error'
import {
	buildMicrosoftAuthorizeUrl,
	exchangeMicrosoftAuthorizationCode,
	isMicrosoftAuthConfigured,
	refreshMicrosoftTokens,
} from '../microsoft-auth'
import { parseAuthCallbackCode } from '../oauth-callback'

const CLIENT_ID = '11111111-2222-3333-4444-555555555555'
const REDIRECT_URI = 'https://abcdefgh.chromiumapp.org/'

const encodeIdTokenPayload = (payload: Record<string, unknown>) =>
	`header.${btoa(JSON.stringify(payload))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')}.signature`

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

describe('isMicrosoftAuthConfigured', () => {
	it('reflects whether a client id is present', () => {
		expect(isMicrosoftAuthConfigured()).toBe(false)

		vi.stubEnv('NEXT_PUBLIC_MICROSOFT_CLIENT_ID', CLIENT_ID)

		expect(isMicrosoftAuthConfigured()).toBe(true)
	})
})

describe('buildMicrosoftAuthorizeUrl', () => {
	it('builds a PKCE authorize url with the expected parameters', () => {
		vi.stubEnv('NEXT_PUBLIC_MICROSOFT_CLIENT_ID', CLIENT_ID)

		const url = new URL(
			buildMicrosoftAuthorizeUrl({
				codeChallenge: 'challenge-value',
				redirectUri: REDIRECT_URI,
				state: 'state-value',
			}),
		)

		expect(url.origin).toBe('https://login.microsoftonline.com')
		expect(url.pathname).toBe('/common/oauth2/v2.0/authorize')
		expect(url.searchParams.get('client_id')).toBe(CLIENT_ID)
		expect(url.searchParams.get('code_challenge')).toBe('challenge-value')
		expect(url.searchParams.get('code_challenge_method')).toBe('S256')
		expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT_URI)
		expect(url.searchParams.get('response_type')).toBe('code')
		expect(url.searchParams.get('scope')).toContain('Calendars.Read')
		expect(url.searchParams.get('scope')).toContain('offline_access')
		expect(url.searchParams.get('state')).toBe('state-value')
	})
})

describe('parseAuthCallbackCode', () => {
	it('returns the authorization code when the state matches', () => {
		expect(
			parseAuthCallbackCode({
				expectedState: 'expected',
				url: `${REDIRECT_URI}?code=auth-code&state=expected`,
			}),
		).toBe('auth-code')
	})

	it('throws on a state mismatch', () => {
		expect(() =>
			parseAuthCallbackCode({
				expectedState: 'expected',
				url: `${REDIRECT_URI}?code=auth-code&state=tampered`,
			}),
		).toThrow(/state mismatch/)
	})

	it('surfaces provider errors from the callback', () => {
		expect(() =>
			parseAuthCallbackCode({
				expectedState: 'expected',
				url: `${REDIRECT_URI}?error=access_denied&error_description=User+declined`,
			}),
		).toThrow(/User declined/)
	})
})

describe('exchangeMicrosoftAuthorizationCode', () => {
	it('maps the token response and decodes the account label and id', async () => {
		stubTokenResponse({
			access_token: 'access-token',
			expires_in: 3600,
			id_token: encodeIdTokenPayload({
				oid: 'object-id',
				preferred_username: 'gus@example.com',
				tid: 'tenant-id',
			}),
			refresh_token: 'refresh-token',
		})

		const tokens = await exchangeMicrosoftAuthorizationCode({
			code: 'auth-code',
			codeVerifier: 'verifier',
			redirectUri: REDIRECT_URI,
		})

		expect(tokens.accessToken).toBe('access-token')
		expect(tokens.accountId).toBe('tenant-id.object-id')
		expect(tokens.accountLabel).toBe('gus@example.com')
		expect(tokens.refreshToken).toBe('refresh-token')
		expect(tokens.expiresAt).toBeGreaterThan(Date.now())
	})

	it('falls back to the sub claim when oid or tid is missing', async () => {
		stubTokenResponse({
			access_token: 'access-token',
			expires_in: 3600,
			id_token: encodeIdTokenPayload({
				preferred_username: 'gus@example.com',
				sub: 'subject-claim',
			}),
		})

		const tokens = await exchangeMicrosoftAuthorizationCode({
			code: 'auth-code',
			codeVerifier: 'verifier',
			redirectUri: REDIRECT_URI,
		})

		expect(tokens.accountId).toBe('subject-claim')
	})

	it('throws on a malformed token response', async () => {
		stubTokenResponse({ unexpected: true })

		await expect(
			exchangeMicrosoftAuthorizationCode({
				code: 'auth-code',
				codeVerifier: 'verifier',
				redirectUri: REDIRECT_URI,
			}),
		).rejects.toThrow(/Invalid Microsoft token response/)
	})
})

describe('refreshMicrosoftTokens', () => {
	const previousTokens = {
		accessToken: 'stale-access-token',
		accountId: 'tenant-id.object-id',
		accountLabel: 'gus@example.com',
		expiresAt: 0,
		refreshToken: 'refresh-token',
	}

	it('preserves account identity and refresh token when absent from the response', async () => {
		stubTokenResponse({
			access_token: 'new-access-token',
			expires_in: 3600,
		})

		const tokens = await refreshMicrosoftTokens({ previousTokens })

		expect(tokens.accessToken).toBe('new-access-token')
		expect(tokens.accountId).toBe('tenant-id.object-id')
		expect(tokens.accountLabel).toBe('gus@example.com')
		expect(tokens.refreshToken).toBe('refresh-token')
	})

	it('requires reauthorisation when no refresh token is held', async () => {
		await expect(
			refreshMicrosoftTokens({
				previousTokens: { ...previousTokens, refreshToken: null },
			}),
		).rejects.toBeInstanceOf(CalendarReauthRequiredError)
	})

	it('requires reauthorisation when the refresh token is rejected', async () => {
		stubTokenResponse({ error: 'invalid_grant' }, 400)

		await expect(
			refreshMicrosoftTokens({ previousTokens }),
		).rejects.toBeInstanceOf(CalendarReauthRequiredError)
	})
})

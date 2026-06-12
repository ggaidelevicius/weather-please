export const createPkcePair = async (): Promise<{
	codeChallenge: string
	codeVerifier: string
}> => {
	const codeVerifier = base64UrlEncode(
		crypto.getRandomValues(new Uint8Array(32)),
	)
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(codeVerifier),
	)

	return {
		codeChallenge: base64UrlEncode(new Uint8Array(digest)),
		codeVerifier,
	}
}

export const createRandomState = () =>
	base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)))

const base64UrlEncode = (bytes: Uint8Array) =>
	btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')

type ChromeGlobal = {
	identity?: ChromeIdentityApi
	runtime?: { lastError?: { message?: string } }
}

type ChromeIdentityApi = {
	getRedirectURL: () => string
	launchWebAuthFlow: (
		details: { interactive: boolean; url: string },
		callback: (responseUrl?: string) => void,
	) => void
}

declare const chrome: ChromeGlobal | undefined

export const hasExtensionAuthSupport = () => getChromeIdentity() !== null

export const getAuthRedirectUri = () => {
	const identity = getChromeIdentity()
	if (identity) {
		return identity.getRedirectURL()
	}

	// Falling back to a page redirect inside an extension would send the
	// provider an invalid chrome-extension:// redirect uri. This state means
	// the loaded extension is missing the `identity` permission (usually a
	// stale manifest awaiting a reload in chrome://extensions).
	if (window.location.protocol === 'chrome-extension:') {
		throw new Error(
			'Extension sign-in is unavailable because the identity permission is missing; reload the extension to pick up the current manifest',
		)
	}

	// On the web build the OAuth redirect must return to the page running the
	// app (e.g. /demo), not the marketing landing page at the site root.
	return `${window.location.origin}${window.location.pathname}`
}

export const launchExtensionAuthFlow = ({ url }: Readonly<{ url: string }>) =>
	new Promise<string>((resolve, reject) => {
		const identity = getChromeIdentity()
		if (!identity) {
			reject(new Error('Extension sign-in is unavailable'))
			return
		}

		identity.launchWebAuthFlow({ interactive: true, url }, (responseUrl) => {
			const lastError =
				typeof chrome === 'undefined' ? undefined : chrome?.runtime?.lastError

			if (lastError || !responseUrl) {
				reject(
					new Error(lastError?.message ?? 'Sign-in was cancelled by the user'),
				)
				return
			}

			resolve(responseUrl)
		})
	})

const getChromeIdentity = (): ChromeIdentityApi | null =>
	typeof chrome !== 'undefined' &&
	typeof chrome?.identity?.launchWebAuthFlow === 'function'
		? chrome.identity
		: null

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

	return identity ? identity.getRedirectURL() : `${window.location.origin}/`
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

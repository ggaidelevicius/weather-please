export const parseAuthCallbackCode = ({
	expectedState,
	url,
}: Readonly<{ expectedState: string; url: string }>) => {
	const params = new URL(url).searchParams
	const errorDescription =
		params.get('error_description') ?? params.get('error')

	if (errorDescription) {
		throw new Error(`Sign-in failed: ${errorDescription}`)
	}

	const code = params.get('code')
	if (!code) {
		throw new Error('Sign-in failed: no authorization code returned')
	}

	if (params.get('state') !== expectedState) {
		throw new Error('Sign-in failed: state mismatch')
	}

	return code
}

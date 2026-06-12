// Identification-only decode; the tokens are consumed by their issuing
// provider's APIs, so signature validation is not required here.
export const decodeJwtPayload = (token: string): unknown => {
	try {
		const payloadSegment = token.split('.')[1] ?? ''

		return JSON.parse(
			atob(payloadSegment.replace(/-/g, '+').replace(/_/g, '/')),
		)
	} catch {
		return null
	}
}

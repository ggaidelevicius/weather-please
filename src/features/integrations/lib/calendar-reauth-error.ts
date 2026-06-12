// Narrow error case to distinguish "user must sign in again" from transient
// failures. Thrown when a refresh token is missing, rejected, or an access
// token is no longer accepted by the provider.
export class CalendarReauthRequiredError extends Error {
	constructor() {
		super('Calendar sign-in has expired and reauthorisation is required')
		this.name = 'CalendarReauthRequiredError'
	}
}

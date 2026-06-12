export enum CalendarProvider {
	Google = 'google',
	Microsoft = 'microsoft',
}

// Display order for provider lists.
export const CALENDAR_PROVIDERS = [
	CalendarProvider.Google,
	CalendarProvider.Microsoft,
] as const satisfies ReadonlyArray<CalendarProvider>

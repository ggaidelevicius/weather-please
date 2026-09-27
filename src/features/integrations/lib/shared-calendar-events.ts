import { z } from 'zod'

import type { SharedResourceSnapshot } from '../../../shared/lib/shared-resource'
import type { StoredCalendarAccount } from './connection-storage'

import {
	readSharedResource,
	subscribeSharedResource,
} from '../../../shared/lib/shared-resource'
import {
	calendarEventSchema,
	mergeCalendarEvents,
} from '../model/calendar-event'

export const sharedAccountEventsSchema = z.object({
	events: z.array(calendarEventSchema),
	expiresAt: z.number(),
	sessionId: z.string().nullable(),
})

export type CalendarEventsUpdate = {
	account: StoredCalendarAccount
	snapshot: SharedResourceSnapshot<SharedAccountEvents>
}

export type SharedAccountEvents = z.infer<typeof sharedAccountEventsSchema>

export const getAccountEventsKey = ({
	account,
	timeZone,
}: Readonly<{
	account: StoredCalendarAccount
	timeZone: string
}>) => `calendar-events:${account.provider}:${account.accountId}:${timeZone}`

export const isAccountEventsCurrent = ({
	account,
	result,
}: Readonly<{
	account: StoredCalendarAccount
	result: SharedAccountEvents
}>) =>
	account.expiresAt === result.expiresAt &&
	hasAccountEventsSession({ account, result })

export const getCalendarEventsIdentity = ({
	accounts,
	timeZone,
}: Readonly<{
	accounts: readonly StoredCalendarAccount[]
	timeZone: string
}>) =>
	JSON.stringify([
		timeZone,
		accounts.map(({ accountId, isSessionExpired, provider, sessionId }) => [
			provider,
			accountId,
			sessionId ?? null,
			isSessionExpired,
		]),
	])

export const createCalendarEventsStore = ({
	accounts,
	timeZone,
}: Readonly<{
	accounts: readonly StoredCalendarAccount[]
	timeZone: string
}>) => {
	const updateListeners = new Set<(update: CalendarEventsUpdate) => void>()
	const activeAccounts = accounts.filter((account) => !account.isSessionExpired)
	let previousResources: Array<null | SharedResourceSnapshot<SharedAccountEvents>> =
		[]
	let previousSnapshot = EMPTY_SNAPSHOT

	const getSnapshot = () => {
		const resources = activeAccounts.map((account) => {
			const cached = readSharedResource({
				key: getAccountEventsKey({ account, timeZone }),
				schema: sharedAccountEventsSchema,
			})
			return cached &&
				hasAccountEventsSession({ account, result: cached.value })
				? cached
				: null
		})
		if (
			resources.length === previousResources.length &&
			resources.every(
				(resource, index) => resource === previousResources[index],
			)
		) {
			return previousSnapshot
		}
		previousResources = resources
		previousSnapshot = {
			events: mergeCalendarEvents(
				resources.map((resource) => resource?.value.events ?? []),
			),
		}
		return previousSnapshot
	}

	return {
		getServerSnapshot: () => EMPTY_SNAPSHOT,
		getSnapshot,
		identity: getCalendarEventsIdentity({ accounts, timeZone }),
		subscribe: (onChange: () => void) => {
			getSnapshot()
			let subscribedResources = previousResources
			const unsubscribe = activeAccounts.map((account) =>
				subscribeSharedResource({
					key: getAccountEventsKey({ account, timeZone }),
					onChange: () => {
						getSnapshot()
						const resources = previousResources
						const changedResources = resources.flatMap((snapshot, index) =>
							snapshot && snapshot !== subscribedResources[index]
								? [{ account: activeAccounts[index], snapshot }]
								: [],
						)
						subscribedResources = resources
						changedResources.forEach((update) =>
							updateListeners.forEach((listener) => listener(update)),
						)
						onChange()
					},
				}),
			)
			return () => unsubscribe.forEach((removeListener) => removeListener())
		},
		subscribeToUpdates: (onUpdate: (update: CalendarEventsUpdate) => void) => {
			updateListeners.add(onUpdate)
			return () => {
				updateListeners.delete(onUpdate)
			}
		},
	}
}

const EMPTY_SNAPSHOT: { events: SharedAccountEvents['events'] } = { events: [] }

// Token rotation keeps the same login's visible events while they refresh.
// Reconnection and expired sessions must discard the previous login's data.
const hasAccountEventsSession = ({
	account,
	result,
}: Readonly<{
	account: StoredCalendarAccount
	result: SharedAccountEvents
}>) =>
	!account.isSessionExpired &&
	(account.sessionId ?? null) === result.sessionId &&
	result.events.every((event) => event.accountId === account.accountId)

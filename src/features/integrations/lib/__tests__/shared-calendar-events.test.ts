import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { StoredCalendarAccount } from '../connection-storage'

import {
	invalidateCalendarResources,
	requestSharedResource,
} from '../../../../shared/lib/shared-resource'
import { CalendarAccountCategory } from '../../model/account-category'
import { CalendarProvider } from '../../model/calendar-provider'
import {
	createCalendarEventsStore,
	getAccountEventsKey,
	getAccountEventsPrefix,
	type SharedAccountEvents,
	sharedAccountEventsSchema,
} from '../shared-calendar-events'

const account: StoredCalendarAccount = {
	accessToken: 'access-token',
	accountId: 'account-a',
	accountLabel: 'Example',
	category: CalendarAccountCategory.Personal,
	expiresAt: 1_800_000_000_000,
	isSessionExpired: false,
	provider: CalendarProvider.Google,
	refreshToken: 'refresh-token',
	sessionId: 'current-session',
}
const timeZone = 'UTC'
const key = getAccountEventsKey({ account, timeZone })
const createEvents = (id: string): SharedAccountEvents => ({
	events: [
		{
			accountId: account.accountId,
			description: null,
			endTimestamp: 1_800_000_060_000,
			icalUid: null,
			id,
			isAllDay: false,
			location: null,
			startTimestamp: 1_800_000_000_000,
			subject: id,
			webLink: null,
		},
	],
	expiresAt: account.expiresAt,
	sessionId: account.sessionId ?? null,
})
const writeEvents = (data = createEvents('cached')) =>
	requestSharedResource({
		fetcher: async () => data,
		force: true,
		key,
		maxAgeMs: 60_000,
		schema: sharedAccountEventsSchema,
	})
const notify = () => window.dispatchEvent(new Event('pageshow'))

beforeEach(() => {
	vi.stubGlobal('BroadcastChannel', undefined)
	invalidateCalendarResources(getAccountEventsPrefix(account))
})
afterEach(() => vi.unstubAllGlobals())

describe('calendar events external store', () => {
	it('keeps browser and server snapshots stable until event data changes', async () => {
		await writeEvents()
		const store = createCalendarEventsStore({ accounts: [account], timeZone })
		const cached = store.getSnapshot()
		expect(cached.events[0].id).toBe('cached')
		expect(store.getSnapshot()).toBe(cached)
		expect(store.getServerSnapshot()).toBe(store.getServerSnapshot())
		expect(store.getServerSnapshot().events).toEqual([])
		await writeEvents(createEvents('changed'))
		expect(store.getSnapshot()).not.toBe(cached)
		expect(store.getSnapshot().events[0].id).toBe('changed')
	})

	it('retains stale same-session events after token rotation but hides expired and replaced sessions', async () => {
		await writeEvents()
		const store = createCalendarEventsStore({
			accounts: [{ ...account, expiresAt: account.expiresAt + 60_000 }],
			timeZone,
		})
		expect(store.getSnapshot().events[0].id).toBe('cached')
		for (const updatedAccount of [
			{ ...account, isSessionExpired: true },
			{ ...account, sessionId: 'replacement-session' },
		]) {
			expect(
				createCalendarEventsStore({
					accounts: [updatedAccount],
					timeZone,
				}).getSnapshot().events,
			).toEqual([])
		}
	})

	it('does not expose events belonging to a different account', async () => {
		const data = createEvents('foreign')
		data.events[0].accountId = 'account-b'
		await writeEvents(data)
		const store = createCalendarEventsStore({ accounts: [account], timeZone })
		expect(store.getSnapshot().events).toEqual([])
	})

	it('ignores duplicate notifications and retry markers, and removes both subscriptions', async () => {
		await writeEvents()
		const store = createCalendarEventsStore({ accounts: [account], timeZone })
		const original = store.getSnapshot()
		const onChange = vi.fn()
		const onUpdate = vi.fn()
		const unsubscribe = store.subscribe(onChange)
		const unsubscribeUpdates = store.subscribeToUpdates(onUpdate)
		notify()
		await expect(
			requestSharedResource({
				fetcher: async () => {
					throw new Error('temporary failure')
				},
				force: true,
				key,
				maxAgeMs: 60_000,
				schema: sharedAccountEventsSchema,
			}),
		).rejects.toThrow('temporary failure')
		notify()
		expect(store.getSnapshot()).toBe(original)
		expect(onUpdate).not.toHaveBeenCalled()
		await writeEvents(createEvents('replacement'))
		notify()
		expect(onUpdate).toHaveBeenCalledOnce()
		expect(store.getSnapshot().events[0].id).toBe('replacement')
		unsubscribeUpdates()
		await writeEvents(createEvents('another'))
		notify()
		expect(onUpdate).toHaveBeenCalledOnce()
		unsubscribe()
		onChange.mockClear()
		await writeEvents(createEvents('unsubscribed'))
		notify()
		expect(onChange).not.toHaveBeenCalled()
	})

	it('clears an invalidated result immediately', async () => {
		await writeEvents()
		const store = createCalendarEventsStore({ accounts: [account], timeZone })
		expect(store.getSnapshot().events[0].id).toBe('cached')
		invalidateCalendarResources(getAccountEventsPrefix(account))
		expect(store.getSnapshot().events).toEqual([])
	})
})

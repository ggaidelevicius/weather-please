import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { StoredCalendarAccount } from '../connection-storage'

import { getCurrentTimestamp } from '../../../../shared/lib/time'
import { CalendarAccountCategory } from '../../model/account-category'
import { CalendarProvider } from '../../model/calendar-provider'
import {
	createCalendarEventsStore,
	getAccountEventsKey,
	type SharedAccountEvents,
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
const storageKey = `weather-please:shared-resource:v1:${getAccountEventsKey({ account, timeZone })}`
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
const writeEvents = ({
	data = createEvents('cached'),
	failureAt,
	hasValue = true,
	updatedAt = getCurrentTimestamp(),
}: {
	data?: SharedAccountEvents
	failureAt?: number
	hasValue?: boolean
	updatedAt?: number
} = {}) => {
	localStorage.setItem(
		storageKey,
		JSON.stringify({
			data,
			failureAt,
			hasValue,
			id: 'cached-id',
			revision: '',
			updatedAt,
			version: 1,
		}),
	)
}
const notify = () =>
	window.dispatchEvent(
		new StorageEvent('storage', {
			key: storageKey,
			storageArea: localStorage,
		}),
	)

beforeEach(() => localStorage.clear())

describe('calendar events external store', () => {
	it('keeps browser and server snapshots stable until event data changes', () => {
		writeEvents()
		const store = createCalendarEventsStore({ accounts: [account], timeZone })
		const cached = store.getSnapshot()
		expect(cached.events[0].id).toBe('cached')
		expect(store.getSnapshot()).toBe(cached)
		expect(store.getServerSnapshot()).toBe(store.getServerSnapshot())
		expect(store.getServerSnapshot().events).toEqual([])
		writeEvents({ data: createEvents('changed') })
		expect(store.getSnapshot()).not.toBe(cached)
		expect(store.getSnapshot().events[0].id).toBe('changed')
	})

	it('retains stale same-session events after token rotation but hides expired and replaced sessions', () => {
		writeEvents({ updatedAt: getCurrentTimestamp() - 60 * 60_000 })
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

	it('does not expose events belonging to a different account', () => {
		const data = createEvents('foreign')
		data.events[0].accountId = 'account-b'
		writeEvents({ data })
		const store = createCalendarEventsStore({ accounts: [account], timeZone })
		expect(store.getSnapshot().events).toEqual([])
	})

	it('ignores duplicate notifications and retry markers, and removes both subscriptions', () => {
		const updatedAt = getCurrentTimestamp()
		writeEvents({ updatedAt })
		const store = createCalendarEventsStore({ accounts: [account], timeZone })
		const original = store.getSnapshot()
		const onChange = vi.fn()
		const onUpdate = vi.fn()
		const unsubscribe = store.subscribe(onChange)
		const unsubscribeUpdates = store.subscribeToUpdates(onUpdate)
		notify()
		writeEvents({ failureAt: updatedAt, updatedAt })
		notify()
		expect(store.getSnapshot()).toBe(original)
		expect(onUpdate).not.toHaveBeenCalled()
		writeEvents({ data: createEvents('replacement'), updatedAt })
		notify()
		expect(onUpdate).toHaveBeenCalledOnce()
		expect(store.getSnapshot().events[0].id).toBe('replacement')
		unsubscribeUpdates()
		writeEvents({ data: createEvents('another'), updatedAt })
		notify()
		expect(onUpdate).toHaveBeenCalledOnce()
		unsubscribe()
		onChange.mockClear()
		writeEvents({ data: createEvents('unsubscribed'), updatedAt })
		notify()
		expect(onChange).not.toHaveBeenCalled()
	})

	it('clears an invalidated result immediately', () => {
		writeEvents()
		const store = createCalendarEventsStore({ accounts: [account], timeZone })
		expect(store.getSnapshot().events[0].id).toBe('cached')
		writeEvents({ hasValue: false })
		expect(store.getSnapshot().events).toEqual([])
	})
})

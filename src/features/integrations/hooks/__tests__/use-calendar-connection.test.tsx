import { act, renderHook, waitFor } from '@testing-library/react'
import { type ReactNode, StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CalendarEvent } from '../../model/calendar-event'

import {
	readStoredCalendarAccounts,
	writeStoredCalendarAccounts,
} from '../../lib/connection-storage'
import { CalendarAccountCategory } from '../../model/account-category'
import { CalendarProvider } from '../../model/calendar-provider'
import { useCalendarConnection } from '../use-calendar-connection'

const { fetchEvents } = vi.hoisted(() => ({ fetchEvents: vi.fn() }))
vi.mock('../../lib/google-calendar', () => ({
	fetchUpcomingGoogleCalendarEvents: fetchEvents,
}))

const createDeferred = () => {
	let resolve!: (events: CalendarEvent[]) => void
	const promise = new Promise<CalendarEvent[]>((complete) => {
		resolve = complete
	})
	return { promise, resolve }
}
const event = (id: string): CalendarEvent => ({
	accountId: 'account-a',
	description: null,
	endTimestamp: Date.now() + 3600000,
	icalUid: null,
	id,
	isAllDay: false,
	location: null,
	startTimestamp: Date.now(),
	subject: id,
	webLink: null,
})
const seedAccount = () =>
	writeStoredCalendarAccounts([
		{
			accessToken: 'test-token',
			accountId: 'account-a',
			accountLabel: 'Example',
			category: CalendarAccountCategory.Personal,
			expiresAt: Date.now() + 3600000,
			isSessionExpired: false,
			provider: CalendarProvider.Google,
			refreshToken: null,
		},
	])

beforeEach(() => {
	localStorage.clear()
	sessionStorage.clear()
	vi.clearAllMocks()
	seedAccount()
})

describe('calendar request lifecycle', () => {
	it('does not restore disconnected events after a pending request completes', async () => {
		const pending = createDeferred()
		fetchEvents.mockReturnValue(pending.promise)
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		act(() => result.current.disconnect('account-a'))
		await act(async () => pending.resolve([event('removed')]))
		expect(result.current.accounts).toEqual([])
		expect(result.current.events).toEqual([])
		expect(readStoredCalendarAccounts()).toEqual([])
	})

	it('preserves a category edited while events are loading', async () => {
		const pending = createDeferred()
		fetchEvents.mockReturnValue(pending.promise)
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		act(() =>
			result.current.setAccountCategory(
				'account-a',
				CalendarAccountCategory.Work,
			),
		)
		await act(async () => pending.resolve([event('updated')]))
		expect(result.current.accounts[0].category).toBe(
			CalendarAccountCategory.Work,
		)
		expect(readStoredCalendarAccounts()[0].category).toBe(
			CalendarAccountCategory.Work,
		)
	})

	it('ignores an older response that arrives after a retry', async () => {
		const older = createDeferred()
		const newer = createDeferred()
		fetchEvents
			.mockReturnValueOnce(older.promise)
			.mockReturnValueOnce(newer.promise)
		const { result } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		act(() => result.current.retryEvents())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledTimes(2))
		await act(async () => newer.resolve([event('newer')]))
		await act(async () => older.resolve([event('older')]))
		expect(result.current.events.map((event) => event.id)).toEqual(['newer'])
	})

	it('does not persist an obsolete response after unmounting', async () => {
		const pending = createDeferred()
		fetchEvents.mockReturnValue(pending.promise)
		const { unmount } = renderHook(() => useCalendarConnection())
		await waitFor(() => expect(fetchEvents).toHaveBeenCalledOnce())
		unmount()
		writeStoredCalendarAccounts([])
		await act(async () => pending.resolve([event('obsolete')]))
		expect(readStoredCalendarAccounts()).toEqual([])
	})

	it('loads events after Strict Mode effect cleanup and setup', async () => {
		fetchEvents.mockResolvedValue([event('strict')])
		const { result } = renderHook(() => useCalendarConnection(), {
			wrapper: ({ children }: { children: ReactNode }) => (
				<StrictMode>{children}</StrictMode>
			),
		})
		await waitFor(() =>
			expect(result.current.events.map((event) => event.id)).toEqual([
				'strict',
			]),
		)
	})
})

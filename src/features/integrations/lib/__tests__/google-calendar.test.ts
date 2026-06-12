import { afterEach, describe, expect, it, vi } from 'vitest'

import { CalendarReauthRequiredError } from '../calendar-reauth-error'
import { fetchUpcomingGoogleCalendarEvents } from '../google-calendar'

const stubEventsResponse = (body: unknown, status = 200) => {
	const fetchMock = vi.fn(async () => ({
		json: async () => body,
		ok: status >= 200 && status <= 299,
		status,
	}))
	vi.stubGlobal('fetch', fetchMock)

	return fetchMock
}

const createGoogleEvent = (overrides: Record<string, unknown> = {}) => ({
	end: { dateTime: '2026-06-12T11:00:00+10:00' },
	htmlLink: 'https://www.google.com/calendar/event?eid=1',
	iCalUID: 'event-1@google.com',
	id: 'event-1',
	location: 'Patricia Coffee Brewers',
	start: { dateTime: '2026-06-12T10:00:00+10:00' },
	status: 'confirmed',
	summary: 'Coffee with Alex',
	...overrides,
})

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('fetchUpcomingGoogleCalendarEvents', () => {
	it('requests the primary calendar window with the access token', async () => {
		const fetchMock = stubEventsResponse({ items: [createGoogleEvent()] })

		await fetchUpcomingGoogleCalendarEvents({
			accessToken: 'access-token',
			accountId: 'google-account',
			now: new Date('2026-06-12T00:00:00Z'),
		})

		const [requestUrl, requestInit] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		]
		const url = new URL(requestUrl)

		expect(url.origin).toBe('https://www.googleapis.com')
		expect(url.pathname).toBe('/calendar/v3/calendars/primary/events')
		expect(url.searchParams.get('singleEvents')).toBe('true')
		expect(url.searchParams.get('timeMin')).toBe('2026-06-12T00:00:00.000Z')
		expect(url.searchParams.get('timeMax')).toBe('2026-06-14T00:00:00.000Z')
		expect(requestInit.headers).toMatchObject({
			Authorization: 'Bearer access-token',
		})
	})

	it('maps timed and all-day events, skipping cancelled ones', async () => {
		stubEventsResponse({
			items: [
				createGoogleEvent({
					id: 'cancelled',
					status: 'cancelled',
				}),
				createGoogleEvent({
					end: { date: '2026-06-14' },
					htmlLink: null,
					iCalUID: null,
					id: 'all-day',
					location: null,
					start: { date: '2026-06-13' },
					summary: null,
				}),
				createGoogleEvent({ id: 'timed' }),
			],
		})

		const events = await fetchUpcomingGoogleCalendarEvents({
			accessToken: 'access-token',
			accountId: 'google-account',
		})

		expect(events.map((event) => event.id)).toEqual(['timed', 'all-day'])

		const timedEvent = events[0]
		expect(timedEvent?.accountId).toBe('google-account')
		expect(timedEvent?.icalUid).toBe('event-1@google.com')
		expect(timedEvent?.isAllDay).toBe(false)
		expect(timedEvent?.location).toBe('Patricia Coffee Brewers')
		expect(timedEvent?.startTimestamp).toBe(
			new Date('2026-06-12T10:00:00+10:00').getTime(),
		)
		expect(timedEvent?.subject).toBe('Coffee with Alex')

		const allDayEvent = events[1]
		expect(allDayEvent?.isAllDay).toBe(true)
		expect(allDayEvent?.location).toBeNull()
		expect(allDayEvent?.startTimestamp).toBe(new Date(2026, 5, 13).getTime())
		expect(allDayEvent?.endTimestamp).toBe(new Date(2026, 5, 14).getTime())
		expect(allDayEvent?.subject).toBe('')
		expect(allDayEvent?.webLink).toBeNull()
	})

	it('requires reauthorisation when the access token is rejected', async () => {
		stubEventsResponse({ error: { code: 401 } }, 401)

		await expect(
			fetchUpcomingGoogleCalendarEvents({
				accessToken: 'expired-token',
				accountId: 'google-account',
			}),
		).rejects.toBeInstanceOf(CalendarReauthRequiredError)
	})

	it('throws on a malformed calendar response', async () => {
		stubEventsResponse({ items: [{ id: 'missing-fields' }] })

		await expect(
			fetchUpcomingGoogleCalendarEvents({
				accessToken: 'access-token',
				accountId: 'google-account',
			}),
		).rejects.toThrow(/Invalid calendar response/)
	})
})

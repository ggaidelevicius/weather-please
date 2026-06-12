import { afterEach, describe, expect, it, vi } from 'vitest'

import { MicrosoftReauthRequiredError } from '../microsoft-auth'
import { fetchUpcomingCalendarEvents } from '../microsoft-calendar'

const stubGraphResponse = (body: unknown, status = 200) => {
	const fetchMock = vi.fn(async () => ({
		json: async () => body,
		ok: status >= 200 && status <= 299,
		status,
	}))
	vi.stubGlobal('fetch', fetchMock)

	return fetchMock
}

const createGraphEvent = (overrides: Record<string, unknown> = {}) => ({
	end: { dateTime: '2026-06-12T11:00:00.0000000' },
	id: 'event-1',
	isAllDay: false,
	start: { dateTime: '2026-06-12T10:00:00.0000000' },
	subject: 'Standup',
	webLink: 'https://outlook.live.com/calendar/item/1',
	...overrides,
})

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('fetchUpcomingCalendarEvents', () => {
	it('requests a calendar view window with the access token and timezone', async () => {
		const fetchMock = stubGraphResponse({ value: [createGraphEvent()] })

		await fetchUpcomingCalendarEvents({
			accessToken: 'access-token',
			accountId: 'account-1',
			now: new Date('2026-06-12T00:00:00Z'),
			timeZone: 'Australia/Melbourne',
		})

		const [requestUrl, requestInit] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		]
		const url = new URL(requestUrl)

		expect(url.origin).toBe('https://graph.microsoft.com')
		expect(url.pathname).toBe('/v1.0/me/calendarView')
		expect(url.searchParams.get('startDateTime')).toBe(
			'2026-06-12T00:00:00.000Z',
		)
		expect(url.searchParams.get('endDateTime')).toBe('2026-06-14T00:00:00.000Z')
		expect(requestInit.headers).toMatchObject({
			Authorization: 'Bearer access-token',
			Prefer: 'outlook.timezone="Australia/Melbourne"',
		})
	})

	it('maps and sorts events by start time, stamping the source account', async () => {
		stubGraphResponse({
			value: [
				createGraphEvent({
					iCalUId: 'ical-later',
					id: 'later',
					location: { displayName: 'Meeting room 3' },
					start: { dateTime: '2026-06-12T15:00:00.0000000' },
				}),
				createGraphEvent({
					iCalUId: null,
					id: 'earlier',
					start: { dateTime: '2026-06-12T09:00:00.0000000' },
					subject: null,
					webLink: null,
				}),
			],
		})

		const events = await fetchUpcomingCalendarEvents({
			accessToken: 'access-token',
			accountId: 'account-1',
			timeZone: 'Australia/Melbourne',
		})

		expect(events.map((event) => event.id)).toEqual(['earlier', 'later'])
		expect(events[0]?.accountId).toBe('account-1')
		expect(events[0]?.icalUid).toBeNull()
		expect(events[0]?.location).toBeNull()
		expect(events[0]?.subject).toBe('')
		expect(events[0]?.webLink).toBeNull()
		expect(events[1]?.icalUid).toBe('ical-later')
		expect(events[1]?.location).toBe('Meeting room 3')
		expect(events[1]?.startTimestamp).toBe(
			new Date('2026-06-12T15:00:00').getTime(),
		)
	})

	it('requires reauthorisation when the access token is rejected', async () => {
		stubGraphResponse({ error: { code: 'InvalidAuthenticationToken' } }, 401)

		await expect(
			fetchUpcomingCalendarEvents({
				accessToken: 'expired-token',
				accountId: 'account-1',
				timeZone: 'Australia/Melbourne',
			}),
		).rejects.toBeInstanceOf(MicrosoftReauthRequiredError)
	})

	it('throws on a malformed calendar response', async () => {
		stubGraphResponse({ value: [{ id: 'missing-fields' }] })

		await expect(
			fetchUpcomingCalendarEvents({
				accessToken: 'access-token',
				accountId: 'account-1',
				timeZone: 'Australia/Melbourne',
			}),
		).rejects.toThrow(/Invalid calendar response/)
	})
})

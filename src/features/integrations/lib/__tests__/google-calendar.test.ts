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
	description: 'Discuss the weekend itinerary',
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
			now: Temporal.Instant.from('2026-06-12T12:00:00Z'),
		})

		const [requestUrl, requestInit] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		]
		const url = new URL(requestUrl)

		expect(url.origin).toBe('https://www.googleapis.com')
		expect(url.pathname).toBe('/calendar/v3/calendars/primary/events')
		expect(url.searchParams.get('singleEvents')).toBe('true')
		expect(url.searchParams.get('timeMin')).toBe('2026-06-12T12:00:00.000Z')
		expect(url.searchParams.get('timeMax')).toBe('2026-06-15T12:00:00.000Z')
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
					description: '   ',
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
			timeZone: 'Australia/Melbourne',
		})

		expect(events.map((event) => event.id)).toEqual(['timed', 'all-day'])

		const timedEvent = events[0]
		expect(timedEvent?.accountId).toBe('google-account')
		expect(timedEvent?.description).toBe('Discuss the weekend itinerary')
		expect(timedEvent?.icalUid).toBe('event-1@google.com')
		expect(timedEvent?.isAllDay).toBe(false)
		expect(timedEvent?.location).toBe('Patricia Coffee Brewers')
		expect(timedEvent?.startTimestamp).toBe(
			Temporal.Instant.from('2026-06-12T10:00:00+10:00').epochMilliseconds,
		)
		expect(timedEvent?.subject).toBe('Coffee with Alex')

		const allDayEvent = events[1]
		expect(allDayEvent?.description).toBeNull()
		expect(allDayEvent?.isAllDay).toBe(true)
		expect(allDayEvent?.location).toBeNull()
		expect(allDayEvent?.startTimestamp).toBe(
			Temporal.PlainDate.from('2026-06-13').toZonedDateTime(
				'Australia/Melbourne',
			).epochMilliseconds,
		)
		expect(allDayEvent?.endTimestamp).toBe(
			Temporal.PlainDate.from('2026-06-14').toZonedDateTime(
				'Australia/Melbourne',
			).epochMilliseconds,
		)
		expect(allDayEvent?.subject).toBe('')
		expect(allDayEvent?.webLink).toBeNull()
	})

	it.each([
		['2026-03-08', '2026-03-09', 23],
		['2026-11-01', '2026-11-02', 25],
	])(
		'preserves the all-day date and exclusive end across %s daylight saving',
		async (start, end, hours) => {
			stubEventsResponse({
				items: [
					createGoogleEvent({ end: { date: end }, start: { date: start } }),
				],
			})
			const [event] = await fetchUpcomingGoogleCalendarEvents({
				accessToken: 'access-token',
				accountId: 'google-account',
				timeZone: 'America/New_York',
			})
			expect(event.isAllDay).toBe(true)
			expect(
				Temporal.Instant.fromEpochMilliseconds(event.startTimestamp)
					.toZonedDateTimeISO('America/New_York')
					.toPlainDate()
					.toString(),
			).toBe(start)
			expect(
				Temporal.Instant.fromEpochMilliseconds(event.endTimestamp)
					.toZonedDateTimeISO('America/New_York')
					.toPlainDate()
					.toString(),
			).toBe(end)
			expect(event.endTimestamp - event.startTimestamp).toBe(
				hours * 60 * 60_000,
			)
		},
	)

	it('rejects invalid all-day calendar dates', async () => {
		stubEventsResponse({
			items: [
				createGoogleEvent({
					end: { date: '2026-03-01' },
					start: { date: '2026-02-30' },
				}),
			],
		})
		await expect(
			fetchUpcomingGoogleCalendarEvents({
				accessToken: 'access-token',
				accountId: 'google-account',
			}),
		).rejects.toThrow()
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

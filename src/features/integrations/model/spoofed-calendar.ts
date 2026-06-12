import type { CalendarAccountSummary } from '../hooks/use-calendar-connection'
import type { CalendarEvent } from './calendar-event'

import { CalendarAccountCategory } from './account-category'
import { mergeCalendarEvents } from './calendar-event'

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS

// Deterministic fixture data for the developer "spoof upcoming events"
// toggle, covering every time-label variant: in progress, later today,
// all-day tomorrow, tomorrow with a time, and a weekday-labelled event.
export const createSpoofedCalendarData = (): {
	accounts: CalendarAccountSummary[]
	events: CalendarEvent[]
} => {
	const now = Date.now()
	const startOfTomorrow = new Date(now + 24 * HOUR_MS)
	startOfTomorrow.setHours(0, 0, 0, 0)

	return {
		accounts: [
			{
				accountId: 'spoof-personal',
				accountLabel: 'spoof-personal@example.com',
				category: CalendarAccountCategory.Personal,
				isSessionExpired: false,
			},
			{
				accountId: 'spoof-work',
				accountLabel: 'spoof-work@example.com',
				category: CalendarAccountCategory.Work,
				isSessionExpired: false,
			},
		],
		events: mergeCalendarEvents([
			[
				{
					accountId: 'spoof-work',
					endTimestamp: now + 20 * MINUTE_MS,
					icalUid: null,
					id: 'spoof-standup',
					isAllDay: false,
					location: 'Microsoft Teams Meeting',
					startTimestamp: now - 10 * MINUTE_MS,
					subject: 'Team standup',
					webLink: 'https://outlook.live.com/calendar/',
				},
				{
					accountId: 'spoof-personal',
					endTimestamp: now + 3 * HOUR_MS,
					icalUid: null,
					id: 'spoof-dentist',
					isAllDay: false,
					location: '128 Collins St, Melbourne',
					startTimestamp: now + 2 * HOUR_MS,
					subject: 'Dentist appointment',
					webLink: null,
				},
				{
					accountId: 'spoof-work',
					endTimestamp: startOfTomorrow.getTime() + 24 * HOUR_MS,
					icalUid: null,
					id: 'spoof-conference',
					isAllDay: true,
					location: 'Sydney HQ',
					startTimestamp: startOfTomorrow.getTime(),
					subject: 'Quarterly planning offsite with a deliberately long title',
					webLink: null,
				},
				{
					accountId: 'spoof-personal',
					endTimestamp: startOfTomorrow.getTime() + 10.5 * HOUR_MS,
					icalUid: null,
					id: 'spoof-coffee',
					isAllDay: false,
					location: 'Patricia Coffee Brewers',
					startTimestamp: startOfTomorrow.getTime() + 9.5 * HOUR_MS,
					subject: 'Coffee with Alex',
					webLink: null,
				},
				{
					accountId: 'spoof-personal',
					endTimestamp: startOfTomorrow.getTime() + 26 * HOUR_MS,
					icalUid: null,
					id: 'spoof-flight',
					isAllDay: false,
					location: 'MEL T2',
					startTimestamp: startOfTomorrow.getTime() + 25 * HOUR_MS,
					subject: 'Flight to Sydney',
					webLink: null,
				},
				{
					accountId: 'spoof-work',
					endTimestamp: startOfTomorrow.getTime() + 12 * HOUR_MS,
					icalUid: null,
					id: 'spoof-one-on-one',
					isAllDay: false,
					location: 'Microsoft Teams Meeting',
					startTimestamp: startOfTomorrow.getTime() + 11.5 * HOUR_MS,
					subject: 'One-on-one with Sam',
					webLink: null,
				},
				{
					accountId: 'spoof-personal',
					endTimestamp: startOfTomorrow.getTime() + 14 * HOUR_MS,
					icalUid: null,
					id: 'spoof-gym',
					isAllDay: false,
					location: null,
					startTimestamp: startOfTomorrow.getTime() + 13 * HOUR_MS,
					subject: 'Gym session',
					webLink: null,
				},
				{
					accountId: 'spoof-work',
					endTimestamp: startOfTomorrow.getTime() + 16 * HOUR_MS,
					icalUid: null,
					id: 'spoof-design-review',
					isAllDay: false,
					location:
						'E701/Chaney Room with an unreasonably verbose location name',
					startTimestamp: startOfTomorrow.getTime() + 15 * HOUR_MS,
					subject: 'Design review',
					webLink: null,
				},
				{
					accountId: 'spoof-personal',
					endTimestamp: startOfTomorrow.getTime() + 21 * HOUR_MS,
					icalUid: null,
					id: 'spoof-dinner',
					isAllDay: false,
					location: 'Tipo 00',
					startTimestamp: startOfTomorrow.getTime() + 19 * HOUR_MS,
					subject: 'Dinner with the team after a quarter of shipping things',
					webLink: null,
				},
			],
		]),
	}
}

import type { CalendarAccountSummary } from '../hooks/use-calendar-connection'
import type { CalendarEvent } from './calendar-event'

import { getCurrentDateTime } from '../../../shared/lib/time'
import { CalendarAccountCategory } from './account-category'
import { mergeCalendarEvents } from './calendar-event'
import { CalendarProvider } from './calendar-provider'

// Deterministic fixture data for the developer "spoof upcoming events"
// toggle, covering every time-label variant: in progress, later today,
// all-day tomorrow, tomorrow with a time, and a weekday-labelled event.
export const createSpoofedCalendarData = (): {
	accounts: CalendarAccountSummary[]
	events: CalendarEvent[]
} => {
	const now = getCurrentDateTime()
	const startOfTomorrow = now.add({ days: 1 }).startOfDay()

	return {
		accounts: [
			{
				accountId: 'spoof-personal',
				accountLabel: 'spoof-personal@example.com',
				category: CalendarAccountCategory.Personal,
				isSessionExpired: false,
				provider: CalendarProvider.Google,
			},
			{
				accountId: 'spoof-work',
				accountLabel: 'spoof-work@example.com',
				category: CalendarAccountCategory.Work,
				isSessionExpired: false,
				provider: CalendarProvider.Microsoft,
			},
		],
		events: mergeCalendarEvents([
			[
				{
					accountId: 'spoof-work',
					description:
						'Share yesterday’s progress, today’s plan, and anything blocking the team.',
					endTimestamp: now.add({ minutes: 20 }).epochMilliseconds,
					icalUid: null,
					id: 'spoof-standup',
					isAllDay: false,
					location: 'Microsoft Teams Meeting',
					startTimestamp: now.subtract({ minutes: 10 }).epochMilliseconds,
					subject: 'Team standup',
					webLink: 'https://outlook.live.com/calendar/',
				},
				{
					accountId: 'spoof-personal',
					description:
						'Routine clean and check-up. Remember to bring the new insurance card.',
					endTimestamp: now.add({ hours: 3 }).epochMilliseconds,
					icalUid: null,
					id: 'spoof-dentist',
					isAllDay: false,
					location: '128 Collins St, Melbourne',
					startTimestamp: now.add({ hours: 2 }).epochMilliseconds,
					subject: 'Dentist appointment',
					webLink: null,
				},
				{
					accountId: 'spoof-work',
					description:
						'Align on next quarter’s priorities, owners, and delivery milestones.\n\nBring any open questions for the roadmap workshop.',
					endTimestamp: startOfTomorrow.add({ days: 1 }).epochMilliseconds,
					icalUid: null,
					id: 'spoof-conference',
					isAllDay: true,
					location: 'Sydney HQ',
					startTimestamp: startOfTomorrow.epochMilliseconds,
					subject: 'Quarterly planning offsite with a deliberately long title',
					webLink: null,
				},
				{
					accountId: 'spoof-personal',
					description: null,
					endTimestamp: startOfTomorrow.with({ hour: 10, minute: 30 })
						.epochMilliseconds,
					icalUid: null,
					id: 'spoof-coffee',
					isAllDay: false,
					location: 'Patricia Coffee Brewers',
					startTimestamp: startOfTomorrow.with({ hour: 9, minute: 30 })
						.epochMilliseconds,
					subject: 'Coffee with Alex',
					webLink: null,
				},
				{
					accountId: 'spoof-personal',
					description: 'Booking reference: WP1234',
					endTimestamp: startOfTomorrow.add({ days: 1 }).with({ hour: 2 })
						.epochMilliseconds,
					icalUid: null,
					id: 'spoof-flight',
					isAllDay: false,
					location: 'MEL T2',
					startTimestamp: startOfTomorrow.add({ days: 1 }).with({ hour: 1 })
						.epochMilliseconds,
					subject: 'Flight to Sydney',
					webLink: null,
				},
				{
					accountId: 'spoof-work',
					description: null,
					endTimestamp: startOfTomorrow.with({ hour: 12, minute: 0 })
						.epochMilliseconds,
					icalUid: null,
					id: 'spoof-one-on-one',
					isAllDay: false,
					location: 'Microsoft Teams Meeting',
					startTimestamp: startOfTomorrow.with({ hour: 11, minute: 30 })
						.epochMilliseconds,
					subject: 'One-on-one with Sam',
					webLink: null,
				},
				{
					accountId: 'spoof-personal',
					description: null,
					endTimestamp: startOfTomorrow.with({ hour: 14, minute: 0 })
						.epochMilliseconds,
					icalUid: null,
					id: 'spoof-gym',
					isAllDay: false,
					location: null,
					startTimestamp: startOfTomorrow.with({ hour: 13, minute: 0 })
						.epochMilliseconds,
					subject: 'Gym session',
					webLink: null,
				},
				{
					accountId: 'spoof-work',
					description:
						'Review the latest interaction flows and agree on what is ready for engineering.',
					endTimestamp: startOfTomorrow.with({ hour: 16, minute: 0 })
						.epochMilliseconds,
					icalUid: null,
					id: 'spoof-design-review',
					isAllDay: false,
					location:
						'E701/Chaney Room with an unreasonably verbose location name',
					startTimestamp: startOfTomorrow.with({ hour: 15, minute: 0 })
						.epochMilliseconds,
					subject: 'Design review',
					webLink: null,
				},
				{
					accountId: 'spoof-personal',
					description: null,
					endTimestamp: startOfTomorrow.with({ hour: 21, minute: 0 })
						.epochMilliseconds,
					icalUid: null,
					id: 'spoof-dinner',
					isAllDay: false,
					location: 'Tipo 00',
					startTimestamp: startOfTomorrow.with({ hour: 19, minute: 0 })
						.epochMilliseconds,
					subject: 'Dinner with the team after a quarter of shipping things',
					webLink: null,
				},
			],
		]),
	}
}

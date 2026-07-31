import type { ReactNode } from 'react'

import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CalendarEvent } from '../../model/calendar-event'

import { UpcomingEvents } from '../upcoming-events'

class ResizeObserverMock {
	disconnect = vi.fn()
	observe = vi.fn()
	unobserve = vi.fn()
}

vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('UpcomingEvents', () => {
	it('expands descriptions in place and omits the control when none exists', () => {
		vi.stubGlobal('ResizeObserver', ResizeObserverMock)

		render(
			<UpcomingEvents
				accounts={[]}
				events={[
					createEvent({
						description: 'Review progress and anything blocking the team.',
						id: 'described-event',
						location: 'Meeting room 3',
						subject: 'Team standup',
						webLink: 'https://calendar.example/events/described-event',
					}),
					createEvent({
						description: null,
						id: 'event-without-description',
						startTimestamp: Date.now() + 7_200_000,
						subject: 'Coffee with Alex',
					}),
				]}
				locale="en"
			/>,
		)

		expect(
			screen.queryByText('Review progress and anything blocking the team.'),
		).not.toBeInTheDocument()

		const descriptionButton = screen.getByRole('button', {
			name: 'Event description',
		})
		expect(descriptionButton).toHaveAttribute('aria-expanded', 'false')
		expect(screen.getAllByRole('button')).toHaveLength(1)

		const sourceLink = screen.getByRole('link', {
			name: 'View source event',
		})
		expect(sourceLink).toHaveAttribute(
			'href',
			'https://calendar.example/events/described-event',
		)
		expect(sourceLink).not.toHaveTextContent('Team standup')
		expect(screen.getByText('Meeting room 3')).toBeInTheDocument()

		fireEvent.click(descriptionButton)

		expect(descriptionButton).toHaveAttribute('aria-expanded', 'true')
		expect(
			screen.getByText('Review progress and anything blocking the team.'),
		).toBeInTheDocument()
	})
})

const createEvent = (
	overrides: Partial<CalendarEvent> = {},
): CalendarEvent => ({
	accountId: 'account-1',
	description: null,
	endTimestamp: Date.now() + 3_600_000,
	icalUid: null,
	id: 'event-1',
	isAllDay: false,
	location: null,
	startTimestamp: Date.now() + 1_800_000,
	subject: 'Calendar event',
	webLink: null,
	...overrides,
})

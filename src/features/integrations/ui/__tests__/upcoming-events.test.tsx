import type { ReactNode } from 'react'

import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CalendarEvent } from '../../model/calendar-event'

import {
	getCurrentTimestamp,
	getSystemTimeZone,
} from '../../../../shared/lib/time'
import { UpcomingEvents } from '../upcoming-events'

class ResizeObserverMock implements ResizeObserver {
	static instances: ResizeObserverMock[] = []
	readonly observedElements = new Set<Element>()
	disconnect = vi.fn(() => this.observedElements.clear())
	observe = vi.fn((target: Element) => this.observedElements.add(target))
	unobserve = vi.fn((target: Element) => this.observedElements.delete(target))

	constructor(private readonly callback: ResizeObserverCallback) {
		ResizeObserverMock.instances.push(this)
	}

	notify(target: Element) {
		if (this.observedElements.has(target)) {
			this.callback([], this)
		}
	}
}

vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

beforeEach(() => {
	vi.stubGlobal('ResizeObserver', ResizeObserverMock)
})

afterEach(() => {
	ResizeObserverMock.instances = []
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe('UpcomingEvents', () => {
	it('expands descriptions in place and omits the control when none exists', () => {
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
						startTimestamp: getCurrentTimestamp() + 7_200_000,
						subject: 'Coffee with Alex',
					}),
				]}
				locale="en"
			/>,
		)

		expect(
			screen.getByRole('region', { name: 'Upcoming calendar events' }),
		).toBeInTheDocument()
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

	it('groups tomorrow by the viewer calendar date across a daylight-saving change', () => {
		const timeZone = 'America/New_York'
		const now = Temporal.ZonedDateTime.from(`2026-03-07T23:30[${timeZone}]`)
		vi.spyOn(Temporal.Now, 'instant').mockReturnValue(now.toInstant())
		vi.spyOn(Temporal.Now, 'timeZoneId').mockReturnValue(timeZone)
		const appointment = Temporal.ZonedDateTime.from(
			`2026-03-08T09:30[${timeZone}]`,
		)
		render(
			<UpcomingEvents
				accounts={[]}
				events={[
					createEvent({
						endTimestamp: appointment.add({ hours: 1 }).epochMilliseconds,
						startTimestamp: appointment.epochMilliseconds,
					}),
				]}
				locale="en-US"
			/>,
		)

		expect(screen.getByText('Tomorrow • March 8')).toBeInTheDocument()
		expect(screen.getByText('9:30 AM')).toBeInTheDocument()
		expect(screen.getByText('1h')).toBeInTheDocument()
	})

	it('keeps the overflow fade in sync when events are replaced and regrouped without changing their count', () => {
		const instant = Temporal.PlainDateTime.from('2026-09-20T08:00')
			.toZonedDateTime(getSystemTimeZone())
			.toInstant()
		const now = instant.epochMilliseconds
		vi.spyOn(Temporal.Now, 'instant').mockReturnValue(instant)
		const { rerender, unmount } = render(
			<UpcomingEvents
				accounts={[]}
				events={[createEvent({ id: 'original-event' })]}
				locale="en"
			/>,
		)
		const section = screen.getByRole('region', {
			name: 'Upcoming calendar events',
		})
		const originalCard = screen.getByRole('article')
		const originalHeading = screen.getByText(/^Today/)
		const resizeObserver = ResizeObserverMock.instances.find((observer) =>
			observer.observedElements.has(originalCard),
		)
		if (!resizeObserver) {
			throw new Error('The calendar event must be observed for size changes.')
		}
		expect(resizeObserver.observedElements).toEqual(new Set(section.children))

		let contentHeight = 500
		Object.defineProperties(section, {
			clientHeight: { configurable: true, value: 300 },
			scrollHeight: { configurable: true, get: () => contentHeight },
		})
		act(() => resizeObserver.notify(originalCard))
		expect(section.className).toContain('mask-[')

		rerender(
			<UpcomingEvents
				accounts={[]}
				events={[
					createEvent({
						endTimestamp: now + 90_000_000,
						id: 'replacement-event',
						startTimestamp: now + 86_400_000,
					}),
				]}
				locale="en"
			/>,
		)
		const replacementCard = screen.getByRole('article')
		expect(replacementCard).not.toBe(originalCard)
		expect(screen.getByText(/^Tomorrow/)).toBeInTheDocument()
		expect(resizeObserver.observedElements).not.toContain(originalCard)
		expect(resizeObserver.observedElements).not.toContain(originalHeading)
		expect(resizeObserver.observedElements).toEqual(new Set(section.children))
		expect(resizeObserver.disconnect).not.toHaveBeenCalled()

		contentHeight = 200
		act(() => resizeObserver.notify(replacementCard))
		expect(section.className).not.toContain('mask-[')

		unmount()
		expect(resizeObserver.observedElements.size).toBe(0)
		expect(resizeObserver.disconnect).toHaveBeenCalledOnce()
	})
})

const createEvent = (
	overrides: Partial<CalendarEvent> = {},
): CalendarEvent => ({
	accountId: 'account-1',
	description: null,
	endTimestamp: getCurrentTimestamp() + 3_600_000,
	icalUid: null,
	id: 'event-1',
	isAllDay: false,
	location: null,
	startTimestamp: getCurrentTimestamp() + 1_800_000,
	subject: 'Calendar event',
	webLink: null,
	...overrides,
})

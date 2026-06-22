import type { ReactNode } from 'react'

import { Trans } from '@lingui/react/macro'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { Fragment, useEffect, useRef, useState } from 'react'

import type { CalendarAccountSummary } from '../hooks/use-calendar-connection'
import type { CalendarEvent } from '../model/calendar-event'

import {
	CALENDAR_ACCOUNT_CATEGORY_STYLES,
	CalendarAccountCategory,
} from '../model/account-category'

const NOW_TICK_INTERVAL_MS = 60_000

const EVENT_CARD_CLASS_NAME =
	'flex w-full items-center gap-3 rounded-xl border border-white/10 bg-dark-950/70 p-3 shadow-sm backdrop-blur-md'

export const UpcomingEvents = ({
	accounts,
	events,
	locale,
}: Readonly<{
	accounts: CalendarAccountSummary[]
	events: CalendarEvent[]
	locale: string
}>) => {
	// Tabs can stay open well past an event's start, so the reference time
	// ticks every minute to keep labels honest and drop events that ended.
	const [now, setNow] = useState(() => Date.now())
	const [hasMoreBelow, setHasMoreBelow] = useState(false)
	const sectionRef = useRef<HTMLElement | null>(null)
	const visibleEvents = events.filter((event) => event.endTimestamp > now)
	const hasVisibleEvents = visibleEvents.length > 0
	const visibleEventCount = visibleEvents.length

	useEffect(() => {
		const tickInterval = setInterval(() => {
			setNow(Date.now())
		}, NOW_TICK_INTERVAL_MS)

		return () => {
			clearInterval(tickInterval)
		}
	}, [])

	// The section lives inside the main view frame, whose native wheel/touch
	// listeners switch between weather views. Scroll gestures over the events
	// must stay within the list, so propagation is stopped before they reach
	// the frame. React's synthetic handlers attach at the root and would fire
	// too late for this.
	useEffect(() => {
		const section = sectionRef.current
		if (!hasVisibleEvents || !section) {
			return
		}

		const stopPropagation = (event: Event) => {
			event.stopPropagation()
		}
		const eventNames = ['wheel', 'touchstart', 'touchend'] as const
		for (const eventName of eventNames) {
			section.addEventListener(eventName, stopPropagation, { passive: true })
		}

		const updateBottomOverflow = () => {
			setHasMoreBelow(
				section.scrollTop + section.clientHeight < section.scrollHeight - 1,
			)
		}
		section.addEventListener('scroll', updateBottomOverflow, { passive: true })
		const initialMeasureFrame = requestAnimationFrame(updateBottomOverflow)

		return () => {
			for (const eventName of eventNames) {
				section.removeEventListener(eventName, stopPropagation)
			}
			section.removeEventListener('scroll', updateBottomOverflow)
			cancelAnimationFrame(initialMeasureFrame)
		}
	}, [hasVisibleEvents, visibleEventCount])

	if (!hasVisibleEvents) {
		return null
	}

	const accountsById = new Map(
		accounts.map((account) => [account.accountId, account]),
	)
	const dayGroups = groupEventsByDay({ events: visibleEvents, now })

	return (
		<motion.section
			animate={{ opacity: 1, x: 0 }}
			aria-label="Upcoming calendar events"
			className={clsx(
				'flex max-h-[calc(100svh-8rem)] w-80 max-w-[calc(100vw-2rem)] [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent] flex-col items-stretch gap-2 overflow-y-auto overscroll-contain pr-1',
				hasMoreBelow &&
					'[mask-image:linear-gradient(to_bottom,black_calc(100%-3rem),transparent)]',
			)}
			initial={{ opacity: 0, x: 8 }}
			ref={sectionRef}
			transition={{ duration: 0.3 }}
		>
			{dayGroups.map((dayGroup) => (
				<Fragment key={dayGroup.dayStartTimestamp}>
					<p className="px-1 pt-1 text-xs font-semibold tracking-wide text-dark-100">
						{getDayHeadingLabel({
							dayStartTimestamp: dayGroup.dayStartTimestamp,
							locale,
							now,
						})}
					</p>
					{dayGroup.events.map((event) => (
						<EventCard
							account={accountsById.get(event.accountId)}
							event={event}
							key={`${event.accountId}:${event.id}`}
							locale={locale}
							now={now}
						/>
					))}
				</Fragment>
			))}
		</motion.section>
	)
}

const EventCard = ({
	account,
	event,
	locale,
	now,
}: Readonly<{
	account: CalendarAccountSummary | undefined
	event: CalendarEvent
	locale: string
	now: number
}>) => {
	const category = account?.category ?? CalendarAccountCategory.Personal
	const durationLabel = event.isAllDay
		? null
		: formatDurationLabel(event.startTimestamp, event.endTimestamp)
	const cardContent = (
		<>
			<div className="w-16 shrink-0">
				<p className="text-sm font-semibold whitespace-nowrap text-white tabular-nums">
					{getEventTimeLabel({ event, locale, now })}
				</p>
				{durationLabel ? (
					<p className="text-xs text-dark-200 tabular-nums">{durationLabel}</p>
				) : null}
			</div>
			<span
				aria-hidden
				className={clsx(
					'w-1 shrink-0 self-stretch rounded-full',
					CALENDAR_ACCOUNT_CATEGORY_STYLES[category].dotClassName,
				)}
			/>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold break-words text-white">
					{event.subject || <Trans>Untitled event</Trans>}
				</p>
				{event.location ? (
					<p className="text-xs break-words text-dark-200">{event.location}</p>
				) : null}
			</div>
		</>
	)

	return event.webLink ? (
		<a
			className={`${EVENT_CARD_CLASS_NAME} transition hover:border-white/25`}
			href={event.webLink}
			rel="noopener noreferrer"
			target="_blank"
			title={account?.accountLabel ?? undefined}
		>
			{cardContent}
		</a>
	) : (
		<div
			className={EVENT_CARD_CLASS_NAME}
			title={account?.accountLabel ?? undefined}
		>
			{cardContent}
		</div>
	)
}

type DayGroup = {
	dayStartTimestamp: number
	events: CalendarEvent[]
}

// Events already running are grouped under today, regardless of when they
// started, since that is when they are actionable.
const groupEventsByDay = ({
	events,
	now,
}: Readonly<{
	events: CalendarEvent[]
	now: number
}>): DayGroup[] => {
	const dayGroups: DayGroup[] = []

	for (const event of events) {
		const effectiveStart = Math.max(event.startTimestamp, now)
		const dayStart = new Date(effectiveStart)
		dayStart.setHours(0, 0, 0, 0)
		const dayStartTimestamp = dayStart.getTime()
		const currentGroup = dayGroups[dayGroups.length - 1]

		if (currentGroup?.dayStartTimestamp === dayStartTimestamp) {
			currentGroup.events.push(event)
		} else {
			dayGroups.push({ dayStartTimestamp, events: [event] })
		}
	}

	return dayGroups
}

const getDayHeadingLabel = ({
	dayStartTimestamp,
	locale,
	now,
}: Readonly<{
	dayStartTimestamp: number
	locale: string
	now: number
}>): ReactNode => {
	const day = new Date(dayStartTimestamp)
	const dateLabel = new Intl.DateTimeFormat(locale, {
		day: 'numeric',
		month: 'long',
	}).format(day)

	if (isSameDay(day, new Date(now))) {
		return <Trans>Today • {dateLabel}</Trans>
	}

	if (isSameDay(day, addDays(new Date(now), 1))) {
		return <Trans>Tomorrow • {dateLabel}</Trans>
	}

	return `${new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(day)} • ${dateLabel}`
}

const getEventTimeLabel = ({
	event,
	locale,
	now,
}: Readonly<{
	event: CalendarEvent
	locale: string
	now: number
}>): ReactNode => {
	if (event.isAllDay) {
		return <Trans>All day</Trans>
	}

	if (event.startTimestamp <= now) {
		return <Trans>Now</Trans>
	}

	return formatEventTime(new Date(event.startTimestamp), locale)
}

const formatDurationLabel = (
	startTimestamp: number,
	endTimestamp: number,
): string => {
	const totalMinutes = Math.round((endTimestamp - startTimestamp) / 60_000)
	const hours = Math.floor(totalMinutes / 60)
	const minutes = totalMinutes % 60

	if (hours === 0) {
		return `${minutes}m`
	}

	return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

const formatEventTime = (date: Date, locale: string) =>
	new Intl.DateTimeFormat(locale, {
		hour: 'numeric',
		minute: '2-digit',
	}).format(date)

const isSameDay = (a: Date, b: Date) =>
	a.getFullYear() === b.getFullYear() &&
	a.getMonth() === b.getMonth() &&
	a.getDate() === b.getDate()

const addDays = (date: Date, days: number) => {
	const nextDate = new Date(date)
	nextDate.setDate(nextDate.getDate() + days)

	return nextDate
}

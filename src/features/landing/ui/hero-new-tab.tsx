import type { ReactNode } from 'react'

import {
	IconArrowLeft,
	IconArrowRight,
	IconPlus,
	IconPuzzle,
	IconReload,
} from '@tabler/icons-react'
import { clsx } from 'clsx'
import { useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

import type { Data } from '../../weather/model/types'

import { createSpoofedCalendarData } from '../../integrations/model/spoofed-calendar'
import { UpcomingEvents } from '../../integrations/ui/upcoming-events'
import { Hemisphere } from '../../seasonal-events/core/types'
import { TileIdentifier } from '../../settings/model/tile-identifier'
import { TemperatureUnit, UnitSystem } from '../../settings/model/unit-system'
import { Tile } from '../../weather/ui/tile'
import { HERO_FORECAST_LOCATION } from '../model/hero-location'
import { SiteLogo } from './site-logo'

export const HERO_TAB_OPEN_DELAY_MS = 1850

export const HeroNewTab = ({ forecast }: Readonly<{ forecast: Data }>) => {
	const shouldReduceMotion = useReducedMotion()
	const [scene, setScene] = useState<'idle' | 'open' | 'playing'>('idle')
	const [calendarData] = useState(createSpoofedCalendarData)
	const isOpen = scene === 'open'

	useEffect(() => {
		// Below lg the browser toolbar is cropped away, so there's no cursor to
		// wait for.
		const isCursorVisible = window.matchMedia(BROWSER_CHROME_QUERY).matches
		if (shouldReduceMotion || !isCursorVisible) {
			const frameId = window.requestAnimationFrame(() => setScene('open'))
			return () => window.cancelAnimationFrame(frameId)
		}

		const frameId = window.requestAnimationFrame(() => setScene('playing'))
		const timeoutId = window.setTimeout(
			() => setScene('open'),
			HERO_TAB_OPEN_DELAY_MS,
		)

		return () => {
			window.cancelAnimationFrame(frameId)
			window.clearTimeout(timeoutId)
		}
	}, [shouldReduceMotion])

	return (
		<div
			aria-label="Weather Please open in a new browser tab, showing a three-day forecast and upcoming calendar events"
			className="@container relative mx-auto mt-10 h-(--hero-frame-height) w-[calc(100%-2rem)] max-w-248 overflow-hidden rounded-t-2xl border border-b-0 border-white/8 bg-dark-800 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)] [--hero-frame-height:20rem] [--hero-scale:0.6] sm:mt-14 sm:w-[calc(100%-3rem)] sm:[--hero-frame-height:24rem] sm:[--hero-scale:0.7] lg:w-[calc(100%-6rem)] lg:[--hero-frame-height:35rem] lg:[--hero-scale:tan(atan2(100cqw,1600px))]"
			data-hero-new-tab={scene}
			role="img"
		>
			{/* Laid out at a 1600px desktop size and scaled to fit, so the tiles stay
			    centred exactly as in the app. Below lg, the window is cropped to the
			    tiles instead. */}
			<div
				className="pointer-events-none absolute top-0 left-1/2 flex h-[calc(var(--hero-frame-height)/var(--hero-scale))] w-400 origin-top -translate-x-1/2 scale-(--hero-scale) flex-col select-none"
				inert
			>
				<div className="flex h-10.5 shrink-0 items-end gap-0.5 bg-[#18191b] px-2.5 max-lg:hidden">
					<BrowserTab
						icon={<span className="size-4 rounded bg-[#5f6368]" />}
						isActive={!isOpen}
						label="Inbox"
					/>
					<BrowserTab
						className={clsx(
							'transition-[width,opacity,padding] duration-200 ease-out',
							!isOpen && 'w-0! px-0! opacity-0',
						)}
						icon={<SiteLogo size={16} />}
						isActive={isOpen}
						label="New tab"
					/>
					<div className="relative ml-1 flex size-7.5 items-center justify-center self-center rounded-full text-[#bdc1c6]">
						{scene === 'playing' && (
							<>
								<span className="absolute inset-0 animate-hero-new-tab-hover rounded-full bg-white/12" />
								<HeroCursor />
							</>
						)}
						<IconPlus className="relative" size={18} />
					</div>
				</div>
				<div className="flex h-11 shrink-0 items-center gap-4 bg-[#35363a] px-3.5 text-[#9aa0a6] max-lg:hidden">
					<IconArrowLeft size={16} />
					<IconArrowRight size={16} />
					<IconReload size={16} />
					<div
						className={clsx(
							'flex h-7.5 flex-1 items-center rounded-full bg-[#202124] px-3.5 text-[13px]',
							isOpen && 'ring-2 ring-[#8ab4f8]',
						)}
					>
						Search Google or type a URL
					</div>
					<IconPuzzle size={16} />
				</div>
				<div className="relative flex-1 bg-dark-800">
					{isOpen ? (
						<>
							<div className="absolute inset-0 flex items-center justify-center gap-5">
								{forecast.map((day, index) => (
									<div className="w-64" key={day.day}>
										<Tile
											{...day}
											delayBaseline={
												shouldReduceMotion ? 0 : TILE_DELAY_SECONDS
											}
											hemisphere={Hemisphere.Southern}
											identifier={TileIdentifier.Day}
											index={index}
											isSeasonalEventBackgroundEnabled={isSeasonalEventDisabled}
											isSeasonalEventEnabled={isSeasonalEventDisabled}
											onToggleSeasonalEvent={ignoreSeasonalEventToggle}
											onToggleSeasonalEventBackground={
												ignoreSeasonalEventToggle
											}
											showSeasonalEvents={false}
											showSeasonalTileGlow={false}
											temperatureUnit={TemperatureUnit.Celsius}
											timeZone={HERO_FORECAST_LOCATION.timeZone}
											unitSystem={UnitSystem.Metric}
										/>
									</div>
								))}
							</div>
							<div className="absolute top-6 right-5.5 max-lg:hidden">
								<UpcomingEvents
									accounts={calendarData.accounts}
									events={calendarData.events.slice(0, HERO_EVENT_COUNT)}
									locale="en"
								/>
							</div>
						</>
					) : (
						<PreviousPage />
					)}
				</div>
			</div>
		</div>
	)
}

// Matches Tailwind's lg breakpoint, where the browser toolbar appears.
const BROWSER_CHROME_QUERY = '(min-width: 64rem)'

// Tiles start their entrance just after the tab opens, on the cursor's press.
const TILE_DELAY_SECONDS = 0.1
// Enough to show the calendar without crowding the tiles.
const HERO_EVENT_COUNT = 3

const isSeasonalEventDisabled = () => false
const ignoreSeasonalEventToggle = () => undefined

const BrowserTab = ({
	className,
	icon,
	isActive,
	label,
}: Readonly<{
	className?: string
	icon: ReactNode
	isActive: boolean
	label: string
}>) => (
	<div
		className={clsx(
			'flex h-8.5 w-52.5 items-center gap-2 overflow-hidden rounded-t-[10px] px-3 text-[12.5px] whitespace-nowrap',
			isActive ? 'bg-[#35363a] text-[#e8eaed]' : 'text-[#9aa0a6]',
			className,
		)}
	>
		<span className="flex shrink-0">{icon}</span>
		{label}
	</div>
)

const HeroCursor = () => (
	<svg
		aria-hidden="true"
		className="absolute top-1/2 left-1/2 z-10 h-6.5 w-4.5 origin-top-left animate-hero-cursor drop-shadow-sm"
		fill="black"
		stroke="white"
		strokeLinejoin="round"
		strokeWidth="1.25"
		viewBox="0 0 18 26"
	>
		<path d="M1 1v20l5.2-5 4.2 8.6 3.4-1.7-4.2-8.3H17L1 1Z" />
	</svg>
)

const PreviousPage = () => (
	<div className="absolute inset-0 flex flex-col gap-3.5 bg-[#1f1f1f] px-12 py-9 max-lg:hidden">
		{PREVIOUS_PAGE_LINE_WIDTHS.map((width, index) => (
			<span
				className="h-3.5 rounded-md bg-[#2c2c2c] first:h-5.5"
				key={index}
				style={{ width }}
			/>
		))}
	</div>
)

const PREVIOUS_PAGE_LINE_WIDTHS = [
	'30%',
	'92%',
	'88%',
	'95%',
	'60%',
	'90%',
	'84%',
	'70%',
]

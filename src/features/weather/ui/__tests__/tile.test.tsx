import type { ComponentProps, ReactNode } from 'react'

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import type { SeasonalEvent } from '../../../seasonal-events/core/types'

import {
	Hemisphere,
	SeasonalEventId,
} from '../../../seasonal-events/core/types'
import { TileIdentifier } from '../../../settings/model/tile-identifier'
import {
	TemperatureUnit,
	UnitSystem,
} from '../../../settings/model/unit-system'
import { Tile } from '../tile'

const seasonalModule = vi.hoisted(() => ({
	getSeasonalEventForDate:
		vi.fn<(options: { date: Temporal.PlainDate }) => null | SeasonalEvent>(),
	ready: Promise.withResolvers<void>(),
}))

vi.mock('../../../seasonal-events/core/seasonal-events-module', async () => {
	await seasonalModule.ready.promise
	return { getSeasonalEventForDate: seasonalModule.getSeasonalEventForDate }
})

vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('next/image', () => ({ default: () => null }))

vi.mock('framer-motion', () => ({
	animate: () => ({ stop: vi.fn() }),
	motion: {
		div: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	},
	useMotionTemplate: () => '',
	useMotionValue: () => 0,
}))

vi.mock('../../../../shared/ui/seasonal-event-modal', () => ({
	SeasonalEventModal: ({
		children,
		isOpen,
	}: {
		children: ReactNode
		isOpen: boolean
	}) => (isOpen ? <dialog open>{children}</dialog> : null),
}))

afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
})

it('discards pending seasonal details while disabled and keeps the dialog closed when enabled again', async () => {
	seasonalModule.getSeasonalEventForDate.mockReturnValue({
		id: SeasonalEventId.ChristmasDay,
		isActive: () => true,
		run: async () => () => {},
	})
	const props = createTileProps()
	const { rerender } = render(<Tile {...props} />)
	rerender(<Tile {...props} showSeasonalEvents={false} />)
	await act(async () => {
		seasonalModule.ready.resolve()
		await vi.dynamicImportSettled()
	})
	expect(seasonalModule.getSeasonalEventForDate).not.toHaveBeenCalled()
	expect(screen.queryByRole('button', { name: 'Christmas Day' })).toBeNull()

	rerender(<Tile {...props} />)
	fireEvent.click(await screen.findByRole('button', { name: 'Christmas Day' }))
	expect(screen.getByRole('dialog')).toBeInTheDocument()

	rerender(<Tile {...props} showSeasonalEvents={false} />)
	expect(screen.queryByRole('dialog')).toBeNull()
	expect(screen.queryByRole('button', { name: 'Christmas Day' })).toBeNull()

	rerender(<Tile {...props} />)
	expect(
		await screen.findByRole('button', { name: 'Christmas Day' }),
	).toHaveAttribute('aria-expanded', 'false')
	expect(screen.queryByRole('dialog')).toBeNull()
})

it.each(['Pacific/Auckland', 'Pacific/Fiji', 'America/Los_Angeles'])(
	'keeps Perth forecast dates when the visitor is in %s',
	(visitorTimeZone) => {
		vi.spyOn(Temporal.Now, 'timeZoneId').mockReturnValue(visitorTimeZone)

		render(
			<Tile
				{...createTileProps()}
				day={PERTH_MONDAY_MIDNIGHT}
				showSeasonalEvents={false}
				timeZone="Australia/Perth"
			/>,
		)

		expect(screen.getByText('Monday')).toBeInTheDocument()
		expect(screen.getByText('19 October')).toBeInTheDocument()
	},
)

it('keeps using the visitor timezone when no timezone is provided', () => {
	vi.spyOn(Temporal.Now, 'timeZoneId').mockReturnValue('America/Los_Angeles')

	render(
		<Tile
			{...createTileProps()}
			day={PERTH_MONDAY_MIDNIGHT}
			showSeasonalEvents={false}
		/>,
	)

	expect(screen.getByText('Sunday')).toBeInTheDocument()
	expect(screen.getByText('18 October')).toBeInTheDocument()
})

it('uses the displayed date for seasonal events when the timezone changes', async () => {
	vi.spyOn(Temporal.Now, 'timeZoneId').mockReturnValue('America/Los_Angeles')
	seasonalModule.getSeasonalEventForDate.mockReturnValue(null)
	const props = { ...createTileProps(), day: PERTH_MONDAY_MIDNIGHT }
	const { rerender } = render(<Tile {...props} timeZone="Australia/Perth" />)

	await act(async () => {
		seasonalModule.ready.resolve()
		await vi.dynamicImportSettled()
	})
	expect(
		seasonalModule.getSeasonalEventForDate.mock.calls
			.at(-1)?.[0]
			.date.toString(),
	).toBe('2026-10-19')

	await act(async () => {
		rerender(<Tile {...props} timeZone="America/Los_Angeles" />)
	})

	expect(screen.getByText('Sunday')).toBeInTheDocument()
	expect(
		seasonalModule.getSeasonalEventForDate.mock.calls
			.at(-1)?.[0]
			.date.toString(),
	).toBe('2026-10-18')
})

const PERTH_MONDAY_MIDNIGHT =
	Temporal.PlainDate.from('2026-10-19').toZonedDateTime({
		timeZone: 'Australia/Perth',
	}).epochMilliseconds / 1000

const createTileProps = (): ComponentProps<typeof Tile> => ({
	day: Temporal.Instant.from('2026-12-25T12:00:00Z').epochMilliseconds / 1_000,
	delayBaseline: 0,
	description: 0,
	hemisphere: Hemisphere.Northern,
	identifier: TileIdentifier.Day,
	index: 0,
	isSeasonalEventBackgroundEnabled: () => true,
	isSeasonalEventEnabled: () => true,
	max: 25,
	min: 15,
	onToggleSeasonalEvent: vi.fn(),
	onToggleSeasonalEventBackground: vi.fn(),
	rain: 0,
	showSeasonalEvents: true,
	showSeasonalTileGlow: false,
	temperatureUnit: TemperatureUnit.Celsius,
	unitSystem: UnitSystem.Metric,
	uv: 0,
	wind: 0,
})

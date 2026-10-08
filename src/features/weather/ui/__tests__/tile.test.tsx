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
	getSeasonalEventForDate: vi.fn<() => null | SeasonalEvent>(),
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

afterEach(cleanup)

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

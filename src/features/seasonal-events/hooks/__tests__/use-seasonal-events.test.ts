import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	Hemisphere,
	SEASONAL_EVENT_OVERRIDE_NONE,
	SeasonalEventId,
} from '../../core/types'
import { useSeasonalEvents } from '../use-seasonal-events'

const effects = vi.hoisted(() => ({
	run: vi.fn<
		(params: {
			eventId: SeasonalEventId
			hemisphere?: Hemisphere
		}) => Promise<() => void>
	>(),
}))

vi.mock('../../core/seasonal-events-module', async (importOriginal) => ({
	...(await importOriginal<
		typeof import('../../core/seasonal-events-module')
	>()),
	runSeasonalEvent: effects.run,
}))

vi.mock('../../core/utils', () => ({
	isLikelySoftwareRenderer: () => false,
}))

describe('seasonal event hemisphere changes', () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] })
		vi.setSystemTime(new Date(2026, 11, 25, 12))
		effects.run.mockReset()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it.each([false, true])(
		'replaces Christmas in either direction with preview enabled: %s',
		async (hasOverride) => {
			if (hasOverride) vi.setSystemTime(new Date(2026, 5, 15, 12))
			const cleanupNorth = vi.fn()
			const cleanupSouth = vi.fn()
			const cleanupNorthAgain = vi.fn()
			effects.run
				.mockResolvedValueOnce(cleanupNorth)
				.mockResolvedValueOnce(cleanupSouth)
				.mockResolvedValueOnce(cleanupNorthAgain)
			const { rerender, unmount } = renderHook(
				({ hemisphere }) =>
					useSeasonalEvents({
						hemisphere,
						isEnabled: true,
						seasonalEventOverride: hasOverride
							? SeasonalEventId.ChristmasDay
							: SEASONAL_EVENT_OVERRIDE_NONE,
					}),
				{ initialProps: { hemisphere: Hemisphere.Northern } },
			)

			await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
			expect(effects.run).toHaveBeenLastCalledWith({
				eventId: SeasonalEventId.ChristmasDay,
				hemisphere: Hemisphere.Northern,
			})

			rerender({ hemisphere: Hemisphere.Southern })
			await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(2))
			expect(effects.run).toHaveBeenLastCalledWith({
				eventId: SeasonalEventId.ChristmasDay,
				hemisphere: Hemisphere.Southern,
			})
			expect(cleanupNorth).toHaveBeenCalledOnce()
			expect(cleanupSouth).not.toHaveBeenCalled()

			rerender({ hemisphere: Hemisphere.Northern })
			await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(3))
			expect(effects.run).toHaveBeenLastCalledWith({
				eventId: SeasonalEventId.ChristmasDay,
				hemisphere: Hemisphere.Northern,
			})
			expect(cleanupSouth).toHaveBeenCalledOnce()

			await act(async () => rerender({ hemisphere: Hemisphere.Northern }))
			expect(effects.run).toHaveBeenCalledTimes(3)
			expect(cleanupNorthAgain).not.toHaveBeenCalled()

			unmount()
			expect(cleanupNorthAgain).toHaveBeenCalledOnce()
		},
	)

	it('uses the northern Christmas scene when hemisphere is unavailable', async () => {
		const cleanup = vi.fn()
		effects.run.mockResolvedValue(cleanup)
		const { unmount } = renderHook(() => useSeasonalEvents({ isEnabled: true }))

		await waitFor(() =>
			expect(effects.run).toHaveBeenCalledWith({
				eventId: SeasonalEventId.ChristmasDay,
				hemisphere: Hemisphere.Northern,
			}),
		)

		unmount()
		expect(cleanup).toHaveBeenCalledOnce()
	})

	it.each([false, true])(
		'keeps unrelated effects running with preview enabled: %s',
		async (hasOverride) => {
			vi.setSystemTime(new Date(2026, 0, 1, 12))
			const cleanup = vi.fn()
			effects.run.mockResolvedValue(cleanup)
			const { rerender, unmount } = renderHook(
				({ hemisphere }) =>
					useSeasonalEvents({
						hemisphere,
						isEnabled: true,
						seasonalEventOverride: hasOverride
							? SeasonalEventId.NewYearsDay
							: SEASONAL_EVENT_OVERRIDE_NONE,
					}),
				{ initialProps: { hemisphere: Hemisphere.Northern } },
			)

			await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
			expect(effects.run).toHaveBeenLastCalledWith({
				eventId: SeasonalEventId.NewYearsDay,
				hemisphere: undefined,
			})

			await act(async () => rerender({ hemisphere: Hemisphere.Southern }))
			expect(effects.run).toHaveBeenCalledOnce()
			expect(cleanup).not.toHaveBeenCalled()

			unmount()
			expect(cleanup).toHaveBeenCalledOnce()
		},
	)

	it('cleans up a previous hemisphere that finishes loading after a switch', async () => {
		const cleanupNorth = vi.fn()
		const cleanupSouth = vi.fn()
		let resolveNorth: (cleanup: () => void) => void = () => {}
		effects.run
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveNorth = resolve
					}),
			)
			.mockResolvedValueOnce(cleanupSouth)
		const { rerender, unmount } = renderHook(
			({ hemisphere }) => useSeasonalEvents({ hemisphere, isEnabled: true }),
			{ initialProps: { hemisphere: Hemisphere.Northern } },
		)

		await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
		rerender({ hemisphere: Hemisphere.Southern })
		await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(2))
		await act(async () => resolveNorth(cleanupNorth))

		expect(cleanupNorth).toHaveBeenCalledOnce()
		expect(cleanupSouth).not.toHaveBeenCalled()
		unmount()
		expect(cleanupSouth).toHaveBeenCalledOnce()
	})
})

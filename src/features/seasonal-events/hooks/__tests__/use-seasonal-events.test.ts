import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SeasonalBackground } from '../../core/types'

import {
	Hemisphere,
	SEASONAL_BACKGROUND_AUTOMATIC,
	SEASONAL_EVENT_OVERRIDE_NONE,
	SeasonalEventId,
} from '../../core/types'
import { useSeasonalEvents } from '../use-seasonal-events'

const effects = vi.hoisted(() => ({
	isSoftwareRenderer: vi.fn<() => boolean>(),
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
	isLikelySoftwareRenderer: effects.isSoftwareRenderer,
}))

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] })
	vi.setSystemTime(atLocalTime('2026-12-25T12:00:00'))
	effects.isSoftwareRenderer.mockReset().mockReturnValue(false)
	effects.run.mockReset().mockResolvedValue(vi.fn())
})

afterEach(() => {
	vi.restoreAllMocks()
	vi.useRealTimers()
})

describe('seasonal calendar midnight', () => {
	it.each([
		['2026-03-08T05:00:00Z', 23],
		['2026-11-01T04:00:00Z', 25],
	] as const)(
		'schedules the next local midnight from %s after %i hours',
		async (instant, hours) => {
			vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
			vi.spyOn(Temporal.Now, 'timeZoneId').mockReturnValue('America/New_York')
			vi.setSystemTime(Temporal.Instant.from(instant).epochMilliseconds)
			const schedule = vi.spyOn(globalThis, 'setTimeout')
			const { unmount } = renderHook(() =>
				useSeasonalEvents({ isEnabled: true }),
			)
			await act(async () => {})
			expect(schedule).toHaveBeenCalledWith(
				expect.any(Function),
				hours * 60 * 60 * 1000,
			)
			unmount()
			expect(vi.getTimerCount()).toBe(0)
		},
	)

	it('changes the calendar at local midnight even when the next day contains a clock change', async () => {
		await import('../../core/seasonal-events-module')
		vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
		vi.spyOn(Temporal.Now, 'timeZoneId').mockReturnValue('America/New_York')
		vi.setSystemTime(
			Temporal.Instant.from('2026-11-01T03:59:59Z').epochMilliseconds,
		)
		const enabledEvents = new Set([
			SeasonalEventId.DayOfTheDead,
			SeasonalEventId.Halloween,
		])
		const { result, unmount } = renderHook(() =>
			useSeasonalEvents({ enabledEvents, isEnabled: true }),
		)
		await act(async () => {})
		expect(result.current).toBe(SeasonalEventId.Halloween)
		await act(async () => vi.advanceTimersByTimeAsync(1_000))
		expect(result.current).toBe(SeasonalEventId.DayOfTheDead)
		unmount()
		expect(vi.getTimerCount()).toBe(0)
	})
})

describe('seasonal event hemisphere changes', () => {
	it.each([false, true])(
		'replaces Christmas in either direction with preview enabled: %s',
		async (hasOverride) => {
			if (hasOverride) vi.setSystemTime(atLocalTime('2026-06-15T12:00:00'))
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
			vi.setSystemTime(atLocalTime('2026-01-01T12:00:00'))
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

describe('permanent seasonal backgrounds', () => {
	it.each([false, true])(
		'runs outside its season with every event disabled and seasonal events enabled: %s',
		async (isEnabled) => {
			vi.setSystemTime(atLocalTime('2026-06-15T12:00:00'))
			const { result, unmount } = renderHook(() =>
				useSeasonalEvents({
					enabledEvents: new Set(),
					isEnabled,
					seasonalBackground: SeasonalEventId.Halloween,
				}),
			)

			await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
			expect(result.current).toBe(SeasonalEventId.Halloween)
			expect(effects.run).toHaveBeenCalledWith({
				eventId: SeasonalEventId.Halloween,
				hemisphere: undefined,
			})
			unmount()
		},
	)

	it.each([SEASONAL_EVENT_OVERRIDE_NONE, SeasonalEventId.NewYearsDay])(
		'takes priority over the calendar and seasonal preview: %s',
		async (seasonalEventOverride) => {
			const { result, unmount } = renderHook(() =>
				useSeasonalEvents({
					isEnabled: true,
					seasonalBackground: SeasonalEventId.Halloween,
					seasonalEventOverride,
				}),
			)

			await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
			expect(result.current).toBe(SeasonalEventId.Halloween)
			expect(effects.run).toHaveBeenCalledWith({
				eventId: SeasonalEventId.Halloween,
				hemisphere: undefined,
			})
			unmount()
		},
	)

	it('switches from automatic to a permanent background and back', async () => {
		const cleanupChristmas = vi.fn()
		const cleanupHalloween = vi.fn()
		const cleanupChristmasAgain = vi.fn()
		effects.run
			.mockResolvedValueOnce(cleanupChristmas)
			.mockResolvedValueOnce(cleanupHalloween)
			.mockResolvedValueOnce(cleanupChristmasAgain)
		const { rerender, result, unmount } = renderHook(
			({ seasonalBackground }: { seasonalBackground: SeasonalBackground }) =>
				useSeasonalEvents({ isEnabled: true, seasonalBackground }),
			{
				initialProps: {
					seasonalBackground:
						SEASONAL_BACKGROUND_AUTOMATIC as SeasonalBackground,
				},
			},
		)

		await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
		expect(result.current).toBe(SeasonalEventId.ChristmasDay)
		rerender({ seasonalBackground: SeasonalEventId.Halloween })
		await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(2))
		expect(cleanupChristmas).toHaveBeenCalledOnce()
		expect(result.current).toBe(SeasonalEventId.Halloween)

		rerender({ seasonalBackground: SEASONAL_BACKGROUND_AUTOMATIC })
		await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(3))
		expect(result.current).toBe(SeasonalEventId.ChristmasDay)
		expect(cleanupHalloween).toHaveBeenCalledOnce()
		expect(effects.run).toHaveBeenLastCalledWith({
			eventId: SeasonalEventId.ChristmasDay,
			hemisphere: Hemisphere.Northern,
		})
		unmount()
		expect(cleanupChristmasAgain).toHaveBeenCalledOnce()
	})

	it('keeps the same effect running when switching between automatic and permanent', async () => {
		const cleanup = vi.fn()
		effects.run.mockResolvedValue(cleanup)
		const { rerender, unmount } = renderHook(
			({ seasonalBackground }: { seasonalBackground: SeasonalBackground }) =>
				useSeasonalEvents({ isEnabled: true, seasonalBackground }),
			{
				initialProps: {
					seasonalBackground:
						SEASONAL_BACKGROUND_AUTOMATIC as SeasonalBackground,
				},
			},
		)

		await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
		await act(async () =>
			rerender({ seasonalBackground: SeasonalEventId.ChristmasDay }),
		)
		await act(async () =>
			rerender({ seasonalBackground: SEASONAL_BACKGROUND_AUTOMATIC }),
		)

		expect(effects.run).toHaveBeenCalledOnce()
		expect(cleanup).not.toHaveBeenCalled()
		unmount()
		expect(cleanup).toHaveBeenCalledOnce()
	})

	it('can return to a previously selected background after cleaning up each scene', async () => {
		const cleanupHalloween = vi.fn()
		const cleanupEarthDay = vi.fn()
		const cleanupHalloweenAgain = vi.fn()
		effects.run
			.mockResolvedValueOnce(cleanupHalloween)
			.mockResolvedValueOnce(cleanupEarthDay)
			.mockResolvedValueOnce(cleanupHalloweenAgain)
		const { rerender, unmount } = renderHook(
			({ seasonalBackground }) =>
				useSeasonalEvents({ isEnabled: false, seasonalBackground }),
			{ initialProps: { seasonalBackground: SeasonalEventId.Halloween } },
		)

		await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
		rerender({ seasonalBackground: SeasonalEventId.EarthDay })
		await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(2))
		expect(cleanupHalloween).toHaveBeenCalledOnce()
		rerender({ seasonalBackground: SeasonalEventId.Halloween })
		await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(3))
		expect(cleanupEarthDay).toHaveBeenCalledOnce()
		expect(effects.run).toHaveBeenLastCalledWith({
			eventId: SeasonalEventId.Halloween,
			hemisphere: undefined,
		})
		unmount()
		expect(cleanupHalloweenAgain).toHaveBeenCalledOnce()
	})

	it('keeps its scene when seasonal preferences change and stops on disabled automatic mode', async () => {
		const cleanup = vi.fn()
		effects.run.mockResolvedValue(cleanup)
		const { rerender, result, unmount } = renderHook(
			({
				enabledEvents,
				isEnabled,
				seasonalBackground,
			}: {
				enabledEvents: Set<SeasonalEventId>
				isEnabled: boolean
				seasonalBackground: SeasonalBackground
			}) => useSeasonalEvents({ enabledEvents, isEnabled, seasonalBackground }),
			{
				initialProps: {
					enabledEvents: new Set([SeasonalEventId.ChristmasDay]),
					isEnabled: true,
					seasonalBackground: SeasonalEventId.Halloween as SeasonalBackground,
				},
			},
		)

		await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
		await act(async () =>
			rerender({
				enabledEvents: new Set(),
				isEnabled: false,
				seasonalBackground: SeasonalEventId.Halloween,
			}),
		)
		expect(result.current).toBe(SeasonalEventId.Halloween)
		expect(effects.run).toHaveBeenCalledOnce()
		expect(cleanup).not.toHaveBeenCalled()

		await act(async () =>
			rerender({
				enabledEvents: new Set(),
				isEnabled: false,
				seasonalBackground: SEASONAL_BACKGROUND_AUTOMATIC,
			}),
		)
		expect(result.current).toBeNull()
		expect(effects.run).toHaveBeenCalledOnce()
		expect(cleanup).toHaveBeenCalledOnce()
		unmount()
		expect(cleanup).toHaveBeenCalledOnce()
	})

	it('starts the saved background again after remounting', async () => {
		const cleanupBefore = vi.fn()
		const cleanupAfter = vi.fn()
		effects.run
			.mockResolvedValueOnce(cleanupBefore)
			.mockResolvedValueOnce(cleanupAfter)
		const renderBackground = () =>
			renderHook(() =>
				useSeasonalEvents({
					isEnabled: false,
					seasonalBackground: SeasonalEventId.Halloween,
				}),
			)
		const first = renderBackground()
		await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
		first.unmount()
		expect(cleanupBefore).toHaveBeenCalledOnce()

		const second = renderBackground()
		await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(2))
		expect(second.result.current).toBe(SeasonalEventId.Halloween)
		expect(cleanupAfter).not.toHaveBeenCalled()
		second.unmount()
		expect(cleanupAfter).toHaveBeenCalledOnce()
	})

	it('cleans up a background that finishes loading after a different selection starts', async () => {
		const cleanupHalloween = vi.fn()
		const cleanupEarthDay = vi.fn()
		let resolveHalloween: (cleanup: () => void) => void = () => {}
		effects.run
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveHalloween = resolve
					}),
			)
			.mockResolvedValueOnce(cleanupEarthDay)
		const { rerender, unmount } = renderHook(
			({ seasonalBackground }) =>
				useSeasonalEvents({ isEnabled: false, seasonalBackground }),
			{ initialProps: { seasonalBackground: SeasonalEventId.Halloween } },
		)

		await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
		rerender({ seasonalBackground: SeasonalEventId.EarthDay })
		await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(2))
		await act(async () => resolveHalloween(cleanupHalloween))

		expect(cleanupHalloween).toHaveBeenCalledOnce()
		expect(cleanupEarthDay).not.toHaveBeenCalled()
		unmount()
		expect(cleanupEarthDay).toHaveBeenCalledOnce()
	})

	it.each(['isHydrated', 'isOnboarded'] as const)(
		'waits for %s and cleans up if it becomes unavailable',
		async (gate) => {
			const cleanup = vi.fn()
			effects.run.mockResolvedValue(cleanup)
			const { rerender, result, unmount } = renderHook(
				({ isReady }) =>
					useSeasonalEvents({
						[gate]: isReady,
						isEnabled: false,
						seasonalBackground: SeasonalEventId.Halloween,
					}),
				{ initialProps: { isReady: false } },
			)

			await act(async () => {})
			expect(result.current).toBeNull()
			expect(effects.run).not.toHaveBeenCalled()
			rerender({ isReady: true })
			await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
			expect(result.current).toBe(SeasonalEventId.Halloween)
			rerender({ isReady: false })
			expect(result.current).toBeNull()
			expect(cleanup).toHaveBeenCalledOnce()
			unmount()
		},
	)

	it('does not start a permanent scene with a software renderer', async () => {
		effects.isSoftwareRenderer.mockReturnValue(true)
		const { unmount } = renderHook(() =>
			useSeasonalEvents({
				isEnabled: false,
				seasonalBackground: SeasonalEventId.Halloween,
			}),
		)

		await act(async () => {})
		expect(effects.run).not.toHaveBeenCalled()
		unmount()
	})

	it('keeps the selected background through midnight and restores the current calendar on automatic', async () => {
		vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
		vi.setSystemTime(atLocalTime('2026-12-31T23:59:59'))
		const cleanupHalloween = vi.fn()
		const cleanupNewYears = vi.fn()
		effects.run
			.mockResolvedValueOnce(cleanupHalloween)
			.mockResolvedValueOnce(cleanupNewYears)
		const { rerender, result, unmount } = renderHook(
			({ seasonalBackground }: { seasonalBackground: SeasonalBackground }) =>
				useSeasonalEvents({ isEnabled: true, seasonalBackground }),
			{
				initialProps: {
					seasonalBackground: SeasonalEventId.Halloween as SeasonalBackground,
				},
			},
		)

		await act(async () => {})
		expect(effects.run).toHaveBeenCalledOnce()
		await act(async () => vi.advanceTimersByTimeAsync(1_000))
		expect(result.current).toBe(SeasonalEventId.Halloween)
		expect(effects.run).toHaveBeenCalledOnce()
		expect(cleanupHalloween).not.toHaveBeenCalled()

		await act(async () =>
			rerender({ seasonalBackground: SEASONAL_BACKGROUND_AUTOMATIC }),
		)
		expect(result.current).toBe(SeasonalEventId.NewYearsDay)
		expect(effects.run).toHaveBeenCalledTimes(2)
		expect(effects.run).toHaveBeenLastCalledWith({
			eventId: SeasonalEventId.NewYearsDay,
			hemisphere: undefined,
		})
		expect(cleanupHalloween).toHaveBeenCalledOnce()
		unmount()
		expect(cleanupNewYears).toHaveBeenCalledOnce()
		expect(vi.getTimerCount()).toBe(0)
	})

	it('uses today when automatic seasonal events are enabled after several days', async () => {
		const { rerender, result, unmount } = renderHook(
			({
				isEnabled,
				seasonalBackground,
			}: {
				isEnabled: boolean
				seasonalBackground: SeasonalBackground
			}) => useSeasonalEvents({ isEnabled, seasonalBackground }),
			{
				initialProps: {
					isEnabled: false,
					seasonalBackground: SeasonalEventId.Halloween as SeasonalBackground,
				},
			},
		)

		await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
		vi.setSystemTime(atLocalTime('2027-01-01T12:00:00'))
		rerender({
			isEnabled: true,
			seasonalBackground: SEASONAL_BACKGROUND_AUTOMATIC,
		})
		await waitFor(() =>
			expect(result.current).toBe(SeasonalEventId.NewYearsDay),
		)
		expect(effects.run).toHaveBeenCalledTimes(2)
		expect(effects.run).toHaveBeenLastCalledWith({
			eventId: SeasonalEventId.NewYearsDay,
			hemisphere: undefined,
		})
		unmount()
	})
})

describe('permanent backgrounds with seasonal priority', () => {
	it('does not restart an expired holiday when seasonal events are enabled again', async () => {
		const enabledEvents = new Set([SeasonalEventId.ChristmasDay])
		const cleanupChristmas = vi.fn()
		effects.run.mockResolvedValueOnce(cleanupChristmas)
		const { rerender, result, unmount } = renderHook(
			({ isEnabled }) =>
				useSeasonalEvents({
					enabledEvents,
					isEnabled,
					seasonalBackground: SeasonalEventId.Halloween,
					shouldPreferSeasonalBackgrounds: true,
				}),
			{ initialProps: { isEnabled: true } },
		)

		await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
		expect(result.current).toBe(SeasonalEventId.ChristmasDay)
		rerender({ isEnabled: false })
		await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(2))
		expect(result.current).toBe(SeasonalEventId.Halloween)
		expect(cleanupChristmas).toHaveBeenCalledOnce()

		vi.setSystemTime(atLocalTime('2026-12-26T12:00:00'))
		await act(async () => rerender({ isEnabled: true }))
		expect(result.current).toBe(SeasonalEventId.Halloween)
		expect(
			effects.run.mock.calls.filter(
				([{ eventId }]) => eventId === SeasonalEventId.ChristmasDay,
			),
		).toHaveLength(1)
		expect(effects.run).toHaveBeenLastCalledWith({
			eventId: SeasonalEventId.Halloween,
			hemisphere: undefined,
		})
		unmount()
	})

	it.each(['isHydrated', 'isOnboarded'] as const)(
		'discards an expired holiday before %s becomes ready again',
		async (readinessOption) => {
			const enabledEvents = new Set([SeasonalEventId.ChristmasDay])
			const cleanupChristmas = vi.fn()
			effects.run.mockResolvedValueOnce(cleanupChristmas)
			const { rerender, result, unmount } = renderHook(
				({ isReady }) =>
					useSeasonalEvents({
						enabledEvents,
						isEnabled: true,
						[readinessOption]: isReady,
						seasonalBackground: SeasonalEventId.Halloween,
						shouldPreferSeasonalBackgrounds: true,
					}),
				{ initialProps: { isReady: true } },
			)
			await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
			rerender({ isReady: false })
			expect(result.current).toBeNull()
			expect(cleanupChristmas).toHaveBeenCalledOnce()

			vi.setSystemTime(atLocalTime('2026-12-28T12:00:00'))
			rerender({ isReady: true })
			expect(result.current).toBeNull()
			await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(2))
			expect(result.current).toBe(SeasonalEventId.Halloween)
			expect(effects.run).toHaveBeenLastCalledWith({
				eventId: SeasonalEventId.Halloween,
				hemisphere: undefined,
			})
			unmount()
		},
	)

	it('starts only the seasonal scene when loading on an enabled holiday', async () => {
		const cleanup = vi.fn()
		effects.run.mockResolvedValue(cleanup)
		const { result, unmount } = renderHook(() =>
			useSeasonalEvents({
				isEnabled: true,
				seasonalBackground: SeasonalEventId.Halloween,
				shouldPreferSeasonalBackgrounds: true,
			}),
		)

		await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
		expect(result.current).toBe(SeasonalEventId.ChristmasDay)
		expect(effects.run).toHaveBeenCalledWith({
			eventId: SeasonalEventId.ChristmasDay,
			hemisphere: Hemisphere.Northern,
		})
		unmount()
		expect(cleanup).toHaveBeenCalledOnce()
	})

	it('yields at midnight and restores the latest manual selection after the holiday', async () => {
		vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
		vi.setSystemTime(atLocalTime('2026-12-31T23:59:59'))
		const cleanupHalloween = vi.fn()
		const cleanupNewYears = vi.fn()
		const cleanupEarthDay = vi.fn()
		const enabledEvents = new Set([SeasonalEventId.NewYearsDay])
		effects.run
			.mockResolvedValueOnce(cleanupHalloween)
			.mockResolvedValueOnce(cleanupNewYears)
			.mockResolvedValueOnce(cleanupEarthDay)
		const { rerender, result, unmount } = renderHook(
			({ seasonalBackground }) =>
				useSeasonalEvents({
					enabledEvents,
					isEnabled: true,
					seasonalBackground,
					shouldPreferSeasonalBackgrounds: true,
				}),
			{ initialProps: { seasonalBackground: SeasonalEventId.Halloween } },
		)

		await act(async () => {})
		expect(result.current).toBe(SeasonalEventId.Halloween)
		expect(effects.run).toHaveBeenCalledOnce()
		await act(async () => vi.advanceTimersByTimeAsync(1_000))
		expect(result.current).toBe(SeasonalEventId.NewYearsDay)
		expect(effects.run).toHaveBeenCalledTimes(2)
		expect(cleanupHalloween).toHaveBeenCalledOnce()
		expect(effects.run).toHaveBeenLastCalledWith({
			eventId: SeasonalEventId.NewYearsDay,
			hemisphere: undefined,
		})

		await act(async () =>
			rerender({ seasonalBackground: SeasonalEventId.EarthDay }),
		)
		expect(result.current).toBe(SeasonalEventId.NewYearsDay)
		expect(effects.run).toHaveBeenCalledTimes(2)
		expect(cleanupNewYears).not.toHaveBeenCalled()

		await act(async () => vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1_000))
		expect(result.current).toBe(SeasonalEventId.EarthDay)
		expect(effects.run).toHaveBeenCalledTimes(3)
		expect(cleanupNewYears).toHaveBeenCalledOnce()
		expect(effects.run).toHaveBeenLastCalledWith({
			eventId: SeasonalEventId.EarthDay,
			hemisphere: undefined,
		})
		unmount()
		expect(cleanupEarthDay).toHaveBeenCalledOnce()
		expect(vi.getTimerCount()).toBe(0)
	})

	it('switches between the chosen and seasonal backgrounds when priority changes', async () => {
		const cleanupHalloween = vi.fn()
		const cleanupChristmas = vi.fn()
		const cleanupHalloweenAgain = vi.fn()
		effects.run
			.mockResolvedValueOnce(cleanupHalloween)
			.mockResolvedValueOnce(cleanupChristmas)
			.mockResolvedValueOnce(cleanupHalloweenAgain)
		const { rerender, result, unmount } = renderHook(
			({ shouldPreferSeasonalBackgrounds }) =>
				useSeasonalEvents({
					isEnabled: true,
					seasonalBackground: SeasonalEventId.Halloween,
					shouldPreferSeasonalBackgrounds,
				}),
			{ initialProps: { shouldPreferSeasonalBackgrounds: false } },
		)

		await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
		expect(result.current).toBe(SeasonalEventId.Halloween)
		rerender({ shouldPreferSeasonalBackgrounds: true })
		await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(2))
		expect(result.current).toBe(SeasonalEventId.ChristmasDay)
		expect(cleanupHalloween).toHaveBeenCalledOnce()
		expect(effects.run).toHaveBeenLastCalledWith({
			eventId: SeasonalEventId.ChristmasDay,
			hemisphere: Hemisphere.Northern,
		})

		rerender({ shouldPreferSeasonalBackgrounds: false })
		await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(3))
		expect(result.current).toBe(SeasonalEventId.Halloween)
		expect(cleanupChristmas).toHaveBeenCalledOnce()
		unmount()
		expect(cleanupHalloweenAgain).toHaveBeenCalledOnce()
	})

	it.each([SeasonalEventId.ChristmasDay, SEASONAL_BACKGROUND_AUTOMATIC])(
		'keeps the same scene running when priority changes with background: %s',
		async (seasonalBackground) => {
			const cleanup = vi.fn()
			effects.run.mockResolvedValue(cleanup)
			const { rerender, result, unmount } = renderHook(
				({ shouldPreferSeasonalBackgrounds }) =>
					useSeasonalEvents({
						isEnabled: true,
						seasonalBackground,
						shouldPreferSeasonalBackgrounds,
					}),
				{ initialProps: { shouldPreferSeasonalBackgrounds: false } },
			)

			await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
			expect(result.current).toBe(SeasonalEventId.ChristmasDay)
			await act(async () => rerender({ shouldPreferSeasonalBackgrounds: true }))
			expect(result.current).toBe(SeasonalEventId.ChristmasDay)
			await act(async () =>
				rerender({ shouldPreferSeasonalBackgrounds: false }),
			)
			expect(result.current).toBe(SeasonalEventId.ChristmasDay)
			expect(effects.run).toHaveBeenCalledOnce()
			expect(cleanup).not.toHaveBeenCalled()
			unmount()
			expect(cleanup).toHaveBeenCalledOnce()
		},
	)

	it.each([
		{
			enabledEvents: new Set([SeasonalEventId.ChristmasDay]),
			isEnabled: false,
			name: 'the master switch',
		},
		{
			enabledEvents: new Set<SeasonalEventId>(),
			isEnabled: true,
			name: 'the individual seasonal event',
		},
	])(
		'restores the chosen background when $name is disabled',
		async ({ enabledEvents, isEnabled }) => {
			const cleanupHalloween = vi.fn()
			const cleanupChristmas = vi.fn()
			const cleanupHalloweenAgain = vi.fn()
			effects.run
				.mockResolvedValueOnce(cleanupHalloween)
				.mockResolvedValueOnce(cleanupChristmas)
				.mockResolvedValueOnce(cleanupHalloweenAgain)
			const { rerender, result, unmount } = renderHook(
				(props) =>
					useSeasonalEvents({
						...props,
						seasonalBackground: SeasonalEventId.Halloween,
						shouldPreferSeasonalBackgrounds: true,
					}),
				{ initialProps: { enabledEvents, isEnabled } },
			)

			await waitFor(() => expect(effects.run).toHaveBeenCalledOnce())
			expect(result.current).toBe(SeasonalEventId.Halloween)
			rerender({
				enabledEvents: new Set([SeasonalEventId.ChristmasDay]),
				isEnabled: true,
			})
			await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(2))
			expect(result.current).toBe(SeasonalEventId.ChristmasDay)
			expect(cleanupHalloween).toHaveBeenCalledOnce()
			rerender({ enabledEvents, isEnabled })
			await waitFor(() => expect(effects.run).toHaveBeenCalledTimes(3))
			expect(result.current).toBe(SeasonalEventId.Halloween)
			expect(cleanupChristmas).toHaveBeenCalledOnce()
			unmount()
			expect(cleanupHalloweenAgain).toHaveBeenCalledOnce()
		},
	)
})

const atLocalTime = (dateTime: string) =>
	Temporal.PlainDateTime.from(dateTime).toZonedDateTime(
		Temporal.Now.timeZoneId(),
	).epochMilliseconds

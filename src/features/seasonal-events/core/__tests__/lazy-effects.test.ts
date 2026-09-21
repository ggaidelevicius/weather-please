import { describe, expect, it, vi } from 'vitest'

import {
	getSeasonalEventForDate,
	runSeasonalEvent,
} from '../seasonal-events-module'
import { Hemisphere, SeasonalEventId } from '../types'

const effect = vi.hoisted(() => ({
	cleanup: vi.fn(),
	isLoaded: false,
	launch: vi.fn(),
}))

vi.mock('../../events/christmas', () => {
	effect.isLoaded = true
	return { launchChristmasScene: effect.launch }
})

describe('seasonal effect loading', () => {
	it('loads an animation only when it runs and preserves cleanup', async () => {
		effect.launch.mockResolvedValue(effect.cleanup)
		const event = getSeasonalEventForDate({ date: new Date(2026, 11, 25) })
		expect(event?.id).toBe(SeasonalEventId.ChristmasDay)
		expect(effect.isLoaded).toBe(false)
		const cleanup = await runSeasonalEvent({
			eventId: SeasonalEventId.ChristmasDay,
		})
		expect(effect.isLoaded).toBe(true)
		expect(effect.launch).toHaveBeenCalledOnce()
		expect(effect.launch).toHaveBeenCalledWith({
			hemisphere: Hemisphere.Northern,
		})
		cleanup()
		expect(effect.cleanup).toHaveBeenCalledOnce()
	})

	it('passes the southern hemisphere to the Christmas renderer', async () => {
		await runSeasonalEvent({
			eventId: SeasonalEventId.ChristmasDay,
			hemisphere: Hemisphere.Southern,
		})

		expect(effect.launch).toHaveBeenLastCalledWith({
			hemisphere: Hemisphere.Southern,
		})
	})
})

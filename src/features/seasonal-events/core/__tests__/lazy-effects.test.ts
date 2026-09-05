import { describe, expect, it, vi } from 'vitest'

import {
	getSeasonalEventForDate,
	runSeasonalEvent,
} from '../seasonal-events-module'
import { SeasonalEventId } from '../types'

const effect = vi.hoisted(() => ({
	isLoaded: false,
	cleanup: vi.fn(),
	launch: vi.fn(),
}))

vi.mock('../../events/christmas', () => {
	effect.isLoaded = true
	return { launchChristmasSnowfall: effect.launch }
})

describe('seasonal effect loading', () => {
	it('loads an animation only when it runs and preserves cleanup', async () => {
		effect.launch.mockResolvedValue(effect.cleanup)
		const event = getSeasonalEventForDate({ date: new Date(2026, 11, 25) })
		expect(event?.id).toBe(SeasonalEventId.ChristmasDay)
		expect(effect.isLoaded).toBe(false)
		const cleanup = await runSeasonalEvent(SeasonalEventId.ChristmasDay)
		expect(effect.isLoaded).toBe(true)
		expect(effect.launch).toHaveBeenCalledOnce()
		cleanup()
		expect(effect.cleanup).toHaveBeenCalledOnce()
	})
})

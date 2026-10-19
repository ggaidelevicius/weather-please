import { act, cleanup, render, screen } from '@testing-library/react'
import { useReducedMotion } from 'framer-motion'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HERO_TAB_OPEN_DELAY_MS, HeroNewTab } from '../hero-new-tab'

vi.mock('framer-motion', () => ({
	useReducedMotion: vi.fn(() => false),
}))

vi.mock('../../../weather/ui/tile', () => ({
	Tile: ({ delayBaseline, max }: { delayBaseline: number; max: number }) => (
		<div data-delay={delayBaseline} data-testid="tile">
			{max}
		</div>
	),
}))

vi.mock('../../../integrations/ui/upcoming-events', () => ({
	UpcomingEvents: () => <div data-testid="upcoming-events" />,
}))

const forecast = [
	{ day: 1, description: 2, max: 21, min: 11, rain: 10, uv: 6, wind: 14 },
	{ day: 2, description: 1, max: 24, min: 13, rain: 0, uv: 7, wind: 11 },
	{ day: 3, description: 51, max: 17, min: 10, rain: 70, uv: 3, wind: 22 },
]

const stubScreenWidth = ({ isLarge }: { isLarge: boolean }) =>
	vi.stubGlobal(
		'matchMedia',
		vi.fn(() => ({ matches: isLarge })),
	)

beforeEach(() => {
	vi.useFakeTimers()
	vi.mocked(useReducedMotion).mockReturnValue(false)
	stubScreenWidth({ isLarge: true })
})

afterEach(() => {
	cleanup()
	vi.useRealTimers()
	vi.unstubAllGlobals()
})

describe('HeroNewTab', () => {
	it('opens the new tab when the cursor presses the new tab button', () => {
		render(<HeroNewTab forecast={forecast} />)
		const frame = screen.getByRole('img', { name: /new browser tab/i })

		act(() => {
			vi.advanceTimersToNextFrame()
		})
		expect(frame).toHaveAttribute('data-hero-new-tab', 'playing')
		expect(screen.queryByTestId('tile')).not.toBeInTheDocument()

		act(() => {
			vi.advanceTimersByTime(HERO_TAB_OPEN_DELAY_MS)
		})
		expect(frame).toHaveAttribute('data-hero-new-tab', 'open')
		expect(
			screen.getAllByTestId('tile').map((tile) => tile.textContent),
		).toEqual(['21', '24', '17'])
		expect(screen.getByTestId('upcoming-events')).toBeInTheDocument()
	})

	it('skips the cursor and opens straight away with reduced motion', () => {
		vi.mocked(useReducedMotion).mockReturnValue(true)
		render(<HeroNewTab forecast={forecast} />)

		act(() => {
			vi.advanceTimersToNextFrame()
		})

		expect(screen.getByRole('img')).toHaveAttribute('data-hero-new-tab', 'open')
		expect(screen.getAllByTestId('tile')[0]).toHaveAttribute('data-delay', '0')
	})

	it('opens straight away below lg, where the cursor is cropped out', () => {
		stubScreenWidth({ isLarge: false })
		render(<HeroNewTab forecast={forecast} />)

		act(() => {
			vi.advanceTimersToNextFrame()
		})

		expect(screen.getByRole('img')).toHaveAttribute('data-hero-new-tab', 'open')
	})
})

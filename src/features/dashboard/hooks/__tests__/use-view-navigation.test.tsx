import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useViewNavigation } from '../use-view-navigation'

beforeEach(() => {
	vi.useFakeTimers()
	localStorage.clear()
})

afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
	vi.useRealTimers()
})

describe('useViewNavigation', () => {
	it('reads current availability and selected view without replacing the wheel listener', () => {
		const addListener = vi.spyOn(HTMLElement.prototype, 'addEventListener')
		const removeListener = vi.spyOn(
			HTMLElement.prototype,
			'removeEventListener',
		)
		const { rerender, unmount } = render(<Navigation isAvailable={false} />)
		const frame = screen.getByTestId('frame')

		expect(dispatchWheel(frame)).toBe(false)
		expect(screen.getByTestId('active-view')).toHaveTextContent('forecast')

		rerender(<Navigation isAvailable />)
		expect(dispatchWheel(frame)).toBe(true)
		expect(screen.getByTestId('active-view')).toHaveTextContent('temperature')
		act(() => vi.advanceTimersByTime(301))
		dispatchWheel(frame)
		expect(screen.getByTestId('active-view')).toHaveTextContent('precipitation')

		fireEvent.click(screen.getByRole('button', { name: 'Wind' }))
		act(() => vi.advanceTimersByTime(301))
		dispatchWheel(frame)
		expect(screen.getByTestId('active-view')).toHaveTextContent('air-quality')

		rerender(<Navigation isAvailable={false} />)
		expect(dispatchWheel(frame)).toBe(false)
		expect(screen.getByTestId('active-view')).toHaveTextContent('forecast')
		const registrations = addListener.mock.calls.filter(
			([type], index) =>
				type === 'wheel' && addListener.mock.contexts[index] === frame,
		)
		expect(registrations).toHaveLength(1)
		expect(registrations[0]?.[2]).toEqual({ passive: false })

		unmount()
		expect(removeListener).toHaveBeenCalledWith('wheel', registrations[0]?.[1])
		expect(vi.getTimerCount()).toBe(0)
	})

	it('ignores wheel momentum but accepts a fresh impulse after the cooldown', () => {
		render(<Navigation isAvailable />)
		const frame = screen.getByTestId('frame')
		dispatchWheel(frame, 100)
		expect(screen.getByTestId('active-view')).toHaveTextContent('temperature')

		for (const delta of [80, 50, 20, 10]) {
			act(() => vi.advanceTimersByTime(100))
			dispatchWheel(frame, delta)
		}
		expect(screen.getByTestId('active-view')).toHaveTextContent('temperature')

		dispatchWheel(frame, 100)
		expect(screen.getByTestId('active-view')).toHaveTextContent('precipitation')
		act(() => vi.advanceTimersByTime(301))
		dispatchWheel(frame, -100)
		expect(screen.getByTestId('active-view')).toHaveTextContent('temperature')
	})

	it('leaves horizontal and tiny wheel gestures untouched', () => {
		render(<Navigation isAvailable />)
		const frame = screen.getByTestId('frame')
		expect(dispatchWheel(frame, 0.5)).toBe(false)
		expect(dispatchWheel(frame, 30, 40)).toBe(false)
		expect(screen.getByTestId('active-view')).toHaveTextContent('forecast')
	})
})

const Navigation = ({ isAvailable }: { isAvailable: boolean }) => {
	const { activeAvailableViewId, handleViewIndicatorSelect, viewFrameRef } =
		useViewNavigation({ canShowNext24HoursView: isAvailable })
	return (
		<main data-testid="frame" ref={viewFrameRef}>
			<output data-testid="active-view">{activeAvailableViewId}</output>
			<button onClick={() => handleViewIndicatorSelect('wind')}>Wind</button>
		</main>
	)
}

const dispatchWheel = (frame: HTMLElement, deltaY = 100, deltaX = 0) => {
	const event = new WheelEvent('wheel', {
		bubbles: true,
		cancelable: true,
		deltaX,
		deltaY,
	})
	act(() => frame.dispatchEvent(event))
	return event.defaultPrevented
}

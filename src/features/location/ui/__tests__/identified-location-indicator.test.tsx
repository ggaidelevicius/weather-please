import type { ReactNode } from 'react'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AsyncStatus } from '../../../../shared/hooks/async-status'
import { useIdentifiedLocation } from '../../hooks/use-identified-location'
import { IdentifiedLocationIndicator } from '../identified-location-indicator'

vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('../../hooks/use-identified-location', () => ({
	useIdentifiedLocation: vi.fn(),
}))

const STORAGE_KEY = 'weather-please:location-expanded'
const locationProps = { lat: '-31.9523', locale: 'en', lon: '115.8613' }
const resolvedLocation = {
	hasResolved: true,
	label: 'Perth, Australia',
	status: AsyncStatus.Success,
}

beforeEach(() => {
	localStorage.clear()
	vi.mocked(useIdentifiedLocation).mockReturnValue(resolvedLocation)
})

afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
})

describe('IdentifiedLocationIndicator', () => {
	it('starts expanded with an accessible toggle and keeps the coordinates tooltip', () => {
		render(<IdentifiedLocationIndicator {...locationProps} />)

		const button = screen.getByRole('button', { name: 'Location' })
		expect(button).toHaveAttribute('type', 'button')
		expect(button).toHaveAttribute('aria-expanded', 'true')
		expect(button).toHaveAttribute('title', '-31.9523, 115.8613')
		expect(button).toHaveAccessibleDescription('Perth, Australia')
		expect(getControlledLabel(button)).toHaveAttribute('aria-hidden', 'false')
		expect(getControlledLabel(button)).toHaveTextContent('Perth, Australia')
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
	})

	it('persists closing and opening across remounts', () => {
		const setItem = vi.spyOn(Storage.prototype, 'setItem')
		const first = render(<IdentifiedLocationIndicator {...locationProps} />, {
			wrapper: StrictMode,
		})
		let button = screen.getByRole('button', { name: 'Location' })

		fireEvent.click(button)
		expect(button).toHaveAttribute('aria-expanded', 'false')
		expect(button).toHaveAccessibleDescription('-31.9523, 115.8613')
		expect(getControlledLabel(button)).toHaveAttribute('aria-hidden', 'true')
		expect(setItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY, 'false')
		first.unmount()

		const second = render(<IdentifiedLocationIndicator {...locationProps} />)
		button = screen.getByRole('button', { name: 'Location' })
		expect(button).toHaveAttribute('aria-expanded', 'false')
		fireEvent.click(button)
		expect(button).toHaveAttribute('aria-expanded', 'true')
		expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
		second.unmount()

		render(<IdentifiedLocationIndicator {...locationProps} />)
		expect(screen.getByRole('button', { name: 'Location' })).toHaveAttribute(
			'aria-expanded',
			'true',
		)
	})

	it.each(['invalid json', '"true"', '1', '{}', '[]', 'null'])(
		'ignores invalid stored expansion state %s',
		(storedValue) => {
			localStorage.setItem(STORAGE_KEY, storedValue)
			render(<IdentifiedLocationIndicator {...locationProps} />)

			expect(screen.getByRole('button', { name: 'Location' })).toHaveAttribute(
				'aria-expanded',
				'true',
			)
		},
	)

	it('remains usable when storage reads are blocked', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('Storage is blocked')
		})
		render(<IdentifiedLocationIndicator {...locationProps} />)

		const button = screen.getByRole('button', { name: 'Location' })
		expect(button).toHaveAttribute('aria-expanded', 'true')
		fireEvent.click(button)
		expect(button).toHaveAttribute('aria-expanded', 'false')
	})

	it('keeps toggling when storage writes fail', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('Storage is full')
		})
		render(<IdentifiedLocationIndicator {...locationProps} />)

		const button = screen.getByRole('button', { name: 'Location' })
		fireEvent.click(button)
		expect(button).toHaveAttribute('aria-expanded', 'false')
		fireEvent.click(button)
		expect(button).toHaveAttribute('aria-expanded', 'true')
	})

	it.each([{ lat: '' }, { lon: '' }])(
		'does not display a toggle with missing coordinates %o',
		(missingCoordinates) => {
			render(
				<IdentifiedLocationIndicator
					{...locationProps}
					{...missingCoordinates}
				/>,
			)

			expect(screen.queryByRole('button')).not.toBeInTheDocument()
		},
	)

	it('waits for location resolution without losing the stored preference', () => {
		localStorage.setItem(STORAGE_KEY, 'true')
		vi.mocked(useIdentifiedLocation).mockReturnValue({
			hasResolved: false,
			label: null,
			status: AsyncStatus.Loading,
		})
		const { rerender } = render(
			<IdentifiedLocationIndicator {...locationProps} />,
		)
		expect(screen.queryByRole('button')).not.toBeInTheDocument()

		vi.mocked(useIdentifiedLocation).mockReturnValue(resolvedLocation)
		rerender(<IdentifiedLocationIndicator {...locationProps} />)
		expect(screen.getByRole('button', { name: 'Location' })).toHaveAttribute(
			'aria-expanded',
			'true',
		)
	})

	it('allows the unavailable-name fallback to collapse and reopen', () => {
		vi.mocked(useIdentifiedLocation).mockReturnValue({
			hasResolved: true,
			label: null,
			status: AsyncStatus.Error,
		})
		render(<IdentifiedLocationIndicator {...locationProps} />)

		const button = screen.getByRole('button', { name: 'Location' })
		fireEvent.click(button)
		expect(button).toHaveAttribute('aria-expanded', 'false')
		fireEvent.click(button)
		expect(button).toHaveAttribute('aria-expanded', 'true')
		expect(getControlledLabel(button)).toHaveTextContent(
			'Location name unavailable',
		)
	})

	it('preserves expansion when the coordinates, locale, and label change', () => {
		localStorage.setItem(STORAGE_KEY, 'false')
		const { rerender } = render(
			<IdentifiedLocationIndicator {...locationProps} />,
		)
		fireEvent.click(screen.getByRole('button', { name: 'Location' }))
		vi.mocked(useIdentifiedLocation).mockReturnValue({
			...resolvedLocation,
			label: 'Londres, Royaume-Uni',
		})

		rerender(
			<IdentifiedLocationIndicator lat="51.507" locale="fr" lon="-0.128" />,
		)

		const button = screen.getByRole('button', { name: 'Location' })
		expect(button).toHaveAttribute('aria-expanded', 'true')
		expect(button).toHaveAttribute('title', '51.507, -0.128')
		expect(getControlledLabel(button)).toHaveTextContent('Londres, Royaume-Uni')
		expect(useIdentifiedLocation).toHaveBeenLastCalledWith({
			lat: '51.507',
			locale: 'fr',
			lon: '-0.128',
		})
	})
})

const getControlledLabel = (button: HTMLElement) => {
	const labelId = button.getAttribute('aria-controls')
	const label = labelId ? document.getElementById(labelId) : null
	if (!label) throw new Error('Expected a controlled location label')
	return label
}

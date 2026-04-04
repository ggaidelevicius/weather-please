import type { ReactNode } from 'react'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BOOLEAN_CONFIG_DEFAULTS } from '../../model/boolean-settings'
import { TileIdentifier } from '../../model/tile-identifier'
import { Settings } from '../settings'

vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

const renderSettings = () =>
	render(<Settings handleChange={vi.fn()} input={createConfig()} />)

describe('Settings modal navigation', () => {
	it('shows one section at a time and switches content from the left rail', () => {
		renderSettings()

		fireEvent.click(screen.getByRole('button', { name: 'Settings' }))

		expect(screen.getByLabelText('Language')).toBeInTheDocument()
		expect(screen.queryByLabelText('Latitude')).not.toBeInTheDocument()
		expect(screen.queryByText(/Leave a review/i)).not.toBeInTheDocument()

		fireEvent.click(screen.getByRole('button', { name: 'Weather' }))

		expect(screen.getByLabelText('Latitude')).toBeInTheDocument()
		expect(screen.queryByLabelText('Language')).not.toBeInTheDocument()

		fireEvent.click(screen.getByRole('button', { name: 'About' }))

		expect(screen.getByText(/Leave a review/i)).toBeInTheDocument()
		expect(screen.queryByLabelText('Latitude')).not.toBeInTheDocument()
		expect(screen.queryByLabelText('Language')).not.toBeInTheDocument()
	})
})

const createConfig = () => ({
	...BOOLEAN_CONFIG_DEFAULTS,
	daysToRetrieve: '3',
	identifier: TileIdentifier.Day,
	installed: 0,
	lang: 'en' as const,
	lat: '-31.9523',
	lon: '115.8613',
})

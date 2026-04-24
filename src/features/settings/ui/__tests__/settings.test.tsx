import type { ReactNode } from 'react'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Config } from '../../hooks/use-config'

import {
	SEASONAL_EVENT_OVERRIDE_NONE,
	SeasonalEventId,
} from '../../../seasonal-events/core/types'
import { BOOLEAN_CONFIG_DEFAULTS } from '../../model/boolean-settings'
import { TileIdentifier } from '../../model/tile-identifier'
import { TemperatureUnit, UnitSystem } from '../../model/unit-system'
import { Settings } from '../settings'

vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

const renderSettings = ({
	handleChange = vi.fn(),
}: {
	handleChange?: (k: keyof Config, v: Config[keyof Config]) => void
} = {}) =>
	render(<Settings handleChange={handleChange} input={createConfig()} />)

afterEach(() => {
	vi.unstubAllEnvs()
})

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

	it('only shows the developer section in development mode', () => {
		renderSettings()

		fireEvent.click(screen.getByRole('button', { name: 'Settings' }))

		expect(
			screen.queryByRole('button', { name: 'Developer' }),
		).not.toBeInTheDocument()

		cleanup()
		vi.stubEnv('NODE_ENV', 'development')
		renderSettings()

		fireEvent.click(screen.getByRole('button', { name: 'Settings' }))

		expect(
			screen.getByRole('button', { name: 'Developer' }),
		).toBeInTheDocument()
	})

	it('updates the seasonal event override from the developer section', () => {
		vi.stubEnv('NODE_ENV', 'development')
		const handleChange = vi.fn()

		renderSettings({ handleChange })

		fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
		fireEvent.click(screen.getByRole('button', { name: 'Developer' }))
		fireEvent.change(screen.getByLabelText('Seasonal event override'), {
			target: { value: SeasonalEventId.ChristmasDay },
		})

		expect(handleChange).toHaveBeenCalledWith(
			'seasonalEventOverride',
			SeasonalEventId.ChristmasDay,
		)
	})

	it('shows the CAMS explainer in a help popover', () => {
		renderSettings()

		fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
		fireEvent.click(screen.getByRole('button', { name: 'Weather' }))

		expect(
			screen.queryByText(/reported UV index is consistently lower/i),
		).not.toBeInTheDocument()

		fireEvent.click(
			screen.getByRole('button', {
				name: 'Why use Global Chemistry Models (CAMS)?',
			}),
		)

		expect(
			screen.getByText(/reported UV index is consistently lower/i),
		).toBeInTheDocument()
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
	seasonalEventOverride: SEASONAL_EVENT_OVERRIDE_NONE,
	temperatureUnit: TemperatureUnit.Celsius,
	unitSystem: UnitSystem.Metric,
})

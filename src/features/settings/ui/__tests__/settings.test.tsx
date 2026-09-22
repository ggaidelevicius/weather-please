import type { ReactNode } from 'react'

import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type {
	CalendarAccountSummary,
	CalendarConnection,
} from '../../../integrations/hooks/use-calendar-connection'
import type { Config } from '../../model/config'
import type { IntegrationsPromo } from '../settings'

import { AsyncStatus } from '../../../../shared/hooks/async-status'
import { CalendarAccountCategory } from '../../../integrations/model/account-category'
import { CalendarProvider } from '../../../integrations/model/calendar-provider'
import {
	SEASONAL_BACKGROUND_AUTOMATIC,
	SEASONAL_EVENT_OVERRIDE_NONE,
	SeasonalEventId,
} from '../../../seasonal-events/core/types'
import { BOOLEAN_CONFIG_DEFAULTS } from '../../model/boolean-settings'
import { TileIdentifier } from '../../model/tile-identifier'
import { TemperatureUnit, UnitSystem } from '../../model/unit-system'
import { Settings } from '../settings'
import { GeneralSettingsSection } from '../sections/general-settings'

vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

const renderSettings = ({
	calendarConnection = createCalendarConnection(),
	handleChange = vi.fn(),
	input = createConfig(),
	integrationsPromo = createIntegrationsPromo(),
}: {
	calendarConnection?: CalendarConnection
	handleChange?: (k: keyof Config, v: Config[keyof Config]) => void
	input?: Config
	integrationsPromo?: IntegrationsPromo
} = {}) =>
	render(
		<Settings
			calendarConnection={calendarConnection}
			handleChange={handleChange}
			input={input}
			integrationsPromo={integrationsPromo}
		/>,
	)

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

	it('keeps background styles in General and event controls in Seasonal events', () => {
		const handleChange = vi.fn()

		renderSettings({
			handleChange,
			input: { ...createConfig(), seasonalBackground: SeasonalEventId.Holi },
		})

		fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
		expect(screen.getByLabelText('Background style')).toHaveValue(
			SeasonalEventId.Holi,
		)
		expect(
			screen.getByLabelText('Switch to seasonal backgrounds'),
		).toBeInTheDocument()

		fireEvent.click(screen.getByRole('button', { name: 'Seasonal events' }))
		expect(screen.queryByLabelText('Background style')).not.toBeInTheDocument()
		expect(
			screen.queryByLabelText('Switch to seasonal backgrounds'),
		).not.toBeInTheDocument()
		expect(screen.getByLabelText('Show seasonal events')).toBeInTheDocument()
		const christmasSettings = screen.getByRole('group', {
			name: 'Christmas Day',
		})

		fireEvent.click(within(christmasSettings).getByLabelText('Background'))
		fireEvent.click(within(christmasSettings).getByLabelText('Show this event'))

		expect(handleChange).toHaveBeenCalledWith(
			'showChristmasEventBackground',
			false,
		)
		expect(handleChange).toHaveBeenCalledWith('showChristmasEvent', false)
	})

	it('offers automatic and every seasonal effect as a background style in General', () => {
		const handleChange = vi.fn()
		renderSettings({ handleChange })

		fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
		const backgroundStyle = screen.getByLabelText('Background style')
		const options = within(backgroundStyle).getAllByRole('option')
		const expectedValues = [
			...Object.values(SeasonalEventId),
			SEASONAL_BACKGROUND_AUTOMATIC,
		]

		expect(backgroundStyle).toHaveValue(SEASONAL_BACKGROUND_AUTOMATIC)
		expect(
			within(backgroundStyle).getByRole('option', {
				name: 'Automatic (seasonal)',
			}),
		).toHaveValue(SEASONAL_BACKGROUND_AUTOMATIC)
		expect(options).toHaveLength(expectedValues.length)
		expect(
			new Set(options.map((option) => option.getAttribute('value'))),
		).toEqual(new Set(expectedValues))

		for (const value of expectedValues) {
			fireEvent.change(backgroundStyle, { target: { value } })
			expect(handleChange).toHaveBeenLastCalledWith('seasonalBackground', value)
		}
		expect(handleChange).toHaveBeenCalledTimes(expectedValues.length)
	})

	it('only offers seasonal background switching for a chosen background style', () => {
		const handleChange = vi.fn()
		const props = {
			handleChange,
			hasSoftwareRenderer: false,
			input: createConfig(),
			localeKeys: ['en' as const],
		}
		const { rerender } = render(<GeneralSettingsSection {...props} />)
		const switchLabel = 'Switch to seasonal backgrounds'

		expect(screen.queryByLabelText(switchLabel)).not.toBeInTheDocument()
		rerender(
			<GeneralSettingsSection
				{...props}
				input={{ ...props.input, seasonalBackground: SeasonalEventId.Holi }}
			/>,
		)

		expect(screen.getByLabelText(switchLabel)).not.toBeChecked()
		expect(
			screen.getByText(
				'Use enabled seasonal backgrounds on their dates, then return to your chosen style. Turn this off to always use your chosen background.',
			),
		).toBeInTheDocument()
		fireEvent.click(screen.getByLabelText(switchLabel))
		expect(handleChange).toHaveBeenLastCalledWith(
			'shouldPreferSeasonalBackgrounds',
			true,
		)

		rerender(
			<GeneralSettingsSection
				{...props}
				input={{
					...props.input,
					seasonalBackground: SeasonalEventId.Holi,
					shouldPreferSeasonalBackgrounds: true,
				}}
			/>,
		)
		expect(screen.getByLabelText(switchLabel)).toBeChecked()
		fireEvent.click(screen.getByLabelText(switchLabel))
		expect(handleChange).toHaveBeenLastCalledWith(
			'shouldPreferSeasonalBackgrounds',
			false,
		)

		rerender(<GeneralSettingsSection {...props} />)
		expect(screen.queryByLabelText(switchLabel)).not.toBeInTheDocument()
	})

	it('keeps General background controls available when seasonal events are disabled', () => {
		const handleChange = vi.fn()
		renderSettings({
			handleChange,
			input: {
				...createConfig(),
				seasonalBackground: SeasonalEventId.Holi,
				showSeasonalEvents: false,
			},
		})

		fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
		const backgroundStyle = screen.getByLabelText('Background style')

		expect(backgroundStyle).toHaveValue(SeasonalEventId.Holi)
		expect(backgroundStyle).toBeEnabled()
		expect(
			screen.getByLabelText('Switch to seasonal backgrounds'),
		).toBeEnabled()
		expect(
			screen.queryByRole('group', { name: 'Holi' }),
		).not.toBeInTheDocument()
		fireEvent.change(backgroundStyle, {
			target: { value: SeasonalEventId.ChristmasDay },
		})
		expect(handleChange).toHaveBeenCalledWith(
			'seasonalBackground',
			SeasonalEventId.ChristmasDay,
		)
	})

	it('explains unavailable fixed backgrounds in General when hardware acceleration is disabled', () => {
		const props = {
			handleChange: vi.fn(),
			hasSoftwareRenderer: true,
			input: { ...createConfig(), showSeasonalEvents: false },
			localeKeys: ['en' as const],
		}
		const { rerender } = render(<GeneralSettingsSection {...props} />)

		expect(
			screen.queryByText(/using a software renderer/),
		).not.toBeInTheDocument()

		rerender(
			<GeneralSettingsSection
				{...props}
				input={{ ...props.input, seasonalBackground: SeasonalEventId.Holi }}
			/>,
		)

		expect(screen.getByText(/using a software renderer/)).toBeInTheDocument()

		rerender(
			<GeneralSettingsSection
				{...props}
				input={{ ...props.input, showSeasonalEvents: true }}
			/>,
		)

		expect(screen.getByText(/using a software renderer/)).toBeInTheDocument()
	})

	it('offers a connect button per configured provider in the integrations section', () => {
		const calendarConnection = createCalendarConnection({
			configuredProviders: [
				CalendarProvider.Google,
				CalendarProvider.Microsoft,
			],
		})

		renderSettings({ calendarConnection })

		fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
		fireEvent.click(screen.getByRole('button', { name: 'Integrations' }))

		expect(screen.getByText('Google Calendar')).toBeInTheDocument()
		expect(screen.getByText('Microsoft Outlook')).toBeInTheDocument()

		fireEvent.click(screen.getAllByRole('button', { name: 'Connect' })[0]!)

		expect(calendarConnection.connect).toHaveBeenCalledWith(
			CalendarProvider.Google,
		)
	})

	it('lists connected accounts with per-account category and disconnect controls', () => {
		const calendarConnection = createCalendarConnection({
			accounts: [
				createCalendarAccount({
					accountId: 'personal-account',
					accountLabel: 'gus@gmail.com',
					provider: CalendarProvider.Google,
				}),
				createCalendarAccount({
					accountId: 'work-account',
					accountLabel: 'gus@work.example',
					category: CalendarAccountCategory.Work,
				}),
			],
			configuredProviders: [CalendarProvider.Microsoft],
		})

		renderSettings({ calendarConnection })

		fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
		fireEvent.click(screen.getByRole('button', { name: 'Integrations' }))

		expect(screen.getByText('gus@gmail.com')).toBeInTheDocument()
		expect(screen.getByText('gus@work.example')).toBeInTheDocument()
		expect(screen.getByText('Google Calendar')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Add account' }),
		).toBeInTheDocument()
		expect(screen.getByLabelText('Show calendar events')).toBeInTheDocument()
		expect(
			within(screen.getByRole('region', { name: 'Google Calendar' })).getByText(
				'gus@gmail.com',
			),
		).toBeInTheDocument()

		fireEvent.change(
			within(
				screen.getByRole('article', { name: 'gus@gmail.com' }),
			).getByLabelText('Category'),
			{
				target: { value: CalendarAccountCategory.School },
			},
		)

		expect(calendarConnection.setAccountCategory).toHaveBeenCalledWith(
			'personal-account',
			CalendarAccountCategory.School,
		)

		fireEvent.click(
			within(
				screen.getByRole('article', { name: 'gus@work.example' }),
			).getByRole('button', { name: 'Disconnect' }),
		)

		expect(calendarConnection.disconnect).toHaveBeenCalledWith('work-account')
	})

	it('prompts to reconnect an account whose session expired', () => {
		const calendarConnection = createCalendarConnection({
			accounts: [
				createCalendarAccount({
					accountLabel: 'gus@gmail.com',
					isSessionExpired: true,
					provider: CalendarProvider.Google,
				}),
			],
			configuredProviders: [CalendarProvider.Google],
		})

		renderSettings({ calendarConnection })

		fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
		fireEvent.click(screen.getByRole('button', { name: 'Integrations' }))

		fireEvent.click(screen.getByRole('button', { name: 'Reconnect' }))

		expect(calendarConnection.connect).toHaveBeenCalledWith(
			CalendarProvider.Google,
		)
	})

	it('reports settings opening and integrations views for the calendar promo', () => {
		const integrationsPromo = createIntegrationsPromo({
			shouldHighlightIntegrations: true,
		})

		renderSettings({ integrationsPromo })

		fireEvent.click(screen.getByRole('button', { name: 'Settings' }))

		expect(integrationsPromo.onSettingsOpened).toHaveBeenCalled()
		expect(integrationsPromo.onIntegrationsViewed).not.toHaveBeenCalled()

		fireEvent.click(screen.getByRole('button', { name: 'Integrations' }))

		expect(integrationsPromo.onIntegrationsViewed).toHaveBeenCalled()
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

const createCalendarAccount = (
	overrides: Partial<CalendarAccountSummary> = {},
): CalendarAccountSummary => ({
	accountId: 'account-1',
	accountLabel: 'gus@example.com',
	category: CalendarAccountCategory.Personal,
	isSessionExpired: false,
	provider: CalendarProvider.Microsoft,
	...overrides,
})

const createIntegrationsPromo = (
	overrides: Partial<IntegrationsPromo> = {},
): IntegrationsPromo => ({
	onIntegrationsViewed: vi.fn(),
	onSettingsOpened: vi.fn(),
	shouldHighlightIntegrations: false,
	...overrides,
})

const createCalendarConnection = (
	overrides: Partial<CalendarConnection> = {},
): CalendarConnection => ({
	accounts: [],
	configuredProviders: [],
	connect: vi.fn(async () => {}),
	disconnect: vi.fn(),
	error: null,
	events: [],
	eventsStatus: AsyncStatus.Idle,
	isConnecting: false,
	retryEvents: vi.fn(),
	setAccountCategory: vi.fn(),
	...overrides,
})

const createConfig = (): Config => ({
	...BOOLEAN_CONFIG_DEFAULTS,
	daysToRetrieve: '3',
	identifier: TileIdentifier.Day,
	installed: 0,
	lang: 'en' as const,
	lat: '-31.9523',
	lon: '115.8613',
	seasonalBackground: SEASONAL_BACKGROUND_AUTOMATIC,
	seasonalEventOverride: SEASONAL_EVENT_OVERRIDE_NONE,
	temperatureUnit: TemperatureUnit.Celsius,
	unitSystem: UnitSystem.Metric,
})

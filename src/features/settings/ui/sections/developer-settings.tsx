import type { SettingsContentProps } from '../settings-types'
import { Trans } from '@lingui/react/macro'
import type { SeasonalEventOverride } from '../../../seasonal-events/core/types'
import { SEASONAL_EVENT_OVERRIDE_NONE } from '../../../seasonal-events/core/types'
import { Select, Switch } from '../../../../shared/ui/input'
import {
	SEASONAL_EVENT_OPTIONS,
	SEASONAL_EVENT_OPTION_LABELS,
} from './seasonal-settings'
import {
	SettingsSectionLayout,
	SettingsSubsection,
	SETTINGS_FIELD_LAYOUT,
} from './section-layout'

export const getSeasonalEventOverrideOptions = () => [
	{
		label: <Trans>None</Trans>,
		value: SEASONAL_EVENT_OVERRIDE_NONE,
	},
	...SEASONAL_EVENT_OPTIONS.map((eventId) => ({
		label: SEASONAL_EVENT_OPTION_LABELS[eventId],
		value: eventId,
	})),
]

export const DeveloperSettingsSection = ({
	handleChange,
	input,
}: Pick<SettingsContentProps, 'handleChange' | 'input'>) => (
	<SettingsSectionLayout>
		<SettingsSubsection
			bodyClassName="space-y-4"
			title={<Trans>Overrides</Trans>}
		>
			<Select
				label={<Trans>Seasonal event override</Trans>}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(e) => {
					handleChange(
						'seasonalEventOverride',
						e.target.value as SeasonalEventOverride,
					)
				}}
				options={getSeasonalEventOverrideOptions()}
				value={input.seasonalEventOverride}
			/>
			<Switch
				checked={input.spoofCalendarEvents}
				label={<Trans>Spoof upcoming calendar events</Trans>}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(checked) => handleChange('spoofCalendarEvents', checked)}
			/>
		</SettingsSubsection>
	</SettingsSectionLayout>
)

import type { SettingsContentProps } from '../settings-types'
import type { SeasonalBackground } from '../../../seasonal-events/core/types'
import { Trans } from '@lingui/react/macro'
import { IconAlertTriangle } from '@tabler/icons-react'
import { SEASONAL_BACKGROUND_AUTOMATIC } from '../../../seasonal-events/core/types'
import { TemperatureUnit, UnitSystem } from '../../model/unit-system'
import { Select, Switch } from '../../../../shared/ui/input'
import { Alert } from '../../../../shared/ui/alert'
import { AlertVariant } from '../../../../shared/ui/alert-variant'
import { locales } from '../../../../shared/lib/i18n'
import {
	SEASONAL_EVENT_OPTIONS,
	SEASONAL_EVENT_OPTION_LABELS,
} from './seasonal-settings'
import {
	SettingsSectionLayout,
	SettingsSubsection,
	SETTINGS_FIELD_LAYOUT,
} from './section-layout'

export const getTemperatureUnitOptions = () => [
	{
		label: <Trans>Celsius (°C)</Trans>,
		value: TemperatureUnit.Celsius,
	},
	{
		label: <Trans>Fahrenheit (°F)</Trans>,
		value: TemperatureUnit.Fahrenheit,
	},
]

export const getUnitSystemOptions = () => [
	{
		label: <Trans>Metric (km/h, mm)</Trans>,
		value: UnitSystem.Metric,
	},
	{
		label: <Trans>Imperial (mph, in)</Trans>,
		value: UnitSystem.Imperial,
	},
]

export const getSeasonalBackgroundOptions = () => [
	{
		label: <Trans>Automatic (seasonal)</Trans>,
		value: SEASONAL_BACKGROUND_AUTOMATIC,
	},
	...SEASONAL_EVENT_OPTIONS.map((eventId) => ({
		label: SEASONAL_EVENT_OPTION_LABELS[eventId],
		value: eventId,
	})),
]

export const GeneralSettingsSection = ({
	handleChange,
	hasSoftwareRenderer,
	input,
	localeKeys,
}: Pick<
	SettingsContentProps,
	'handleChange' | 'hasSoftwareRenderer' | 'input' | 'localeKeys'
>) => (
	<SettingsSectionLayout>
		<SettingsSubsection
			bodyClassName="space-y-4"
			title={<Trans>Background</Trans>}
		>
			<Select
				label={<Trans>Background style</Trans>}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(e) => {
					handleChange(
						'seasonalBackground',
						e.target.value as SeasonalBackground,
					)
				}}
				options={getSeasonalBackgroundOptions()}
				value={input.seasonalBackground}
			/>
			{input.seasonalBackground !== SEASONAL_BACKGROUND_AUTOMATIC ? (
				<div className="space-y-2">
					<Switch
						checked={input.shouldPreferSeasonalBackgrounds}
						label={<Trans>Switch to seasonal backgrounds</Trans>}
						layout={SETTINGS_FIELD_LAYOUT}
						onChange={(checked) =>
							handleChange('shouldPreferSeasonalBackgrounds', checked)
						}
					/>
					<p className="text-sm text-dark-200 opacity-80">
						<Trans>
							Use enabled seasonal backgrounds on their dates, then return to
							your chosen style. Turn this off to always use your chosen
							background.
						</Trans>
					</p>
				</div>
			) : null}
			{hasSoftwareRenderer &&
			(input.showSeasonalEvents ||
				input.seasonalBackground !== SEASONAL_BACKGROUND_AUTOMATIC) ? (
				<Alert icon={IconAlertTriangle} variant={AlertVariant.InfoRed}>
					<Trans>
						Seasonal effects are disabled because your browser appears to be
						using a software renderer. Enable hardware acceleration to see these
						effects.
					</Trans>
				</Alert>
			) : null}
		</SettingsSubsection>
		<SettingsSubsection bodyClassName="space-y-4" title={<Trans>Locale</Trans>}>
			<Select
				label={<Trans>Language</Trans>}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(e) => {
					handleChange('lang', e.target.value)
				}}
				options={localeKeys.map((key) => ({
					label: locales[key].label,
					value: key,
				}))}
				value={input.lang}
			/>
			<Select
				label={<Trans>Temperature</Trans>}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(e) => {
					handleChange('temperatureUnit', e.target.value as TemperatureUnit)
				}}
				options={getTemperatureUnitOptions()}
				value={input.temperatureUnit}
			/>
			<Select
				label={<Trans>Other units</Trans>}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(e) => {
					handleChange('unitSystem', e.target.value as UnitSystem)
				}}
				options={getUnitSystemOptions()}
				value={input.unitSystem}
			/>
		</SettingsSubsection>
	</SettingsSectionLayout>
)

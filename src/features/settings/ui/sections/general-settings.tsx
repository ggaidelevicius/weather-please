import type { SettingsContentProps } from '../settings-types'
import { Trans } from '@lingui/react/macro'
import { TemperatureUnit, UnitSystem } from '../../model/unit-system'
import { Select } from '../../../../shared/ui/input'
import { locales } from '../../../../shared/lib/i18n'
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

export const GeneralSettingsSection = ({
	handleChange,
	input,
	localeKeys,
}: Pick<SettingsContentProps, 'handleChange' | 'input' | 'localeKeys'>) => (
	<SettingsSectionLayout>
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

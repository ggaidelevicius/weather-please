import type { SettingsContentProps, SwitchDefinition } from '../settings-types'
import { Trans } from '@lingui/react/macro'
import { IconShieldCheckFilled } from '@tabler/icons-react'
import { Input, Switch, Select } from '../../../../shared/ui/input'
import { TileIdentifier } from '../../model/tile-identifier'
import { HelpPopover } from '../../../../shared/ui/help-popover'
import {
	SettingsSectionLayout,
	SettingsSubsection,
	SETTINGS_FIELD_LAYOUT,
} from './section-layout'

export const ALERT_DETAIL_SWITCHES = [
	{ key: 'useCompactAlerts', label: <Trans>Compact weather alerts</Trans> },
	{ key: 'showUvAlerts', label: <Trans>Show extreme UV alerts</Trans> },
	{
		key: 'showPrecipitationAlerts',
		label: <Trans>Show high precipitation alerts</Trans>,
	},
	{ key: 'showWindAlerts', label: <Trans>Show strong wind alerts</Trans> },
	{
		key: 'showVisibilityAlerts',
		label: <Trans>Show low visibility alerts</Trans>,
	},
] as const satisfies ReadonlyArray<SwitchDefinition>

export const WeatherSettingsSection = ({
	handleChange,
	input,
}: Pick<SettingsContentProps, 'handleChange' | 'input'>) => (
	<SettingsSectionLayout>
		<SettingsSubsection
			bodyClassName="space-y-4"
			headerAccessory={
				<span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-blue-600 to-blue-500 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white shadow-sm">
					<IconShieldCheckFilled aria-hidden size={14} />
					<Trans>Securely stored</Trans>
				</span>
			}
			title={<Trans>Location</Trans>}
		>
			<Input
				label={<Trans>Latitude</Trans>}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(e) => {
					handleChange('lat', e.target.value)
				}}
				validation={/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(input.lat)}
				value={input.lat}
			/>
			<Input
				label={<Trans>Longitude</Trans>}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(e) => {
					handleChange('lon', e.target.value)
				}}
				validation={/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/.test(
					input.lon,
				)}
				value={input.lon}
			/>
			<Switch
				checked={input.periodicLocationUpdate}
				label={<Trans>Periodically update location automatically</Trans>}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(checked) => handleChange('periodicLocationUpdate', checked)}
			/>
		</SettingsSubsection>
		<SettingsSubsection
			bodyClassName="space-y-4"
			title={<Trans>Forecast</Trans>}
		>
			<Select
				label={<Trans>Number of days to forecast</Trans>}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(e) => {
					handleChange('daysToRetrieve', e.target.value)
				}}
				options={Array.from({ length: 9 }, (_, i) => ({
					label: (i + 1).toString(),
					value: (i + 1).toString(),
				}))}
				value={input.daysToRetrieve}
			/>
			<Select
				label={<Trans>Identifier</Trans>}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(e) => {
					handleChange('identifier', e.target.value as TileIdentifier)
				}}
				options={[
					{
						label: <Trans>Day</Trans>,
						value: TileIdentifier.Day,
					},
					{
						label: <Trans>Date</Trans>,
						value: TileIdentifier.Date,
					},
				]}
				value={input.identifier}
			/>
		</SettingsSubsection>
		<SettingsSubsection
			bodyClassName="space-y-4"
			title={<Trans>Data & alerts</Trans>}
		>
			<Switch
				checked={input.useAirQualityUvOverride}
				label={<Trans>Use Global Chemistry Models (CAMS)</Trans>}
				labelAccessory={
					<HelpPopover label="Why use Global Chemistry Models (CAMS)?">
						<Trans>
							Turn this on if Weather Please&apos;s reported UV index is
							consistently lower than local sources.
						</Trans>
					</HelpPopover>
				}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(checked) => handleChange('useAirQualityUvOverride', checked)}
			/>
			<Switch
				checked={input.showAlerts}
				label={<Trans>Show weather alerts</Trans>}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(checked) => handleChange('showAlerts', checked)}
			/>
			{input.showAlerts ? (
				<div className="space-y-4">
					{ALERT_DETAIL_SWITCHES.map((switchDefinition) => (
						<Switch
							checked={input[switchDefinition.key]}
							key={switchDefinition.key}
							label={switchDefinition.label}
							layout={SETTINGS_FIELD_LAYOUT}
							onChange={(checked) =>
								handleChange(switchDefinition.key, checked)
							}
						/>
					))}
				</div>
			) : null}
		</SettingsSubsection>
	</SettingsSectionLayout>
)

import type {
	SettingsContentProps,
	SeasonalEventSection,
} from '../settings-types'
import { SeasonalEventId } from '../../../seasonal-events/core/types'
import { Trans } from '@lingui/react/macro'
import type { ReactNode } from 'react'
import { Switch } from '../../../../shared/ui/input'
import { Alert } from '../../../../shared/ui/alert'
import { IconAlertTriangle } from '@tabler/icons-react'
import { AlertVariant } from '../../../../shared/ui/alert-variant'
import {
	SEASONAL_EVENT_BACKGROUND_TOGGLE_KEY_BY_ID,
	SEASONAL_EVENT_TOGGLE_KEY_BY_ID,
} from '../../model/seasonal-event-toggle-map'
import {
	SettingsSectionLayout,
	SettingsSubsection,
	SETTINGS_FIELD_LAYOUT,
} from './section-layout'

export const SEASONAL_EVENT_OPTION_LABELS = {
	[SeasonalEventId.AutumnEquinox]: <Trans>Autumn Equinox</Trans>,
	[SeasonalEventId.ChristmasDay]: <Trans>Christmas Day</Trans>,
	[SeasonalEventId.DayOfTheDead]: <Trans>Day of the Dead</Trans>,
	[SeasonalEventId.Diwali]: <Trans>Diwali</Trans>,
	[SeasonalEventId.EarthDay]: <Trans>Earth Day</Trans>,
	[SeasonalEventId.Easter]: <Trans>Easter</Trans>,
	[SeasonalEventId.EidAlAdha]: <Trans>Eid al-Adha</Trans>,
	[SeasonalEventId.EidAlFitr]: <Trans>Eid al-Fitr</Trans>,
	[SeasonalEventId.EtaAquariids]: <Trans>Eta Aquariids meteor shower</Trans>,
	[SeasonalEventId.EventHorizonDay]: <Trans>Event Horizon Day</Trans>,
	[SeasonalEventId.Geminids]: <Trans>Geminids meteor shower</Trans>,
	[SeasonalEventId.Halloween]: <Trans>Halloween</Trans>,
	[SeasonalEventId.Hanukkah]: <Trans>Hanukkah</Trans>,
	[SeasonalEventId.Holi]: <Trans>Holi</Trans>,
	[SeasonalEventId.Leonids]: <Trans>Leonids meteor shower</Trans>,
	[SeasonalEventId.LunarNewYear]: <Trans>Lunar New Year</Trans>,
	[SeasonalEventId.Lyrids]: <Trans>Lyrids meteor shower</Trans>,
	[SeasonalEventId.NewYearsDay]: <Trans>New Year&apos;s Day</Trans>,
	[SeasonalEventId.Orionids]: <Trans>Orionids meteor shower</Trans>,
	[SeasonalEventId.Perseids]: <Trans>Perseids meteor shower</Trans>,
	[SeasonalEventId.Quadrantids]: <Trans>Quadrantids meteor shower</Trans>,
	[SeasonalEventId.SpringEquinox]: <Trans>Spring Equinox</Trans>,
	[SeasonalEventId.SummerSolstice]: <Trans>Summer Solstice</Trans>,
	[SeasonalEventId.TotalLunarEclipse]: <Trans>Total lunar eclipse</Trans>,
	[SeasonalEventId.TotalSolarEclipse]: <Trans>Total solar eclipse</Trans>,
	[SeasonalEventId.ValentinesDay]: <Trans>Valentine&apos;s Day</Trans>,
	[SeasonalEventId.WinterSolstice]: <Trans>Winter Solstice</Trans>,
} as const satisfies Record<SeasonalEventId, ReactNode>

export const SEASONAL_EVENT_SECTIONS = [
	{
		eventIds: [
			SeasonalEventId.SpringEquinox,
			SeasonalEventId.SummerSolstice,
			SeasonalEventId.AutumnEquinox,
			SeasonalEventId.WinterSolstice,
			SeasonalEventId.EarthDay,
		],
		id: 'nature',
		title: <Trans>Seasons & nature</Trans>,
	},
	{
		eventIds: [
			SeasonalEventId.Quadrantids,
			SeasonalEventId.Lyrids,
			SeasonalEventId.EtaAquariids,
			SeasonalEventId.Orionids,
			SeasonalEventId.Leonids,
			SeasonalEventId.TotalSolarEclipse,
			SeasonalEventId.TotalLunarEclipse,
			SeasonalEventId.Perseids,
			SeasonalEventId.Geminids,
			SeasonalEventId.EventHorizonDay,
		],
		id: 'astronomy',
		title: <Trans>Astronomy</Trans>,
	},
	{
		eventIds: [
			SeasonalEventId.LunarNewYear,
			SeasonalEventId.Easter,
			SeasonalEventId.Diwali,
			SeasonalEventId.Holi,
			SeasonalEventId.EidAlFitr,
			SeasonalEventId.EidAlAdha,
			SeasonalEventId.Hanukkah,
			SeasonalEventId.ChristmasDay,
		],
		id: 'religious-cultural',
		title: <Trans>Religious & cultural</Trans>,
	},
	{
		eventIds: [
			SeasonalEventId.NewYearsDay,
			SeasonalEventId.ValentinesDay,
			SeasonalEventId.Halloween,
			SeasonalEventId.DayOfTheDead,
		],
		id: 'other-holidays',
		title: <Trans>Other holidays</Trans>,
	},
] as const satisfies ReadonlyArray<SeasonalEventSection>

export const SEASONAL_EVENT_OPTIONS = SEASONAL_EVENT_SECTIONS.flatMap(
	(section) => section.eventIds,
)

export const SeasonalSettingsSection = ({
	handleChange,
	hasSoftwareRenderer,
	input,
}: Pick<
	SettingsContentProps,
	'handleChange' | 'hasSoftwareRenderer' | 'input'
>) => (
	<SettingsSectionLayout>
		<SettingsSubsection
			bodyClassName="space-y-4"
			title={<Trans>Display</Trans>}
		>
			<Switch
				checked={input.showSeasonalEvents}
				label={<Trans>Show seasonal events</Trans>}
				layout={SETTINGS_FIELD_LAYOUT}
				onChange={(checked) => handleChange('showSeasonalEvents', checked)}
			/>
			{input.showSeasonalEvents && hasSoftwareRenderer ? (
				<Alert icon={IconAlertTriangle} variant={AlertVariant.InfoRed}>
					<Trans>
						Seasonal effects are disabled because your browser appears to be
						using a software renderer. Enable hardware acceleration to see these
						effects.
					</Trans>
				</Alert>
			) : null}
			{input.showSeasonalEvents ? (
				<Switch
					checked={input.showSeasonalTileGlow}
					label={<Trans>Show seasonal tile glow</Trans>}
					layout={SETTINGS_FIELD_LAYOUT}
					onChange={(checked) => handleChange('showSeasonalTileGlow', checked)}
				/>
			) : null}
		</SettingsSubsection>
		{input.showSeasonalEvents
			? SEASONAL_EVENT_SECTIONS.map((section) => (
					<SettingsSubsection
						bodyClassName="space-y-4"
						key={section.id}
						title={section.title}
					>
						{section.eventIds.map((eventId) => (
							<fieldset
								className="space-y-3 rounded-xl border border-white/5 bg-white/2 px-3.5 pt-1.5 pb-3.5"
								key={eventId}
							>
								<legend className="px-1 text-sm font-medium text-white">
									{SEASONAL_EVENT_OPTION_LABELS[eventId]}
								</legend>
								<Switch
									checked={
										input[SEASONAL_EVENT_BACKGROUND_TOGGLE_KEY_BY_ID[eventId]]
									}
									label={<Trans>Background</Trans>}
									layout={SETTINGS_FIELD_LAYOUT}
									onChange={(checked) =>
										handleChange(
											SEASONAL_EVENT_BACKGROUND_TOGGLE_KEY_BY_ID[eventId],
											checked,
										)
									}
								/>
								<Switch
									checked={input[SEASONAL_EVENT_TOGGLE_KEY_BY_ID[eventId]]}
									label={<Trans>Show this event</Trans>}
									layout={SETTINGS_FIELD_LAYOUT}
									onChange={(checked) =>
										handleChange(
											SEASONAL_EVENT_TOGGLE_KEY_BY_ID[eventId],
											checked,
										)
									}
								/>
							</fieldset>
						))}
					</SettingsSubsection>
				))
			: null}
	</SettingsSectionLayout>
)

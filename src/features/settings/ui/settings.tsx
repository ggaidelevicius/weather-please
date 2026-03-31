import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from '@headlessui/react'
import { Trans } from '@lingui/react/macro'
import {
	IconAlertTriangle,
	IconSettings,
	IconShieldCheckFilled,
} from '@tabler/icons-react'
import { Fragment, type ReactNode, useEffect, useState } from 'react'

import type { LocaleKey } from '../../../shared/lib/i18n'
import type { Config } from '../hooks/use-config'

import { locales } from '../../../shared/lib/i18n'
import { setSettingsModalOpenState } from '../../../shared/lib/settings-modal-state'
import { Alert } from '../../../shared/ui/alert'
import { AlertVariant } from '../../../shared/ui/alert-variant'
import { IconButton } from '../../../shared/ui/button'
import { Input, Select, Switch } from '../../../shared/ui/input'
import { SeasonalEventId } from '../../seasonal-events/core/types'
import { isLikelySoftwareRenderer } from '../../seasonal-events/core/utils'
import { SEASONAL_EVENT_TOGGLE_KEY_BY_ID } from '../model/seasonal-event-toggle-map'
import { TileIdentifier } from '../model/tile-identifier'

type BooleanConfigKey = {
	[K in keyof Config]: Config[K] extends boolean ? K : never
}[keyof Config]

type SeasonalEventSection = {
	eventIds: SeasonalEventId[]
	id: string
	title: ReactNode
}

type SwitchDefinition<K extends BooleanConfigKey = BooleanConfigKey> = {
	key: K
	label: ReactNode
}

const ALERT_DETAIL_SWITCHES = [
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

const SEASONAL_EVENT_LABELS = {
	[SeasonalEventId.AutumnEquinox]: <Trans>Show Autumn Equinox event</Trans>,
	[SeasonalEventId.ChristmasDay]: <Trans>Show Christmas Day event</Trans>,
	[SeasonalEventId.DayOfTheDead]: <Trans>Show Day of the Dead event</Trans>,
	[SeasonalEventId.Diwali]: <Trans>Show Diwali event</Trans>,
	[SeasonalEventId.EarthDay]: <Trans>Show Earth Day event</Trans>,
	[SeasonalEventId.Easter]: <Trans>Show Easter event</Trans>,
	[SeasonalEventId.EidAlAdha]: <Trans>Show Eid al-Adha event</Trans>,
	[SeasonalEventId.EidAlFitr]: <Trans>Show Eid al-Fitr event</Trans>,
	[SeasonalEventId.EtaAquariids]: (
		<Trans>Show Eta Aquariids meteor shower event</Trans>
	),
	[SeasonalEventId.EventHorizonDay]: (
		<Trans>Show Event Horizon Day event</Trans>
	),
	[SeasonalEventId.Geminids]: <Trans>Show Geminids meteor shower event</Trans>,
	[SeasonalEventId.Halloween]: <Trans>Show Halloween event</Trans>,
	[SeasonalEventId.Hanukkah]: <Trans>Show Hanukkah event</Trans>,
	[SeasonalEventId.Holi]: <Trans>Show Holi event</Trans>,
	[SeasonalEventId.Leonids]: <Trans>Show Leonids meteor shower event</Trans>,
	[SeasonalEventId.LunarNewYear]: <Trans>Show Lunar New Year event</Trans>,
	[SeasonalEventId.Lyrids]: <Trans>Show Lyrids meteor shower event</Trans>,
	[SeasonalEventId.NewYearsDay]: <Trans>Show New Year&apos;s Day event</Trans>,
	[SeasonalEventId.Orionids]: <Trans>Show Orionids meteor shower event</Trans>,
	[SeasonalEventId.Perseids]: <Trans>Show Perseids meteor shower event</Trans>,
	[SeasonalEventId.Quadrantids]: (
		<Trans>Show Quadrantids meteor shower event</Trans>
	),
	[SeasonalEventId.SpringEquinox]: <Trans>Show Spring Equinox event</Trans>,
	[SeasonalEventId.SummerSolstice]: <Trans>Show Summer Solstice event</Trans>,
	[SeasonalEventId.TotalLunarEclipse]: (
		<Trans>Show total lunar eclipse event</Trans>
	),
	[SeasonalEventId.TotalSolarEclipse]: (
		<Trans>Show total solar eclipse event</Trans>
	),
	[SeasonalEventId.ValentinesDay]: (
		<Trans>Show Valentine&apos;s Day event</Trans>
	),
	[SeasonalEventId.WinterSolstice]: <Trans>Show Winter Solstice event</Trans>,
} as const satisfies Record<SeasonalEventId, ReactNode>

const SEASONAL_EVENT_SECTIONS = [
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

interface SettingsProps {
	handleChange: (k: keyof Config, v: Config[keyof Config]) => void
	input: Config
}

const ATTRIBUTION_LINKS = [
	{
		href: 'https://open-meteo.com/',
		label: <Trans>Weather data by Open-Meteo</Trans>,
	},
	{
		href: 'https://www.openstreetmap.org/copyright',
		label: <Trans>Reverse geocoding by OpenStreetMap contributors</Trans>,
	},
] as const satisfies ReadonlyArray<{ href: string; label: ReactNode }>

export const Settings = ({ handleChange, input }: Readonly<SettingsProps>) => {
	const [isOpen, setIsOpen] = useState(false)
	const [hasSoftwareRenderer] = useState(isLikelySoftwareRenderer)
	const localeKeys = Object.keys(locales) as LocaleKey[]
	const platformReviewLink =
		typeof navigator !== 'undefined' &&
		navigator.userAgent.toLowerCase().includes('firefox/')
			? 'https://addons.mozilla.org/en-US/firefox/addon/weather-please/reviews/'
			: 'https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn/reviews'

	useEffect(() => {
		setSettingsModalOpenState(isOpen)
	}, [isOpen])

	useEffect(
		() => () => {
			setSettingsModalOpenState(false)
		},
		[],
	)

	const renderBooleanSwitch = <K extends BooleanConfigKey>(
		switchDefinition: SwitchDefinition<K>,
	) => (
		<Switch
			checked={input[switchDefinition.key]}
			key={switchDefinition.key}
			label={switchDefinition.label}
			onChange={(checked) => handleChange(switchDefinition.key, checked)}
		/>
	)

	return (
		<>
			<IconButton
				className="fixed right-4 bottom-4 shadow-md"
				icon={IconSettings}
				onClick={() => {
					setIsOpen(true)
				}}
			>
				<Trans>Settings</Trans>
			</IconButton>
			<Dialog
				className="relative z-50"
				onClose={() => setIsOpen(false)}
				open={isOpen}
			>
				<DialogBackdrop
					className="fixed inset-0 bg-black/60 backdrop-blur-lg transition duration-300 will-change-[backdrop-filter,background-color] data-closed:opacity-0"
					transition
				/>
				<div className="fixed inset-0 flex w-screen items-center justify-center overflow-y-auto p-8">
					<DialogPanel
						className="m-auto w-full max-w-lg space-y-4 rounded-xl bg-dark-800 p-12 transition duration-400 will-change-[transform,opacity,filter] data-closed:scale-97 data-closed:opacity-0 data-closed:blur-xs"
						transition
					>
						<DialogTitle as="h1" className="text-4xl font-bold text-white">
							<Trans>Settings</Trans>
						</DialogTitle>
						<h2 className="mt-14 text-2xl font-medium text-white">
							<Trans>General</Trans>
						</h2>
						<Select
							label={<Trans>Language</Trans>}
							onChange={(e) => {
								handleChange('lang', e.target.value)
							}}
							options={localeKeys.map((key) => ({
								label: locales[key].label,
								value: key,
							}))}
							value={input.lang}
						/>
						<Switch
							checked={input.useMetric}
							label={<Trans>Use metric number format</Trans>}
							onChange={(e) => handleChange('useMetric', e)}
						/>
						<h2 className="mt-14 text-2xl font-medium text-white">
							<Trans>Weather</Trans>
						</h2>
						<Alert icon={IconShieldCheckFilled}>
							<Trans>
								Your location data is securely stored exclusively on your
								personal device.
							</Trans>
						</Alert>
						<Input
							label={<Trans>Latitude</Trans>}
							onChange={(e) => {
								handleChange('lat', e.target.value)
							}}
							validation={/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(input.lat)}
							value={input.lat}
						/>
						<Input
							label={<Trans>Longitude</Trans>}
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
							onChange={(e) => handleChange('periodicLocationUpdate', e)}
						/>
						<Select
							label={<Trans>Number of days to forecast</Trans>}
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
						<div className="space-y-1">
							<Switch
								checked={input.useAirQualityUvOverride}
								label={<Trans>Use Global Chemistry Models (CAMS)</Trans>}
								onChange={(e) => handleChange('useAirQualityUvOverride', e)}
							/>
							<p className="text-sm text-dark-100">
								<Trans>
									Turn this on if Weather Please&apos;s reported UV index is
									consistently lower than local sources.
								</Trans>
							</p>
						</div>
						<Switch
							checked={input.showAlerts}
							label={<Trans>Show weather alerts</Trans>}
							onChange={(e) => handleChange('showAlerts', e)}
						/>
						{input.showAlerts && (
							<>{ALERT_DETAIL_SWITCHES.map(renderBooleanSwitch)}</>
						)}
						<h2 className="mt-8 text-2xl font-medium text-white">
							<Trans>Seasonal events</Trans>
						</h2>
						<Switch
							checked={input.showSeasonalEvents}
							label={<Trans>Show seasonal events</Trans>}
							onChange={(e) => handleChange('showSeasonalEvents', e)}
						/>
						{input.showSeasonalEvents && hasSoftwareRenderer && (
							<Alert icon={IconAlertTriangle} variant={AlertVariant.InfoRed}>
								<Trans>
									Seasonal effects are disabled because your browser appears to
									be using a software renderer. Enable hardware acceleration to
									see these effects.
								</Trans>
							</Alert>
						)}
						{input.showSeasonalEvents && (
							<>
								<Switch
									checked={input.showSeasonalTileGlow}
									label={<Trans>Show seasonal tile glow</Trans>}
									onChange={(e) => handleChange('showSeasonalTileGlow', e)}
								/>
								{SEASONAL_EVENT_SECTIONS.map((section) => (
									<Fragment key={section.id}>
										<h3 className="mt-8 text-sm font-semibold tracking-wide text-white uppercase">
											{section.title}
										</h3>
										{section.eventIds.map((eventId) =>
											renderBooleanSwitch({
												key: SEASONAL_EVENT_TOGGLE_KEY_BY_ID[eventId],
												label: SEASONAL_EVENT_LABELS[eventId],
											}),
										)}
									</Fragment>
								))}
							</>
						)}
						<h2 className="mt-14 text-2xl font-medium text-white">
							<Trans>Feedback</Trans>
						</h2>
						<a
							className="mb-2 flex text-sm text-blue-300 hover:underline"
							href={platformReviewLink}
							rel="noopener noreferrer"
							target="_blank"
						>
							<Trans>🌟 Leave a review</Trans>
						</a>
						<a
							className="mb-2 flex text-sm text-blue-300 hover:underline"
							href={`https://weather-please.app/bug?locale=${input.lang}`}
							rel="noopener noreferrer"
							target="_blank"
						>
							<Trans>🐛 Report a bug</Trans>
						</a>
						<a
							className="mb-2 flex text-sm text-blue-300 hover:underline"
							href="https://www.buymeacoffee.com/ggaidelevicius"
							rel="noopener noreferrer"
							target="_blank"
						>
							<Trans>☕ Gift a coffee</Trans>
						</a>
						<a
							className="flex text-sm text-blue-300 hover:underline"
							href="https://ggaidelevicius.com/?utm_source=weather_please"
							rel="noopener noreferrer"
							target="_blank"
						>
							👨 ggaidelevicius.com
						</a>
						<h2 className="mt-14 text-2xl font-medium text-white">
							<Trans>Attributions</Trans>
						</h2>
						<p className="text-sm text-dark-100">
							<Trans>
								Weather Please uses the following third-party data sources and
								location services.
							</Trans>
						</p>
						<ul className="space-y-2 pl-4">
							{ATTRIBUTION_LINKS.map((link) => (
								<li className="list-disc marker:text-blue-300" key={link.href}>
									<a
										className="flex text-sm text-blue-300 hover:underline"
										href={link.href}
										rel="noopener noreferrer"
										target="_blank"
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
						<h2 className="mt-14 text-2xl font-medium text-white">
							<Trans>Legal</Trans>
						</h2>
						<a
							className="flex text-sm text-blue-300 hover:underline"
							href={locales[input.lang].privacy}
							rel="noopener noreferrer"
							target="_blank"
						>
							<Trans>🔒 Privacy policy</Trans>
						</a>
					</DialogPanel>
				</div>
			</Dialog>
		</>
	)
}

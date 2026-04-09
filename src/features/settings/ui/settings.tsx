import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from '@headlessui/react'
import { Trans } from '@lingui/react/macro'
import {
	IconAlertTriangle,
	IconCloud,
	IconInfoCircle,
	IconSettings,
	IconShieldCheckFilled,
	IconSparkles,
} from '@tabler/icons-react'
import { clsx } from 'clsx'
import { type ReactNode, useEffect, useState } from 'react'

import type { LocaleKey } from '../../../shared/lib/i18n'
import type { Config } from '../hooks/use-config'

import { locales } from '../../../shared/lib/i18n'
import { setSettingsModalOpenState } from '../../../shared/lib/settings-modal-state'
import { Alert } from '../../../shared/ui/alert'
import { AlertVariant } from '../../../shared/ui/alert-variant'
import { IconButton } from '../../../shared/ui/button'
import { HelpPopover } from '../../../shared/ui/help-popover'
import { Input, Select, Switch } from '../../../shared/ui/input'
import { SeasonalEventId } from '../../seasonal-events/core/types'
import { isLikelySoftwareRenderer } from '../../seasonal-events/core/utils'
import { SEASONAL_EVENT_TOGGLE_KEY_BY_ID } from '../model/seasonal-event-toggle-map'
import { TileIdentifier } from '../model/tile-identifier'
import { TemperatureUnit, UnitSystem } from '../model/unit-system'

type BooleanConfigKey = {
	[K in keyof Config]: Config[K] extends boolean ? K : never
}[keyof Config]

type SeasonalEventSection = {
	eventIds: SeasonalEventId[]
	id: string
	title: ReactNode
}

type SettingsContentProps = {
	handleChange: (k: keyof Config, v: Config[keyof Config]) => void
	hasSoftwareRenderer: boolean
	input: Config
	localeKeys: LocaleKey[]
	platformReviewLink: string
}

type SettingsSectionDefinition = {
	icon: ReactNode
	id: SettingsSectionId
	title: ReactNode
}

type SettingsSectionId = 'about' | 'general' | 'seasonal' | 'weather'

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

const SETTINGS_SECTIONS = [
	{
		icon: <IconSettings aria-hidden size={18} />,
		id: 'general',
		title: <Trans>General</Trans>,
	},
	{
		icon: <IconCloud aria-hidden size={18} />,
		id: 'weather',
		title: <Trans>Weather</Trans>,
	},
	{
		icon: <IconSparkles aria-hidden size={18} />,
		id: 'seasonal',
		title: <Trans>Seasonal events</Trans>,
	},
	{
		icon: <IconInfoCircle aria-hidden size={18} />,
		id: 'about',
		title: <Trans>About</Trans>,
	},
] as const satisfies ReadonlyArray<SettingsSectionDefinition>

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

const SETTINGS_FIELD_LAYOUT = 'split' as const

const getTemperatureUnitOptions = () => [
	{
		label: <Trans>Celsius (°C)</Trans>,
		value: TemperatureUnit.Celsius,
	},
	{
		label: <Trans>Fahrenheit (°F)</Trans>,
		value: TemperatureUnit.Fahrenheit,
	},
]

const getUnitSystemOptions = () => [
	{
		label: <Trans>Metric (km/h, mm)</Trans>,
		value: UnitSystem.Metric,
	},
	{
		label: <Trans>Imperial (mph, in)</Trans>,
		value: UnitSystem.Imperial,
	},
]

interface SettingsProps {
	handleChange: (k: keyof Config, v: Config[keyof Config]) => void
	input: Config
}

export const Settings = ({ handleChange, input }: Readonly<SettingsProps>) => {
	const [activeSection, setActiveSection] =
		useState<SettingsSectionId>('general')
	const [isOpen, setIsOpen] = useState(false)
	const [hasSoftwareRenderer] = useState(isLikelySoftwareRenderer)
	const localeKeys = Object.keys(locales) as LocaleKey[]
	const platformReviewLink =
		typeof navigator !== 'undefined' &&
		navigator.userAgent.toLowerCase().includes('firefox/')
			? 'https://addons.mozilla.org/en-US/firefox/addon/weather-please/reviews/'
			: 'https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn/reviews'
	const activeSectionDefinition =
		SETTINGS_SECTIONS.find((section) => section.id === activeSection) ??
		SETTINGS_SECTIONS[0]
	const contentProps = {
		handleChange,
		hasSoftwareRenderer,
		input,
		localeKeys,
		platformReviewLink,
	}

	useEffect(() => {
		setSettingsModalOpenState(isOpen)
	}, [isOpen])

	useEffect(
		() => () => {
			setSettingsModalOpenState(false)
		},
		[],
	)

	return (
		<>
			<IconButton
				className="fixed right-4 bottom-4 shadow-md"
				icon={IconSettings}
				onClick={() => {
					setActiveSection('general')
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
				<div className="fixed inset-0 flex w-screen items-center justify-center overflow-y-auto p-4 md:p-8">
					<DialogPanel
						className="m-auto h-150 w-full max-w-3xl overflow-hidden rounded-2xl bg-dark-800 transition duration-400 will-change-[transform,opacity,filter] data-closed:scale-97 data-closed:opacity-0 data-closed:blur-xs"
						transition
					>
						<div className="flex h-full flex-col md:flex-row">
							<div className="border-b border-white/6 bg-dark-900/45 p-5 md:w-56 md:border-r md:border-b-0 md:p-6">
								<DialogTitle as="h1" className="text-3xl font-bold text-white">
									<Trans>Settings</Trans>
								</DialogTitle>
								<nav
									aria-label="Settings sections"
									className="mt-6 grid grid-cols-2 gap-2 md:flex md:flex-col"
								>
									{SETTINGS_SECTIONS.map((section) => (
										<button
											aria-pressed={section.id === activeSection}
											className={
												section.id === activeSection
													? 'flex w-full cursor-pointer items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 text-left text-sm font-semibold text-dark-700 shadow-sm'
													: 'flex w-full cursor-pointer items-center gap-2.5 rounded-xl bg-transparent px-3 py-2.5 text-left text-sm font-medium text-dark-100 transition hover:bg-white/6 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'
											}
											key={section.id}
											onClick={() => {
												setActiveSection(section.id)
											}}
											type="button"
										>
											<span className="shrink-0">{section.icon}</span>
											<span className="min-w-0">{section.title}</span>
										</button>
									))}
								</nav>
							</div>
							<div className="flex-1 overflow-y-auto p-6 md:p-8">
								<div
									className="mx-auto max-w-2xl space-y-6"
									key={activeSection}
								>
									<div className="space-y-2">
										<h2 className="text-2xl font-medium text-white">
											{activeSectionDefinition.title}
										</h2>
									</div>
									{renderActiveSection({
										...contentProps,
										activeSection,
									})}
								</div>
							</div>
						</div>
					</DialogPanel>
				</div>
			</Dialog>
		</>
	)
}

const renderActiveSection = ({
	activeSection,
	handleChange,
	hasSoftwareRenderer,
	input,
	localeKeys,
	platformReviewLink,
}: SettingsContentProps & { activeSection: SettingsSectionId }) => {
	switch (activeSection) {
		case 'about':
			return (
				<AboutSettingsSection
					input={input}
					platformReviewLink={platformReviewLink}
				/>
			)
		case 'general':
			return (
				<GeneralSettingsSection
					handleChange={handleChange}
					input={input}
					localeKeys={localeKeys}
				/>
			)
		case 'seasonal':
			return (
				<SeasonalSettingsSection
					handleChange={handleChange}
					hasSoftwareRenderer={hasSoftwareRenderer}
					input={input}
				/>
			)
		case 'weather':
			return (
				<WeatherSettingsSection handleChange={handleChange} input={input} />
			)
	}
}

const SettingsSubsection = ({
	bodyClassName = 'space-y-2',
	children,
	description,
	headerAccessory,
	title,
}: Readonly<{
	bodyClassName?: string
	children: ReactNode
	description?: ReactNode
	headerAccessory?: ReactNode
	title: ReactNode
}>) => (
	<div className="space-y-3">
		<div className="flex items-center justify-between gap-3">
			<h3 className="font-semibold text-white">{title}</h3>
			{headerAccessory ? (
				<div className="shrink-0">{headerAccessory}</div>
			) : null}
		</div>
		{description ? (
			<p className="text-sm text-dark-200">{description}</p>
		) : null}
		<div className={clsx(bodyClassName)}>{children}</div>
	</div>
)

const SettingsSectionLayout = ({
	children,
}: Readonly<{ children: ReactNode }>) => (
	<div className="space-y-8">{children}</div>
)

const GeneralSettingsSection = ({
	handleChange,
	input,
	localeKeys,
}: Pick<SettingsContentProps, 'handleChange' | 'input' | 'localeKeys'>) => (
	<SettingsSectionLayout>
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
	</SettingsSectionLayout>
)

const WeatherSettingsSection = ({
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

const SeasonalSettingsSection = ({
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
							<Switch
								checked={input[SEASONAL_EVENT_TOGGLE_KEY_BY_ID[eventId]]}
								key={eventId}
								label={SEASONAL_EVENT_LABELS[eventId]}
								layout={SETTINGS_FIELD_LAYOUT}
								onChange={(checked) =>
									handleChange(
										SEASONAL_EVENT_TOGGLE_KEY_BY_ID[eventId],
										checked,
									)
								}
							/>
						))}
					</SettingsSubsection>
				))
			: null}
	</SettingsSectionLayout>
)

const AboutSettingsSection = ({
	input,
	platformReviewLink,
}: Pick<SettingsContentProps, 'input' | 'platformReviewLink'>) => (
	<SettingsSectionLayout>
		<SettingsSubsection title={<Trans>Feedback</Trans>}>
			<>
				<a
					className="flex text-sm text-blue-300 hover:underline"
					href={platformReviewLink}
					rel="noopener noreferrer"
					target="_blank"
				>
					<Trans>🌟 Leave a review</Trans>
				</a>
				<a
					className="flex text-sm text-blue-300 hover:underline"
					href={`https://weather-please.app/bug?locale=${input.lang}`}
					rel="noopener noreferrer"
					target="_blank"
				>
					<Trans>🐛 Report a bug</Trans>
				</a>
				<a
					className="flex text-sm text-blue-300 hover:underline"
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
			</>
		</SettingsSubsection>
		<SettingsSubsection title={<Trans>Attributions</Trans>}>
			<>
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
			</>
		</SettingsSubsection>
		<SettingsSubsection title={<Trans>Legal</Trans>}>
			<a
				className="flex text-sm text-blue-300 hover:underline"
				href={locales[input.lang].privacy}
				rel="noopener noreferrer"
				target="_blank"
			>
				<Trans>🔒 Privacy policy</Trans>
			</a>
		</SettingsSubsection>
	</SettingsSectionLayout>
)

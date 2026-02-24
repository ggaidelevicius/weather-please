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
import { Alert } from './alert'
import { IconButton } from './button'
import { Input, Select, Switch } from './input'
import { SEASONAL_EVENT_BOOLEAN_SETTINGS } from '../config/boolean-settings'
import { locales } from '../lib/i18n'
import { isLikelySoftwareRenderer } from '../hooks/seasonal-events/utils'
import type { SeasonalEventId } from '../hooks/seasonal-events'
import type { Config } from '../hooks/use-config'
import type { LocaleKey } from '../lib/i18n'

type BooleanConfigKey = {
	[K in keyof Config]: Config[K] extends boolean ? K : never
}[keyof Config]

type SeasonalEventToggleKey =
	(typeof SEASONAL_EVENT_BOOLEAN_SETTINGS)[number]['key']

type SwitchDefinition<K extends BooleanConfigKey = BooleanConfigKey> = {
	key: K
	label: ReactNode
}

type SeasonalEventSection = {
	id: string
	title: ReactNode
	eventIds: SeasonalEventId[]
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
	'spring-equinox': <Trans>Show Spring Equinox event</Trans>,
	'summer-solstice': <Trans>Show Summer Solstice event</Trans>,
	'autumn-equinox': <Trans>Show Autumn Equinox event</Trans>,
	'winter-solstice': <Trans>Show Winter Solstice event</Trans>,
	'earth-day': <Trans>Show Earth Day event</Trans>,
	quadrantids: <Trans>Show Quadrantids meteor shower event</Trans>,
	lyrids: <Trans>Show Lyrids meteor shower event</Trans>,
	'eta-aquariids': <Trans>Show Eta Aquariids meteor shower event</Trans>,
	orionids: <Trans>Show Orionids meteor shower event</Trans>,
	leonids: <Trans>Show Leonids meteor shower event</Trans>,
	'total-solar-eclipse': <Trans>Show total solar eclipse event</Trans>,
	'total-lunar-eclipse': <Trans>Show total lunar eclipse event</Trans>,
	perseids: <Trans>Show Perseids meteor shower event</Trans>,
	geminids: <Trans>Show Geminids meteor shower event</Trans>,
	'lunar-new-year': <Trans>Show Lunar New Year event</Trans>,
	easter: <Trans>Show Easter event</Trans>,
	diwali: <Trans>Show Diwali event</Trans>,
	holi: <Trans>Show Holi event</Trans>,
	'eid-al-fitr': <Trans>Show Eid al-Fitr event</Trans>,
	'eid-al-adha': <Trans>Show Eid al-Adha event</Trans>,
	hanukkah: <Trans>Show Hanukkah event</Trans>,
	'christmas-day': <Trans>Show Christmas Day event</Trans>,
	'new-years-day': <Trans>Show New Year&apos;s Day event</Trans>,
	'valentines-day': <Trans>Show Valentine&apos;s Day event</Trans>,
	halloween: <Trans>Show Halloween event</Trans>,
	'day-of-the-dead': <Trans>Show Day of the Dead event</Trans>,
} as const satisfies Record<SeasonalEventId, ReactNode>

const SEASONAL_EVENT_SECTIONS = [
	{
		id: 'nature',
		title: <Trans>Seasons & nature</Trans>,
		eventIds: [
			'spring-equinox',
			'summer-solstice',
			'autumn-equinox',
			'winter-solstice',
			'earth-day',
		],
	},
	{
		id: 'astronomy',
		title: <Trans>Astronomy</Trans>,
		eventIds: [
			'quadrantids',
			'lyrids',
			'eta-aquariids',
			'orionids',
			'leonids',
			'total-solar-eclipse',
			'total-lunar-eclipse',
			'perseids',
			'geminids',
		],
	},
	{
		id: 'religious-cultural',
		title: <Trans>Religious & cultural</Trans>,
		eventIds: [
			'lunar-new-year',
			'easter',
			'diwali',
			'holi',
			'eid-al-fitr',
			'eid-al-adha',
			'hanukkah',
			'christmas-day',
		],
	},
	{
		id: 'other-holidays',
		title: <Trans>Other holidays</Trans>,
		eventIds: [
			'new-years-day',
			'valentines-day',
			'halloween',
			'day-of-the-dead',
		],
	},
] as const satisfies ReadonlyArray<SeasonalEventSection>

const SEASONAL_EVENT_KEY_BY_ID = Object.fromEntries(
	SEASONAL_EVENT_BOOLEAN_SETTINGS.map((setting) => [
		setting.seasonalEventId,
		setting.key,
	]),
) as Record<SeasonalEventId, SeasonalEventToggleKey>

interface SettingsProps {
	handleChange: (k: keyof Config, v: Config[keyof Config]) => void
	input: Config
}

export const Settings = ({ handleChange, input }: Readonly<SettingsProps>) => {
	const [isOpen, setIsOpen] = useState(false)
	const [platformReviewLink, setPlatformReviewLink] = useState(
		'https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn/reviews',
	)
	const [hasSoftwareRenderer, setHasSoftwareRenderer] = useState(false)
	const localeKeys = Object.keys(locales) as LocaleKey[]

	useEffect(() => {
		if (navigator.userAgent.toLowerCase().includes('firefox/')) {
			setPlatformReviewLink(
				'https://addons.mozilla.org/en-US/firefox/addon/weather-please/reviews/',
			)
		}
	}, [])

	useEffect(() => {
		setHasSoftwareRenderer(isLikelySoftwareRenderer())
	}, [])

	const renderBooleanSwitch = <K extends BooleanConfigKey>(
		switchDefinition: SwitchDefinition<K>,
	) => (
		<Switch
			key={switchDefinition.key}
			label={switchDefinition.label}
			checked={input[switchDefinition.key]}
			onChange={(checked) => handleChange(switchDefinition.key, checked)}
		/>
	)

	return (
		<>
			<IconButton
				onClick={() => {
					setIsOpen(true)
				}}
				className="fixed right-4 bottom-4 shadow-md"
				icon={IconSettings}
			>
				<Trans>Settings</Trans>
			</IconButton>
			<Dialog
				open={isOpen}
				onClose={() => setIsOpen(false)}
				className="relative z-50"
			>
				<DialogBackdrop
					transition
					className="fixed inset-0 bg-black/60 backdrop-blur-lg transition duration-300 will-change-[backdrop-filter,background-color] data-closed:opacity-0"
				/>
				<div className="fixed inset-0 flex w-screen items-center justify-center overflow-y-auto p-8">
					<DialogPanel
						transition
						className="m-auto w-full max-w-lg space-y-4 rounded-xl bg-dark-800 p-12 transition duration-400 will-change-[transform,opacity,filter] data-closed:scale-97 data-closed:opacity-0 data-closed:blur-xs"
					>
						<DialogTitle as="h1" className="text-4xl font-bold text-white">
							<Trans>Settings</Trans>
						</DialogTitle>
						<h2 className="mt-14 text-2xl font-medium text-white">
							<Trans>General</Trans>
						</h2>
						<Select
							label={<Trans>Language</Trans>}
							value={input.lang}
							onChange={(e) => {
								handleChange('lang', e.target.value)
							}}
							options={localeKeys.map((key) => ({
								value: key,
								label: locales[key].label,
							}))}
						/>
						<Switch
							label={<Trans>Use metric number format</Trans>}
							checked={input.useMetric}
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
							value={input.lat}
							onChange={(e) => {
								handleChange('lat', e.target.value)
							}}
							validation={/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(input.lat)}
						/>
						<Input
							label={<Trans>Longitude</Trans>}
							value={input.lon}
							onChange={(e) => {
								handleChange('lon', e.target.value)
							}}
							validation={/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/.test(
								input.lon,
							)}
						/>
						<Switch
							label={<Trans>Periodically update location automatically</Trans>}
							checked={input.periodicLocationUpdate}
							onChange={(e) => handleChange('periodicLocationUpdate', e)}
						/>
						<Select
							label={<Trans>Number of days to forecast</Trans>}
							value={input.daysToRetrieve}
							onChange={(e) => {
								handleChange('daysToRetrieve', e.target.value)
							}}
							options={Array.from({ length: 9 }, (_, i) => ({
								value: (i + 1).toString(),
								label: (i + 1).toString(),
							}))}
						/>
						<Select
							label={<Trans>Identifier</Trans>}
							value={input.identifier}
							onChange={(e) => {
								handleChange('identifier', e.target.value)
							}}
							options={[
								{
									label: <Trans>Day</Trans>,
									value: 'day',
								},
								{
									label: <Trans>Date</Trans>,
									value: 'date',
								},
							]}
						/>
						<div className="space-y-1">
							<Switch
								label={<Trans>Use Global Chemistry Models (CAMS)</Trans>}
								checked={input.useAirQualityUvOverride}
								onChange={(e) => handleChange('useAirQualityUvOverride', e)}
							/>
							<p className="text-sm text-dark-100">
								<Trans>
									Turn this on if Weather Please's reported UV index is
									consistently lower than local sources.
								</Trans>
							</p>
						</div>
						<Switch
							label={<Trans>Show weather alerts</Trans>}
							checked={input.showAlerts}
							onChange={(e) => handleChange('showAlerts', e)}
						/>
						{input.showAlerts && (
							<>{ALERT_DETAIL_SWITCHES.map(renderBooleanSwitch)}</>
						)}
						<h2 className="mt-8 text-2xl font-medium text-white">
							<Trans>Seasonal events</Trans>
						</h2>
						<Switch
							label={<Trans>Show seasonal events</Trans>}
							checked={input.showSeasonalEvents}
							onChange={(e) => handleChange('showSeasonalEvents', e)}
						/>
						{input.showSeasonalEvents && hasSoftwareRenderer && (
							<Alert icon={IconAlertTriangle} variant="info-red">
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
									label={<Trans>Show seasonal tile glow</Trans>}
									checked={input.showSeasonalTileGlow}
									onChange={(e) => handleChange('showSeasonalTileGlow', e)}
								/>
								{SEASONAL_EVENT_SECTIONS.map((section) => (
									<Fragment key={section.id}>
										<h3 className="mt-8 text-sm font-semibold tracking-wide text-white uppercase">
											{section.title}
										</h3>
										{section.eventIds.map((eventId) =>
											renderBooleanSwitch({
												key: SEASONAL_EVENT_KEY_BY_ID[eventId],
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
							href={platformReviewLink}
							target="_blank"
							rel="noopener noreferrer"
							className="mb-2 flex text-sm text-blue-300 hover:underline"
						>
							<Trans>🌟 Leave a review</Trans>
						</a>
						<a
							href={`https://weather-please.app/bug?locale=${input.lang}`}
							target="_blank"
							rel="noopener noreferrer"
							className="mb-2 flex text-sm text-blue-300 hover:underline"
						>
							<Trans>🐛 Report a bug</Trans>
						</a>
						<a
							href="https://www.buymeacoffee.com/ggaidelevicius"
							target="_blank"
							rel="noopener noreferrer"
							className="mb-2 flex text-sm text-blue-300 hover:underline"
						>
							<Trans>☕ Gift a coffee</Trans>
						</a>
						<a
							href="https://ggaidelevicius.com/?utm_source=weather_please"
							target="_blank"
							rel="noopener noreferrer"
							className="flex text-sm text-blue-300 hover:underline"
						>
							👨 ggaidelevicius.com
						</a>
						<h2 className="mt-14 text-2xl font-medium text-white">
							<Trans>Legal</Trans>
						</h2>
						<a
							href={locales[input.lang].privacy}
							target="_blank"
							rel="noopener noreferrer"
							className="flex text-sm text-blue-300 hover:underline"
						>
							<Trans>🔒 Privacy policy</Trans>
						</a>
					</DialogPanel>
				</div>
			</Dialog>
		</>
	)
}

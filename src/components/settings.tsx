import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from '@headlessui/react'
import { Trans } from '@lingui/react/macro'
import { IconSettings, IconShieldCheckFilled } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { Alert } from './alert'
import { IconButton } from './button'
import { Input, Select, Switch } from './input'
import { locales } from '../lib/i18n'
import type { Config } from '../hooks/use-config'
import type { LocaleKey } from '../lib/i18n'

interface SettingsProps {
	handleChange: (k: keyof Config, v: Config[keyof Config]) => void
	input: Config
}

export const Settings = ({ handleChange, input }: Readonly<SettingsProps>) => {
	const [isOpen, setIsOpen] = useState(false)
	const [platformReviewLink, setPlatformReviewLink] = useState(
		'https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn/reviews',
	)
	const localeKeys = Object.keys(locales) as LocaleKey[]

	useEffect(() => {
		if (navigator.userAgent.toLowerCase().includes('firefox/')) {
			setPlatformReviewLink(
				'https://addons.mozilla.org/en-US/firefox/addon/weather-please/reviews/',
			)
		}
	}, [])

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
						<Switch
							label={<Trans>Show weather alerts</Trans>}
							checked={input.showAlerts}
							onChange={(e) => handleChange('showAlerts', e)}
						/>
						{input.showAlerts && (
							<>
								<Switch
									label={<Trans>Show extreme UV alerts</Trans>}
									checked={input.showUvAlerts}
									onChange={(e) => handleChange('showUvAlerts', e)}
								/>
								<Switch
									label={<Trans>Show high precipitation alerts</Trans>}
									checked={input.showPrecipitationAlerts}
									onChange={(e) => handleChange('showPrecipitationAlerts', e)}
								/>
								<Switch
									label={<Trans>Show strong wind alerts</Trans>}
									checked={input.showWindAlerts}
									onChange={(e) => handleChange('showWindAlerts', e)}
								/>
								<Switch
									label={<Trans>Show low visibility alerts</Trans>}
									checked={input.showVisibilityAlerts}
									onChange={(e) => handleChange('showVisibilityAlerts', e)}
								/>
							</>
						)}
						<h2 className="mt-8 text-2xl font-medium text-white">
							<Trans>Seasonal events</Trans>
						</h2>
						<Switch
							label={<Trans>Show seasonal events</Trans>}
							checked={input.showSeasonalEvents}
							onChange={(e) => handleChange('showSeasonalEvents', e)}
						/>
						{input.showSeasonalEvents && (
							<>
								<Switch
									label={<Trans>Show seasonal tile glow</Trans>}
									checked={input.showSeasonalTileGlow}
									onChange={(e) => handleChange('showSeasonalTileGlow', e)}
								/>
								<h3 className="mt-8 text-sm font-semibold tracking-wide text-white uppercase">
									<Trans>Seasons & nature</Trans>
								</h3>
								<Switch
									label={<Trans>Show Spring Equinox event</Trans>}
									checked={input.showSpringEquinoxEvent}
									onChange={(e) => handleChange('showSpringEquinoxEvent', e)}
								/>
								<Switch
									label={<Trans>Show Summer Solstice event</Trans>}
									checked={input.showSummerSolsticeEvent}
									onChange={(e) => handleChange('showSummerSolsticeEvent', e)}
								/>
								<Switch
									label={<Trans>Show Autumn Equinox event</Trans>}
									checked={input.showAutumnEquinoxEvent}
									onChange={(e) => handleChange('showAutumnEquinoxEvent', e)}
								/>
								<Switch
									label={<Trans>Show Winter Solstice event</Trans>}
									checked={input.showWinterSolsticeEvent}
									onChange={(e) => handleChange('showWinterSolsticeEvent', e)}
								/>
								<Switch
									label={<Trans>Show Earth Day event</Trans>}
									checked={input.showEarthDayEvent}
									onChange={(e) => handleChange('showEarthDayEvent', e)}
								/>
								<h3 className="mt-8 text-sm font-semibold tracking-wide text-white uppercase">
									<Trans>Astronomy</Trans>
								</h3>
								<Switch
									label={<Trans>Show Quadrantids meteor shower event</Trans>}
									checked={input.showQuadrantidsEvent}
									onChange={(e) => handleChange('showQuadrantidsEvent', e)}
								/>
								<Switch
									label={<Trans>Show Lyrids meteor shower event</Trans>}
									checked={input.showLyridsEvent}
									onChange={(e) => handleChange('showLyridsEvent', e)}
								/>
								<Switch
									label={<Trans>Show Eta Aquariids meteor shower event</Trans>}
									checked={input.showEtaAquariidsEvent}
									onChange={(e) => handleChange('showEtaAquariidsEvent', e)}
								/>
								<Switch
									label={<Trans>Show Orionids meteor shower event</Trans>}
									checked={input.showOrionidsEvent}
									onChange={(e) => handleChange('showOrionidsEvent', e)}
								/>
								<Switch
									label={<Trans>Show Leonids meteor shower event</Trans>}
									checked={input.showLeonidsEvent}
									onChange={(e) => handleChange('showLeonidsEvent', e)}
								/>
								<Switch
									label={<Trans>Show total solar eclipse event</Trans>}
									checked={input.showTotalSolarEclipseEvent}
									onChange={(e) =>
										handleChange('showTotalSolarEclipseEvent', e)
									}
								/>
								<Switch
									label={<Trans>Show Perseids meteor shower event</Trans>}
									checked={input.showPerseidsEvent}
									onChange={(e) => handleChange('showPerseidsEvent', e)}
								/>
								<Switch
									label={<Trans>Show Geminids meteor shower event</Trans>}
									checked={input.showGeminidsEvent}
									onChange={(e) => handleChange('showGeminidsEvent', e)}
								/>
								<h3 className="mt-8 text-sm font-semibold tracking-wide text-white uppercase">
									<Trans>Religious & cultural</Trans>
								</h3>
								<Switch
									label={<Trans>Show Lunar New Year event</Trans>}
									checked={input.showLunarNewYearEvent}
									onChange={(e) => handleChange('showLunarNewYearEvent', e)}
								/>
								<Switch
									label={<Trans>Show Diwali event</Trans>}
									checked={input.showDiwaliEvent}
									onChange={(e) => handleChange('showDiwaliEvent', e)}
								/>
								<Switch
									label={<Trans>Show Holi event</Trans>}
									checked={input.showHoliEvent}
									onChange={(e) => handleChange('showHoliEvent', e)}
								/>
								<Switch
									label={<Trans>Show Eid al-Fitr event</Trans>}
									checked={input.showEidAlFitrEvent}
									onChange={(e) => handleChange('showEidAlFitrEvent', e)}
								/>
								<Switch
									label={<Trans>Show Eid al-Adha event</Trans>}
									checked={input.showEidAlAdhaEvent}
									onChange={(e) => handleChange('showEidAlAdhaEvent', e)}
								/>
								<Switch
									label={<Trans>Show Hanukkah event</Trans>}
									checked={input.showHanukkahEvent}
									onChange={(e) => handleChange('showHanukkahEvent', e)}
								/>
								<Switch
									label={<Trans>Show Christmas Day event</Trans>}
									checked={input.showChristmasEvent}
									onChange={(e) => handleChange('showChristmasEvent', e)}
								/>
								<h3 className="mt-8 text-sm font-semibold tracking-wide text-white uppercase">
									<Trans>Other holidays</Trans>
								</h3>
								<Switch
									label={<Trans>Show New Year&apos;s Day event</Trans>}
									checked={input.showNewYearsEvent}
									onChange={(e) => handleChange('showNewYearsEvent', e)}
								/>
								<Switch
									label={<Trans>Show Valentine&apos;s Day event</Trans>}
									checked={input.showValentinesEvent}
									onChange={(e) => handleChange('showValentinesEvent', e)}
								/>
								<Switch
									label={<Trans>Show Halloween event</Trans>}
									checked={input.showHalloweenEvent}
									onChange={(e) => handleChange('showHalloweenEvent', e)}
								/>
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

import { locales } from '@/lib/i18n'
import type { HandleChange } from '@/lib/types'
import type { Config } from '@/pages'
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

interface SettingsProps {
	handleChange: HandleChange
	input: Config
}

export const Settings = ({ handleChange, input }: Readonly<SettingsProps>) => {
	const [isOpen, setIsOpen] = useState(false)
	const [platformReviewLink, setPlatformReviewLink] = useState(
		'https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn/reviews',
	)

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
				className="fixed right-4 bottom-4"
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
					className="fixed inset-0 bg-black/60 backdrop-blur-lg transition duration-300 will-change-[backdrop-filter,background-color] data-[closed]:opacity-0"
				/>
				<div className="fixed inset-0 flex w-screen items-center justify-center overflow-y-auto p-8">
					<DialogPanel
						transition
						className="m-auto w-full max-w-lg space-y-4 rounded-xl bg-dark-800 p-12 transition duration-400 will-change-[transform,opacity,filter] data-[closed]:scale-97 data-[closed]:opacity-0 data-[closed]:blur-xs"
					>
						<DialogTitle as="h1" className="text-4xl font-bold text-white">
							<Trans>Settings</Trans>
						</DialogTitle>
						<h2 className="mt-8 text-2xl font-medium text-white">
							<Trans>General</Trans>
						</h2>
						<Select
							label={(<Trans>Language</Trans>) as unknown as string}
							value={input.lang}
							onChange={(e) => {
								handleChange('lang', e.target.value)
							}}
							options={Object.keys(locales).map((key) => ({
								value: key,
								label: locales[key].label,
							}))}
						/>
						<Switch
							label={
								(<Trans>Use metric number format</Trans>) as unknown as string
							}
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
							label={(<Trans>Latitude</Trans>) as unknown as string}
							value={input.lat}
							onChange={(e) => {
								handleChange('lat', e.target.value)
							}}
							validation={/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(input.lat)}
						/>
						<Input
							label={(<Trans>Longitude</Trans>) as unknown as string}
							value={input.lon}
							onChange={(e) => {
								handleChange('lon', e.target.value)
							}}
							validation={/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/.test(
								input.lon,
							)}
						/>
						<Switch
							label={
								(
									<Trans>Periodically update location automatically</Trans>
								) as unknown as string
							}
							checked={input.periodicLocationUpdate}
							onChange={(e) => handleChange('periodicLocationUpdate', e)}
						/>
						<Select
							label={
								(<Trans>Number of days to forecast</Trans>) as unknown as string
							}
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
							label={(<Trans>Identifier</Trans>) as unknown as string}
							value={input.identifier}
							onChange={(e) => {
								handleChange('identifier', e.target.value)
							}}
							options={[
								{
									label: (<Trans>Day</Trans>) as unknown as string,
									value: 'day',
								},
								{
									label: (<Trans>Date</Trans>) as unknown as string,
									value: 'date',
								},
							]}
						/>
						<Switch
							label={(<Trans>Show weather alerts</Trans>) as unknown as string}
							checked={input.showAlerts}
							onChange={(e) => handleChange('showAlerts', e)}
						/>
						{input.showAlerts && (
							<>
								<Switch
									label={
										(<Trans>Show extreme UV alerts</Trans>) as unknown as string
									}
									checked={input.showUvAlerts}
									onChange={(e) => handleChange('showUvAlerts', e)}
								/>
								<Switch
									label={
										(
											<Trans>Show high precipitation alerts</Trans>
										) as unknown as string
									}
									checked={input.showPrecipitationAlerts}
									onChange={(e) => handleChange('showPrecipitationAlerts', e)}
								/>
								<Switch
									label={
										(
											<Trans>Show strong wind alerts</Trans>
										) as unknown as string
									}
									checked={input.showWindAlerts}
									onChange={(e) => handleChange('showWindAlerts', e)}
								/>
								<Switch
									label={
										(
											<Trans>Show low visibility alerts</Trans>
										) as unknown as string
									}
									checked={input.showVisibilityAlerts}
									onChange={(e) => handleChange('showVisibilityAlerts', e)}
								/>
							</>
						)}
						<h2 className="mt-14 text-2xl font-medium text-white">
							<Trans>Feedback</Trans>
						</h2>
						<a
							href={platformReviewLink}
							target="_blank"
							className="mb-2 flex text-sm text-blue-300 hover:underline"
						>
							<Trans>🌟 Leave a review</Trans>
						</a>
						<a
							href={`https://weather-please.app/bug?locale=${input.lang}`}
							target="_blank"
							className="mb-2 flex text-sm text-blue-300 hover:underline"
						>
							<Trans>🐛 Report a bug</Trans>
						</a>
						<a
							href="https://www.buymeacoffee.com/ggaidelevicius"
							target="_blank"
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

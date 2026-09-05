import type {
	SettingsProps,
	SettingsContentProps,
	SettingsSectionDefinition,
	SettingsSectionId,
} from './settings-types'
import {
	IconSettings,
	IconCloud,
	IconSparkles,
	IconPlugConnected,
	IconInfoCircle,
	IconCode,
} from '@tabler/icons-react'
import { Trans } from '@lingui/react/macro'
import { useState, useEffect } from 'react'
import { isLikelySoftwareRenderer } from '../../seasonal-events/core/utils'
import type { LocaleKey } from '../../../shared/lib/i18n'
import { locales } from '../../../shared/lib/i18n'
import { setSettingsModalOpenState } from '../../../shared/lib/settings-modal-state'
import { IconButton } from '../../../shared/ui/button'
import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from '@headlessui/react'
import { AboutSettingsSection } from './sections/about-settings'
import { DeveloperSettingsSection } from './sections/developer-settings'
import { GeneralSettingsSection } from './sections/general-settings'
import { IntegrationsSettingsSection } from './sections/integrations-settings'
import { SeasonalSettingsSection } from './sections/seasonal-settings'
import { WeatherSettingsSection } from './sections/weather-settings'

export const SETTINGS_SECTIONS = [
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
		icon: <IconPlugConnected aria-hidden size={18} />,
		id: 'integrations',
		title: <Trans>Integrations</Trans>,
	},
	{
		icon: <IconInfoCircle aria-hidden size={18} />,
		id: 'about',
		title: <Trans>About</Trans>,
	},
	{
		icon: <IconCode aria-hidden size={18} />,
		id: 'developer',
		title: <Trans>Developer</Trans>,
	},
] as const satisfies ReadonlyArray<SettingsSectionDefinition>

export const getVisibleSettingsSections = ({
	isDeveloperMode,
}: Readonly<{ isDeveloperMode: boolean }>) =>
	isDeveloperMode
		? SETTINGS_SECTIONS
		: SETTINGS_SECTIONS.filter((section) => section.id !== 'developer')

export const Settings = ({
	calendarConnection,
	handleChange,
	input,
	integrationsPromo,
}: Readonly<SettingsProps>) => {
	const [activeSection, setActiveSection] =
		useState<SettingsSectionId>('general')
	const [isOpen, setIsOpen] = useState(false)
	const [hasSoftwareRenderer] = useState(isLikelySoftwareRenderer)
	const isDeveloperMode = process.env.NODE_ENV === 'development'
	const localeKeys = Object.keys(locales) as LocaleKey[]
	const settingsSections = getVisibleSettingsSections({ isDeveloperMode })
	const platformReviewLink =
		typeof navigator !== 'undefined' &&
		navigator.userAgent.toLowerCase().includes('firefox/')
			? 'https://addons.mozilla.org/en-US/firefox/addon/weather-please/reviews/'
			: 'https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn/reviews'
	const activeSectionDefinition =
		settingsSections.find((section) => section.id === activeSection) ??
		settingsSections[0]
	const contentProps = {
		calendarConnection,
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
				className="fixed right-4 bottom-4 z-2 shadow-md"
				icon={IconSettings}
				onClick={() => {
					setActiveSection('general')
					setIsOpen(true)
					integrationsPromo.onSettingsOpened()
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
									{settingsSections.map((section) => (
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
												if (section.id === 'integrations') {
													integrationsPromo.onIntegrationsViewed()
												}
											}}
											type="button"
										>
											<span className="shrink-0">{section.icon}</span>
											<span className="min-w-0">{section.title}</span>
											{section.id === 'integrations' &&
											integrationsPromo.shouldHighlightIntegrations ? (
												<span
													aria-hidden
													className="relative ml-auto flex size-2 shrink-0"
												>
													<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
													<span className="relative inline-flex size-2 rounded-full bg-blue-400" />
												</span>
											) : null}
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

export const renderActiveSection = ({
	activeSection,
	calendarConnection,
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
		case 'developer':
			return (
				<DeveloperSettingsSection handleChange={handleChange} input={input} />
			)
		case 'general':
			return (
				<GeneralSettingsSection
					handleChange={handleChange}
					input={input}
					localeKeys={localeKeys}
				/>
			)
		case 'integrations':
			return (
				<IntegrationsSettingsSection
					calendarConnection={calendarConnection}
					handleChange={handleChange}
					input={input}
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

export type { IntegrationsPromo } from './settings-types'

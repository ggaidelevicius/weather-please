import type { ReactNode } from 'react'

import { Trans } from '@lingui/react/macro'

import type { SettingsContentProps } from '../settings-types'

import { locales } from '../../../../shared/lib/i18n'
import { SettingsSectionLayout, SettingsSubsection } from './section-layout'

export const ATTRIBUTION_LINKS = [
	{
		href: 'https://open-meteo.com/',
		label: <Trans>Weather data by Open-Meteo</Trans>,
	},
	{
		href: 'https://www.openstreetmap.org/copyright',
		label: <Trans>Reverse geocoding by OpenStreetMap contributors</Trans>,
	},
] as const satisfies ReadonlyArray<{ href: string; label: ReactNode }>

export const AboutSettingsSection = ({
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

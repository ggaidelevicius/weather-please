import type { ReactNode } from 'react'

import Head from 'next/head'
import Link from 'next/link'

const SectionHeading = ({ children }: Readonly<{ children: ReactNode }>) => (
	<h2 className="mt-10 text-xl font-semibold text-white">{children}</h2>
)

const Paragraph = ({ children }: Readonly<{ children: ReactNode }>) => (
	<p className="mt-4 leading-relaxed text-dark-100">{children}</p>
)

const ListItem = ({ children }: Readonly<{ children: ReactNode }>) => (
	<li className="list-disc leading-relaxed text-dark-100 marker:text-blue-300">
		{children}
	</li>
)

const ExternalLink = ({
	children,
	href,
}: Readonly<{ children: ReactNode; href: string }>) => (
	<a
		className="text-blue-300 hover:underline"
		href={href}
		rel="noopener noreferrer"
		target="_blank"
	>
		{children}
	</a>
)

const PrivacyPage = () => (
	<div className="min-h-screen w-full bg-dark-800">
		<Head>
			<title>Privacy policy — Weather Please</title>
			<meta
				content="The privacy policy for the Weather Please browser extension."
				name="description"
			/>
		</Head>
		<div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
			<header>
				<Link aria-label="Home" className="flex items-center" href="/">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						alt=""
						className="size-10 flex-none rounded-xl"
						src="/favicon.png"
					/>
					<p className="ml-4 text-base font-semibold text-white">
						Weather Please
					</p>
				</Link>
			</header>
			<main className="pb-10">
				<h1 className="mt-14 text-3xl font-medium tracking-tight text-pretty text-white">
					Privacy Policy for the &quot;Weather Please&quot; Browser Extension
				</h1>
				<p className="mt-4 text-sm text-dark-200">
					Last updated: June 12, 2026
				</p>
				<Paragraph>
					Your privacy is important to us. This policy outlines what data the
					&quot;Weather Please&quot; browser extension may collect and how it is
					used.
				</Paragraph>

				<SectionHeading>1. Information We Don&apos;t Collect</SectionHeading>
				<Paragraph>
					&quot;Weather Please&quot; does <strong>not</strong> collect, store,
					or transmit any personal data related to your browsing activity. We do
					not access, retain, or share data such as IP addresses, browsing
					history, or any personally identifiable information.
				</Paragraph>

				<SectionHeading>
					2. Geolocation Data and Third-Party Services
				</SectionHeading>
				<Paragraph>
					To retrieve local weather information, &quot;Weather Please&quot;
					requires access to your device&apos;s geolocation (latitude and
					longitude). Upon installation, you will be prompted to allow location
					access. If you decline, the extension will not function.
				</Paragraph>
				<Paragraph>
					Location data is sent directly to third-party services to fetch
					weather updates and to display a user-friendly location name. These
					services operate under their own privacy policies, which you can
					review here:
				</Paragraph>
				<ul className="mt-4 space-y-2 pl-5">
					<ListItem>
						<ExternalLink href="https://open-meteo.com/en/terms">
							Open-Meteo Privacy Policy
						</ExternalLink>
					</ListItem>
					<ListItem>
						<ExternalLink href="https://osmfoundation.org/wiki/Privacy_Policy">
							Nominatim (OpenStreetMap) Privacy Policy
						</ExternalLink>
					</ListItem>
				</ul>
				<Paragraph>
					Nominatim is used to convert your coordinates into a readable location
					name (reverse geocoding). &quot;Weather Please&quot; does not store or
					transmit your location data beyond these requests.
				</Paragraph>

				<SectionHeading>3. Calendar Data (Optional)</SectionHeading>
				<Paragraph>
					&quot;Weather Please&quot; can optionally connect to your Google
					Calendar or Microsoft Outlook account to display your upcoming events.
					If you choose to connect an account:
				</Paragraph>
				<ul className="mt-4 space-y-2 pl-5">
					<ListItem>
						Authentication happens directly between your browser and Google or
						Microsoft using the industry-standard OAuth 2.0 protocol. We never
						see or store your password.
					</ListItem>
					<ListItem>
						The extension requests the minimum read-only access required to list
						your upcoming events. It cannot create, edit, or delete events.
					</ListItem>
					<ListItem>
						Event data (titles, times, and locations) is fetched directly from
						your provider and displayed locally on your new tab page. It is
						never transmitted to, processed by, or stored on our servers.
					</ListItem>
					<ListItem>
						Sign-in tokens are stored locally in your browser and are deleted
						when you disconnect the account.
					</ListItem>
					<ListItem>
						You can disconnect an account at any time from the extension&apos;s
						settings, and you can additionally revoke the extension&apos;s
						access from your Google or Microsoft account security settings.
					</ListItem>
				</ul>
				<Paragraph>
					Google&apos;s and Microsoft&apos;s handling of your data is governed
					by their own privacy policies:
				</Paragraph>
				<ul className="mt-4 space-y-2 pl-5">
					<ListItem>
						<ExternalLink href="https://policies.google.com/privacy">
							Google Privacy Policy
						</ExternalLink>
					</ListItem>
					<ListItem>
						<ExternalLink href="https://privacy.microsoft.com/privacystatement">
							Microsoft Privacy Statement
						</ExternalLink>
					</ListItem>
				</ul>
				<Paragraph>
					&quot;Weather Please&apos;s&quot; use and transfer of information
					received from Google APIs adheres to the{' '}
					<ExternalLink href="https://developers.google.com/terms/api-services-user-data-policy">
						Google API Services User Data Policy
					</ExternalLink>
					, including the Limited Use requirements.
				</Paragraph>

				<SectionHeading>4. How We Use Your Information</SectionHeading>
				<Paragraph>
					We do not collect, store, or share any personal data. Your geolocation
					is used <strong>only</strong> to retrieve weather data from
					third-party services, and calendar access is used{' '}
					<strong>only</strong> to display your upcoming events on your new tab
					page.
				</Paragraph>

				<SectionHeading>5. Your Choices</SectionHeading>
				<Paragraph>
					You may choose whether to grant location access when prompted. If you
					do not allow it, the extension will not function. Calendar connections
					are entirely optional, and the extension works fully without them. By
					using &quot;Weather Please,&quot; you acknowledge and accept these
					requirements.
				</Paragraph>

				<SectionHeading>6. Changes to This Privacy Policy</SectionHeading>
				<Paragraph>
					We may update this Privacy Policy from time to time. Changes will be
					posted on this page and take effect immediately upon posting.
				</Paragraph>

				<SectionHeading>7. Contact Us</SectionHeading>
				<Paragraph>
					If you have any questions or suggestions about this Privacy Policy,
					contact us at{' '}
					<a
						className="text-blue-300 hover:underline"
						href="mailto:contact@weather-please.app"
					>
						contact@weather-please.app
					</a>
					.
				</Paragraph>
			</main>
		</div>
	</div>
)

export default PrivacyPage

import type { ReactNode } from 'react'

import Head from 'next/head'
import Link from 'next/link'

const SectionHeading = ({ children }: Readonly<{ children: ReactNode }>) => (
	<h2 className="mt-10 text-xl font-semibold text-white">{children}</h2>
)

const SubsectionHeading = ({
	children,
	id,
}: Readonly<{ children: ReactNode; id: string }>) => (
	<h3 className="mt-7 text-base font-semibold text-white" id={id}>
		{children}
	</h3>
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
					Last updated: August 1, 2026
				</p>
				<Paragraph>
					This policy explains what data the &quot;Weather Please&quot; browser
					extension accesses, how it uses and protects that data, and the
					choices available to you.
				</Paragraph>

				<SectionHeading>1. Information We Don&apos;t Collect</SectionHeading>
				<Paragraph>
					The extension does not access or collect your browsing history, the
					contents of websites you visit, contacts, files, or advertising
					identifiers. We do not operate a server that receives or stores your
					Google account or Google Calendar data.
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

				<SectionHeading>
					3. Google User Data and Calendar Integration (Optional)
				</SectionHeading>
				<Paragraph>
					You may optionally connect a Google account so the extension can show
					your upcoming calendar events on your new tab page. The extension uses
					Google OAuth 2.0 and requests the{' '}
					<code>calendar.events.readonly</code> scope. Calendar access is not
					required to use the weather features.
				</Paragraph>

				<SubsectionHeading id="google-user-data-access">
					3.1 Google User Data We Access
				</SubsectionHeading>
				<Paragraph>If you connect a Google account, we access:</Paragraph>
				<ul className="mt-4 space-y-2 pl-5">
					<ListItem>
						Your Google account&apos;s stable identifier and email address or
						name, used only to identify and label the connected account in the
						extension.
					</ListItem>
					<ListItem>
						OAuth access and refresh tokens, used to authenticate requests and
						keep the connection working until you disconnect it.
					</ListItem>
					<ListItem>
						Up to 10 upcoming events from your primary Google Calendar within
						the next three days. The event fields accessed are title,
						description, start and end time, all-day status, location, event
						status, event identifiers, and the Google Calendar source link.
					</ListItem>
				</ul>
				<Paragraph>
					This is read-only access. The extension cannot create, edit, delete,
					or otherwise modify your events or calendars.
				</Paragraph>

				<SubsectionHeading id="google-user-data-use">
					3.2 How We Use Google User Data
				</SubsectionHeading>
				<Paragraph>
					We use your Google account information and OAuth tokens only to
					connect the account, refresh the connection, and make authorized
					read-only requests to Google Calendar. We use event data only to
					display, group, sort, and deduplicate your upcoming events and to
					provide a link that opens the source event in Google Calendar.
				</Paragraph>
				<Paragraph>
					Google user data is not used for advertising, profiling, credit or
					eligibility decisions, or developing, improving, or training
					general-purpose artificial intelligence or machine-learning models.
				</Paragraph>

				<SubsectionHeading id="google-user-data-sharing">
					3.3 Sharing, Transfer, and Disclosure of Google User Data
				</SubsectionHeading>
				<Paragraph>
					Google user data travels directly between Google and the extension in
					your browser. It is not transmitted to our servers. We do not sell,
					rent, share, transfer, or disclose Google user data to third parties,
					advertisers, data brokers, or other users. We do not permit humans to
					read your Google user data.
				</Paragraph>

				<SubsectionHeading id="google-user-data-protection">
					3.4 Storage and Data Protection
				</SubsectionHeading>
				<Paragraph>
					Authentication uses the OAuth 2.0 Authorization Code flow with PKCE,
					so the extension never receives or stores your Google password.
					Requests to Google use HTTPS/TLS, and the extension requests only the
					read-only scope required for its calendar display.
				</Paragraph>
				<Paragraph>
					Event details are held in browser memory only and are not written to
					persistent storage. OAuth tokens and the connected account identifier
					and label are stored locally in browser storage, isolated to the
					extension&apos;s origin and protected by your browser profile and
					operating-system access controls. No Google user data is included in
					analytics, diagnostic reports, or application logs.
				</Paragraph>

				<SubsectionHeading id="google-user-data-retention">
					3.5 Retention and Deletion of Google User Data
				</SubsectionHeading>
				<Paragraph>
					Calendar event details remain in memory only while the page is open
					and are discarded when the page is closed or reloaded, when refreshed
					data replaces them, or when you disconnect the account. OAuth tokens
					and connected-account information remain in local browser storage only
					while the account is connected. Disconnecting the account in the
					extension&apos;s settings deletes those locally stored values.
					Removing the extension also removes its local extension storage.
				</Paragraph>
				<Paragraph>
					You may also revoke access from your{' '}
					<ExternalLink href="https://myaccount.google.com/connections">
						Google Account connections
					</ExternalLink>
					, which invalidates the authorization. Because we do not keep Google
					user data on our servers or in server backups, there is no additional
					server-side copy to request that we delete.
				</Paragraph>

				<SubsectionHeading id="google-limited-use">
					3.6 Google API Services User Data Policy
				</SubsectionHeading>
				<Paragraph>
					&quot;Weather Please&apos;s&quot; use and transfer of information
					received from Google APIs adheres to the{' '}
					<ExternalLink href="https://developers.google.com/terms/api-services-user-data-policy">
						Google API Services User Data Policy
					</ExternalLink>
					, including the Limited Use requirements.
				</Paragraph>

				<SectionHeading>4. Microsoft Outlook Data (Optional)</SectionHeading>
				<Paragraph>
					You may also connect a Microsoft Outlook account to display upcoming
					events. For this integration:
				</Paragraph>
				<ul className="mt-4 space-y-2 pl-5">
					<ListItem>
						Authentication happens directly between your browser and Microsoft
						using OAuth 2.0. We never see or store your password.
					</ListItem>
					<ListItem>
						The extension requests the minimum read-only access required to list
						your upcoming events. It cannot create, edit, or delete events.
					</ListItem>
					<ListItem>
						Event data is fetched directly from Microsoft and displayed locally.
						It is not transmitted to or stored on our servers.
					</ListItem>
					<ListItem>
						Sign-in tokens are stored locally in your browser and are deleted
						when you disconnect the account.
					</ListItem>
					<ListItem>
						You can disconnect the account in the extension&apos;s settings and
						revoke access from your Microsoft account security settings.
					</ListItem>
				</ul>
				<Paragraph>
					Microsoft&apos;s handling of your data is governed by the{' '}
					<ExternalLink href="https://privacy.microsoft.com/privacystatement">
						Microsoft Privacy Statement
					</ExternalLink>
					.
				</Paragraph>

				<SectionHeading>5. How We Use Other Information</SectionHeading>
				<Paragraph>
					Your geolocation is used only to retrieve local weather data and a
					readable place name from the services described above. Weather data,
					your selected settings, and location cache may be stored locally in
					your browser so the extension can load quickly and remember your
					preferences.
				</Paragraph>

				<SectionHeading>6. Your Choices</SectionHeading>
				<Paragraph>
					You may choose whether to grant location access when prompted. If you
					do not allow it, the extension will not function. Calendar connections
					are entirely optional, and the extension works fully without them. By
					using &quot;Weather Please,&quot; you acknowledge and accept these
					requirements.
				</Paragraph>

				<SectionHeading>7. Changes to This Privacy Policy</SectionHeading>
				<Paragraph>
					We may update this Privacy Policy from time to time. Changes will be
					posted on this page and take effect immediately upon posting.
				</Paragraph>

				<SectionHeading>8. Contact Us</SectionHeading>
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

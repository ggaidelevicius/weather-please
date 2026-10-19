import Head from 'next/head'

import { AgentDiscoveryLinks } from '../features/landing/ui/agent-discovery-links'
import { PrivacyContent } from '../features/landing/ui/privacy-content'
import { SiteFooter } from '../features/landing/ui/site-footer'
import { SiteHeader } from '../features/landing/ui/site-header'

const PrivacyPage = () => (
	<div className="min-h-screen w-full bg-dark-800">
		<Head>
			<title>Privacy policy — Weather Please</title>
			<meta
				content="The privacy policy for the Weather Please browser extension."
				name="description"
			/>
		</Head>
		<AgentDiscoveryLinks pathname="/privacy" />
		<SiteHeader pathname="/privacy" />
		<div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
			<main className="pb-10">
				<PrivacyContent />
			</main>
		</div>
		<SiteFooter />
	</div>
)

export default PrivacyPage

import '../styles/tailwind.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { Analytics } from '@vercel/analytics/react'

import { SITE_URL } from '../features/landing/model/site'
import { AgentDiscoveryLinks } from '../features/landing/ui/agent-discovery-links'
import { SiteFooter } from '../features/landing/ui/site-footer'
import { SiteHeader } from '../features/landing/ui/site-header'

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
}

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => (
	<html className="h-full bg-dark-800 antialiased" lang="en">
		<body className="min-h-full overflow-x-clip">
			<div className="min-h-screen w-full bg-dark-800">
				<AgentDiscoveryLinks />
				<SiteHeader />
				{children}
				<SiteFooter />
			</div>
			<Analytics />
		</body>
	</html>
)

export default RootLayout

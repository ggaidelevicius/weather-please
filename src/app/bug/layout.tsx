import '../../styles/tailwind.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
	alternates: {
		canonical: './',
	},
	metadataBase: new URL('https://weather-please.app'),
	robots: {
		index: false,
	},
	title: 'Report a bug',
}

interface RootLayoutProps {
	children: ReactNode
}

const RootLayout = ({ children }: Readonly<RootLayoutProps>) => {
	return (
		<html className="h-full bg-dark-800 antialiased" lang="en">
			<body className="flex min-h-full flex-col items-center justify-center">
				{children}
				<Analytics />
			</body>
		</html>
	)
}

export default RootLayout

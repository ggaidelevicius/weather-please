import '../../styles/tailwind.css'
import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
	metadataBase: new URL('https://weather-please.app'),
	title: 'Report a bug',
	robots: {
		index: false,
	},
	alternates: {
		canonical: './',
	},
}

interface RootLayoutProps {
	children: ReactNode
}

const RootLayout = ({ children }: Readonly<RootLayoutProps>) => {
	return (
		<html lang="en" className="h-full bg-dark-800 antialiased">
			<body className="flex min-h-full flex-col items-center justify-center">
				{children}
				<Analytics />
			</body>
		</html>
	)
}

export default RootLayout

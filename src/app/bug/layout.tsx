import '@/styles/tailwind.css'
import { Analytics } from '@vercel/analytics/react'
import { type Metadata } from 'next'

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

const RootLayout = ({ children }: { children: React.ReactNode }) => {
	return (
               <html lang="en" className="antialiased h-full bg-dark-800">
			<body className="flex min-h-full flex-col items-center justify-center">
				{children}
				<Analytics />
			</body>
		</html>
	)
}

export default RootLayout

import '@/styles/styles.css'
import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import { Notifications } from '@mantine/notifications'
import '@mantine/notifications/styles.css'
import { Analytics } from '@vercel/analytics/react'
import { Metadata } from 'next'
import type { FC } from 'react'
import { createHmac } from 'node:crypto'

const getToken = (id: string): string => {
	const hmac = createHmac('sha256', process.env.OG_KEY as string)
	hmac.update(JSON.stringify({ title: id }))
	const token = hmac.digest('hex')
	return token
}

const theme = createTheme({
	colors: {
		dark: [
			'#C1C2C5',
			'#A6A7AB',
			'#909296',
			'#5c5f66',
			'#373A40',
			'#2C2E33',
			'#25262b',
			'#1A1B1E',
			'#141517',
			'#101113',
		],
	},
})

const title = 'Feedback'
const description =
	'Leave some feedback, request a new feature, or report a bug.'

export const metadata: Metadata = {
	metadataBase: new URL(`https://${process.env.VERCEL_URL}`),
	title: title,
	description: description,
	openGraph: {
		images: [
			`/api/og?title=Feedback&description=${encodeURIComponent(
				description,
			)}&token=${getToken('Feedback')}`,
		],
	},
	alternates: {
		canonical: `/feedback`,
	},
}

const Layout: FC<{ children: React.ReactNode }> = ({ children }) => {
	return (
		<html lang="en">
			<head>
				<ColorSchemeScript />
			</head>
			<body className="appRouterBody">
				<MantineProvider defaultColorScheme="dark" theme={theme}>
					<Notifications
						position="top-right"
						transitionDuration={1000}
						notificationMaxHeight={10000}
					/>
					{children}
				</MantineProvider>
				{process.env.NEXT_PUBLIC_DEMO === 'true' && <Analytics />}
			</body>
		</html>
	)
}

export default Layout

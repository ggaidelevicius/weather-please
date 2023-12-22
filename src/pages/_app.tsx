import '@/styles/styles.css'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import { Notifications } from '@mantine/notifications'
import '@mantine/notifications/styles.css'
import { Analytics } from '@vercel/analytics/react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import type { FC } from 'react'

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

const App: FC<AppProps> = (props) => {
	const { Component, pageProps } = props

	return (
		<I18nProvider i18n={i18n}>
			<Head>
				{process.env.NEXT_PUBLIC_DEMO === 'true' && (
					<>
						<title>Weather Please</title>
						<meta
							name="description"
							content="Weather Please is a minimal new tab page that provides an outlook on current and future weather data."
						/>
						<link rel="canonical" href="https://weather-please.app" />
						<meta property="og:title" content="Weather Please" />
						<meta
							property="og:description"
							content="Weather Please is a minimal new tab page that provides an outlook on current and future weather data."
						/>
						<meta
							property="og:image"
							content={`https://weather-please.app/api/og?title=Weather%20Please&description=${encodeURIComponent(
								'Weather Please is a minimal new tab page that provides an outlook on current and future weather data.',
							)}&token=3b17f4222d691811a5a75dfd7b26a2235a212840f526c39828a07117997f17a3`}
						/>
						<meta property="og:url" content="https://weather-please.app" />
						<meta name="twitter:card" content="summary_large_image" />
						<meta name="twitter:title" content="Weather Please" />
						<meta
							name="twitter:description"
							content="Weather Please is a minimal new tab page that provides an outlook on current and future weather data."
						/>
						<meta
							name="twitter:image"
							content={`https://weather-please.app/api/og?title=Weather%20Please&description=${encodeURIComponent(
								'Weather Please is a minimal new tab page that provides an outlook on current and future weather data.',
							)}&token=3b17f4222d691811a5a75dfd7b26a2235a212840f526c39828a07117997f17a3`}
						/>
					</>
				)}
				{process.env.NEXT_PUBLIC_DEMO !== 'true' && <title>New tab</title>}
				<meta
					name="viewport"
					content="minimum-scale=1, initial-scale=1, width=device-width"
				/>
				<link rel="icon" href="/favicon.png" />
			</Head>
			<MantineProvider defaultColorScheme="dark" theme={theme}>
				<Notifications
					position="top-right"
					transitionDuration={1000}
					notificationMaxHeight={10000}
				/>
				<Component {...pageProps} />
				{process.env.NEXT_PUBLIC_DEMO === 'true' && <Analytics />}
			</MantineProvider>
		</I18nProvider>
	)
}

export default App

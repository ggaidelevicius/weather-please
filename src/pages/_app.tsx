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
				<title>New tab</title>
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

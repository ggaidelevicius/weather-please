import '../styles/tailwind.css'
import type { AppProps } from 'next/app'

import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { Analytics } from '@vercel/analytics/react'
import Head from 'next/head'

const App = ({ Component, pageProps }: Readonly<AppProps>) => {
	return (
		<I18nProvider i18n={i18n}>
			<Head>
				<title>New tab</title>
				<link href="/favicon.png" rel="icon" />
			</Head>
			<Component {...pageProps} />
			<Analytics />
		</I18nProvider>
	)
}

export default App

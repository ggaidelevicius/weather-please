import '../styles/tailwind.css'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import Head from 'next/head'
import { queryClient } from '../lib/query-client'
import type { AppProps } from 'next/app'

const App = ({ Component, pageProps }: Readonly<AppProps>) => {
	return (
		<I18nProvider i18n={i18n}>
			<Head>
				<title>New tab</title>
				<link rel="icon" href="/favicon.png" />
			</Head>
			<QueryClientProvider client={queryClient}>
				<Component {...pageProps} />
			</QueryClientProvider>
			<Analytics />
		</I18nProvider>
	)
}

export default App

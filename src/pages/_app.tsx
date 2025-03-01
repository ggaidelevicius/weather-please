import '@/styles/tailwind.css'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import type { AppProps } from 'next/app'
import Head from 'next/head'

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
		},
	},
})

const App = ({ Component, pageProps }: AppProps) => {

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
			<QueryClientProvider client={queryClient}>
				<Component {...pageProps} />
			</QueryClientProvider>
			{process.env.NEXT_PUBLIC_DEMO === 'true' && <Analytics />}
		</I18nProvider>
	)
}

export default App

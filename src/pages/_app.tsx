import '../styles/tailwind.css'
import type { AppProps } from 'next/app'

import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { Analytics } from '@vercel/analytics/react'
import Head from 'next/head'

import { messages } from '../locales/en/messages'

// I18nProvider renders nothing until a locale is active, so activation must
// happen before any page renders — not just on pages that use translations.
i18n.load({
	en: messages,
})
i18n.activate('en')

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

import '@/styles/styles.css'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { MantineProvider, createEmotionCache } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { Analytics } from '@vercel/analytics/react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import type { FC } from 'react'

const cache = createEmotionCache({ key: 'weather-please' })

const App: FC<AppProps> = (props) => {
  const { Component, pageProps } = props

  return (
    <I18nProvider i18n={i18n}>
      <Head>
        <title>
          New tab
        </title>
        <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
        <link rel='icon' href='/favicon.png' />
      </Head>
      <MantineProvider
        emotionCache={cache}
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: 'dark',
        }}
      >
        <Notifications />
        <Component {...pageProps} />
        {process.env.NEXT_PUBLIC_DEMO === 'true' &&
          <Analytics />
        }
      </MantineProvider>
    </I18nProvider >
  )
}

export default App

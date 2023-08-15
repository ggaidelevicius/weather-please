import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { AppProps } from 'next/app'
import Head from 'next/head'
import type { FC } from 'react'
import './styles.css'

const App: FC<AppProps> = (props: AppProps) => {
  const { Component, pageProps } = props

  return (
    <>
      <Head>
        <title>New tab</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: 'dark',
        }}
      >
        <Notifications />
        <Component {...pageProps} />
      </MantineProvider>
    </>
  )
}

export default App

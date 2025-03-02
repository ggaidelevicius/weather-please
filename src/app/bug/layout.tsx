import '@/styles/tailwind.css'
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
    <html
      lang="en"
      className='h-full bg-dark-800 antialiased"'
    >
      <body className="flex min-h-full flex-col items-center justify-center">
        {children}
      </body>
    </html>
  )
}

export default RootLayout
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
	alternates: {
		canonical: '/bug',
	},
	robots: {
		index: false,
	},
	title: 'Report a bug',
}

const BugLayout = ({ children }: Readonly<{ children: ReactNode }>) => (
	<main className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6">{children}</main>
)

export default BugLayout

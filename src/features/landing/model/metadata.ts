import type { Metadata } from 'next'

import { MARKDOWN_PATHS, type MarkdownPagePath, SITE_URL } from './site'

export const createMarketingMetadata = ({
	description,
	pathname,
	title,
}: Readonly<{
	description: string
	pathname: MarkdownPagePath
	title: string
}>): Metadata => ({
	alternates: {
		canonical: new URL(pathname, SITE_URL).href,
		types: { 'text/markdown': MARKDOWN_PATHS[pathname] },
	},
	description,
	openGraph: {
		description,
		siteName: 'Weather Please',
		title,
		type: 'website',
		url: new URL(pathname, SITE_URL).href,
	},
	title,
	twitter: { card: 'summary', description, title },
})

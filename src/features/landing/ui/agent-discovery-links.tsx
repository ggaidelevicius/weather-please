import Head from 'next/head'

import type { MarkdownPagePath } from '../model/site'

import { MARKDOWN_PATHS, SITE_URL } from '../model/site'

// Points crawlers and agents at the page's Markdown version and the site's
// agent guides. The proxy sends the same links as HTTP headers.
export const AgentDiscoveryLinks = ({
	pathname,
}: Readonly<{ pathname: MarkdownPagePath }>) => (
	<Head>
		<link href={`${SITE_URL}${pathname}`} key="canonical" rel="canonical" />
		<link
			href={`${SITE_URL}${MARKDOWN_PATHS[pathname]}`}
			key="markdown"
			rel="alternate"
			type="text/markdown"
		/>
		<link
			href={`${SITE_URL}/llms.txt`}
			key="llms"
			rel="describedby"
			type="text/plain"
		/>
		<link
			href={`${SITE_URL}/sitemap.xml`}
			key="sitemap"
			rel="sitemap"
			type="application/xml"
		/>
		<link
			href={`${SITE_URL}/auth.md`}
			key="auth"
			rel="help"
			type="text/markdown"
		/>
	</Head>
)

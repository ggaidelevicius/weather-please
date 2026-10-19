import type { MarkdownPagePath } from '../model/site'

import { CONTENT_SIGNAL, SITE_URL } from '../model/site'

export const markdownResponse = ({
	canonicalPath,
	content,
}: Readonly<{
	canonicalPath: MarkdownPagePath
	content: string
}>): Response =>
	new Response(content, {
		headers: {
			// Static route responses must carry this policy themselves: Next.js
			// can replace the proxy's headers when serving its cached Markdown.
			'Cache-Control': 'private, no-store',
			'Content-Signal': CONTENT_SIGNAL,
			'Content-Type': 'text/markdown; charset=utf-8',
			Link: `<${SITE_URL}${canonicalPath}>; rel="canonical"`,
			Vary: 'Accept',
			'X-Content-Type-Options': 'nosniff',
		},
	})

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
			'Content-Signal': CONTENT_SIGNAL,
			'Content-Type': 'text/markdown; charset=utf-8',
			Link: `<${SITE_URL}${canonicalPath}>; rel="canonical"`,
			'X-Content-Type-Options': 'nosniff',
		},
	})

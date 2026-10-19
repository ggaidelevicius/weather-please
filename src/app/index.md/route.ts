import { markdownResponse } from '../../features/landing/lib/markdown-response'
import { getHomeMarkdown } from '../../features/landing/lib/public-markdown'

export const GET = async () =>
	markdownResponse({ canonicalPath: '/', content: await getHomeMarkdown() })

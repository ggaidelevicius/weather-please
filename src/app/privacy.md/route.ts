import { markdownResponse } from '../../features/landing/lib/markdown-response'
import { getPrivacyMarkdown } from '../../features/landing/lib/public-markdown'

export const GET = async () =>
	markdownResponse({
		canonicalPath: '/privacy',
		content: await getPrivacyMarkdown(),
	})

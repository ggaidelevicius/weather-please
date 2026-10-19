import { createElement } from 'react'

import { HomeMarkdownContent } from '../ui/home-markdown-content'
import { PrivacyContent } from '../ui/privacy-content'
import { renderPageMarkdown } from './page-markdown'

export const getHomeMarkdown = (): Promise<string> =>
	renderPageMarkdown({
		canonicalPath: '/',
		content: createElement(HomeMarkdownContent),
	})

export const getPrivacyMarkdown = (): Promise<string> =>
	renderPageMarkdown({
		canonicalPath: '/privacy',
		content: createElement(PrivacyContent),
	})

import type { ReactNode } from 'react'

import { renderToReadableStream } from 'react-dom/server.edge'
import TurndownService from 'turndown'

import type { MarkdownPagePath } from '../model/site'

import { SITE_URL } from '../model/site'

export const renderPageMarkdown = async ({
	canonicalPath,
	content,
}: Readonly<{
	canonicalPath: MarkdownPagePath
	content: ReactNode
}>): Promise<string> => {
	const stream = await renderToReadableStream(content)
	await stream.allReady
	return htmlToMarkdown({
		canonicalPath,
		html: await new Response(stream).text(),
	})
}

export const htmlToMarkdown = ({
	canonicalPath,
	html,
}: Readonly<{ canonicalPath: MarkdownPagePath; html: string }>): string => {
	const converter = new TurndownService({
		bulletListMarker: '-',
		codeBlockStyle: 'fenced',
		headingStyle: 'atx',
	})

	converter.addRule('excludedContent', {
		filter: (node) =>
			node.getAttribute('data-markdown') === 'exclude' ||
			['LINK', 'SCRIPT', 'STYLE', 'SVG', 'TEMPLATE'].includes(
				node.nodeName.toUpperCase(),
			),
		replacement: () => '',
	})
	// Relative links resolve against the canonical page, so Markdown readers
	// get URLs they can follow.
	converter.addRule('absoluteLinks', {
		filter: (node) => node.nodeName === 'A' && node.hasAttribute('href'),
		replacement: (content, node) => {
			const href = new URL(
				node.getAttribute('href') ?? '',
				new URL(canonicalPath, SITE_URL),
			)
			return `[${content}](${href.href})`
		},
	})

	return `${converter.turndown(html).trim()}\n`
}

import { describe, expect, it } from 'vitest'

import { acceptsMarkdown } from '../accept-markdown'

describe('acceptsMarkdown', () => {
	it.each([
		'text/markdown',
		'TEXT/MARKDOWN; charset=utf-8',
		'text/markdown, text/html',
		'text/html;q=0.5, text/markdown;q=0.9',
		'text/markdown;q=0.8, text/*;q=0.7',
		'text/markdown;q=0.8, text/html;q=0, */*;q=1',
	])('chooses explicitly preferred Markdown for %s', (accept) => {
		expect(acceptsMarkdown({ accept })).toBe(true)
	})

	it.each([
		null,
		'',
		'*/*',
		'text/*',
		'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		'text/markdown;q=0',
		'text/markdown;q=0, */*',
		'text/markdown;q=0.3, text/html',
		'text/markdown;q=0.3, text/*;q=0.9',
		'text/markdown;q=0.3, */*;q=0.9',
		'text/markdown;q=invalid',
		'text/markdown;q=2',
		'text/markdown;q=-1',
		'text/markdown;q=0;q=1',
		'text/markdown'.repeat(1000),
	])(
		'keeps HTML for absent, unacceptable, or lower priority Markdown',
		(accept) => {
			expect(acceptsMarkdown({ accept })).toBe(false)
		},
	)
})

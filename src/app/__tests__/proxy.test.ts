// @vitest-environment node
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { config, proxy } from '../../proxy'

const request = ({
	accept,
	method = 'GET',
	path,
}: Readonly<{ accept: string; method?: string; path: string }>) =>
	proxy(
		new NextRequest(`https://weather-please.app${path}`, {
			headers: { accept },
			method,
		}),
	)

describe('public page proxy', () => {
	it.each([
		['/', '/index.md'],
		['/privacy', '/privacy.md'],
	])('rewrites %s to its Markdown version', (path, markdownPath) => {
		const response = request({
			accept: 'text/markdown',
			path: `${path}?tracking=ignored`,
		})

		expect(response.headers.get('x-middleware-rewrite')).toBe(
			`https://weather-please.app${markdownPath}`,
		)
		expect(response.headers.get('vary')).toContain('Accept')
		expect(response.headers.get('link')).toContain(
			`<https://weather-please.app${markdownPath}>; rel="alternate"; type="text/markdown"`,
		)
	})

	it('keeps HTML for browsers and still advertises the agent guides', () => {
		const response = request({
			accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
			path: '/',
		})

		expect(response.headers.has('x-middleware-rewrite')).toBe(false)
		expect(response.headers.get('link')).toContain(
			'<https://weather-please.app/>; rel="canonical"',
		)
		expect(response.headers.get('link')).toContain('/llms.txt>')
		expect(response.headers.get('link')).toContain('/sitemap.xml>')
		expect(response.headers.get('link')).toContain('/auth.md>')
		expect(response.headers.get('content-signal')).toBe(
			'search=yes, ai-input=yes, ai-train=yes',
		)
	})

	it.each(['text/html', 'text/markdown'])(
		'keeps %s responses out of shared caches',
		(accept) => {
			const response = request({ accept, path: '/' })

			expect(response.headers.get('cache-control')).toBe('private, no-store')
			for (const header of [
				'CDN-Cache-Control',
				'Cloudflare-CDN-Cache-Control',
				'Vercel-CDN-Cache-Control',
			]) {
				expect(response.headers.get(header)).toBe('no-store')
			}
		},
	)

	it('keeps HTML for non-read methods', () => {
		const response = request({
			accept: 'text/markdown',
			method: 'POST',
			path: '/',
		})

		expect(response.headers.has('x-middleware-rewrite')).toBe(false)
	})

	it('only runs on pages with a Markdown version', () => {
		expect(config.matcher).toEqual(['/', '/privacy'])
		expect(
			request({ accept: 'text/markdown', path: '/demo' }).headers.has(
				'x-middleware-rewrite',
			),
		).toBe(false)
	})
})

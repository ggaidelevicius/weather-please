// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import nextConfig from '../../../next.config'
import { SITE_URL } from '../../features/landing/model/site'
import sitemap from '../sitemap'

const readPublicFile = (name: string) =>
	readFileSync(new URL(`../../../public/${name}`, import.meta.url), 'utf8')

const robots = readPublicFile('robots.txt')
const groups = robots
	.split(/\n\s*\n/)
	.map((block) =>
		block
			.split('\n')
			.filter((line) => line && !line.startsWith('#'))
			.map((line) => {
				const separator = line.indexOf(':')
				return {
					field: line.slice(0, separator).toLowerCase(),
					value: line.slice(separator + 1).trim(),
				}
			}),
	)
	.filter((group) => group.some(({ field }) => field === 'user-agent'))

// Longest matching rule wins, and Allow wins ties, as in RFC 9309.
const isAllowed = ({
	group,
	path,
}: Readonly<{
	group: readonly { field: string; value: string }[]
	path: string
}>) => {
	const rules = group
		.filter(({ field }) => field === 'allow' || field === 'disallow')
		.filter(({ value }) => path.startsWith(value))
		.sort(
			(a, b) =>
				b.value.length - a.value.length ||
				Number(b.field === 'allow') - Number(a.field === 'allow'),
		)
	return rules[0]?.field !== 'disallow'
}

describe('public agent discovery', () => {
	it('allows the same public uses for default and named AI crawlers', () => {
		expect(
			groups.flatMap((group) =>
				group
					.filter(({ field }) => field === 'user-agent')
					.map(({ value }) => value),
			),
		).toEqual([
			'*',
			'GPTBot',
			'OAI-SearchBot',
			'ChatGPT-User',
			'ClaudeBot',
			'Claude-SearchBot',
			'Claude-User',
			'Google-Extended',
			'PerplexityBot',
			'Perplexity-User',
		])
		for (const group of groups) {
			expect(group).toContainEqual({
				field: 'content-signal',
				value: 'search=yes, ai-input=yes, ai-train=yes',
			})
			for (const path of [
				'/',
				'/privacy',
				'/demo',
				'/index.md',
				'/privacy.md',
				'/llms.txt',
				'/auth.md',
				'/sitemap.xml',
			]) {
				expect(isAllowed({ group, path }), path).toBe(true)
			}
			expect(isAllowed({ group, path: '/bug' })).toBe(false)
		}
	})

	it('lists the canonical HTML pages in the sitemap', () => {
		expect(sitemap()).toEqual([
			{ url: `${SITE_URL}/` },
			{ url: `${SITE_URL}/privacy` },
		])
		expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
	})

	it('links the guides to pages and files the site serves', () => {
		const servedUrls = [
			'/',
			'/index.md',
			'/privacy.md',
			'/auth.md',
			'/llms.txt',
			'/demo',
			'/bug',
			'/sitemap.xml',
			'/robots.txt',
		].map((path) => `${SITE_URL}${path}`)
		for (const guide of ['llms.txt', 'auth.md']) {
			const siteLinks = [
				...readPublicFile(guide).matchAll(
					/\]\((https:\/\/weather-please\.app[^)]*)\)/g,
				),
			].map(([, url]) => url)
			expect(siteLinks.length, guide).toBeGreaterThan(0)
			for (const url of siteLinks) {
				expect(servedUrls, `${guide} links to ${url}`).toContain(url)
			}
		}
	})

	it('sends text guides with their types and keeps the bug form out of search', async () => {
		const headers = (await nextConfig.headers?.()) ?? []
		const headersFor = (source: string) =>
			headers.find((rule) => rule.source === source)?.headers ?? []

		expect(headersFor('/bug')).toContainEqual({
			key: 'X-Robots-Tag',
			value: 'noindex, nofollow',
		})
		for (const [source, type] of [
			['/llms.txt', 'text/plain'],
			['/robots.txt', 'text/plain'],
			['/auth.md', 'text/markdown'],
		]) {
			expect(headersFor(source)).toEqual(
				expect.arrayContaining([
					{ key: 'Content-Type', value: `${type}; charset=utf-8` },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{
						key: 'Content-Signal',
						value: 'search=yes, ai-input=yes, ai-train=yes',
					},
				]),
			)
		}
	})
})

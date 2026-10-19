import type { APIResponse } from '@playwright/test'

import { expect, test } from '@playwright/test'

for (const [path, markdownPath] of [
	['/', '/index.md'],
	['/privacy', '/privacy.md'],
]) {
	test(`${path} negotiates Markdown and HTML without shared caching`, async ({
		request,
	}) => {
		for (const accept of ['text/markdown', 'text/html', 'text/markdown']) {
			const response = await request.get(path, { headers: { accept } })

			expect(response.status()).toBe(200)
			expect(response.headers()['content-type']).toContain(accept)
			expectUncachedProxyResponse(response)
			if (accept === 'text/markdown') expectMarkdownVary(response)
			else expectAppRouterVary(response)
			expect(await response.text()).toMatch(
				accept === 'text/markdown' ? /^# / : /^<!doctype html>/i,
			)
		}
	})

	test(`${path} preserves negotiation and App Router variations for client navigation`, async ({
		request,
	}) => {
		const response = await request.get(path, {
			headers: { accept: '*/*', rsc: '1' },
		})

		expect(response.status()).toBe(200)
		expect(response.headers()['content-type']).toContain('text/x-component')
		expectUncachedProxyResponse(response)
		expectAppRouterVary(response)
	})

	test(`${path} preserves Markdown negotiation headers for HEAD`, async ({
		request,
	}) => {
		const response = await request.head(path, {
			headers: { accept: 'text/markdown' },
		})

		expect(response.status()).toBe(200)
		expect(response.headers()['content-type']).toContain('text/markdown')
		expectUncachedProxyResponse(response)
		expectMarkdownVary(response)
		expect(await response.text()).toBe('')
	})

	test(`${markdownPath} retains the final response's cache policy`, async ({
		request,
	}) => {
		const response = await request.get(markdownPath)

		expect(response.status()).toBe(200)
		expect(response.headers()['content-type']).toContain('text/markdown')
		expectUncachedResponse(response)
		expectMarkdownVary(response)
		expect(await response.text()).toMatch(/^# /)
	})
}

const expectAppRouterVary = (response: APIResponse) => {
	expect(
		response
			.headers()
			.vary?.toLowerCase()
			.split(',')
			.map((field) => field.trim()),
	).toEqual(
		expect.arrayContaining([
			'rsc',
			'next-router-state-tree',
			'next-router-prefetch',
			'next-router-segment-prefetch',
		]),
	)
}

// App Router owns Vary on HTML/RSC responses. Cache isolation must hold even
// when it replaces the proxy's Accept variation.
const expectUncachedProxyResponse = (response: APIResponse) => {
	expectUncachedResponse(response)
	const headers = response.headers()
	for (const header of [
		'cdn-cache-control',
		'cloudflare-cdn-cache-control',
		'vercel-cdn-cache-control',
	]) {
		expect(headers[header]).toBe('no-store')
	}
}

const expectUncachedResponse = (response: APIResponse) => {
	expect(response.headers()['cache-control']).toBe('private, no-store')
}

const expectMarkdownVary = (response: APIResponse) => {
	expect(
		response
			.headers()
			.vary?.toLowerCase()
			.split(',')
			.map((field) => field.trim()),
	).toContain('accept')
}

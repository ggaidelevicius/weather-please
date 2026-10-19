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
			expectUncachedNegotiation(response)
			expect(await response.text()).toMatch(
				accept === 'text/markdown' ? /^# / : /^<!doctype html>/i,
			)
		}
	})

	test(`${path} preserves Markdown negotiation headers for HEAD`, async ({
		request,
	}) => {
		const response = await request.head(path, {
			headers: { accept: 'text/markdown' },
		})

		expect(response.status()).toBe(200)
		expect(response.headers()['content-type']).toContain('text/markdown')
		expectUncachedNegotiation(response)
		expect(await response.text()).toBe('')
	})

	test(`${markdownPath} retains the final response's cache policy`, async ({
		request,
	}) => {
		const response = await request.get(markdownPath)

		expect(response.status()).toBe(200)
		expect(response.headers()['content-type']).toContain('text/markdown')
		expectUncachedNegotiation(response)
		expect(await response.text()).toMatch(/^# /)
	})
}

const expectUncachedNegotiation = (response: APIResponse) => {
	const headers = response.headers()
	expect(headers['cache-control']).toBe('private, no-store')
	expect(
		headers.vary
			?.toLowerCase()
			.split(',')
			.map((field) => field.trim()),
	).toContain('accept')
}

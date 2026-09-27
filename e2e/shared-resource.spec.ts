import type { BrowserContext, Page } from '@playwright/test'

import { chromium, expect, test } from '@playwright/test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

type RequestSnapshot = {
	error: null | string
	status: 'error' | 'pending' | 'success'
	value: null | ResourceValue
}
type ResourceValue = { source: string; version: number }
type SharedFixture = {
	getChannelMessages: (key: string) => number
	getFetchCount: (key: string) => number
	getRequest: (id: string) => null | RequestSnapshot
	getUpdates: (key: string) => ResourceValue[]
	releaseRequest: (id: string) => boolean
	startRequest: (options: {
		force?: boolean
		key: string
		shouldWait?: boolean
		value: ResourceValue
	}) => string
	subscribe: (key: string) => boolean
}

declare global {
	interface Window {
		sharedFixture: SharedFixture
	}
}

let fixtureBundle = ''

test.beforeAll(async () => {
	const rootRequire = createRequire(resolve('package.json'))
	const vitestRequire = createRequire(
		rootRequire.resolve('vitest/package.json'),
	)
	const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'))
	const esbuild = viteRequire('esbuild') as {
		build: (options: {
			bundle: boolean
			format: string
			platform: string
			stdin: { contents: string; resolveDir: string; sourcefile: string }
			write: boolean
		}) => Promise<{ outputFiles: { text: string }[] }>
	}
	const result = await esbuild.build({
		bundle: true,
		format: 'iife',
		platform: 'browser',
		stdin: {
			contents: fixtureSource,
			resolveDir: process.cwd(),
			sourcefile: 'shared-resource-browser-fixture.js',
		},
		write: false,
	})
	fixtureBundle = result.outputFiles[0].text
})

test('deduplicates requests across pages and broadcasts refreshed results', async () => {
	const browser = await chromium.launch()
	try {
		const context = await browser.newContext()
		await routeFixture(context)
		const owner = await openFixture(context, 'https://shared-fetch.test/owner')
		const follower = await openFixture(
			context,
			'https://shared-fetch.test/follower',
		)
		const key = 'browser-deduplication'
		await follower.evaluate((key) => window.sharedFixture.subscribe(key), key)

		const firstOwnerRequest = await owner.evaluate(
			(key) =>
				window.sharedFixture.startRequest({
					key,
					shouldWait: true,
					value: { source: 'owner', version: 1 },
				}),
			key,
		)
		await expect.poll(() => getFetchCount(owner, key)).toBe(1)
		const firstFollowerRequest = await follower.evaluate(
			(key) =>
				window.sharedFixture.startRequest({
					key,
					value: { source: 'follower', version: 1 },
				}),
			key,
		)
		await expectWaitingLock(follower, key)
		expect(await getFetchCount(follower, key)).toBe(0)

		await owner.evaluate(
			(id) => window.sharedFixture.releaseRequest(id),
			firstOwnerRequest,
		)
		await expect
			.poll(() => getRequest(follower, firstFollowerRequest))
			.toMatchObject({
				status: 'success',
				value: { source: 'owner', version: 1 },
			})
		await expect
			.poll(() => getRequest(owner, firstOwnerRequest))
			.toMatchObject({ status: 'success' })
		await expect
			.poll(() =>
				follower.evaluate((key) => window.sharedFixture.getUpdates(key), key),
			)
			.toContainEqual({ source: 'owner', version: 1 })
		await expect
			.poll(() =>
				follower.evaluate(
					(key) => window.sharedFixture.getChannelMessages(key),
					key,
				),
			)
			.toBeGreaterThan(0)
		expect(await getFetchCount(follower, key)).toBe(0)

		const refreshedOwnerRequest = await owner.evaluate(
			(key) =>
				window.sharedFixture.startRequest({
					force: true,
					key,
					shouldWait: true,
					value: { source: 'owner', version: 2 },
				}),
			key,
		)
		await expect.poll(() => getFetchCount(owner, key)).toBe(2)
		const refreshedFollowerRequest = await follower.evaluate(
			(key) =>
				window.sharedFixture.startRequest({
					force: true,
					key,
					value: { source: 'follower', version: 2 },
				}),
			key,
		)
		await expectWaitingLock(follower, key)
		await owner.evaluate(
			(id) => window.sharedFixture.releaseRequest(id),
			refreshedOwnerRequest,
		)

		await expect
			.poll(() => getRequest(follower, refreshedFollowerRequest))
			.toMatchObject({
				status: 'success',
				value: { source: 'owner', version: 2 },
			})
		await expect
			.poll(() =>
				follower.evaluate((key) => window.sharedFixture.getUpdates(key), key),
			)
			.toContainEqual({ source: 'owner', version: 2 })
		expect(await getFetchCount(owner, key)).toBe(2)
		expect(await getFetchCount(follower, key)).toBe(0)
	} finally {
		await browser.close()
	}
})

test('releases a closed owner’s native lock so a waiting page can finish', async () => {
	const browser = await chromium.launch()
	try {
		const context = await browser.newContext()
		await routeFixture(context)
		const owner = await openFixture(context, 'https://shared-fetch.test/owner')
		const follower = await openFixture(
			context,
			'https://shared-fetch.test/follower',
		)
		const key = 'browser-owner-close'

		await owner.evaluate(
			(key) =>
				window.sharedFixture.startRequest({
					key,
					shouldWait: true,
					value: { source: 'closed-owner', version: 1 },
				}),
			key,
		)
		await expect.poll(() => getFetchCount(owner, key)).toBe(1)
		const followerRequest = await follower.evaluate(
			(key) =>
				window.sharedFixture.startRequest({
					key,
					value: { source: 'surviving-follower', version: 2 },
				}),
			key,
		)
		await expectWaitingLock(follower, key)
		expect(await getFetchCount(follower, key)).toBe(0)

		await owner.close()
		await expect
			.poll(() => getRequest(follower, followerRequest))
			.toMatchObject({
				status: 'success',
				value: { source: 'surviving-follower', version: 2 },
			})
		expect(await getFetchCount(follower, key)).toBe(1)
		await expect
			.poll(() =>
				follower.evaluate(
					async () => (await navigator.locks.query()).held?.length ?? 0,
				),
			)
			.toBe(0)
	} finally {
		await browser.close()
	}
})

test('shares extension data and transfers ownership when an extension page closes', async () => {
	const temporaryDirectory = await mkdtemp(
		join(tmpdir(), 'weather-please-shared-extension-'),
	)
	const extensionDirectory = join(temporaryDirectory, 'extension')
	let context: BrowserContext | undefined
	try {
		await mkdir(extensionDirectory)
		await writeFile(
			join(extensionDirectory, 'manifest.json'),
			JSON.stringify({
				background: { service_worker: 'worker.js' },
				manifest_version: 3,
				name: 'Weather Please shared resource regression',
				version: '1.0.0',
			}),
		)
		await writeFile(
			join(extensionDirectory, 'worker.js'),
			'chrome.runtime.onInstalled.addListener(() => {})',
		)
		await writeFile(join(extensionDirectory, 'fixture.js'), fixtureBundle)
		await writeFile(
			join(extensionDirectory, 'index.html'),
			'<!doctype html><title>Shared extension test</title><script src="fixture.js"></script>',
		)
		context = await chromium.launchPersistentContext(
			join(temporaryDirectory, 'profile'),
			{
				args: [
					`--disable-extensions-except=${extensionDirectory}`,
					`--load-extension=${extensionDirectory}`,
				],
				channel: 'chromium',
				headless: true,
			},
		)
		const worker =
			context.serviceWorkers()[0] ??
			(await context.waitForEvent('serviceworker'))
		expect(new URL(worker.url()).protocol).toBe('chrome-extension:')
		const extensionId = new URL(worker.url()).hostname
		const baseUrl = `chrome-extension://${extensionId}/index.html`
		const owner = await openFixture(context, `${baseUrl}?owner`)
		const follower = await openFixture(context, `${baseUrl}?follower`)
		const key = 'extension-owner-close'
		await follower.evaluate((key) => window.sharedFixture.subscribe(key), key)
		const initialRequest = await owner.evaluate(
			(key) =>
				window.sharedFixture.startRequest({
					key,
					value: { source: 'extension-owner', version: 1 },
				}),
			key,
		)
		await expect
			.poll(() => getRequest(owner, initialRequest))
			.toMatchObject({ status: 'success' })
		await expect
			.poll(() =>
				follower.evaluate((key) => window.sharedFixture.getUpdates(key), key),
			)
			.toContainEqual({ source: 'extension-owner', version: 1 })
		await expect
			.poll(() =>
				follower.evaluate(
					(key) => window.sharedFixture.getChannelMessages(key),
					key,
				),
			)
			.toBeGreaterThan(0)

		await owner.evaluate(
			(key) =>
				window.sharedFixture.startRequest({
					force: true,
					key,
					shouldWait: true,
					value: { source: 'closed-extension-owner', version: 2 },
				}),
			key,
		)
		await expect.poll(() => getFetchCount(owner, key)).toBe(2)
		const followerRequest = await follower.evaluate(
			(key) =>
				window.sharedFixture.startRequest({
					force: true,
					key,
					value: { source: 'extension-follower', version: 2 },
				}),
			key,
		)
		await expectWaitingLock(follower, key)
		expect(await getFetchCount(follower, key)).toBe(0)
		await owner.close()
		await expect
			.poll(() => getRequest(follower, followerRequest))
			.toMatchObject({
				status: 'success',
				value: { source: 'extension-follower', version: 2 },
			})
		expect(await getFetchCount(follower, key)).toBe(1)
	} finally {
		try {
			await context?.close()
		} finally {
			await rm(temporaryDirectory, { force: true, recursive: true })
		}
	}
})

const routeFixture = (context: BrowserContext) =>
	context.route('https://shared-fetch.test/**', (route) =>
		route.fulfill(
			new URL(route.request().url()).pathname === '/fixture.js'
				? { body: fixtureBundle, contentType: 'text/javascript' }
				: {
						body: '<!doctype html><title>Shared resource test</title><script src="/fixture.js"></script>',
						contentType: 'text/html',
					},
		),
	)

const openFixture = async (context: BrowserContext, url: string) => {
	const page = await context.newPage()
	await page.goto(url)
	await expect
		.poll(() =>
			page.evaluate(() => ({
				hasBroadcastChannel: typeof BroadcastChannel === 'function',
				hasLocks: typeof navigator.locks?.request === 'function',
				isReady: Boolean(window.sharedFixture),
				isSecure: window.isSecureContext,
				isVisible: document.visibilityState === 'visible',
			})),
		)
		.toEqual({
			hasBroadcastChannel: true,
			hasLocks: true,
			isReady: true,
			isSecure: true,
			isVisible: true,
		})
	return page
}

const getFetchCount = (page: Page, key: string) =>
	page.evaluate((key) => window.sharedFixture.getFetchCount(key), key)
const getRequest = (page: Page, id: string) =>
	page.evaluate((id) => window.sharedFixture.getRequest(id), id)
const expectWaitingLock = (page: Page, key: string) =>
	expect
		.poll(() =>
			page.evaluate(async (key) => {
				const snapshot = await navigator.locks.query()
				return (
					snapshot.pending?.some(
						(lock) => lock.name === `weather-please:shared-resource:v1:${key}`,
					) ?? false
				)
			}, key),
		)
		.toBe(true)

const fixtureSource = `
import { z } from 'zod'
import {
	readSharedResource,
	requestSharedResource,
	subscribeSharedResource,
} from './src/shared/lib/shared-resource.ts'

const schema = z.object({ version: z.number(), source: z.string() })
const requests = new Map()
const gates = new Map()
const fetchCounts = new Map()
const updates = new Map()
const subscriptions = new Map()
const channelMessages = new Map()
const observer = new BroadcastChannel('weather-please:shared-resources:v1')
observer.addEventListener('message', ({ data }) => {
	if (typeof data?.key === 'string') {
		channelMessages.set(data.key, (channelMessages.get(data.key) ?? 0) + 1)
	}
})

window.sharedFixture = {
	startRequest({ key, value, shouldWait = false, force = false }) {
		const id = crypto.randomUUID()
		const state = { status: 'pending', value: null, error: null }
		requests.set(id, state)
		void requestSharedResource({
			key, schema, maxAgeMs: 60_000, force,
			fetcher: async ({ signal }) => {
				fetchCounts.set(key, (fetchCounts.get(key) ?? 0) + 1)
				if (shouldWait) await new Promise((resolve) => gates.set(id, resolve))
				signal.throwIfAborted()
				return value
			},
		}).then(
			(value) => Object.assign(state, { status: 'success', value }),
			(error) => Object.assign(state, { status: 'error', error: String(error) }),
		)
		return id
	},
	releaseRequest(id) {
		const release = gates.get(id)
		if (!release) return false
		gates.delete(id)
		release()
		return true
	},
	getRequest: (id) => requests.get(id) ?? null,
	getFetchCount: (key) => fetchCounts.get(key) ?? 0,
	subscribe(key) {
		if (subscriptions.has(key)) return false
		updates.set(key, [])
		subscriptions.set(key, subscribeSharedResource({
			key,
			onChange: () => {
				const snapshot = readSharedResource({ key, schema })
				if (snapshot) updates.get(key).push(snapshot.value)
			},
		}))
		return true
	},
	getUpdates: (key) => updates.get(key) ?? [],
	getChannelMessages: (key) => channelMessages.get(key) ?? 0,
}
`

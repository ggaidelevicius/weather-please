import type { BrowserContext, Page, Route } from '@playwright/test'

import { chromium, expect, test } from '@playwright/test'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

import { createWeatherResponse } from '../src/features/weather/testing/weather-response'

type RequestCounts = { airQuality: number; forecast: number; map: number }

declare global {
	interface Window {
		weatherSharingFixture: {
			setVisibility: (visibility: DocumentVisibilityState) => void
			start: () => void
			state: {
				error: null | string
				forecast: 'pending' | 'success'
				map: 'pending' | 'success'
				maximum: null | number
			}
		}
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
			sourcefile: 'weather-sharing-browser-fixture.js',
		},
		write: false,
	})
	fixtureBundle = result.outputFiles[0].text
})

test('finishes an owned forecast and air-quality request when switching tabs without duplicate provider requests', async () => {
	const browser = await chromium.launch()
	const gate = createGate()
	try {
		const context = await browser.newContext({ timezoneId: 'UTC' })
		const owner = await openFixture(context, 'owner')
		const follower = await openFixture(context, 'follower')
		const requests = await routeProviders({ context, gate, owner })
		await start(owner)
		await expect.poll(() => requests.forecastsFinished.has(owner)).toBe(true)
		await expect.poll(() => requests.counts(owner).airQuality).toBe(1)
		await start(follower)
		await expectPendingWeatherLocks(follower, 1)

		await setVisibility(owner, 'hidden')
		await expectPendingWeatherLocks(follower, 1)
		expect(requests.counts(owner)).toEqual({
			airQuality: 1,
			forecast: 1,
			map: 0,
		})
		expect(requests.counts(follower)).toEqual({
			airQuality: 0,
			forecast: 0,
			map: 0,
		})
		expect(await state(owner)).toMatchObject({
			error: null,
			forecast: 'pending',
		})
		expect(requests.failures).toEqual([])

		gate.release()
		await expect
			.poll(() => state(follower))
			.toMatchObject({
				error: null,
				forecast: 'success',
				map: 'success',
				maximum: 30,
			})
		await expect
			.poll(() => state(owner))
			.toMatchObject({
				error: null,
				forecast: 'success',
				maximum: 30,
			})
		expect(requests.counts(owner)).toEqual({
			airQuality: 1,
			forecast: 1,
			map: 0,
		})
		expect(requests.counts(follower)).toEqual({
			airQuality: 0,
			forecast: 0,
			map: 1,
		})
		expect(requests.failures).toEqual([])

		await setVisibility(owner, 'visible')
		await expect
			.poll(() => state(owner))
			.toMatchObject({ error: null, map: 'success' })
		expect(requests.counts(owner)).toEqual({
			airQuality: 1,
			forecast: 1,
			map: 0,
		})
	} finally {
		gate.release()
		await browser.close()
	}
})

test('hands a closed weather owner to a visible follower without allowing a hidden queued tab to fetch', async () => {
	const browser = await chromium.launch()
	const gate = createGate()
	try {
		const context = await browser.newContext({ timezoneId: 'UTC' })
		const owner = await openFixture(context, 'owner')
		const hiddenFollower = await openFixture(context, 'hidden-follower')
		const visibleFollower = await openFixture(context, 'visible-follower')
		const requests = await routeProviders({ context, gate, owner })
		await start(owner)
		await expect.poll(() => requests.forecastsFinished.has(owner)).toBe(true)
		await expect.poll(() => requests.counts(owner).airQuality).toBe(1)
		await start(hiddenFollower)
		await expectPendingWeatherLocks(hiddenFollower, 1)
		await start(visibleFollower)
		await expectPendingWeatherLocks(visibleFollower, 2)
		await setVisibility(hiddenFollower, 'hidden')
		expect(requests.counts(hiddenFollower)).toEqual({
			airQuality: 0,
			forecast: 0,
			map: 0,
		})
		expect(requests.counts(visibleFollower)).toEqual({
			airQuality: 0,
			forecast: 0,
			map: 0,
		})

		await owner.close()
		await expect
			.poll(() => state(visibleFollower))
			.toMatchObject({
				error: null,
				forecast: 'success',
				map: 'success',
				maximum: 30,
			})
		expect(requests.counts(visibleFollower)).toEqual({
			airQuality: 1,
			forecast: 1,
			map: 1,
		})
		expect(requests.counts(hiddenFollower)).toEqual({
			airQuality: 0,
			forecast: 0,
			map: 0,
		})
		expect(requests.failures.filter(({ page }) => page !== owner)).toEqual([])
	} finally {
		gate.release()
		await browser.close()
	}
})

const openFixture = async (
	context: BrowserContext,
	name: string,
): Promise<Page> => {
	const page = await context.newPage()
	await page.route('https://weather-sharing.test/**', (route) =>
		route.fulfill(
			new URL(route.request().url()).pathname === '/fixture.js'
				? { body: fixtureBundle, contentType: 'text/javascript' }
				: {
						body: '<!doctype html><title>Shared weather test</title><script src="/fixture.js"></script>',
						contentType: 'text/html',
					},
		),
	)
	await page.goto(`https://weather-sharing.test/${name}`)
	await expect
		.poll(() => page.evaluate(() => Boolean(window.weatherSharingFixture)))
		.toBe(true)
	await setVisibility(page, 'visible')
	return page
}

const routeProviders = async ({
	context,
	gate,
	owner,
}: {
	context: BrowserContext
	gate: ReturnType<typeof createGate>
	owner: Page
}) => {
	const byPage = new Map<Page, RequestCounts>()
	const counts = (page: Page): RequestCounts =>
		byPage.get(page) ?? {
			airQuality: 0,
			forecast: 0,
			map: 0,
		}
	const forecastsFinished = new Set<Page>()
	const failures: { page: Page; url: string }[] = []
	context.on('requestfinished', (request) => {
		const url = new URL(request.url())
		if (
			url.hostname === 'api.open-meteo.com' &&
			!url.searchParams.has('forecast_hours')
		)
			forecastsFinished.add(request.frame().page())
	})
	context.on('requestfailed', (request) => {
		if (new URL(request.url()).hostname.endsWith('open-meteo.com'))
			failures.push({ page: request.frame().page(), url: request.url() })
	})
	await context.route('https://*.open-meteo.com/**', async (route: Route) => {
		const page = route.request().frame().page()
		const url = new URL(route.request().url())
		const kind = url.hostname.startsWith('air-quality')
			? 'airQuality'
			: url.searchParams.has('forecast_hours')
				? 'map'
				: 'forecast'
		const current = counts(page)
		byPage.set(page, { ...current, [kind]: current[kind] + 1 })
		if (kind === 'airQuality' && page === owner) await gate.promise
		if (page.isClosed()) return
		await route.fulfill({
			contentType: 'application/json',
			headers: { 'access-control-allow-origin': '*' },
			json:
				kind === 'airQuality'
					? { hourly: { time: [], uv_index: [] } }
					: kind === 'map'
						? {
								hourly: {
									precipitation: [0],
									precipitation_probability: [10],
									time: [0],
									winddirection_10m: [90],
									windspeed_10m: [12],
								},
								latitude: 40,
								longitude: -74,
							}
						: createWeatherResponse(),
		})
	})
	return { counts, failures, forecastsFinished }
}

const start = (page: Page) =>
	page.evaluate(() => window.weatherSharingFixture.start())
const state = (page: Page) =>
	page.evaluate(() => window.weatherSharingFixture.state)
const setVisibility = (page: Page, visibility: DocumentVisibilityState) =>
	page.evaluate(
		(visibility) => window.weatherSharingFixture.setVisibility(visibility),
		visibility,
	)

const expectPendingWeatherLocks = (page: Page, count: number) =>
	expect
		.poll(() =>
			page.evaluate(
				async () =>
					(await navigator.locks.query()).pending?.filter(
						(lock) =>
							lock.name ===
							'weather-please:shared-resource:v1:weather:["40","-74","UTC",false]',
					).length ?? 0,
			),
		)
		.toBe(count)

const createGate = () => {
	let release = () => {}
	const promise = new Promise<void>((resolve) => {
		release = resolve
	})
	return { promise, release }
}

const fixtureSource = `
import { requestSharedWeather, requestSharedWeatherMap } from './src/features/weather/services/shared-weather.ts'

const identity = { lat: '40', lon: '-74', timeZone: 'UTC', shouldUseAirQualityUv: false }
const state = { error: null, forecast: 'pending', map: 'pending', maximum: null }
window.weatherSharingFixture = {
	state,
	setVisibility(visibility) {
		Object.defineProperty(document, 'visibilityState', { configurable: true, value: visibility })
		document.dispatchEvent(new Event('visibilitychange'))
	},
	start() {
		void requestSharedWeather(identity).then(async (weather) => {
			Object.assign(state, { forecast: 'success', maximum: weather.weatherData[0]?.max })
			await requestSharedWeatherMap(identity)
			state.map = 'success'
		}).catch((error) => { state.error = String(error) })
	},
}
`

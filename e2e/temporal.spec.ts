import type { BrowserContext, BrowserType } from '@playwright/test'

import { chromium, expect, firefox, test } from '@playwright/test'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

type TemporalFixture = {
	checkCache: () => {
		isHydratedInstant: boolean
		isInvalidCacheDiscarded: boolean
		legacyFall: string | undefined
		legacySpring: string | undefined
		restored: string | undefined
		serialized: string
	}
	checkClock: () => {
		currentDate: string
		currentDateTimeDate: string
		formattedPlainDate: string
		formattedZonedDateTime: string
		hasNativeTemporal: boolean
		isInstant: boolean
		isTimestampWithinSample: boolean
		systemTimeZone: string
		zonedTimeZone: string
	}
	checkDst: () => {
		fallDayHours: number
		fallFirstHour: string
		fallSecondHour: string
		graceFresh: boolean[]
		refreshFresh: boolean[]
		springDayHours: number
		springTomorrow: string
	}
}

declare global {
	interface Window {
		temporalFixture: TemporalFixture
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
			sourcefile: 'temporal-browser-fixture.js',
		},
		write: false,
	})
	fixtureBundle = result.outputFiles[0].text
})

for (const browserType of [chromium, firefox]) {
	test(`${browserType.name()} supports native Temporal clocks, DST, and stored weather`, async () => {
		await withFixture(browserType, async (context) => {
			const page = await context.newPage()
			await page.goto('https://temporal.test/')
			await expect
				.poll(() => page.evaluate(() => Boolean(window.temporalFixture)))
				.toBe(true)

			const clock = await page.evaluate(() =>
				window.temporalFixture.checkClock(),
			)
			expect(clock).toMatchObject({
				hasNativeTemporal: true,
				isInstant: true,
				isTimestampWithinSample: true,
				systemTimeZone: 'America/New_York',
				zonedTimeZone: 'America/New_York',
			})
			expect(clock.currentDate).toBe(clock.currentDateTimeDate)
			expect(clock.formattedPlainDate).toMatch(/March\s+8/)
			expect(clock.formattedPlainDate).toContain('2026')
			expect(clock.formattedZonedDateTime).toMatch(/November\s+1/)
			expect(clock.formattedZonedDateTime).toContain('2026')
			expect(clock.formattedZonedDateTime).toContain('01:30')

			expect(
				await page.evaluate(() => window.temporalFixture.checkDst()),
			).toEqual({
				fallDayHours: 25,
				fallFirstHour: '2026-11-01T01:00:00-04:00[America/New_York]',
				fallSecondHour: '2026-11-01T01:00:00-05:00[America/New_York]',
				graceFresh: [true, true],
				refreshFresh: [false, false],
				springDayHours: 23,
				springTomorrow: '2026-03-09',
			})

			expect(
				await page.evaluate(() => window.temporalFixture.checkCache()),
			).toEqual({
				isHydratedInstant: true,
				isInvalidCacheDiscarded: true,
				legacyFall: '2026-11-01T05:00:00Z',
				legacySpring: '2026-03-08T07:00:00Z',
				restored: '2026-09-27T01:23:45.678Z',
				serialized: '2026-09-27T01:23:45.678Z',
			})
		})
	})
}

const withFixture = async (
	browserType: BrowserType,
	check: (context: BrowserContext) => Promise<void>,
) => {
	const browser = await browserType.launch()
	try {
		const version = browser.version()
		test.info().annotations.push({
			description: `${browserType.name()} ${version}`,
			type: 'browser-version',
		})
		console.info(
			`Native Temporal verification: ${browserType.name()} ${version}`,
		)
		const context = await browser.newContext({
			timezoneId: 'America/New_York',
		})
		await context.route('https://temporal.test/**', (route) =>
			route.fulfill(
				new URL(route.request().url()).pathname === '/fixture.js'
					? { body: fixtureBundle, contentType: 'text/javascript' }
					: {
							body: '<!doctype html><title>Native Temporal test</title><script src="/fixture.js"></script>',
							contentType: 'text/html',
						},
			),
		)
		await check(context)
	} finally {
		await browser.close()
	}
}

const fixtureSource = `
import {
	getCurrentDate, getCurrentDateTime, getCurrentInstant, getCurrentTimestamp,
	getDateTime, getSystemTimeZone,
} from './src/shared/lib/time.ts'
import { createEmptyAlerts } from './src/features/weather/model/alerts.ts'
import {
	getCachedWeather, writeCachedWeather, WEATHER_CACHE_STORAGE_KEY,
} from './src/features/weather/model/cache.ts'
import { next24HoursDataSchema } from './src/features/weather/model/types.ts'
import { isWeatherCacheFresh } from './src/features/weather/services/shared-weather.ts'

const identity = { lat: '40', lon: '-74', timeZone: 'America/New_York', shouldUseAirQualityUv: false }
const createWeather = (instant) => ({
	...identity,
	alertData: createEmptyAlerts(),
	isDegraded: false,
	lastUpdatedDate: instant,
	next24HoursData: next24HoursDataSchema.parse([{
		apparentTemperature: 20, precipitation: 0, precipitationProbability: 0,
		temperature: 20, time: 1793512800, uv: 1, visibility: 10000,
		weatherCode: 1, wind: 5, windGust: 7,
	}]),
	weatherData: [{ day: 1793512800, description: 1, max: 20, min: 10, rain: 0, uv: 1, wind: 5 }],
	weatherMapData: null,
})
const localDateTime = (instant) => getDateTime({ timestamp: Temporal.Instant.from(instant).epochMilliseconds })
const dayHours = (date) => {
	const start = date.toZonedDateTime(getSystemTimeZone())
	const end = date.add({ days: 1 }).toZonedDateTime(getSystemTimeZone())
	return (end.epochMilliseconds - start.epochMilliseconds) / 3600000
}
const legacyInstant = (value) => {
	localStorage.setItem(WEATHER_CACHE_STORAGE_KEY, JSON.stringify({
		...createWeather(getCurrentInstant()), version: 1, lastUpdatedDate: value,
	}))
	return getCachedWeather({ ...identity, allowStale: true })?.lastUpdatedDate.toString()
}

window.temporalFixture = {
	checkClock() {
		const before = getCurrentInstant()
		const timestamp = getCurrentTimestamp()
		const after = getCurrentInstant()
		return {
			hasNativeTemporal: /\\[native code\\]/.test(Temporal.Instant.toString()),
			isInstant: before instanceof Temporal.Instant,
			isTimestampWithinSample: timestamp >= before.epochMilliseconds && timestamp <= after.epochMilliseconds,
			systemTimeZone: getSystemTimeZone(),
			zonedTimeZone: getCurrentDateTime().timeZoneId,
			currentDate: getCurrentDate().toString(),
			currentDateTimeDate: getCurrentDateTime().toPlainDate().toString(),
			formattedPlainDate: Temporal.PlainDate.from('2026-03-08').toLocaleString('en-US', {
				day: 'numeric', month: 'long', year: 'numeric',
			}),
			formattedZonedDateTime: localDateTime('2026-11-01T01:30:00-05:00').toLocaleString('en-US', {
				day: 'numeric', hour: '2-digit', hour12: false, minute: '2-digit', month: 'long', year: 'numeric',
			}),
		}
	},
	checkDst() {
		const spring = Temporal.PlainDate.from('2026-03-08')
		const fall = Temporal.PlainDate.from('2026-11-01')
		const transitions = [
			['2026-03-08T01:45:00-05:00', '2026-03-08T03:00:30-04:00', '2026-03-08T03:01:00-04:00'],
			['2026-11-01T01:45:00-04:00', '2026-11-01T01:00:30-05:00', '2026-11-01T01:01:00-05:00'],
		]
		const freshness = transitions.map(([cachedAt, graceAt, refreshAt]) => {
			const cached = createWeather(Temporal.Instant.from(cachedAt))
			return [graceAt, refreshAt].map((time) => isWeatherCacheFresh({
				cached, now: Temporal.Instant.from(time).epochMilliseconds,
			}))
		})
		return {
			springTomorrow: spring.add({ days: 1 }).toString(),
			springDayHours: dayHours(spring),
			fallDayHours: dayHours(fall),
			fallFirstHour: localDateTime('2026-11-01T01:30:00-04:00').round({ smallestUnit: 'hour', roundingMode: 'floor' }).toString(),
			fallSecondHour: localDateTime('2026-11-01T01:30:00-05:00').round({ smallestUnit: 'hour', roundingMode: 'floor' }).toString(),
			graceFresh: freshness.map(([grace]) => grace),
			refreshFresh: freshness.map(([, refresh]) => refresh),
		}
	},
	checkCache() {
		const instant = Temporal.Instant.from('2026-09-27T01:23:45.678Z')
		writeCachedWeather(createWeather(instant))
		const serialized = JSON.parse(localStorage.getItem(WEATHER_CACHE_STORAGE_KEY)).lastUpdatedDate
		const restored = getCachedWeather({ ...identity, allowStale: true })
		const legacySpring = legacyInstant('2026-2-8-2')
		const legacyFall = legacyInstant('2026-10-1-1')
		legacyInstant('2026-99-99-99')
		return {
			serialized,
			restored: restored?.lastUpdatedDate.toString(),
			isHydratedInstant: restored?.lastUpdatedDate instanceof Temporal.Instant,
			legacySpring,
			legacyFall,
			isInvalidCacheDiscarded: localStorage.getItem(WEATHER_CACHE_STORAGE_KEY) === null,
		}
	},
}
`

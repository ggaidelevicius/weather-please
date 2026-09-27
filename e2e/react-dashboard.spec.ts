import { chromium, expect, test } from '@playwright/test'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

import type { ForecastViewId } from '../src/features/dashboard/model/view-navigation'

declare global {
	interface Window {
		dashboardFixture: {
			lifecycle: Record<string, { starts: number; stops: number }>
			navigate: (viewId: ForecastViewId) => void
		}
	}
}

test('dashboard Activity follows real spring exits and preserves state through rapid navigation', async () => {
	const rootRequire = createRequire(resolve('package.json'))
	const vitestRequire = createRequire(
		rootRequire.resolve('vitest/package.json'),
	)
	const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'))
	const esbuild = viteRequire('esbuild') as {
		build: (options: {
			bundle: boolean
			define: Record<string, string>
			format: string
			jsx: string
			platform: string
			stdin: { contents: string; resolveDir: string; sourcefile: string }
			write: boolean
		}) => Promise<{ outputFiles: { text: string }[] }>
	}
	const result = await esbuild.build({
		bundle: true,
		define: { 'process.env.NODE_ENV': '"production"' },
		format: 'iife',
		jsx: 'automatic',
		platform: 'browser',
		stdin: {
			contents: fixtureSource,
			resolveDir: process.cwd(),
			sourcefile: 'react-dashboard-browser-fixture.js',
		},
		write: false,
	})
	const browser = await chromium.launch()
	try {
		const page = await browser.newPage()
		const errors: string[] = []
		page.on('pageerror', (error) => errors.push(error.message))
		await page.route('https://dashboard.test/**', (route) =>
			route.fulfill(
				new URL(route.request().url()).pathname === '/fixture.js'
					? { body: result.outputFiles[0].text, contentType: 'text/javascript' }
					: {
							body: '<!doctype html><title>Dashboard Activity test</title><style>.absolute{position:absolute}.inset-0{inset:0}</style><div id="root"></div><script src="/fixture.js"></script>',
							contentType: 'text/html',
						},
			),
		)
		await page.goto('https://dashboard.test/')
		const forecastCounter = page.getByTestId('forecast-counter')
		const temperatureCounter = page.getByTestId('temperature-counter')
		await forecastCounter.click()
		await expect(forecastCounter).toHaveText('forecast count 1')
		await expect
			.poll(() => page.evaluate(() => window.dashboardFixture.lifecycle))
			.toMatchObject({
				forecast: { starts: 1, stops: 0 },
				temperature: { starts: 0, stops: 0 },
			})

		await page.getByRole('button', { name: 'Show temperature' }).click()
		await expect(forecastCounter).toBeVisible()
		expect(
			await forecastCounter.evaluate((button) => {
				button.focus()
				return (
					button.closest('[inert]') !== null &&
					document.activeElement !== button
				)
			}),
		).toBe(true)
		await expect
			.poll(() =>
				page.evaluate(() => window.dashboardFixture.lifecycle.forecast.stops),
			)
			.toBe(1)
		await expect(forecastCounter).toBeHidden()
		await expect(temperatureCounter).toBeVisible()
		await temperatureCounter.click()

		await page.getByRole('button', { name: 'Show forecast' }).click()
		await expect(forecastCounter).toHaveText('forecast count 1')
		await expect(forecastCounter).toBeVisible()
		await expect
			.poll(() =>
				page.evaluate(
					() => window.dashboardFixture.lifecycle.temperature.stops,
				),
			)
			.toBe(1)

		await page.evaluate(() => {
			window.dashboardFixture.navigate('temperature')
			window.dashboardFixture.navigate('forecast')
			window.dashboardFixture.navigate('temperature')
		})
		await expect(temperatureCounter).toHaveText('temperature count 1')
		await expect(temperatureCounter).toBeVisible()
		await expect
			.poll(() =>
				page.evaluate(() => window.dashboardFixture.lifecycle.forecast.stops),
			)
			.toBe(2)
		await expect(forecastCounter).toBeHidden()

		await page.getByRole('button', { name: 'Show forecast' }).click()
		await expect(forecastCounter).toBeVisible()
		await expect(forecastCounter).toHaveText('forecast count 1')
		await expect
			.poll(() =>
				page.evaluate(
					() => window.dashboardFixture.lifecycle.temperature.stops,
				),
			)
			.toBe(2)
		expect(errors).toEqual([])
	} finally {
		await browser.close()
	}
})

const fixtureSource = `
import { createElement, useEffect, useLayoutEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { DirectionalView } from './src/features/dashboard/ui/directional-view.tsx'
import { useViewNavigation } from './src/features/dashboard/hooks/use-view-navigation.ts'

const viewIds = ['forecast', 'temperature', 'wind']
window.dashboardFixture = {
	lifecycle: Object.fromEntries(viewIds.map((id) => [id, { starts: 0, stops: 0 }])),
	navigate: () => {},
}
const Counter = ({ viewId }) => {
	const [count, setCount] = useState(0)
	useEffect(() => {
		window.dashboardFixture.lifecycle[viewId].starts += 1
		return () => { window.dashboardFixture.lifecycle[viewId].stops += 1 }
	}, [viewId])
	return createElement('button', {
		'data-testid': viewId + '-counter',
		onClick: () => setCount(count + 1),
	}, viewId + ' count ' + count)
}
const Dashboard = () => {
	const { activeAvailableViewId, handleViewIndicatorSelect, previousTransitionViewId, viewFrameRef } =
		useViewNavigation({ canShowNext24HoursView: true })
	useLayoutEffect(() => {
		window.dashboardFixture.navigate = (viewId) => flushSync(() => handleViewIndicatorSelect(viewId))
	}, [handleViewIndicatorSelect])
	return createElement('div', null,
		createElement('nav', null, ...viewIds.map((viewId) => createElement('button', {
			key: viewId, onClick: () => handleViewIndicatorSelect(viewId),
		}, 'Show ' + viewId))),
		createElement('main', { ref: viewFrameRef, style: { position: 'relative', width: 700, height: 300 } },
			...viewIds.map((viewId) => createElement(DirectionalView, {
				activeViewId: activeAvailableViewId, className: '', key: viewId, previousTransitionViewId, viewId,
			}, createElement(Counter, { viewId }))),
		),
	)
}
createRoot(document.getElementById('root')).render(createElement(Dashboard))
`

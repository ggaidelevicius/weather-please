import { chromium, expect, test } from '@playwright/test'
import path from 'node:path'

import { exerciseDashboard, prepareWeather } from './weather-fixture'

test('web onboarding, settings persistence, and detail navigation', async ({
	context,
	page,
}) => {
	const errors: string[] = []
	page.on('pageerror', (error) => errors.push(error.message))
	await prepareWeather(context)
	await page.goto('/demo')
	await exerciseDashboard(page)
	expect(errors).toEqual([])
})

test('extension hydrates under MV3 and supports the dashboard flow', async () => {
	const extensionPath = path.resolve('extension')
	const context = await chromium.launchPersistentContext('', {
		channel: 'chromium',
		headless: true,
		args: [
			`--disable-extensions-except=${extensionPath}`,
			`--load-extension=${extensionPath}`,
		],
	})
	try {
		await prepareWeather(context)
		const page = await context.newPage()
		const errors: string[] = []
		page.on('pageerror', (error) => errors.push(error.message))
		page.on('console', (message) => {
			if (
				message.type() === 'error' &&
				/content security policy|refused to execute/i.test(message.text())
			)
				errors.push(message.text())
		})
		await page.goto('chrome://newtab/')
		await page.waitForURL('chrome-extension://**/index.html')
		await exerciseDashboard(page)
		expect(errors).toEqual([])
	} finally {
		await context.close()
	}
})

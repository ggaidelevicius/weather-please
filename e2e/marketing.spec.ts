import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { prepareWeather } from './weather-fixture'

test.use({ reducedMotion: 'reduce', timezoneId: 'Pacific/Kiritimati' })

test('the homepage animates its new tab without hydration errors', async ({
	page,
}) => {
	const errors = collectBrowserErrors(page)
	await page.emulateMedia({ reducedMotion: 'no-preference' })
	await page.goto('/')
	await expect(page.locator('[data-hero-new-tab]')).toHaveAttribute(
		'data-hero-new-tab',
		'open',
	)
	await page
		.getByRole('heading', { name: 'Private by design' })
		.scrollIntoViewIfNeeded()
	expect(errors).toEqual([])
})

test('marketing pages hydrate and update metadata without reloading the document', async ({
	page,
}) => {
	const errors = collectBrowserErrors(page)
	await page.goto('/')
	await expect(
		page.getByRole('heading', {
			level: 1,
			name: 'Everything you need from a new tab. Nothing you don’t.',
		}),
	).toBeVisible()
	await expect(page.locator('[data-hero-new-tab]')).toHaveAttribute(
		'data-hero-new-tab',
		'open',
	)
	for (const title of [
		'Every hour, one scroll away',
		'A heads-up before it hits',
		'All your calendars in one place',
		'Private by design',
		'Seasonal touches',
	]) {
		await expect(page.getByRole('heading', { name: title })).toBeVisible()
	}
	await expectMarketingMetadata({ page, pathname: '/' })
	const documentStart = await page.evaluate(() => performance.timeOrigin)

	await page
		.getByRole('navigation', { name: 'Footer' })
		.getByRole('link', { name: 'Privacy' })
		.click()
	await expect(page).toHaveURL('/privacy')
	await expect(
		page.getByRole('heading', {
			level: 1,
			name: 'Privacy Policy for the "Weather Please" Browser Extension',
		}),
	).toBeVisible()
	await expectMarketingMetadata({ page, pathname: '/privacy' })
	expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart)
	const homeLink = page
		.getByRole('navigation', { name: 'Main navigation' })
		.getByRole('link', { name: 'Weather Please home' })
	await expect(homeLink).not.toHaveAttribute('aria-current', 'page')

	await homeLink.click()
	await expect(page).toHaveURL('/')
	await expect(homeLink).toHaveAttribute('aria-current', 'page')
	await expectMarketingMetadata({ page, pathname: '/' })
	expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart)
	expect(errors).toEqual([])
})

test('mobile navigation closes after in-page and cross-page feature links', async ({
	page,
}) => {
	const errors = collectBrowserErrors(page)
	await page.setViewportSize({ height: 844, width: 390 })
	await page.goto('/')
	const navigation = page.getByRole('navigation', { name: 'Main navigation' })
	const menu = navigation.getByRole('button', { name: 'Menu' })
	await menu.click()
	await expect(menu).toHaveAttribute('aria-expanded', 'true')
	await navigation.getByRole('link', { exact: true, name: 'Features' }).click()
	await expect(page).toHaveURL('/#features')
	await expect(menu).toHaveAttribute('aria-expanded', 'false')
	await expect(page.locator('#features')).toBeInViewport()

	await page
		.getByRole('navigation', { name: 'Footer' })
		.getByRole('link', { name: 'Privacy' })
		.click()
	await expect(page).toHaveURL('/privacy')
	await menu.click()
	await navigation.getByRole('link', { exact: true, name: 'Features' }).click()
	await expect(page).toHaveURL('/#features')
	await expect(menu).toHaveAttribute('aria-expanded', 'false')
	await expect(page.locator('#features')).toBeInViewport()
	expect(errors).toEqual([])
})

test('the marketing demo link loads the Pages dashboard and its onboarding', async ({
	context,
	page,
}) => {
	const errors = collectBrowserErrors(page)
	await prepareWeather(context)
	await page.goto('/')
	const documentStart = await page.evaluate(() => performance.timeOrigin)
	await page
		.getByRole('link', { exact: true, name: 'Try the live demo' })
		.click()
	await expect(page).toHaveURL('/demo')
	await expect(
		page.getByRole('button', { exact: true, name: 'Set my location' }),
	).toBeVisible()
	await expect(page.locator('html')).toHaveAttribute('data-weather-please-app')
	await expect(
		page.getByRole('navigation', { name: 'Main navigation' }),
	).toHaveCount(0)
	expect(await page.evaluate(() => performance.timeOrigin)).not.toBe(
		documentStart,
	)
	expect(errors).toEqual([])
})

test('the bug form shares the site layout and keeps its metadata scoped to the route', async ({
	page,
}) => {
	const errors = collectBrowserErrors(page)
	await page.goto('/bug')
	await expect(page).toHaveTitle(/Report a bug/)
	await expect(
		page.getByRole('heading', { name: 'Report a bug' }),
	).toBeVisible()
	await expect(page.getByLabel('Your message')).toBeVisible()
	await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
		'href',
		'https://weather-please.app/bug',
	)
	await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
		'content',
		/\bnoindex\b/,
	)
	const navigation = page.getByRole('navigation', { name: 'Main navigation' })
	await expect(navigation).toBeVisible()
	await expect(page.getByRole('navigation', { name: 'Footer' })).toBeVisible()
	await expect(page.getByRole('main')).toHaveCount(1)
	await expect(page.getByRole('main').getByLabel('Your message')).toBeVisible()
	const homeLink = navigation.getByRole('link', { name: 'Weather Please home' })
	await expect(homeLink).not.toHaveAttribute('aria-current', 'page')
	const documentStart = await page.evaluate(() => performance.timeOrigin)

	await homeLink.click()
	await expect(page).toHaveURL('/')
	await expect(homeLink).toHaveAttribute('aria-current', 'page')
	await expectMarketingMetadata({ page, pathname: '/' })
	expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart)
	expect(errors).toEqual([])
})

test('the localized bug form fits mobile and shares cross-page navigation', async ({
	page,
}) => {
	const errors = collectBrowserErrors(page)
	await page.setViewportSize({ height: 844, width: 390 })
	await page.goto('/bug?locale=lt')
	const main = page.getByRole('main')
	await expect(
		main.getByRole('heading', { level: 1, name: 'Pranešti apie klaidą' }),
	).toBeVisible()
	await main
		.getByLabel('Jūsų el. paštas (pasirinktinai)')
		.fill('test@example.com')
	await main.getByLabel('Jūsų žinutė').fill('Testuojamas klaidos pranešimas.')
	await expect(main.locator('input[name="locale"]')).toHaveValue('lt')
	await expect(main.getByRole('button', { name: 'Pateikti' })).toBeEnabled()
	await expect(page.getByRole('navigation', { name: 'Footer' })).toBeVisible()
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth,
		),
	).toBe(true)
	const documentStart = await page.evaluate(() => performance.timeOrigin)
	const navigation = page.getByRole('navigation', { name: 'Main navigation' })
	const menu = navigation.getByRole('button', { name: 'Menu' })
	await menu.click()
	await expect(menu).toHaveAttribute('aria-expanded', 'true')
	await navigation.getByRole('link', { exact: true, name: 'Features' }).click()
	await expect(page).toHaveURL('/#features')
	await expect(menu).toHaveAttribute('aria-expanded', 'false')
	await expect(page.locator('#features')).toBeInViewport()
	await expectMarketingMetadata({ page, pathname: '/' })
	expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart)
	expect(errors).toEqual([])
})

const collectBrowserErrors = (page: Page) => {
	const errors: string[] = []
	page.on('pageerror', (error) => errors.push(error.message))
	page.on('console', (message) => {
		if (
			message.type() === 'error' &&
			/hydrat|did not match|didn't match|Minified React error #(?:418|423|425)/i.test(
				message.text(),
			)
		) {
			errors.push(message.text())
		}
	})
	return errors
}

const expectMarketingMetadata = async ({
	page,
	pathname,
}: {
	page: Page
	pathname: '/' | '/privacy'
}) => {
	const isHome = pathname === '/'
	const title = isHome
		? 'Weather Please — weather and calendar in every new tab'
		: 'Privacy policy — Weather Please'
	const description = isHome
		? 'Weather Please is a free, open-source browser extension that shows your local weather forecast and upcoming calendar events on every new tab.'
		: 'The privacy policy for the Weather Please browser extension.'
	const canonical = `https://weather-please.app${isHome ? '' : pathname}`
	await expect(page).toHaveTitle(title)
	for (const [selector, content] of [
		['meta[name="description"]', description],
		['meta[property="og:title"]', title],
		['meta[property="og:description"]', description],
		['meta[property="og:url"]', canonical],
		['meta[name="twitter:title"]', title],
		['meta[name="twitter:description"]', description],
	]) {
		await expect(page.locator(`head ${selector}`)).toHaveAttribute(
			'content',
			content,
		)
	}
	for (const [selector, href] of [
		['link[rel="canonical"]', canonical],
		[
			'link[rel="alternate"][type="text/markdown"]',
			`https://weather-please.app/${isHome ? 'index' : 'privacy'}.md`,
		],
		['link[rel="describedby"]', 'https://weather-please.app/llms.txt'],
		['link[rel="sitemap"]', 'https://weather-please.app/sitemap.xml'],
		['link[rel="help"]', 'https://weather-please.app/auth.md'],
	]) {
		await expect(page.locator(`head ${selector}`)).toHaveAttribute('href', href)
	}
	await expect(
		page.locator('head meta[name="robots"][content*="noindex"]'),
	).toHaveCount(0)
}

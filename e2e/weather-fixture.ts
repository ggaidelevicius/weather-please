import type { BrowserContext, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { createWeatherResponse } from '../src/features/weather/testing/weather-response'

export const prepareWeather = async (context: BrowserContext) => {
	await context.addInitScript(() => {
		Object.defineProperty(navigator, 'geolocation', {
			value: {
				getCurrentPosition: (success: PositionCallback) =>
					success({
						coords: {
							accuracy: 10,
							altitude: null,
							altitudeAccuracy: null,
							heading: null,
							latitude: 40.7128,
							longitude: -74.006,
							speed: null,
							toJSON: () => ({}),
						},
						timestamp: Date.now(),
						toJSON: () => ({}),
					}),
			},
		})
	})
	const weather = createWeatherResponse()
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const midnight = today.getTime() / 1000
	weather.daily.time = [midnight]
	weather.daily.sunrise = [midnight + 21600]
	weather.daily.sunset = [midnight + 64800]
	weather.hourly.time = weather.hourly.time.map(
		(_, index) => midnight + index * 3600,
	)
	await context.route('https://**/*', async (route) => {
		const url = new URL(route.request().url())
		if (
			url.hostname === 'api.open-meteo.com' &&
			url.searchParams.has('forecast_hours')
		) {
			await route.fulfill({
				json: {
					hourly: {
						precipitation: Array(7).fill(0),
						precipitation_probability: Array(7).fill(0),
						time: weather.hourly.time.slice(0, 7),
						winddirection_10m: Array(7).fill(90),
						windspeed_10m: Array(7).fill(10),
					},
					latitude: 40.7128,
					longitude: -74.006,
				},
			})
		} else if (url.hostname === 'api.open-meteo.com') {
			await route.fulfill({ json: weather })
		} else if (url.hostname === 'air-quality-api.open-meteo.com') {
			await route.fulfill({
				json: {
					hourly: {
						pm2_5: weather.hourly.time.map(() => 5),
						time: weather.hourly.time,
						us_aqi: weather.hourly.time.map(() => 25),
						uv_index: weather.hourly.time.map(() => 1),
					},
				},
			})
		} else if (url.hostname === 'nominatim.openstreetmap.org') {
			await route.fulfill({
				json: {
					features: [
						{
							properties: {
								geocoding: { city: 'New York', country: 'United States' },
							},
						},
					],
				},
			})
		} else {
			await route.abort()
		}
	})
}

export const exerciseDashboard = async (page: Page) => {
	await expect(
		page.getByRole('button', { exact: true, name: 'Set my location' }),
	).toBeVisible()
	await page
		.getByRole('button', { exact: true, name: 'Set my location' })
		.click()
	await expect(page.getByRole('dialog')).toHaveCount(0)
	await expect(
		page.getByText('New York, United States', { exact: true }),
	).toBeVisible()
	await page.getByRole('button', { exact: true, name: 'Settings' }).click()
	await page.getByRole('button', { exact: true, name: 'Weather' }).click()
	await page.getByLabel('Number of days to forecast').selectOption('4')
	await page.keyboard.press('Escape')
	await expect(page.getByRole('dialog')).toHaveCount(0)
	await page.reload()
	await expect(
		page.getByRole('button', { exact: true, name: 'Set my location' }),
	).toHaveCount(0)
	await page.getByRole('button', { exact: true, name: 'Settings' }).click()
	await page.getByRole('button', { exact: true, name: 'Weather' }).click()
	await expect(page.getByLabel('Number of days to forecast')).toHaveValue('4')
	await page.keyboard.press('Escape')
	await expect(page.getByRole('dialog')).toHaveCount(0)
	await page.getByRole('main').hover()
	await page.mouse.wheel(0, 150)
	await expect(
		page.getByRole('button', { name: 'Show temperature view' }),
	).toHaveAttribute('aria-current', 'page')
	await expect(
		page.getByRole('heading', { exact: true, name: 'Temperature' }),
	).toBeVisible()
	await page
		.getByRole('navigation', { name: 'Weather view navigation' })
		.hover()
	for (const view of [
		'precipitation',
		'wind',
		'air quality',
		'sun',
		'conditions',
		'map',
	]) {
		const button = page.getByRole('button', { name: `Show ${view} view` })
		await button.click()
		await expect(button).toHaveAttribute('aria-current', 'page')
		if (view !== 'map') {
			await expect(
				page.getByRole('heading', { name: new RegExp(`^${view}$`, 'i') }),
			).toBeVisible()
		}
	}
}

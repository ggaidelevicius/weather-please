import { describe, expect, it, vi } from 'vitest'

import { fetchWeatherResponse } from '../weather-api'

describe('fetchWeatherResponse', () => {
	it('includes the upstream HTTP status code in weather fetch errors', async () => {
		const fetchMock = vi
			.spyOn(global, 'fetch')
			.mockResolvedValueOnce(new Response(null, { status: 503 }))

		await expect(
			fetchWeatherResponse({
				lat: '-31.9523',
				lon: '115.8613',
				shouldUseAirQualityUv: false,
				timeZone: 'Australia/Perth',
			}),
		).rejects.toThrow('Weather fetch failed: 503')

		fetchMock.mockRestore()
	})
})

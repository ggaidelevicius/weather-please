import { renderHook, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

import { createWeatherResponse } from '../../testing/weather-response'
import { useWeather } from '../use-weather'

it('displays a successful forecast even when the cache cannot be written', async () => {
	localStorage.clear()
	const weather = createWeatherResponse()
	const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
		if (String(url).includes('air-quality'))
			return Response.json({ hourly: { time: [], uv_index: [] } })
		if (String(url).includes('forecast_hours'))
			return new Response(null, { status: 503 })
		return Response.json(weather)
	})
	const storageSpy = vi
		.spyOn(Storage.prototype, 'setItem')
		.mockImplementation(() => {
			throw new DOMException('Full', 'QuotaExceededError')
		})
	const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
	try {
		const { result } = renderHook(() => useWeather('40', '-74', 0, false))
		await waitFor(() => expect(result.current.hasData).toBe(true))
		expect(result.current.error).toBeNull()
		expect(result.current.weatherData[0]).toMatchObject({ max: 30, min: 20 })
	} finally {
		fetchSpy.mockRestore()
		storageSpy.mockRestore()
		consoleSpy.mockRestore()
	}
})

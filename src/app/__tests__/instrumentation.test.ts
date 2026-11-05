// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getHeroForecast } from '../../features/landing/model/hero-forecast'
import { createWeatherResponse } from '../../features/weather/testing/weather-response'
import { register } from '../../instrumentation'
import { getCurrentDateTime } from '../../shared/lib/time'

beforeEach(() => {
	vi.stubEnv('NEXT_RUNTIME', 'nodejs')
})

afterEach(() => {
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
	vi.unstubAllEnvs()
})

describe('server Temporal initialization', () => {
	it('preserves native Temporal when it is available', async () => {
		const nativeTemporal = globalThis.Temporal

		await register()

		expect(globalThis.Temporal).toBe(nativeTemporal)
	})

	it('does not initialize Temporal outside the Node.js runtime', async () => {
		vi.stubEnv('NEXT_RUNTIME', 'edge')
		vi.stubGlobal('Temporal', undefined)

		await register()

		expect(typeof globalThis.Temporal).toBe('undefined')
	})

	describe('when the runtime has no native Temporal', () => {
		beforeEach(async () => {
			vi.stubGlobal('Temporal', undefined)
			await register()
			vi.spyOn(Temporal.Now, 'instant').mockReturnValue(
				Temporal.Instant.from('2026-10-19T01:00:00Z'),
			)
		})

		it('initializes the server clock once with timezone support', async () => {
			const temporal = globalThis.Temporal

			await register()

			expect(globalThis.Temporal).toBe(temporal)
			expect(getCurrentDateTime('Australia/Perth').hour).toBe(9)
			expect(
				getCurrentDateTime('Australia/Perth').toPlainDate().toString(),
			).toBe('2026-10-19')
		})

		it('loads the live hero forecast without a Temporal error', async () => {
			const weather = createWeatherResponse()
			const midnight =
				Temporal.PlainDate.from('2026-10-19').toZonedDateTime('Australia/Perth')
					.epochMilliseconds / 1000
			weather.daily = {
				...weather.daily,
				precipitation_probability_max: [10, 20, 30],
				temperature_2m_max: [30, 31, 32],
				temperature_2m_min: [20, 21, 22],
				time: [midnight, midnight + 86_400, midnight + 2 * 86_400],
				uv_index_max: [8, 9, 10],
				weathercode: [1, 2, 3],
				windspeed_10m_max: [15, 16, 17],
			}
			weather.hourly.time = weather.hourly.time.map(
				(_, index) => midnight + index * 3600,
			)
			vi.spyOn(globalThis, 'fetch')
				.mockResolvedValueOnce(Response.json(weather))
				.mockResolvedValueOnce(Response.json({ hourly: { time: [] } }))
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

			const { forecast, hourly, revalidateSeconds } = await getHeroForecast()

			expect(forecast.map(({ max }) => max)).toEqual([30, 31, 32])
			expect(hourly.labels.start).toBe('9 AM')
			expect(revalidateSeconds).toBe(3600)
			expect(errorSpy).not.toHaveBeenCalled()
		})

		it('still returns sample data when the weather service is unavailable', async () => {
			vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

			const { forecast, hourly, revalidateSeconds } = await getHeroForecast()

			expect(forecast).toHaveLength(3)
			expect(hourly.times).toHaveLength(24)
			expect(hourly.labels.start).toBe('9 AM')
			expect(revalidateSeconds).toBe(300)
			expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
				'Unable to load the hero forecast; using sample data.',
				expect.objectContaining({ message: 'offline' }),
			)
		})
	})
})

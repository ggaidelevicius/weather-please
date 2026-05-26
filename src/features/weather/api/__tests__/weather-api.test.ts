import { describe, expect, it, vi } from 'vitest'

import type { WeatherResponse } from '../weather-api'

import {
	fetchWeatherMapData,
	fetchWeatherResponse,
	mapWeatherResponseToNext24HoursData,
} from '../weather-api'

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

	it('accepts nullable weather UV values before applying air quality UV data', async () => {
		const weatherResponse = createWeatherResponse()
		weatherResponse.daily.uv_index_max = [null]
		weatherResponse.hourly.uv_index = Array.from({ length: 30 }, () => null)
		const fetchMock = vi
			.spyOn(global, 'fetch')
			.mockResolvedValueOnce(Response.json(weatherResponse))
			.mockResolvedValueOnce(
				Response.json({
					hourly: {
						time: [0, 1],
						uv_index: [2, 3],
					},
				}),
			)

		const result = await fetchWeatherResponse({
			lat: '-31.9523',
			lon: '115.8613',
			shouldUseAirQualityUv: true,
			timeZone: 'Australia/Perth',
		})

		expect(result.daily.uv_index_max[0]).toBe(3)
		expect(result.hourly.uv_index.slice(0, 2)).toEqual([2, 3])

		fetchMock.mockRestore()
	})
})

describe('fetchWeatherMapData', () => {
	it('maps local grid forecast frames from Open-Meteo responses', async () => {
		const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
			Response.json([
				{
					hourly: {
						precipitation: [0.4, 1.2],
						precipitation_probability: [10, 20],
						time: [100, 200],
						winddirection_10m: [90, 180],
						windspeed_10m: [12, 18],
					},
					latitude: -31.95,
					longitude: 115.86,
				},
			]),
		)

		const result = await fetchWeatherMapData({
			lat: '-31.9523',
			lon: '115.8613',
			timeZone: 'Australia/Perth',
		})

		expect(result).toEqual({
			center: {
				lat: -31.9523,
				lon: 115.8613,
			},
			frames: [
				{
					points: [
						{
							lat: -31.95,
							lon: 115.86,
							precipitation: 0.4,
							precipitationProbability: 10,
							windDirection: 90,
							windSpeed: 12,
						},
					],
					time: 100,
				},
				{
					points: [
						{
							lat: -31.95,
							lon: 115.86,
							precipitation: 1.2,
							precipitationProbability: 20,
							windDirection: 180,
							windSpeed: 18,
						},
					],
					time: 200,
				},
			],
		})
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain('forecast_hours=7')

		fetchMock.mockRestore()
	})
})

describe('mapWeatherResponseToNext24HoursData', () => {
	it('maps the current hour through the next 24 hours', () => {
		const data = createWeatherResponse()

		const result = mapWeatherResponseToNext24HoursData({
			currentHour: 3,
			data,
		})

		expect(result).toHaveLength(25)
		expect(result[0]).toEqual({
			apparentTemperature: 13,
			dewPoint: 8,
			humidity: 53,
			precipitation: 3,
			precipitationProbability: 6,
			shortwaveRadiation: 130,
			temperature: 23,
			time: 3,
			uv: 3,
			visibility: 997,
			weatherCode: 3,
			wind: 13,
			windGust: 23,
		})
		expect(result.at(-1)?.time).toBe(27)
	})

	it('normalizes null hourly weather values with conservative fallbacks', () => {
		const data = createWeatherResponse()
		data.hourly.apparent_temperature[3] = null
		data.hourly.dew_point_2m[3] = null
		data.hourly.precipitation[3] = null
		data.hourly.precipitation_probability[3] = null
		data.hourly.relative_humidity_2m[3] = null
		data.hourly.shortwave_radiation_instant[3] = null
		data.hourly.uv_index[3] = null
		data.hourly.visibility[3] = null
		data.hourly.weathercode[3] = null
		data.hourly.windgusts_10m[3] = null
		data.hourly.windspeed_10m[3] = null

		const result = mapWeatherResponseToNext24HoursData({
			currentHour: 3,
			data,
		})

		expect(result[0]).toEqual({
			apparentTemperature: 23,
			dewPoint: 23,
			humidity: 0,
			precipitation: 0,
			precipitationProbability: 0,
			shortwaveRadiation: 0,
			temperature: 23,
			time: 3,
			uv: 0,
			visibility: 0,
			weatherCode: 0,
			wind: 0,
			windGust: 0,
		})
	})
})

const createWeatherResponse = (): WeatherResponse => ({
	daily: {
		precipitation_probability_max: [10],
		temperature_2m_max: [30],
		temperature_2m_min: [20],
		time: [0],
		uv_index_max: [8],
		weathercode: [1],
		windspeed_10m_max: [15],
	},
	hourly: {
		apparent_temperature: Array.from({ length: 30 }, (_, index) => index + 10),
		dew_point_2m: Array.from({ length: 30 }, (_, index) => index + 5),
		precipitation: Array.from({ length: 30 }, (_, index) => index),
		precipitation_probability: Array.from(
			{ length: 30 },
			(_, index) => index * 2,
		),
		relative_humidity_2m: Array.from({ length: 30 }, (_, index) => index + 50),
		shortwave_radiation_instant: Array.from(
			{ length: 30 },
			(_, index) => index * 10 + 100,
		),
		temperature_2m: Array.from({ length: 30 }, (_, index) => index + 20),
		time: Array.from({ length: 30 }, (_, index) => index),
		uv_index: Array.from({ length: 30 }, (_, index) => index),
		visibility: Array.from({ length: 30 }, (_, index) => 1000 - index),
		weathercode: Array.from({ length: 30 }, (_, index) => index),
		windgusts_10m: Array.from({ length: 30 }, (_, index) => index + 20),
		windspeed_10m: Array.from({ length: 30 }, (_, index) => index + 10),
	},
})

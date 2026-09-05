import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createEmptyAlerts } from '../alerts'
import {
	getCachedWeather,
	writeCachedWeather,
	writeCachedWeatherMapData,
	WEATHER_CACHE_STORAGE_KEY,
} from '../cache'

const identity = {
	lat: '40',
	lon: '-74',
	timeZone: 'UTC',
	shouldUseAirQualityUv: false,
}
const forecast = () => ({
	...identity,
	alertData: createEmptyAlerts(),
	lastUpdatedDate: new Date(),
	weatherData: [
		{
			day: Math.floor(Date.now() / 1000),
			description: 0,
			max: 25,
			min: 15,
			rain: 0,
			uv: 1,
			wind: 2,
		},
	],
	next24HoursData: [],
	weatherMapData: null,
})

beforeEach(() => localStorage.clear())

describe('weather cache persistence', () => {
	it('keeps the previous complete record when a write exceeds the quota', () => {
		writeCachedWeather(forecast())
		const original = localStorage.getItem(WEATHER_CACHE_STORAGE_KEY)
		const spy = vi
			.spyOn(Storage.prototype, 'setItem')
			.mockImplementation(() => {
				throw new DOMException('Full', 'QuotaExceededError')
			})
		try {
			expect(writeCachedWeather({ ...forecast(), lat: '50' })).toBe(false)
			expect(localStorage.getItem(WEATHER_CACHE_STORAGE_KEY)).toBe(original)
			expect(getCachedWeather(identity)?.weatherData).toHaveLength(1)
		} finally {
			spy.mockRestore()
		}
	})

	it('ignores maps from a different forecast location', () => {
		writeCachedWeather(forecast())
		expect(
			writeCachedWeatherMapData({
				...identity,
				lat: '50',
				weatherMapData: { center: { lat: 50, lon: -74 }, frames: [] },
			}),
		).toBe(false)
		expect(getCachedWeather(identity)?.weatherMapData).toBeNull()
	})

	it('treats blocked storage as a cache miss', () => {
		const spy = vi
			.spyOn(Storage.prototype, 'getItem')
			.mockImplementation(() => {
				throw new DOMException('Blocked', 'SecurityError')
			})
		try {
			expect(getCachedWeather(identity)).toBeNull()
		} finally {
			spy.mockRestore()
		}
	})
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	getCurrentInstant,
	getCurrentTimestamp,
} from '../../../../shared/lib/time'
import { createEmptyAlerts } from '../alerts'
import {
	getCachedWeather,
	readCachedWeatherSnapshot,
	WEATHER_CACHE_STORAGE_KEY,
	writeCachedWeather,
	writeCachedWeatherMapData,
} from '../cache'

const identity = {
	lat: '40',
	lon: '-74',
	shouldUseAirQualityUv: false,
	timeZone: 'UTC',
}
const forecast = () => ({
	...identity,
	alertData: createEmptyAlerts(),
	lastUpdatedDate: getCurrentInstant(),
	next24HoursData: [],
	weatherData: [
		{
			day: Math.floor(getCurrentTimestamp() / 1000),
			description: 0,
			max: 25,
			min: 15,
			rain: 0,
			uv: 1,
			wind: 2,
		},
	],
	weatherMapData: null,
})

beforeEach(() => localStorage.clear())

describe('weather cache persistence', () => {
	it('reads invalid snapshots without repairing storage during render', () => {
		localStorage.setItem(WEATHER_CACHE_STORAGE_KEY, '{broken json')
		const write = vi.spyOn(Storage.prototype, 'setItem')
		const remove = vi.spyOn(Storage.prototype, 'removeItem')
		try {
			expect(readCachedWeatherSnapshot()).toBeNull()
			expect(readCachedWeatherSnapshot()).toBeNull()
			expect(write).not.toHaveBeenCalled()
			expect(remove).not.toHaveBeenCalled()
			expect(localStorage.getItem(WEATHER_CACHE_STORAGE_KEY)).toBe(
				'{broken json',
			)
		} finally {
			write.mockRestore()
			remove.mockRestore()
		}
	})

	it('tracks legacy fallback changes without migrating or repairing during snapshot reads', () => {
		const weather = forecast()
		localStorage.setItem(WEATHER_CACHE_STORAGE_KEY, '{broken json')
		localStorage.setItem('cachedLat', identity.lat)
		localStorage.setItem('cachedLon', identity.lon)
		localStorage.setItem('cachedTimeZone', identity.timeZone)
		localStorage.setItem('cachedUseAirQualityUv', 'false')
		localStorage.setItem('lastUpdated', weather.lastUpdatedDate.toString())
		localStorage.setItem('alerts', JSON.stringify(weather.alertData))
		localStorage.setItem('data', JSON.stringify(weather.weatherData))
		const first = readCachedWeatherSnapshot()
		expect(first?.weatherData[0]?.max).toBe(25)
		expect(localStorage.getItem(WEATHER_CACHE_STORAGE_KEY)).toBe('{broken json')
		localStorage.setItem(
			'data',
			JSON.stringify(weather.weatherData.map((day) => ({ ...day, max: 40 }))),
		)
		const next = readCachedWeatherSnapshot()
		expect(next).not.toBe(first)
		expect(next?.weatherData[0]?.max).toBe(40)
		expect(localStorage.getItem(WEATHER_CACHE_STORAGE_KEY)).toBe('{broken json')
	})

	it('returns the same validated snapshot until persisted data changes', () => {
		writeCachedWeather(forecast())
		const first = readCachedWeatherSnapshot()
		expect(first).not.toBeNull()
		expect(readCachedWeatherSnapshot()).toBe(first)
		writeCachedWeather({ ...forecast(), lat: '50' })
		const second = readCachedWeatherSnapshot()
		expect(second).not.toBe(first)
		expect(second?.lat).toBe('50')
		localStorage.clear()
		expect(readCachedWeatherSnapshot()).toBeNull()
	})

	it.each([0.5, 8_640_000_000_001])(
		'discards a cached forecast with invalid day timestamp %s',
		(day) => {
			const weather = forecast()
			localStorage.setItem(
				WEATHER_CACHE_STORAGE_KEY,
				JSON.stringify({
					...weather,
					isDegraded: false,
					version: 1,
					weatherData: weather.weatherData.map((daily) => ({ ...daily, day })),
				}),
			)
			expect(() => getCachedWeather(identity)).not.toThrow()
			expect(getCachedWeather(identity)).toBeNull()
			expect(localStorage.getItem(WEATHER_CACHE_STORAGE_KEY)).toBeNull()
		},
	)

	it('persists the existing ISO timestamp format and restores an instant', () => {
		const lastUpdatedDate = Temporal.Instant.from('2026-09-27T01:23:45.678Z')
		writeCachedWeather({ ...forecast(), lastUpdatedDate })
		const stored = JSON.parse(
			localStorage.getItem(WEATHER_CACHE_STORAGE_KEY) ?? 'null',
		)
		expect(stored.lastUpdatedDate).toBe('2026-09-27T01:23:45.678Z')
		const cached = getCachedWeather({ ...identity, allowStale: true })
		expect(cached?.lastUpdatedDate).toBeInstanceOf(Temporal.Instant)
		expect(cached?.lastUpdatedDate.equals(lastUpdatedDate)).toBe(true)
	})

	it.each([
		['2026-0-15-9', '2026-01-15T14:00:00Z'],
		['2026-2-8-2', '2026-03-08T07:00:00Z'],
		['2026-10-1-1', '2026-11-01T05:00:00Z'],
	])(
		'reads legacy local timestamp %s with zero-based months and compatible DST handling',
		(legacy, expected) => {
			const timeZone = vi
				.spyOn(Temporal.Now, 'timeZoneId')
				.mockReturnValue('America/New_York')
			try {
				localStorage.setItem(
					WEATHER_CACHE_STORAGE_KEY,
					JSON.stringify({
						...forecast(),
						isDegraded: false,
						lastUpdatedDate: legacy,
						version: 1,
					}),
				)
				expect(
					getCachedWeather({
						...identity,
						allowStale: true,
					})?.lastUpdatedDate.equals(Temporal.Instant.from(expected)),
				).toBe(true)
			} finally {
				timeZone.mockRestore()
			}
		},
	)

	it.each(['2026-99-99-99', '2026-02-30T00:00:00.000Z'])(
		'discards invalid stored timestamp %s without throwing',
		(lastUpdatedDate) => {
			localStorage.setItem(
				WEATHER_CACHE_STORAGE_KEY,
				JSON.stringify({
					...forecast(),
					isDegraded: false,
					lastUpdatedDate,
					version: 1,
				}),
			)
			expect(() => getCachedWeather(identity)).not.toThrow()
			expect(getCachedWeather(identity)).toBeNull()
			expect(localStorage.getItem(WEATHER_CACHE_STORAGE_KEY)).toBeNull()
		},
	)

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

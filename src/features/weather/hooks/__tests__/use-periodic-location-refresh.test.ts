import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { invalidateSharedResource } from '../../../../shared/lib/shared-resource'
import { getCurrentTimestamp } from '../../../../shared/lib/time'
import { usePeriodicLocationRefresh } from '../use-periodic-location-refresh'

const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>()

beforeEach(() => {
	vi.useFakeTimers()
	getCurrentPosition.mockReset()
	vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
	vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
	invalidateSharedResource({ key: 'device-location' })
	localStorage.clear()
})

afterEach(() => {
	cleanup()
	vi.useRealTimers()
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe('shared periodic location checks', () => {
	it('shares one location check and its result between active consumers', async () => {
		const firstUpdate = vi.fn()
		const secondUpdate = vi.fn()
		renderLocation(firstUpdate)
		renderLocation(secondUpdate)
		await flushWork()
		expect(getCurrentPosition).toHaveBeenCalledTimes(1)

		await act(async () =>
			getCurrentPosition.mock.calls[0][0](createPosition(-31.95, 115.86)),
		)
		expect(firstUpdate).toHaveBeenCalledExactlyOnceWith({
			lat: '-31.95',
			lon: '115.86',
		})
		expect(secondUpdate).toHaveBeenCalledExactlyOnceWith({
			lat: '-31.95',
			lon: '115.86',
		})

		const laterUpdate = vi.fn()
		renderLocation(laterUpdate)
		await flushWork()
		expect(laterUpdate).toHaveBeenCalledExactlyOnceWith({
			lat: '-31.95',
			lon: '115.86',
		})
		expect(getCurrentPosition).toHaveBeenCalledTimes(1)
	})

	it('checks again once the shared location expires and preserves the one kilometre threshold', async () => {
		const onLocationChange = vi.fn()
		renderLocation(onLocationChange, { lat: '-31.95', lon: '115.86' })
		await flushWork()
		await act(async () =>
			getCurrentPosition.mock.calls[0][0](createPosition(-31.9501, 115.8601)),
		)
		expect(onLocationChange).not.toHaveBeenCalled()

		await act(async () => vi.advanceTimersByTimeAsync(60_001))
		expect(getCurrentPosition).toHaveBeenCalledTimes(2)
		await act(async () =>
			getCurrentPosition.mock.calls[1][0](createPosition(-32.05, 115.86)),
		)
		expect(onLocationChange).toHaveBeenCalledExactlyOnceWith({
			lat: '-32.05',
			lon: '115.86',
		})
	})

	it('does not check a hidden tab and rechecks stale data on resume', async () => {
		const visibility = vi
			.spyOn(document, 'visibilityState', 'get')
			.mockReturnValue('hidden')
		const onLocationChange = vi.fn()
		renderLocation(onLocationChange)
		await act(async () => vi.advanceTimersByTimeAsync(120_000))
		expect(getCurrentPosition).not.toHaveBeenCalled()

		act(() => {
			visibility.mockReturnValue('visible')
			document.dispatchEvent(new Event('visibilitychange'))
		})
		await flushWork()
		expect(getCurrentPosition).toHaveBeenCalledTimes(1)
		await act(async () =>
			getCurrentPosition.mock.calls[0][0](createPosition(-31.95, 115.86)),
		)

		act(() => {
			visibility.mockReturnValue('hidden')
			document.dispatchEvent(new Event('visibilitychange'))
		})
		await act(async () => vi.advanceTimersByTimeAsync(120_000))
		expect(getCurrentPosition).toHaveBeenCalledTimes(1)
		act(() => {
			visibility.mockReturnValue('visible')
			window.dispatchEvent(new Event('pageshow'))
		})
		await flushWork()
		expect(getCurrentPosition).toHaveBeenCalledTimes(2)
	})

	it('adopts another tab’s completed location while hidden without starting its own check', async () => {
		vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
		const onLocationChange = vi.fn()
		renderLocation(onLocationChange)
		const key = 'weather-please:shared-resource:v1:device-location'
		const newValue = JSON.stringify({
			data: { lat: -31.95, lon: 115.86, status: 'success' },
			hasValue: true,
			id: 'other-tab-location',
			revision: '',
			updatedAt: getCurrentTimestamp(),
			version: 1,
		})
		act(() => {
			localStorage.setItem(key, newValue)
			window.dispatchEvent(
				new StorageEvent('storage', {
					key,
					newValue,
					storageArea: localStorage,
				}),
			)
		})

		expect(onLocationChange).toHaveBeenCalledExactlyOnceWith({
			lat: '-31.95',
			lon: '115.86',
		})
		await act(async () => vi.advanceTimersByTimeAsync(120_000))
		expect(getCurrentPosition).not.toHaveBeenCalled()
	})

	it('leaves a fixed location alone and ignores a pending check after opting out', async () => {
		const onLocationChange = vi.fn()
		const { rerender } = renderHook(
			({ enabled }) =>
				usePeriodicLocationRefresh({
					enabled,
					lat: '40',
					lon: '-74',
					onLocationChange,
				}),
			{ initialProps: { enabled: false } },
		)
		await flushWork()
		expect(getCurrentPosition).not.toHaveBeenCalled()

		rerender({ enabled: true })
		await flushWork()
		expect(getCurrentPosition).toHaveBeenCalledTimes(1)
		rerender({ enabled: false })
		await act(async () =>
			getCurrentPosition.mock.calls[0][0](createPosition(-31.95, 115.86)),
		)
		expect(onLocationChange).not.toHaveBeenCalled()
	})

	it('shares permission failures without changing saved coordinates or retrying immediately', async () => {
		const onLocationChange = vi.fn()
		renderLocation(onLocationChange, { lat: '40', lon: '-74' })
		renderLocation(vi.fn(), { lat: '40', lon: '-74' })
		await flushWork()
		await act(async () =>
			getCurrentPosition.mock.calls[0][1]?.({
				code: 1,
				message: 'Permission denied',
				PERMISSION_DENIED: 1,
				POSITION_UNAVAILABLE: 2,
				TIMEOUT: 3,
			}),
		)
		await flushWork()
		expect(onLocationChange).not.toHaveBeenCalled()
		expect(getCurrentPosition).toHaveBeenCalledTimes(1)
	})

	it('discards a late location callback after hiding and starts a fresh check when visible', async () => {
		const onLocationChange = vi.fn()
		const visibility = vi.spyOn(document, 'visibilityState', 'get')
		renderLocation(onLocationChange)
		await flushWork()
		act(() => {
			visibility.mockReturnValue('hidden')
			document.dispatchEvent(new Event('visibilitychange'))
		})
		await act(async () =>
			getCurrentPosition.mock.calls[0][0](createPosition(40, -74)),
		)
		expect(onLocationChange).not.toHaveBeenCalled()

		act(() => {
			visibility.mockReturnValue('visible')
			document.dispatchEvent(new Event('visibilitychange'))
		})
		await flushWork()
		expect(getCurrentPosition).toHaveBeenCalledTimes(2)
		await act(async () =>
			getCurrentPosition.mock.calls[1][0](createPosition(-31.95, 115.86)),
		)
		expect(onLocationChange).toHaveBeenCalledExactlyOnceWith({
			lat: '-31.95',
			lon: '115.86',
		})
	})
})

const renderLocation = (
	onLocationChange: (coords: { lat: string; lon: string }) => void,
	{ lat = '', lon = '' } = {},
) =>
	renderHook(() =>
		usePeriodicLocationRefresh({ enabled: true, lat, lon, onLocationChange }),
	)

const flushWork = () =>
	act(async () => {
		await vi.advanceTimersByTimeAsync(0)
	})

const createPosition = (
	latitude: number,
	longitude: number,
): GeolocationPosition => ({
	coords: {
		accuracy: 1,
		altitude: null,
		altitudeAccuracy: null,
		heading: null,
		latitude,
		longitude,
		speed: null,
		toJSON: () => ({}),
	},
	timestamp: getCurrentTimestamp(),
	toJSON: () => ({}),
})

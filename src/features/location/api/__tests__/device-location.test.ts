import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchDeviceLocation } from '../device-location'

const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>()

beforeEach(() => {
	getCurrentPosition.mockReset()
	vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
})

afterEach(() => vi.unstubAllGlobals())

describe('device location checks', () => {
	it('returns validated coordinates', async () => {
		const controller = new AbortController()
		const pending = fetchDeviceLocation({ signal: controller.signal })
		getCurrentPosition.mock.calls[0][0](createPosition(-31.95, 115.86))

		await expect(pending).resolves.toEqual({
			lat: -31.95,
			lon: 115.86,
			status: 'success',
		})
	})

	it('returns a cacheable permission failure', async () => {
		const pending = fetchDeviceLocation({
			signal: new AbortController().signal,
		})
		getCurrentPosition.mock.calls[0][1]?.({
			code: 1,
			message: 'Permission denied',
			PERMISSION_DENIED: 1,
			POSITION_UNAVAILABLE: 2,
			TIMEOUT: 3,
		})

		await expect(pending).resolves.toEqual({
			code: 'permission-denied',
			status: 'error',
		})
	})

	it('ignores a browser callback after the check is cancelled', async () => {
		const controller = new AbortController()
		const pending = fetchDeviceLocation({ signal: controller.signal })
		controller.abort()
		getCurrentPosition.mock.calls[0][0](createPosition(-31.95, 115.86))

		await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
	})

	it('does not ask for location when already cancelled', async () => {
		const controller = new AbortController()
		controller.abort()

		await expect(
			fetchDeviceLocation({ signal: controller.signal }),
		).rejects.toMatchObject({
			name: 'AbortError',
		})
		expect(getCurrentPosition).not.toHaveBeenCalled()
	})

	it('does not publish invalid coordinates', async () => {
		const pending = fetchDeviceLocation({
			signal: new AbortController().signal,
		})
		getCurrentPosition.mock.calls[0][0](createPosition(200, 115.86))

		await expect(pending).resolves.toEqual({
			code: 'position-unavailable',
			status: 'error',
		})
	})
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
	timestamp: Date.now(),
	toJSON: () => ({}),
})

import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AsyncStatus } from '../../../../shared/hooks/async-status'
import { useIdentifiedLocation } from '../use-identified-location'

const IDENTIFIED_LOCATION_CACHE_STORAGE_KEY = 'identifiedLocationCache'

const localStorageMock = (() => {
	let store: Record<string, string> = {}
	return {
		clear: () => {
			store = {}
		},
		getItem: (key: string) => store[key] || null,
		removeItem: (key: string) => {
			delete store[key]
		},
		setItem: (key: string, value: string) => {
			store[key] = value
		},
	}
})()

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
})

const fetchMock = vi.fn()
global.fetch = fetchMock

const createReverseGeocodeResponse = (geocoding: Record<string, string>) => ({
	features: [
		{
			properties: {
				geocoding,
			},
		},
	],
})

describe('useIdentifiedLocation', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		localStorageMock.clear()
	})

	it('stays idle without coordinates', () => {
		const { result } = renderHook(() =>
			useIdentifiedLocation({
				lat: '',
				locale: 'en',
				lon: '',
			}),
		)

		expect(result.current).toEqual({
			hasResolved: false,
			label: null,
			status: AsyncStatus.Idle,
		})
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('uses cached labels without fetching again', async () => {
		localStorageMock.setItem(
			IDENTIFIED_LOCATION_CACHE_STORAGE_KEY,
			JSON.stringify({
				'en:40.713:-74.006': {
					label: 'New York, United States',
					storedAt: Date.now(),
				},
			}),
		)

		const { result } = renderHook(() =>
			useIdentifiedLocation({
				lat: '40.71284',
				locale: 'en',
				lon: '-74.00604',
			}),
		)

		expect(result.current).toEqual({
			hasResolved: true,
			label: 'New York, United States',
			status: AsyncStatus.Success,
		})
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('fetches and stores a concise identified location label', async () => {
		fetchMock.mockResolvedValue({
			json: async () =>
				createReverseGeocodeResponse({
					city: 'Perth',
					country: 'Australia',
					state: 'Western Australia',
				}),
			ok: true,
		})

		const { result } = renderHook(() =>
			useIdentifiedLocation({
				lat: '-31.9523',
				locale: 'en',
				lon: '115.8613',
			}),
		)

		expect(result.current.status).toBe(AsyncStatus.Loading)
		expect(result.current.hasResolved).toBe(false)

		await waitFor(() => {
			expect(result.current).toEqual({
				hasResolved: true,
				label: 'Perth, Western Australia',
				status: AsyncStatus.Success,
			})
		})

		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining('format=geocodejson'),
			expect.objectContaining({
				signal: expect.any(AbortSignal),
			}),
		)

		expect(
			JSON.parse(
				localStorageMock.getItem(IDENTIFIED_LOCATION_CACHE_STORAGE_KEY) ?? '{}',
			),
		).toMatchObject({
			'en:-31.952:115.861': {
				label: 'Perth, Western Australia',
			},
		})
	})

	it('sets an error state when reverse geocoding fails', async () => {
		fetchMock.mockResolvedValue({
			ok: false,
		})

		const { result } = renderHook(() =>
			useIdentifiedLocation({
				lat: '51.5074',
				locale: 'en',
				lon: '-0.1278',
			}),
		)

		await waitFor(() => {
			expect(result.current).toEqual({
				hasResolved: true,
				label: null,
				status: AsyncStatus.Error,
			})
		})
	})
})

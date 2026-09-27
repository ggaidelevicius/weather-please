import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AsyncStatus } from '../../../../shared/hooks/async-status'
import { invalidateSharedResource } from '../../../../shared/lib/shared-resource'
import { getCurrentTimestamp } from '../../../../shared/lib/time'
import { useIdentifiedLocation } from '../use-identified-location'

const IDENTIFIED_LOCATION_CACHE_STORAGE_KEY = 'identifiedLocationCache'

const localStorageMock = localStorage

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
		fetchMock.mockReset()
		for (const cacheKey of [
			'en:40.713:-74.006',
			'en:-31.952:115.861',
			'en:51.507:-0.128',
			'fr:-31.952:115.861',
		]) {
			invalidateSharedResource({ key: `location-label:${cacheKey}` })
		}
		localStorageMock.clear()
		vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
	})

	afterEach(() => vi.restoreAllMocks())

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
					storedAt: getCurrentTimestamp(),
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

	it('shares a pending lookup with other consumers of the same coordinates and locale', async () => {
		let finish!: (response: Response) => void
		fetchMock.mockReturnValue(
			new Promise<Response>((resolve) => {
				finish = resolve
			}),
		)
		const first = renderHook(() =>
			useIdentifiedLocation({ lat: '-31.9523', locale: 'en', lon: '115.8613' }),
		)
		const second = renderHook(() =>
			useIdentifiedLocation({ lat: '-31.9523', locale: 'en', lon: '115.8613' }),
		)
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

		await act(async () =>
			finish(
				new Response(
					JSON.stringify(createReverseGeocodeResponse({ city: 'Perth' })),
					{ status: 200 },
				),
			),
		)
		await waitFor(() => {
			expect(first.result.current.label).toBe('Perth')
			expect(second.result.current.label).toBe('Perth')
		})
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	it('keeps labels in different languages separate', async () => {
		fetchMock.mockImplementation(
			async (url: string) =>
				new Response(
					JSON.stringify(
						createReverseGeocodeResponse({
							city:
								new URL(url).searchParams.get('accept-language') === 'fr'
									? 'Perth français'
									: 'Perth English',
						}),
					),
					{ status: 200 },
				),
		)
		const first = renderHook(() =>
			useIdentifiedLocation({ lat: '-31.9523', locale: 'en', lon: '115.8613' }),
		)
		const second = renderHook(() =>
			useIdentifiedLocation({ lat: '-31.9523', locale: 'fr', lon: '115.8613' }),
		)

		await waitFor(() => {
			expect(first.result.current.label).toBe('Perth English')
			expect(second.result.current.label).toBe('Perth français')
		})
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})

	it('waits until visible before requesting an uncached label', async () => {
		const visibility = vi
			.spyOn(document, 'visibilityState', 'get')
			.mockReturnValue('hidden')
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify(createReverseGeocodeResponse({ city: 'Perth' })),
				{ status: 200 },
			),
		)
		const { result } = renderHook(() =>
			useIdentifiedLocation({ lat: '-31.9523', locale: 'en', lon: '115.8613' }),
		)
		expect(fetchMock).not.toHaveBeenCalled()

		act(() => {
			visibility.mockReturnValue('visible')
			document.dispatchEvent(new Event('visibilitychange'))
		})
		await waitFor(() => expect(result.current.label).toBe('Perth'))
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	it('still resolves a label when browser storage is unavailable', async () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('Storage blocked')
		})
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('Storage blocked')
		})
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify(createReverseGeocodeResponse({ city: 'Perth' })),
				{ status: 200 },
			),
		)
		const { result } = renderHook(() =>
			useIdentifiedLocation({ lat: '-31.9523', locale: 'en', lon: '115.8613' }),
		)

		await waitFor(() => expect(result.current.label).toBe('Perth'))
	})
})

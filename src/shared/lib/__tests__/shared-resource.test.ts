import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import {
	invalidateSharedResource,
	readSharedResource,
	requestSharedResource,
	subscribeSharedResource,
} from '../shared-resource'
import { getCurrentTimestamp } from '../time'

const schema = z.object({ value: z.string() })
const maxAgeMs = 60_000
const storagePrefix = 'weather-please:shared-resource:v1:'
let sequence = 0
let key: string

const deferred = <T>() => {
	let resolve!: (value: T) => void
	let reject!: (reason: unknown) => void
	const promise = new Promise<T>((complete, fail) => {
		resolve = complete
		reject = fail
	})
	return { promise, reject, resolve }
}

const createLocks = () => {
	const queues = new Map<string, Promise<void>>()
	return {
		request: vi.fn(
			(
				name: string,
				options: { signal: AbortSignal },
				work: () => Promise<unknown>,
			) => {
				const previous = queues.get(name) ?? Promise.resolve()
				const result = previous.then(() => {
					options.signal.throwIfAborted()
					return work()
				})
				queues.set(
					name,
					result.then(
						() => {},
						() => {},
					),
				)
				return result
			},
		),
	}
}

const stubChannel = () => {
	const messages = new EventTarget()
	vi.stubGlobal(
		'BroadcastChannel',
		vi.fn(function () {
			return {
				addEventListener: messages.addEventListener.bind(messages),
				close: vi.fn(),
				postMessage: vi.fn(),
			}
		}),
	)
	return (data: unknown) =>
		messages.dispatchEvent(new MessageEvent('message', { data }))
}

const getStoredRecord = () =>
	z
		.record(z.string(), z.unknown())
		.parse(JSON.parse(localStorage.getItem(storagePrefix + key) ?? '{}'))

beforeEach(() => {
	key = `shared-test-${++sequence}`
	localStorage.clear()
	vi.stubGlobal('navigator', { locks: createLocks() })
	vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
})

afterEach(() => {
	window.dispatchEvent(new Event('pagehide'))
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
	vi.useRealTimers()
})

describe('shared resource ownership', () => {
	it('rechecks shared cache after waiting so concurrent requests fetch once', async () => {
		const response = deferred<{ value: string }>()
		const fetcher = vi.fn(() => response.promise)
		const first = requestSharedResource({ fetcher, key, maxAgeMs, schema })
		const second = requestSharedResource({ fetcher, key, maxAgeMs, schema })
		await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
		response.resolve({ value: 'shared' })
		expect(await Promise.all([first, second])).toEqual([
			{ value: 'shared' },
			{ value: 'shared' },
		])
		expect(fetcher).toHaveBeenCalledOnce()
	})

	it('coalesces concurrent manual refreshes and allows a subsequent manual refresh', async () => {
		await requestSharedResource({
			fetcher: async () => ({ value: 'cached' }),
			key,
			maxAgeMs,
			schema,
		})
		const response = deferred<{ value: string }>()
		const fetcher = vi.fn(() => response.promise)
		const first = requestSharedResource({
			fetcher,
			force: true,
			key,
			maxAgeMs,
			schema,
		})
		const second = requestSharedResource({
			fetcher,
			force: true,
			key,
			maxAgeMs,
			schema,
		})
		await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
		response.resolve({ value: 'renewed' })
		await Promise.all([first, second])
		expect(fetcher).toHaveBeenCalledOnce()
		await requestSharedResource({ fetcher, force: true, key, maxAgeMs, schema })
		expect(fetcher).toHaveBeenCalledTimes(2)
	})

	it('releases an aborted owner even when its fetch ignores cancellation', async () => {
		const obsolete = deferred<{ value: string }>()
		const controller = new AbortController()
		const ownerFetcher = vi.fn(() => obsolete.promise)
		const owner = requestSharedResource({
			fetcher: ownerFetcher,
			key,
			maxAgeMs,
			schema,
			signal: controller.signal,
		})
		const ownerError = expect(owner).rejects.toMatchObject({
			name: 'AbortError',
		})
		const followerFetcher = vi.fn(async () => ({ value: 'takeover' }))
		const follower = requestSharedResource({
			fetcher: followerFetcher,
			key,
			maxAgeMs,
			schema,
		})
		await vi.waitFor(() => expect(ownerFetcher).toHaveBeenCalledOnce())
		controller.abort()
		await ownerError
		expect(await follower).toEqual({ value: 'takeover' })
		obsolete.resolve({ value: 'obsolete' })
		await obsolete.promise
		expect(readSharedResource({ key, schema })?.value).toEqual({
			value: 'takeover',
		})
	})

	it('releases timed-out work so a waiting request can take over', async () => {
		vi.useFakeTimers()
		const fetcher = vi.fn(() => new Promise<{ value: string }>(() => {}))
		const owner = requestSharedResource({
			fetcher,
			key,
			maxAgeMs,
			schema,
			timeoutMs: 100,
		})
		const ownerError = expect(owner).rejects.toMatchObject({
			name: 'TimeoutError',
		})
		const follower = requestSharedResource({
			fetcher: async () => ({ value: 'recovered' }),
			key,
			maxAgeMs,
			schema,
		})
		await vi.advanceTimersByTimeAsync(101)
		await ownerError
		expect(await follower).toEqual({ value: 'recovered' })
	})

	it.each(['pagehide', 'freeze'])(
		'cancels owned work on %s and permits a later owner',
		async (eventName) => {
			const fetcher = vi.fn(() => new Promise<{ value: string }>(() => {}))
			const owner = requestSharedResource({ fetcher, key, maxAgeMs, schema })
			const ownerError = expect(owner).rejects.toMatchObject({
				name: 'AbortError',
			})
			await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
			;(eventName === 'freeze' ? document : window).dispatchEvent(
				new Event(eventName),
			)
			await ownerError
			expect(
				await requestSharedResource({
					fetcher: async () => ({ value: 'new-owner' }),
					key,
					maxAgeMs,
					schema,
				}),
			).toEqual({ value: 'new-owner' })
		},
	)

	it('waits for visibility before starting network work', async () => {
		const visibility = vi
			.spyOn(document, 'visibilityState', 'get')
			.mockReturnValue('hidden')
		const fetcher = vi.fn(async () => ({ value: 'visible' }))
		const request = requestSharedResource({ fetcher, key, maxAgeMs, schema })
		await Promise.resolve()
		expect(fetcher).not.toHaveBeenCalled()
		visibility.mockReturnValue('visible')
		document.dispatchEvent(new Event('visibilitychange'))
		expect(await request).toEqual({ value: 'visible' })
	})

	it('cancels work on hiding and rejects late responses', async () => {
		const visibility = vi
			.spyOn(document, 'visibilityState', 'get')
			.mockReturnValue('visible')
		const response = deferred<{ value: string }>()
		const fetcher = vi.fn(() => response.promise)
		const request = requestSharedResource({ fetcher, key, maxAgeMs, schema })
		const error = expect(request).rejects.toMatchObject({ name: 'AbortError' })
		await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
		visibility.mockReturnValue('hidden')
		document.dispatchEvent(new Event('visibilitychange'))
		await error
		response.resolve({ value: 'late' })
		await response.promise
		expect(readSharedResource({ key, schema })).toBeNull()
	})

	it('invalidates pending responses and lets a new request use the new generation', async () => {
		const response = deferred<{ value: string }>()
		const fetcher = vi.fn(() => response.promise)
		const request = requestSharedResource({ fetcher, key, maxAgeMs, schema })
		const error = expect(request).rejects.toMatchObject({ name: 'AbortError' })
		await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
		invalidateSharedResource({ key })
		await error
		await requestSharedResource({
			fetcher: async () => ({ value: 'current' }),
			key,
			maxAgeMs,
			schema,
		})
		response.resolve({ value: 'obsolete' })
		await response.promise
		expect(readSharedResource({ key, schema })?.value).toEqual({
			value: 'current',
		})
	})

	it('shares a failure with waiting consumers and allows an explicit retry', async () => {
		const response = deferred<{ value: string }>()
		const fetcher = vi.fn(() => response.promise)
		const first = requestSharedResource({ fetcher, key, maxAgeMs, schema })
		const second = requestSharedResource({ fetcher, key, maxAgeMs, schema })
		const errors = Promise.allSettled([first, second])
		await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
		response.reject(new Error('Provider unavailable'))
		expect((await errors).map((result) => result.status)).toEqual([
			'rejected',
			'rejected',
		])
		expect(fetcher).toHaveBeenCalledOnce()
		expect(
			await requestSharedResource({
				fetcher: async () => ({ value: 'retried' }),
				force: true,
				key,
				maxAgeMs,
				schema,
			}),
		).toEqual({ value: 'retried' })
	})

	it('keeps a live cache when browser storage cannot be written', async () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Full', 'QuotaExceededError')
		})
		const fetcher = vi.fn(async () => ({ value: 'memory' }))
		await requestSharedResource({ fetcher, key, maxAgeMs, schema })
		await requestSharedResource({ fetcher, key, maxAgeMs, schema })
		expect(fetcher).toHaveBeenCalledOnce()
		expect(readSharedResource({ key, schema })?.value).toEqual({
			value: 'memory',
		})
	})

	it('deduplicates within a tab when Web Locks are unavailable', async () => {
		vi.stubGlobal('navigator', {})
		const fetcher = vi.fn(async () => ({ value: 'fallback' }))
		await Promise.all([
			requestSharedResource({ fetcher, key, maxAgeMs, schema }),
			requestSharedResource({ fetcher, key, maxAgeMs, schema }),
		])
		expect(fetcher).toHaveBeenCalledOnce()
	})

	it('notifies subscribers after publishing a validated result', async () => {
		const received: string[] = []
		const unsubscribe = subscribeSharedResource({
			key,
			onChange: () => {
				const snapshot = readSharedResource({ key, schema })
				if (snapshot) received.push(snapshot.value.value)
			},
		})
		await requestSharedResource({
			fetcher: async () => ({ value: 'published' }),
			key,
			maxAgeMs,
			schema,
		})
		unsubscribe()
		expect(received).toEqual(['published'])
	})

	it('rejects a late broadcast from a revision invalidated by disconnect', async () => {
		const broadcast = stubChannel()
		await requestSharedResource({
			fetcher: async () => ({ value: 'old' }),
			key,
			maxAgeMs,
			schema,
		})
		const oldRecord = getStoredRecord()
		invalidateSharedResource({ key })
		await requestSharedResource({
			fetcher: async () => ({ value: 'current' }),
			key,
			maxAgeMs,
			schema,
		})
		broadcast({
			key,
			record: { ...oldRecord, updatedAt: getCurrentTimestamp() + 1 },
		})
		expect(readSharedResource({ key, schema })?.value).toEqual({
			value: 'current',
		})
	})

	it('ignores duplicate invalidation notices for requests in the new revision', async () => {
		const broadcast = stubChannel()
		invalidateSharedResource({ key })
		const tombstone = getStoredRecord()
		const response = deferred<{ value: string }>()
		const fetcher = vi.fn(() => response.promise)
		const request = requestSharedResource({ fetcher, key, maxAgeMs, schema })
		await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
		broadcast({ key, record: tombstone })
		response.resolve({ value: 'new revision' })
		expect(await request).toEqual({ value: 'new revision' })
	})

	it('does not cancel a first fetch when a delayed empty-cache notification arrives', async () => {
		const broadcast = stubChannel()
		const response = deferred<{ value: string }>()
		const fetcher = vi.fn(() => response.promise)
		const request = requestSharedResource({ fetcher, key, maxAgeMs, schema })
		await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
		broadcast({ key })
		window.dispatchEvent(
			new StorageEvent('storage', {
				key: storagePrefix + key,
				storageArea: localStorage,
			}),
		)
		response.resolve({ value: 'completed' })
		expect(await request).toEqual({ value: 'completed' })
	})

	it('allows a subscriber to start replacement work immediately after invalidation', async () => {
		await requestSharedResource({
			fetcher: async () => ({ value: 'old' }),
			key,
			maxAgeMs,
			schema,
		})
		let replacement: Promise<{ value: string }> | undefined
		const unsubscribe = subscribeSharedResource({
			key,
			onChange: () => {
				if (readSharedResource({ key, schema })) return
				replacement = requestSharedResource({
					fetcher: async () => ({ value: 'replacement' }),
					key,
					maxAgeMs,
					schema,
				})
			},
		})
		invalidateSharedResource({ key })
		expect(await replacement).toEqual({ value: 'replacement' })
		unsubscribe()
	})

	it('validates data received through shared storage before returning it', async () => {
		await requestSharedResource({
			fetcher: async () => ({ value: 'valid' }),
			key,
			maxAgeMs,
			schema,
		})
		localStorage.setItem(
			storagePrefix + key,
			JSON.stringify({ ...getStoredRecord(), data: { value: 42 } }),
		)
		expect(readSharedResource({ key, schema })).toBeNull()
	})

	it('does not resurrect an in-memory record after its stored copy is removed', async () => {
		await requestSharedResource({
			fetcher: async () => ({ value: 'removed' }),
			key,
			maxAgeMs,
			schema,
		})
		localStorage.removeItem(storagePrefix + key)
		expect(readSharedResource({ key, schema })).toBeNull()
	})

	it('recovers persisted writes when another shared cache entry is malformed', async () => {
		localStorage.setItem(storagePrefix + 'malformed-json', '{')
		localStorage.setItem(storagePrefix + 'malformed-record', '{}')
		await requestSharedResource({
			fetcher: async () => ({ value: 'persisted' }),
			key,
			maxAgeMs,
			schema,
		})
		expect(getStoredRecord()).toMatchObject({ data: { value: 'persisted' } })
		expect(localStorage.getItem(storagePrefix + 'malformed-json')).toBeNull()
		expect(localStorage.getItem(storagePrefix + 'malformed-record')).toBeNull()
	})

	it('bounds stored entries by evicting older shared data and retaining user settings', async () => {
		localStorage.setItem('user-settings', 'retained')
		for (let index = 0; index < 64; index += 1) {
			localStorage.setItem(
				storagePrefix + `older-${index}`,
				JSON.stringify({
					data: { value: 'old' },
					hasValue: true,
					id: `older-${index}`,
					revision: '',
					updatedAt: getCurrentTimestamp() - 1000 + index,
					version: 1,
				}),
			)
		}
		await requestSharedResource({
			fetcher: async () => ({ value: 'newest' }),
			key,
			maxAgeMs,
			schema,
		})
		expect(localStorage.length).toBe(65)
		expect(localStorage.getItem(storagePrefix + 'older-0')).toBeNull()
		expect(getStoredRecord()).toMatchObject({ data: { value: 'newest' } })
		expect(localStorage.getItem('user-settings')).toBe('retained')
	})

	it('bounds stored bytes while preserving recent invalidation fences', async () => {
		const invalidatedKey = key + ':invalidated'
		invalidateSharedResource({ key: invalidatedKey })
		const value = 'x'.repeat(350_000)
		for (let index = 0; index < 2; index += 1) {
			localStorage.setItem(
				storagePrefix + `large-${index}`,
				JSON.stringify({
					data: { value },
					hasValue: true,
					id: `large-${index}`,
					revision: '',
					updatedAt: getCurrentTimestamp() - 1000 + index,
					version: 1,
				}),
			)
		}
		await requestSharedResource({
			fetcher: async () => ({ value }),
			key,
			maxAgeMs,
			schema,
		})
		expect(localStorage.getItem(storagePrefix + 'large-0')).toBeNull()
		expect(localStorage.getItem(storagePrefix + 'large-1')).not.toBeNull()
		expect(localStorage.getItem(storagePrefix + invalidatedKey)).not.toBeNull()
		expect(getStoredRecord()).toMatchObject({ data: { value } })
	})
})

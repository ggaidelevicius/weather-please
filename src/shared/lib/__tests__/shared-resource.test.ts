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
	it('keeps validated snapshots stable until the record or schema changes', async () => {
		await requestSharedResource({
			fetcher: async () => ({ value: 'first' }),
			key,
			maxAgeMs,
			schema,
		})
		const validate = vi.spyOn(schema, 'safeParse')
		const first = readSharedResource({ key, schema })
		expect(readSharedResource({ key, schema })).toBe(first)
		expect(validate).toHaveBeenCalledOnce()

		const transformedSchema = schema.transform(({ value }) => value.length)
		expect(readSharedResource({ key, schema: transformedSchema })?.value).toBe(
			5,
		)
		expect(readSharedResource({ key, schema })).toBe(first)

		localStorage.setItem(
			storagePrefix + key,
			JSON.stringify({ ...getStoredRecord(), data: { value: 'updated' } }),
		)
		const updated = readSharedResource({ key, schema })
		expect(updated).not.toBe(first)
		expect(updated?.value.value).toBe('updated')
		expect(readSharedResource({ key, schema })).toBe(updated)
	})

	it('reuses validation failures and rechecks freshness independently of snapshot identity', async () => {
		vi.useFakeTimers()
		await requestSharedResource({
			fetcher: async () => ({ value: 'first' }),
			key,
			maxAgeMs,
			schema,
		})
		const first = readSharedResource({ key, schema })
		await vi.advanceTimersByTimeAsync(maxAgeMs + 1)
		expect(readSharedResource({ key, maxAgeMs, schema })).toBeNull()
		expect(readSharedResource({ key, schema })).toBe(first)
		const invalidSchema = z.object({ value: z.number() })
		const validate = vi.spyOn(invalidSchema, 'safeParse')
		expect(readSharedResource({ key, schema: invalidSchema })).toBeNull()
		expect(readSharedResource({ key, schema: invalidSchema })).toBeNull()
		expect(validate).toHaveBeenCalledOnce()
	})

	it('does not open transport or install listeners while reading snapshots', () => {
		const channel = vi.fn()
		vi.stubGlobal('BroadcastChannel', channel)
		const documentListener = vi.spyOn(document, 'addEventListener')
		const windowListener = vi.spyOn(window, 'addEventListener')
		expect(readSharedResource({ key, schema })).toBeNull()
		expect(channel).not.toHaveBeenCalled()
		expect(documentListener).not.toHaveBeenCalled()
		expect(windowListener).not.toHaveBeenCalled()
	})

	it.each(['pageshow', 'resume', 'visibilitychange'])(
		'reads missed persisted changes on %s and stops notifying after unsubscribe',
		async (eventName) => {
			await requestSharedResource({
				fetcher: async () => ({ value: 'before sleep' }),
				key,
				maxAgeMs,
				schema,
			})
			const snapshots: unknown[] = []
			const unsubscribe = subscribeSharedResource({
				key,
				onChange: () => snapshots.push(readSharedResource({ key, schema })),
			})
			window.dispatchEvent(new Event('pagehide'))
			localStorage.setItem(
				storagePrefix + key,
				JSON.stringify({
					...getStoredRecord(),
					data: { value: 'while asleep' },
				}),
			)
			const target = eventName === 'pageshow' ? window : document
			target.dispatchEvent(new Event(eventName))
			expect(snapshots).toEqual([
				expect.objectContaining({ value: { value: 'while asleep' } }),
			])
			unsubscribe()
			target.dispatchEvent(new Event(eventName))
			expect(snapshots).toHaveLength(1)
		},
	)

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

	it.each([false, true])(
		'rechecks contextual freshness after a lock wait (force: %s)',
		async (force) => {
			const response = deferred<{ value: string }>()
			const ownerFetcher = vi.fn(() => response.promise)
			const owner = requestSharedResource({
				fetcher: ownerFetcher,
				force,
				key,
				maxAgeMs,
				schema,
			})
			let currentSession = 'original session'
			const followerFetcher = vi.fn(async () => ({ value: currentSession }))
			const follower = requestSharedResource({
				fetcher: followerFetcher,
				force,
				isFresh: ({ value }) => value === currentSession,
				key,
				maxAgeMs,
				schema,
			})
			await vi.waitFor(() => expect(ownerFetcher).toHaveBeenCalledOnce())
			currentSession = 'replacement session'
			response.resolve({ value: 'original session' })
			await owner
			expect(await follower).toEqual({ value: 'replacement session' })
			expect(followerFetcher).toHaveBeenCalledOnce()
		},
	)

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

	it('finishes owned work when hidden and shares it without another fetch', async () => {
		const visibility = vi
			.spyOn(document, 'visibilityState', 'get')
			.mockReturnValue('visible')
		const response = deferred<{ value: string }>()
		const fetcher = vi.fn(() => response.promise)
		const request = requestSharedResource({ fetcher, key, maxAgeMs, schema })
		const followerFetcher = vi.fn(async () => ({ value: 'duplicate' }))
		const follower = requestSharedResource({
			fetcher: followerFetcher,
			key,
			maxAgeMs,
			schema,
		})
		const results = Promise.all([request, follower])
		await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
		visibility.mockReturnValue('hidden')
		document.dispatchEvent(new Event('visibilitychange'))
		response.resolve({ value: 'completed' })
		expect(await results).toEqual([
			{ value: 'completed' },
			{ value: 'completed' },
		])
		expect(followerFetcher).not.toHaveBeenCalled()
		expect(readSharedResource({ key, schema })?.value).toEqual({
			value: 'completed',
		})
	})

	it('releases a queued lock without fetching if the waiting tab became hidden', async () => {
		const locks = createLocks()
		vi.stubGlobal('navigator', { locks })
		const visibility = vi
			.spyOn(document, 'visibilityState', 'get')
			.mockReturnValue('visible')
		const blocker = deferred<void>()
		const blocking = locks.request(
			storagePrefix + key,
			{ signal: new AbortController().signal },
			() => blocker.promise,
		)
		const fetcher = vi.fn(async () => ({ value: 'visible owner' }))
		const request = requestSharedResource({ fetcher, key, maxAgeMs, schema })
		await vi.waitFor(() => expect(locks.request).toHaveBeenCalledTimes(2))
		visibility.mockReturnValue('hidden')
		document.dispatchEvent(new Event('visibilitychange'))
		blocker.resolve(undefined)
		await blocking
		await locks.request.mock.results[1].value
		expect(fetcher).not.toHaveBeenCalled()
		await expect(
			locks.request(
				storagePrefix + key,
				{ signal: new AbortController().signal },
				async () => 'lock is available',
			),
		).resolves.toBe('lock is available')
		visibility.mockReturnValue('visible')
		document.dispatchEvent(new Event('visibilitychange'))
		expect(await request).toEqual({ value: 'visible owner' })
		expect(fetcher).toHaveBeenCalledOnce()
	})

	it('keeps the hidden owner’s broadcast channel available when storage writes fail', async () => {
		const close = vi.fn()
		const postMessage = vi.fn()
		vi.stubGlobal(
			'BroadcastChannel',
			vi.fn(function () {
				return { addEventListener: vi.fn(), close, postMessage }
			}),
		)
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Full', 'QuotaExceededError')
		})
		const visibility = vi
			.spyOn(document, 'visibilityState', 'get')
			.mockReturnValue('visible')
		const response = deferred<{ value: string }>()
		const fetcher = vi.fn(() => response.promise)
		const request = requestSharedResource({ fetcher, key, maxAgeMs, schema })
		await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
		visibility.mockReturnValue('hidden')
		document.dispatchEvent(new Event('visibilitychange'))
		response.resolve({ value: 'broadcast while hidden' })
		await request
		expect(close).not.toHaveBeenCalled()
		expect(postMessage).toHaveBeenCalledWith({
			key,
			record: expect.objectContaining({
				data: { value: 'broadcast while hidden' },
			}),
		})
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

	it('keeps the same snapshot through failed refreshes and duplicate fallback broadcasts', async () => {
		const broadcast = stubChannel()
		await requestSharedResource({
			fetcher: async () => ({ value: 'retained' }),
			key,
			maxAgeMs,
			schema,
		})
		const original = readSharedResource({ key, schema })
		await expect(
			requestSharedResource({
				fetcher: async () => {
					throw new Error('Temporary failure')
				},
				force: true,
				key,
				maxAgeMs,
				schema,
			}),
		).rejects.toThrow('Temporary failure')
		expect(readSharedResource({ key, schema })).toBe(original)
		broadcast({ key, record: getStoredRecord() })
		expect(readSharedResource({ key, schema })).toBe(original)
		localStorage.setItem(
			storagePrefix + key,
			JSON.stringify({ ...getStoredRecord(), failureId: 'other-tab-failure' }),
		)
		expect(readSharedResource({ key, schema })).toBe(original)
		invalidateSharedResource({ key })
		expect(readSharedResource({ key, schema })).toBeNull()
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

	it('checks publication context after parsing and never publishes a superseded result', async () => {
		let isCurrentSession = true
		const requestSchema = schema.transform((value) => {
			isCurrentSession = false
			return value
		})
		const validate = vi.fn(() => {
			if (!isCurrentSession)
				throw new DOMException('Session changed', 'AbortError')
		})
		const onChange = vi.fn()
		const unsubscribe = subscribeSharedResource({ key, onChange })
		await expect(
			requestSharedResource({
				fetcher: async () => ({ value: 'superseded' }),
				key,
				maxAgeMs,
				schema: requestSchema,
				validate,
			}),
		).rejects.toMatchObject({ name: 'AbortError' })
		expect(validate).toHaveBeenCalledOnce()
		expect(readSharedResource({ key, schema })).toBeNull()
		expect(onChange).not.toHaveBeenCalled()
		unsubscribe()
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

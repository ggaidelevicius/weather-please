import { z } from 'zod'

import { getCurrentTimestamp } from './time'

export type SharedResourceSnapshot<T> = {
	updatedAt: number
	value: T
}

// Keep work synchronous: this lock protects a short read/merge/write operation.
export const runWithSharedLock = <T>({
	key,
	signal,
	work,
}: Readonly<{
	key: string
	signal?: AbortSignal
	work: () => T
}>): Promise<T> =>
	withResourceLock({
		key,
		signal: signal ?? new AbortController().signal,
		work: async () => work(),
	})

export const requestSharedResource = async <T>({
	fetcher,
	force = false,
	isFresh,
	key,
	lockKey = key,
	maxAgeMs,
	schema,
	signal,
	timeoutMs = 30_000,
}: Readonly<{
	fetcher: (options: { signal: AbortSignal }) => Promise<T>
	force?: boolean
	isFresh?: (value: T, updatedAt: number) => boolean
	key: string
	lockKey?: string
	maxAgeMs: number
	schema: z.ZodType<T>
	signal?: AbortSignal
	timeoutMs?: number
}>): Promise<T> => {
	ensureTransport()
	signal?.throwIfAborted()
	const initialRecord = readRecord(key)
	const initialRevision = initialRecord?.revision ?? ''
	const requestedAt = getCurrentTimestamp()
	const readMatchingCache = () => {
		const record = readRecord(key)
		if ((record?.revision ?? '') !== initialRevision) {
			throw createAbortError()
		}
		const cached = readSharedResource({ key, maxAgeMs: Infinity, schema })
		if (!record) return null
		const isCacheFresh =
			cached &&
			(force
				? record.id !== initialRecord?.id && record.updatedAt >= requestedAt
				: isRecent(record.updatedAt, maxAgeMs) &&
					(isFresh?.(cached.value, cached.updatedAt) ?? true))
		if (isCacheFresh) return cached
		if (
			record.failureAt !== undefined &&
			(force
				? record.failureId !== initialRecord?.failureId &&
					record.failureAt >= requestedAt
				: isRecent(record.failureAt, 5_000))
		) {
			throw new Error('Data could not be refreshed. Please try again shortly.')
		}
		return null
	}
	const cached = readMatchingCache()
	if (cached) return cached.value

	const controller = new AbortController()
	const handleAbort = () => controller.abort(signal?.reason)
	signal?.addEventListener('abort', handleAbort, { once: true })
	const request = { controller, key, revision: initialRevision }
	activeRequests.add(request)
	try {
		await waitUntilVisible(controller.signal)
		return await withResourceLock({
			key: lockKey,
			signal: controller.signal,
			work: async () => {
				controller.signal.throwIfAborted()
				const latest = readMatchingCache()
				if (latest) return latest.value
				const timeout = setTimeout(
					() =>
						controller.abort(
							new DOMException('Data refresh timed out', 'TimeoutError'),
						),
					Math.min(Math.max(timeoutMs, 1), 120_000),
				)
				try {
					// Racing cancellation releases ownership even if a provider ignores
					// AbortSignal (geolocation, for example). Its late result is discarded.
					const value = await raceWithSignal(
						Promise.resolve().then(() => {
							controller.signal.throwIfAborted()
							return fetcher({ signal: controller.signal })
						}),
						controller.signal,
					)
					controller.signal.throwIfAborted()
					if ((readRecord(key)?.revision ?? '') !== initialRevision) {
						throw createAbortError()
					}
					const validated = schema.parse(value)
					writeRecord(key, {
						data: validated,
						hasValue: true,
						id: crypto.randomUUID(),
						revision: initialRevision,
						updatedAt: getCurrentTimestamp(),
						version: 1,
					})
					return validated
				} catch (error) {
					if (
						!controller.signal.aborted &&
						!(error instanceof Error && error.name === 'AbortError') &&
						(readRecord(key)?.revision ?? '') === initialRevision
					) {
						const previous = readRecord(key)
						writeRecord(key, {
							data: previous?.data,
							failureAt: getCurrentTimestamp(),
							failureId: crypto.randomUUID(),
							hasValue: previous?.hasValue ?? false,
							id: previous?.id ?? crypto.randomUUID(),
							revision: initialRevision,
							updatedAt: previous?.updatedAt ?? getCurrentTimestamp(),
							version: 1,
						})
					}
					throw error
				} finally {
					clearTimeout(timeout)
				}
			},
		})
	} finally {
		signal?.removeEventListener('abort', handleAbort)
		activeRequests.delete(request)
	}
}

export const readSharedResource = <T>({
	key,
	maxAgeMs = Infinity,
	schema,
}: Readonly<{
	key: string
	maxAgeMs?: number
	schema: z.ZodType<T>
}>): null | SharedResourceSnapshot<T> => {
	if (typeof window === 'undefined') return null
	ensureTransport()
	const record = readRecord(key)
	if (!record?.hasValue || !isRecent(record.updatedAt, maxAgeMs)) return null
	const parsed = schema.safeParse(record.data)
	return parsed.success
		? { updatedAt: record.updatedAt, value: parsed.data }
		: null
}

export const subscribeSharedResource = ({
	key,
	onChange,
}: Readonly<{ key: string; onChange: () => void }>): (() => void) => {
	ensureTransport()
	const listeners = subscriptions.get(key) ?? new Set<() => void>()
	listeners.add(onChange)
	subscriptions.set(key, listeners)
	return () => {
		listeners.delete(onChange)
		if (listeners.size === 0) subscriptions.delete(key)
	}
}

export const invalidateSharedResource = ({
	key,
}: Readonly<{ key: string }>): void => {
	ensureTransport()
	abortRequests(key)
	writeRecord(key, {
		hasValue: false,
		id: crypto.randomUUID(),
		revision: crypto.randomUUID(),
		updatedAt: getCurrentTimestamp(),
		version: 1,
	})
}

const STORAGE_PREFIX = 'weather-please:shared-resource:v1:'
const CHANNEL_NAME = 'weather-please:shared-resources:v1'
const MAX_RECORDS = 64
const MAX_STORED_BYTES = 2_000_000
const recordSchema = z.object({
	data: z.unknown().optional(),
	failureAt: z.number().optional(),
	failureId: z.string().optional(),
	hasValue: z.boolean(),
	id: z.string(),
	revision: z.string(),
	updatedAt: z.number(),
	version: z.literal(1),
})
const messageSchema = z.object({
	key: z.string(),
	record: recordSchema.optional(),
})
type ResourceRecord = z.infer<typeof recordSchema>
const records = new Map<string, ResourceRecord>()
const observedStorage = new Map<string, null | string>()
const subscriptions = new Map<string, Set<() => void>>()
const activeRequests = new Set<{
	controller: AbortController
	key: string
	revision: string
}>()
const localLocks = new Map<string, Promise<void>>()
let channel: BroadcastChannel | null = null
let hasListeners = false

const isRecent = (updatedAt: number, maxAgeMs: number) => {
	const age = getCurrentTimestamp() - updatedAt
	return age >= 0 && age <= maxAgeMs
}

const readRecord = (key: string): ResourceRecord | undefined => {
	try {
		const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
		if (
			raw !== observedStorage.get(key) ||
			(raw !== null && !records.has(key))
		) {
			observedStorage.set(key, raw)
			records.delete(key)
			if (raw === null) {
				return undefined
			} else {
				const parsed = recordSchema.safeParse(JSON.parse(raw))
				if (parsed.success) records.set(key, parsed.data)
				else records.delete(key)
			}
		}
	} catch {
		// Cached data remains usable when browser storage is unavailable.
	}
	return records.get(key)
}

const writeRecord = (key: string, record: ResourceRecord) => {
	readRecord(key)
	records.set(key, record)
	let hasPersisted = false
	try {
		const raw = JSON.stringify(record)
		if (raw.length * 2 > MAX_STORED_BYTES)
			throw new Error('Shared result exceeds cache capacity')
		pruneRecords({
			incomingBytes: raw.length * 2,
			incomingKey: STORAGE_PREFIX + key,
		})
		window.localStorage.setItem(STORAGE_PREFIX + key, raw)
		observedStorage.set(key, raw)
		hasPersisted = true
	} catch {
		// Other tabs can still receive the value through the channel.
	}
	pruneMemory()
	try {
		channel?.postMessage(hasPersisted ? { key } : { key, record })
	} catch {
		// Storage events and reads on resume provide another synchronization path.
	}
	notifySubscribers(key)
	return record
}

const pruneRecords = ({
	incomingBytes,
	incomingKey,
}: {
	incomingBytes: number
	incomingKey: string
}) => {
	const candidates: {
		bytes: number
		isProtected: boolean
		key: string
		updatedAt: number
	}[] = []
	for (let index = 0; index < localStorage.length; index += 1) {
		const key = localStorage.key(index)
		if (!key?.startsWith(STORAGE_PREFIX) || key === incomingKey) continue
		const raw = localStorage.getItem(key) ?? 'null'
		let record: ResourceRecord
		try {
			const parsed = recordSchema.safeParse(JSON.parse(raw))
			if (!parsed.success) throw new Error('Invalid shared cache entry')
			record = parsed.data
		} catch {
			localStorage.removeItem(key)
			records.delete(key.slice(STORAGE_PREFIX.length))
			observedStorage.delete(key.slice(STORAGE_PREFIX.length))
			index -= 1
			continue
		}
		candidates.push({
			bytes: raw.length * 2,
			isProtected:
				!record.hasValue && getCurrentTimestamp() - record.updatedAt < 120_000,
			key,
			updatedAt: record.updatedAt,
		})
	}
	candidates.sort((left, right) => right.updatedAt - left.updatedAt)
	let bytes = incomingBytes
	let count = 1
	for (const entry of candidates) {
		if (
			entry.isProtected ||
			(count < MAX_RECORDS && bytes + entry.bytes <= MAX_STORED_BYTES)
		) {
			bytes += entry.bytes
			count += 1
			continue
		}
		localStorage.removeItem(entry.key)
		records.delete(entry.key.slice(STORAGE_PREFIX.length))
		observedStorage.delete(entry.key.slice(STORAGE_PREFIX.length))
	}
}

const notifySubscribers = (key: string) => {
	for (const listener of subscriptions.get(key) ?? []) {
		try {
			listener()
		} catch (error) {
			console.error('Shared data update failed:', error)
		}
	}
}

const pruneMemory = () => {
	const candidates = [...records.entries()]
		.filter(
			([key, record]) =>
				!subscriptions.has(key) &&
				![...activeRequests].some((request) => request.key === key) &&
				(record.hasValue || getCurrentTimestamp() - record.updatedAt > 120_000),
		)
		.sort((left, right) => left[1].updatedAt - right[1].updatedAt)
	for (const [key] of candidates.slice(
		0,
		Math.max(0, records.size - MAX_RECORDS),
	)) {
		records.delete(key)
		observedStorage.delete(key)
	}
}

const abortRequests = (key?: string, currentRevision?: string) => {
	for (const request of activeRequests) {
		if (
			(key === undefined || request.key === key) &&
			(currentRevision === undefined || request.revision !== currentRevision)
		) {
			request.controller.abort(createAbortError())
		}
	}
}

const ensureTransport = () => {
	if (typeof window === 'undefined') return
	if (!hasListeners) {
		hasListeners = true
		window.addEventListener('storage', (event) => {
			try {
				if (event.storageArea && event.storageArea !== window.localStorage)
					return
			} catch {
				return
			}
			if (event.key === null) {
				records.clear()
				observedStorage.clear()
				abortRequests()
				for (const key of subscriptions.keys()) notifySubscribers(key)
			} else if (event.key.startsWith(STORAGE_PREFIX)) {
				const key = event.key.slice(STORAGE_PREFIX.length)
				const current = readRecord(key)
				abortRequests(key, current?.revision ?? '')
				notifySubscribers(key)
			}
		})
		const handleInactive = () => {
			abortRequests()
			channel?.close()
			channel = null
		}
		window.addEventListener('pagehide', handleInactive)
		document.addEventListener('freeze', handleInactive)
		document.addEventListener('resume', ensureTransport)
		window.addEventListener('pageshow', ensureTransport)
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') handleInactive()
			else ensureTransport()
		})
	}
	if (
		!channel &&
		document.visibilityState !== 'hidden' &&
		typeof window.BroadcastChannel === 'function'
	) {
		try {
			channel = new BroadcastChannel(CHANNEL_NAME)
			channel.addEventListener('message', (event: MessageEvent<unknown>) => {
				const message = messageSchema.safeParse(event.data)
				if (!message.success) return
				const { key, record } = message.data
				const persisted = readRecord(key)
				if (record) {
					const isInvalidation =
						!record.hasValue && record.failureId === undefined
					const hasMatchingRevision =
						!persisted || record.revision === persisted.revision
					if (
						(persisted && record.updatedAt < persisted.updatedAt) ||
						(!hasMatchingRevision && !isInvalidation)
					)
						return
					records.set(key, record)
					pruneMemory()
				}
				const current = records.get(key)
				abortRequests(key, current?.revision ?? '')
				notifySubscribers(key)
			})
		} catch {
			channel = null
		}
	}
}

const waitUntilVisible = (signal: AbortSignal): Promise<void> => {
	signal.throwIfAborted()
	if (typeof document === 'undefined' || document.visibilityState !== 'hidden')
		return Promise.resolve()
	return new Promise((resolve, reject) => {
		const cleanup = () => {
			document.removeEventListener('visibilitychange', handleVisibility)
			signal.removeEventListener('abort', handleAbort)
		}
		const handleVisibility = () => {
			if (document.visibilityState !== 'hidden') {
				cleanup()
				resolve()
			}
		}
		const handleAbort = () => {
			cleanup()
			reject(signal.reason)
		}
		document.addEventListener('visibilitychange', handleVisibility)
		signal.addEventListener('abort', handleAbort, { once: true })
	})
}

const withResourceLock = async <T>({
	key,
	signal,
	work,
}: {
	key: string
	signal: AbortSignal
	work: () => Promise<T>
}): Promise<T> => {
	let hasAcquired = false
	try {
		if (typeof navigator !== 'undefined' && navigator.locks?.request) {
			return await navigator.locks.request(
				STORAGE_PREFIX + key,
				{ signal },
				() => {
					hasAcquired = true
					return work()
				},
			)
		}
	} catch (error) {
		if (
			hasAcquired ||
			!(error instanceof DOMException) ||
			!['NotSupportedError', 'SecurityError'].includes(error.name)
		)
			throw error
	}
	// Browsers without Web Locks still deduplicate within the current tab.
	const previous = localLocks.get(key) ?? Promise.resolve()
	const task = previous.then(() => {
		signal.throwIfAborted()
		return work()
	})
	const settled = task.then(
		() => {},
		() => {},
	)
	localLocks.set(key, settled)
	void settled.then(() => {
		if (localLocks.get(key) === settled) localLocks.delete(key)
	})
	return raceWithSignal(task, signal)
}

const raceWithSignal = <T>(
	promise: Promise<T>,
	signal: AbortSignal,
): Promise<T> =>
	new Promise((resolve, reject) => {
		const handleAbort = () => reject(signal.reason)
		if (signal.aborted) handleAbort()
		else signal.addEventListener('abort', handleAbort, { once: true })
		promise
			.then(resolve, reject)
			.finally(() => signal.removeEventListener('abort', handleAbort))
	})

const createAbortError = () =>
	new DOMException('Shared data request was cancelled', 'AbortError')

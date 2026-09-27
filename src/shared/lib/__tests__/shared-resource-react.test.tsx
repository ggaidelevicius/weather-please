import { act, render, screen } from '@testing-library/react'
import { useSyncExternalStore } from 'react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { readSharedResource, subscribeSharedResource } from '../shared-resource'
import { getCurrentTimestamp } from '../time'

const schema = z.object({ label: z.string() })
const storagePrefix = 'weather-please:shared-resource:v1:'
let sequence = 0
let key: string

const writeResult = (key: string, label: string) => {
	localStorage.setItem(
		storagePrefix + key,
		JSON.stringify({
			data: { label },
			hasValue: true,
			id: label,
			revision: '',
			updatedAt: getCurrentTimestamp(),
			version: 1,
		}),
	)
}

const notify = (key: null | string) => {
	window.dispatchEvent(
		new StorageEvent('storage', {
			key: key === null ? null : storagePrefix + key,
			storageArea: localStorage,
		}),
	)
}

const createStore = (key: string) => ({
	getServerSnapshot: () => null,
	getSnapshot: () => readSharedResource({ key, schema }),
	subscribe: (onChange: () => void) =>
		subscribeSharedResource({ key, onChange }),
})

const Reader = ({
	onRender,
	store,
}: Readonly<{
	onRender?: () => void
	store: ReturnType<typeof createStore>
}>) => {
	const snapshot = useSyncExternalStore(
		store.subscribe,
		store.getSnapshot,
		store.getServerSnapshot,
	)
	onRender?.()
	return <span>{snapshot?.value.label ?? 'empty'}</span>
}

beforeEach(() => {
	key = `react-shared-${++sequence}`
	localStorage.clear()
})

describe('shared resources with React subscriptions', () => {
	it('observes writes between rendering and subscribing', () => {
		writeResult(key, 'before render')
		const store = createStore(key)
		const subscribe = store.subscribe
		store.subscribe = (onChange) => {
			writeResult(key, 'before subscribe')
			return subscribe(onChange)
		}
		render(<Reader store={store} />)
		expect(screen.getByText('before subscribe')).toBeInTheDocument()
	})

	it('ignores duplicate notifications, observes clearing, and removes subscriptions', () => {
		writeResult(key, 'cached')
		const store = createStore(key)
		const onRender = vi.fn()
		const { unmount } = render(<Reader onRender={onRender} store={store} />)
		expect(screen.getByText('cached')).toBeInTheDocument()
		const renderCount = onRender.mock.calls.length
		act(() => {
			notify(key)
			notify(key)
			window.dispatchEvent(new Event('pageshow'))
		})
		expect(onRender).toHaveBeenCalledTimes(renderCount)
		act(() => {
			localStorage.clear()
			notify(null)
		})
		expect(screen.getByText('empty')).toBeInTheDocument()
		unmount()
		const countAfterUnmount = onRender.mock.calls.length
		act(() => {
			writeResult(key, 'after unmount')
			notify(key)
		})
		expect(onRender).toHaveBeenCalledTimes(countAfterUnmount)
	})

	it('switches resource identities without showing the previous data', () => {
		writeResult(key, 'old location')
		const oldStore = createStore(key)
		const newStore = createStore(key + '-new')
		const { rerender } = render(<Reader store={oldStore} />)
		expect(screen.getByText('old location')).toBeInTheDocument()
		rerender(<Reader store={newStore} />)
		expect(screen.getByText('empty')).toBeInTheDocument()
		act(() => {
			writeResult(key, 'obsolete update')
			notify(key)
		})
		expect(screen.getByText('empty')).toBeInTheDocument()
		act(() => {
			writeResult(key + '-new', 'new location')
			notify(key + '-new')
		})
		expect(screen.getByText('new location')).toBeInTheDocument()
	})

	it('uses an empty server snapshot without reading browser data', () => {
		writeResult(key, 'browser cache')
		const store = createStore(key)
		const getSnapshot = vi.spyOn(store, 'getSnapshot')
		const subscribe = vi.spyOn(store, 'subscribe')
		expect(renderToString(<Reader store={store} />)).toBe('<span>empty</span>')
		expect(getSnapshot).not.toHaveBeenCalled()
		expect(subscribe).not.toHaveBeenCalled()
	})
})

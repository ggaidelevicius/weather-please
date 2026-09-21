import type { ComponentProps, ReactNode } from 'react'

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SeasonalEventId } from '../../core/types'
import { LazyMeteorViewingGuide } from '../lazy-viewing-guide'

type GuideProps = ComponentProps<typeof LazyMeteorViewingGuide>
type GuideModule = {
	MeteorViewingGuide: (props: GuideProps) => ReactNode
}

vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

const props = {
	eventId: SeasonalEventId.Geminids,
	date: new Date(2026, 11, 14),
	latitude: -31.95,
	longitude: 115.86,
}

beforeEach(() => {
	vi.resetModules()
})

afterEach(() => {
	cleanup()
	vi.doUnmock('../viewing-guide')
	vi.restoreAllMocks()
})

describe('LazyMeteorViewingGuide', () => {
	it('defers loading until mounted and renders the latest location and night', async () => {
		const load = Promise.withResolvers<GuideModule>()
		const importGuide = vi.fn(() => load.promise)
		vi.doMock('../viewing-guide', importGuide)
		expect(importGuide).not.toHaveBeenCalled()

		const { rerender } = render(<LazyMeteorViewingGuide {...props} />)
		expect(
			screen.getByText('Calculating local viewing times…'),
		).toBeInTheDocument()
		const nextProps = {
			...props,
			date: new Date(2026, 11, 15),
			latitude: 51.5,
			longitude: -0.12,
		}
		rerender(<LazyMeteorViewingGuide {...nextProps} />)
		await act(async () => load.resolve({ MeteorViewingGuide: LoadedGuide }))

		expect(await screen.findByTestId('loaded-guide')).toHaveTextContent(
			'51.5, -0.12',
		)
		expect(screen.getByTestId('loaded-guide')).toHaveAttribute(
			'data-night',
			nextProps.date.toISOString(),
		)
		expect(importGuide).toHaveBeenCalledOnce()
		expect(screen.queryByText('Calculating local viewing times…')).toBeNull()

		rerender(<LazyMeteorViewingGuide {...props} />)
		expect(screen.getByTestId('loaded-guide')).toHaveTextContent(
			'-31.95, 115.86',
		)
		expect(importGuide).toHaveBeenCalledOnce()
	})

	it('shows an actionable load failure and retries successfully', async () => {
		const error = new Error('The viewing guide chunk could not be fetched')
		const reportError = vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.doMock('../viewing-guide', async () => {
			throw error
		})
		render(<LazyMeteorViewingGuide {...props} />)

		expect(
			await screen.findByText('Viewing guidance could not be loaded.'),
		).toBeInTheDocument()
		expect(reportError).toHaveBeenCalledWith(
			'Failed to load meteor viewing guidance',
			expect.any(Error),
		)
		const retry = Promise.withResolvers<GuideModule>()
		vi.doMock('../viewing-guide', () => retry.promise)
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
		expect(
			screen.getByText('Calculating local viewing times…'),
		).toBeInTheDocument()
		expect(
			screen.queryByText('Viewing guidance could not be loaded.'),
		).toBeNull()
		await act(async () => retry.resolve({ MeteorViewingGuide: LoadedGuide }))

		expect(await screen.findByTestId('loaded-guide')).toHaveTextContent(
			'-31.95, 115.86',
		)
		expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
	})

	it('does not mount a guide after its modal has been closed during loading', async () => {
		const load = Promise.withResolvers<GuideModule>()
		const renderGuide = vi.fn(LoadedGuide)
		vi.doMock('../viewing-guide', () => load.promise)
		const { container, unmount } = render(<LazyMeteorViewingGuide {...props} />)
		unmount()

		await act(async () => {
			load.resolve({ MeteorViewingGuide: renderGuide })
			await vi.dynamicImportSettled()
		})

		expect(container).toBeEmptyDOMElement()
		expect(renderGuide).not.toHaveBeenCalled()
	})
})

function LoadedGuide({ date, latitude, longitude }: GuideProps) {
	return (
		<div data-night={date.toISOString()} data-testid="loaded-guide">
			{latitude}, {longitude}
		</div>
	)
}

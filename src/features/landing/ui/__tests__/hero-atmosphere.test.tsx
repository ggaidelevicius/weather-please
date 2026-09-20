import { Canvas } from '@react-three/fiber'
import { act, cleanup, render, screen } from '@testing-library/react'
import { useReducedMotion } from 'framer-motion'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HeroAtmosphere } from '../hero-atmosphere'

vi.mock('@react-three/fiber', () => ({
	Canvas: vi.fn(({ frameloop }: { frameloop: string }) => (
		<canvas data-frameloop={frameloop} data-testid="hero-canvas" />
	)),
	useFrame: vi.fn(),
	useThree: vi.fn(),
}))

vi.mock('framer-motion', () => ({
	useReducedMotion: vi.fn(() => false),
}))

beforeEach(() => {
	vi.clearAllMocks()
	vi.mocked(useReducedMotion).mockReturnValue(false)
})

afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe('HeroAtmosphere', () => {
	it('renders the decorative shell on the server and hydrates the canvas in the browser', async () => {
		vi.stubGlobal('WebGLRenderingContext', vi.fn())
		let revealSurface: FrameRequestCallback | undefined
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
			revealSurface = callback
			return 42
		})
		const cancelAnimationFrame = vi.spyOn(window, 'cancelAnimationFrame')
		const html = renderToString(<HeroAtmosphere />)
		expect(html).toContain('data-hero-atmosphere')
		expect(html).not.toContain('<canvas')
		expect(Canvas).not.toHaveBeenCalled()

		const container = document.createElement('div')
		container.innerHTML = html
		document.body.appendChild(container)
		const onRecoverableError = vi.fn()
		const { unmount } = render(<HeroAtmosphere />, {
			container,
			hydrate: true,
			onRecoverableError,
		})
		expect(await screen.findByTestId('hero-canvas')).toHaveAttribute(
			'data-frameloop',
			'always',
		)
		expect(onRecoverableError).not.toHaveBeenCalled()
		const surface = container.querySelector(
			'[data-hero-atmosphere]',
		)?.firstElementChild
		expect(surface).toHaveClass('opacity-0')
		expect(revealSurface).toBeDefined()
		act(() => revealSurface?.(100))
		expect(surface).toHaveClass('opacity-100')

		unmount()
		expect(cancelAnimationFrame).toHaveBeenCalledWith(42)
	})

	it('keeps the decorative shell when WebGL is unavailable', () => {
		const { container } = render(<HeroAtmosphere />)

		expect(
			container.querySelector('[data-hero-atmosphere]'),
		).toBeInTheDocument()
		expect(screen.queryByTestId('hero-canvas')).not.toBeInTheDocument()
		expect(Canvas).not.toHaveBeenCalled()
	})

	it('preserves reduced-motion behavior for the browser-only canvas', () => {
		vi.stubGlobal('WebGLRenderingContext', vi.fn())
		vi.mocked(useReducedMotion).mockReturnValue(true)
		const { rerender } = render(<HeroAtmosphere />)

		expect(screen.getByTestId('hero-canvas')).toHaveAttribute(
			'data-frameloop',
			'demand',
		)
		vi.mocked(useReducedMotion).mockReturnValue(false)
		rerender(<HeroAtmosphere />)
		expect(screen.getByTestId('hero-canvas')).toHaveAttribute(
			'data-frameloop',
			'always',
		)
	})
})

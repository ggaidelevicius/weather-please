import { beforeEach, describe, expect, it, vi } from 'vitest'

import { applySeasonalEventCanvasBlur } from '../effect-canvas-blur'

describe('applySeasonalEventCanvasBlur', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		vi.useRealTimers()
	})

	it('blurs direct seasonal effect canvases and restores their original filter after animating out', () => {
		vi.useFakeTimers()

		const canvas = document.createElement('canvas')
		canvas.style.position = 'fixed'
		canvas.style.pointerEvents = 'none'
		canvas.style.filter = 'saturate(120%)'

		document.body.appendChild(canvas)

		applySeasonalEventCanvasBlur({ shouldBlurEffects: true })

		expect(canvas.style.filter).toBe('saturate(120%) blur(20px)')
		expect(canvas.style.transition).toBe('filter 350ms ease')

		applySeasonalEventCanvasBlur({ shouldBlurEffects: false })

		expect(canvas.style.filter).toBe('saturate(120%)')
		expect(canvas.style.transition).toBe('filter 350ms ease')

		vi.advanceTimersByTime(350)

		expect(canvas.style.transition).toBe('')
	})

	it('blurs canvases inside fixed seasonal effect roots', () => {
		const root = document.createElement('div')
		const canvas = document.createElement('canvas')

		root.style.position = 'fixed'
		root.style.pointerEvents = 'none'
		root.appendChild(canvas)
		document.body.appendChild(root)

		applySeasonalEventCanvasBlur({ shouldBlurEffects: true })

		expect(canvas.style.filter).toBe('blur(20px)')
	})

	it('ignores ordinary app canvases', () => {
		const canvas = document.createElement('canvas')

		document.body.appendChild(canvas)

		applySeasonalEventCanvasBlur({ shouldBlurEffects: true })

		expect(canvas.style.filter).toBe('')
	})
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { applySeasonalEventEffectBlur } from '../effect-blur'

describe('applySeasonalEventEffectBlur', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		document.head.innerHTML = ''
		vi.useRealTimers()
	})

	it('blurs direct seasonal effect canvases and restores their original filter after animating out', () => {
		vi.useFakeTimers()

		const canvas = document.createElement('canvas')
		canvas.style.position = 'fixed'
		canvas.style.pointerEvents = 'none'
		canvas.style.filter = 'saturate(120%)'

		document.body.appendChild(canvas)

		applySeasonalEventEffectBlur({ shouldBlurEffects: true })

		expect(canvas.style.filter).toBe('saturate(120%) blur(20px)')
		expect(canvas.style.transition).toBe('filter 350ms ease')

		applySeasonalEventEffectBlur({ shouldBlurEffects: false })

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

		applySeasonalEventEffectBlur({ shouldBlurEffects: true })

		expect(canvas.style.filter).toBe('blur(20px)')
		expect(root.style.filter).toBe('')
	})

	it('blurs fixed seasonal effect roots that do not use canvas', () => {
		const root = document.createElement('div')
		const layer = document.createElement('div')

		root.style.position = 'fixed'
		root.style.pointerEvents = 'none'
		root.appendChild(layer)
		document.body.appendChild(root)

		applySeasonalEventEffectBlur({ shouldBlurEffects: true })

		expect(root.style.filter).toBe('blur(20px)')
		expect(layer.style.filter).toBe('')
	})

	it('blurs eclipse-style roots that use stylesheet positioning', () => {
		const style = document.createElement('style')
		const root = document.createElement('div')

		style.textContent = `
			.wp-eclipse-overlay {
				position: fixed;
				pointer-events: none;
			}
		`
		root.className = 'wp-eclipse-overlay'

		document.head.appendChild(style)
		document.body.appendChild(root)

		applySeasonalEventEffectBlur({ shouldBlurEffects: true })

		expect(root.style.filter).toBe('blur(20px)')
	})

	it('ignores ordinary app canvases', () => {
		const canvas = document.createElement('canvas')

		document.body.appendChild(canvas)

		applySeasonalEventEffectBlur({ shouldBlurEffects: true })

		expect(canvas.style.filter).toBe('')
	})
})

import { describe, expect, it } from 'vitest'

import { mergeObjects } from '../helpers'

describe('mergeObjects', () => {
	it('preserves keys from the target object', () => {
		const target = { a: 1 }
		const source = { a: 2, b: 3 }
		const result = mergeObjects(target, source)
		expect(result).toEqual({ a: 1, b: 3 })
	})

	it('adds keys from the source only when missing', () => {
		const target = { foo: 'bar' }
		const source = { baz: 'qux' }
		const result = mergeObjects(target, source)
		expect(result).toEqual({ baz: 'qux', foo: 'bar' })
	})
})

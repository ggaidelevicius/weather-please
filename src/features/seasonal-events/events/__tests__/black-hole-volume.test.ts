import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	Data3DTexture,
	LinearFilter,
	LinearMipmapLinearFilter,
	NoColorSpace,
	RepeatWrapping,
	RGBAFormat,
	UnsignedByteType,
} from 'three'
import { createAccretionVolumeTexture } from '../black-hole-volume'

const textures: Data3DTexture[] = []

afterEach(() => {
	for (const texture of textures.splice(0)) texture.dispose()
	vi.restoreAllMocks()
})

describe('accretion gas volume', () => {
	it('creates a compact, linear RGBA volume ready for seamless mipmapped sampling', () => {
		const texture = createTexture()
		expect(texture).toBeInstanceOf(Data3DTexture)
		expect(texture.image).toMatchObject({ width: 64, height: 64, depth: 64 })
		expect(getData(texture)).toHaveLength(64 ** 3 * 4)
		expect(texture.format).toBe(RGBAFormat)
		expect(texture.type).toBe(UnsignedByteType)
		expect(texture.colorSpace).toBe(NoColorSpace)
		expect([texture.wrapS, texture.wrapT, texture.wrapR]).toEqual([
			RepeatWrapping,
			RepeatWrapping,
			RepeatWrapping,
		])
		expect(texture.minFilter).toBe(LinearMipmapLinearFilter)
		expect(texture.magFilter).toBe(LinearFilter)
		expect(texture.generateMipmaps).toBe(true)
		expect(texture.version).toBeGreaterThan(0)
	})

	it('reproduces the same gas independently of random texture identifiers', () => {
		const random = vi.spyOn(Math, 'random').mockReturnValue(0.1)
		const first = createTexture()
		random.mockReturnValue(0.9)
		const second = createTexture()
		const firstData = getData(first)
		const secondData = getData(second)
		expect(firstData).not.toBe(secondData)
		expect(first.uuid).not.toBe(second.uuid)
		expect(firstData.every((value, index) => value === secondData[index])).toBe(
			true,
		)
	})

	it('provides varied, finite channel values with progressively finer spatial detail', () => {
		const data = getData(createTexture())
		const ranges = Array.from({ length: 4 }, () => ({
			min: 255,
			max: 0,
			values: new Set<number>(),
		}))
		for (let offset = 0; offset < data.length; offset += 1) {
			const value = data[offset]
			const channel = ranges[offset % 4]
			channel.min = Math.min(channel.min, value)
			channel.max = Math.max(channel.max, value)
			channel.values.add(value)
		}
		expect(data.every(Number.isFinite)).toBe(true)
		for (const channel of ranges) {
			expect(channel.max - channel.min).toBeGreaterThan(80)
			expect(channel.values.size).toBeGreaterThan(64)
		}
		const differences = [0, 1, 2, 3].map(
			(channel) => getAdjacentDifferences({ data, channel, axis: 0 }).interior,
		)
		for (let channel = 1; channel < differences.length; channel += 1) {
			expect(differences[channel]).toBeGreaterThan(differences[channel - 1])
		}
	})

	it('keeps repeating faces at least as smooth as normal interior transitions on every axis', () => {
		const data = getData(createTexture())
		for (const axis of [0, 1, 2]) {
			for (const channel of [0, 1, 2, 3]) {
				const { interior, seam } = getAdjacentDifferences({
					data,
					channel,
					axis,
				})
				expect(seam).toBeLessThan(interior * 1.5 + 1)
			}
		}
	})
})

function createTexture() {
	const texture = createAccretionVolumeTexture()
	textures.push(texture)
	return texture
}

function getData(texture: Data3DTexture) {
	const data = texture.image.data
	if (!(data instanceof Uint8Array))
		throw new Error('Expected unsigned byte gas data')
	return data
}

function getAdjacentDifferences({
	data,
	channel,
	axis,
}: {
	data: Uint8Array
	channel: number
	axis: number
}) {
	const size = 64
	const stride = size ** axis
	let interior = 0
	let seam = 0
	for (let voxel = 0; voxel < size ** 3; voxel += 1) {
		const coordinate = Math.floor(voxel / stride) % size
		const offset = voxel * 4 + channel
		if (coordinate === size - 1) {
			seam += Math.abs(data[offset] - data[offset - (size - 1) * stride * 4])
		} else {
			interior += Math.abs(data[offset] - data[offset + stride * 4])
		}
	}
	return {
		interior: interior / (size ** 2 * (size - 1)),
		seam: seam / size ** 2,
	}
}

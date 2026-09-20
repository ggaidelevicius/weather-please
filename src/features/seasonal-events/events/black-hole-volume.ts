import {
	Data3DTexture,
	LinearFilter,
	LinearMipmapLinearFilter,
	RepeatWrapping,
	RGBAFormat,
	UnsignedByteType,
} from 'three'

type NoiseLayer = {
	values: Float32Array
	lower: Uint16Array
	upper: Uint16Array
	blend: Float32Array
	period: number
}

export function createAccretionVolumeTexture(): Data3DTexture {
	const size = 64
	const data = new Uint8Array(size ** 3 * 4)
	const [coarse, medium, fine, finest, detail] = [4, 8, 16, 32, 64].map(
		(period) => createNoiseLayer({ period, size }),
	)
	let offset = 0
	for (let z = 0; z < size; z += 1) {
		for (let y = 0; y < size; y += 1) {
			for (let x = 0; x < size; x += 1) {
				const a = sampleNoise(coarse, x, y, z)
				const b = sampleNoise(medium, x, y, z)
				const c = sampleNoise(fine, x, y, z)
				const d = sampleNoise(finest, x, y, z)
				const e = sampleNoise(detail, x, y, z)
				data[offset] = Math.round((a * 0.76 + b * 0.24) * 255)
				data[offset + 1] = Math.round((b * 0.76 + c * 0.24) * 255)
				data[offset + 2] = Math.round((c * 0.76 + d * 0.24) * 255)
				data[offset + 3] = Math.round((d * 0.76 + e * 0.24) * 255)
				offset += 4
			}
		}
	}
	const texture = new Data3DTexture(data, size, size, size)
	texture.format = RGBAFormat
	texture.type = UnsignedByteType
	texture.wrapS = RepeatWrapping
	texture.wrapT = RepeatWrapping
	texture.wrapR = RepeatWrapping
	texture.minFilter = LinearMipmapLinearFilter
	texture.magFilter = LinearFilter
	texture.generateMipmaps = true
	texture.needsUpdate = true
	return texture
}

function createNoiseLayer({
	period,
	size,
}: {
	period: number
	size: number
}): NoiseLayer {
	const values = new Float32Array(period ** 3)
	for (let index = 0; index < values.length; index += 1) {
		let hash = index ^ Math.imul(period, 0x9e3779b9)
		hash = Math.imul(hash ^ (hash >>> 16), 0x7feb352d)
		hash = Math.imul(hash ^ (hash >>> 15), 0x846ca68b)
		values[index] = ((hash ^ (hash >>> 16)) >>> 0) / 0xffffffff
	}
	const lower = new Uint16Array(size)
	const upper = new Uint16Array(size)
	const blend = new Float32Array(size)
	for (let coordinate = 0; coordinate < size; coordinate += 1) {
		// Voxel-center sampling and wrapped lattice corners keep all faces seamless.
		const position = ((coordinate + 0.5) * period) / size
		const cell = Math.floor(position)
		const fraction = position - cell
		lower[coordinate] = cell % period
		upper[coordinate] = (cell + 1) % period
		blend[coordinate] = fraction ** 3 * (fraction * (fraction * 6 - 15) + 10)
	}
	return { values, lower, upper, blend, period }
}

function sampleNoise(layer: NoiseLayer, x: number, y: number, z: number) {
	const { values, lower, upper, blend, period } = layer
	const x0 = lower[x]
	const x1 = upper[x]
	const y0 = lower[y] * period
	const y1 = upper[y] * period
	const z0 = lower[z] * period * period
	const z1 = upper[z] * period * period
	const tx = blend[x]
	const ty = blend[y]
	const tz = blend[z]
	const a = values[x0 + y0 + z0]
	const b = values[x0 + y1 + z0]
	const c = values[x0 + y0 + z1]
	const d = values[x0 + y1 + z1]
	const frontTop = a + (values[x1 + y0 + z0] - a) * tx
	const frontBottom = b + (values[x1 + y1 + z0] - b) * tx
	const backTop = c + (values[x1 + y0 + z1] - c) * tx
	const backBottom = d + (values[x1 + y1 + z1] - d) * tx
	const front = frontTop + (frontBottom - frontTop) * ty
	const back = backTop + (backBottom - backTop) * ty
	return front + (back - front) * tz
}

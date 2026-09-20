type Sprite = {
	canvas: HTMLCanvasElement
	width: number
	height: number
}

export function createTotalLunarEclipseArtwork({ dpr }: { dpr: number }): {
	moon: Sprite
	shade: Sprite
	glow: Sprite
	haze: Sprite
	star: Sprite
	glint: Sprite
	nebula: Sprite
	radius: number
} {
	const pixelRatio = Number.isFinite(dpr) ? Math.min(2, Math.max(1, dpr)) : 1
	const { moon, shade } = createMoon(Math.min(1.5, pixelRatio))
	return {
		moon,
		shade,
		glow: createGlow(pixelRatio),
		haze: createHaze(pixelRatio),
		star: createStar(pixelRatio),
		glint: createGlint(pixelRatio),
		nebula: createNebula(),
		radius: 240,
	}
}

function createMoon(pixelRatio: number) {
	const { sprite: moon, context } = createCanvas({
		width: 640,
		height: 640,
		pixelRatio,
	})
	const { sprite: shade, context: shadeContext } = createCanvas({
		width: 640,
		height: 640,
		pixelRatio,
	})
	const size = moon.canvas.width
	const pixels = context.createImageData(size, size)
	const shadePixels = shadeContext.createImageData(size, size)
	const noise = createNoiseTable()
	const craters = createCraterField(noise)
	const inverseScale = 640 / size
	const maria = [
		[-0.32, -0.32, 0.3, 0.27],
		[0.13, -0.27, 0.22, 0.22],
		[0.32, -0.05, 0.23, 0.19],
		[0.47, 0.19, 0.16, 0.22],
		[-0.22, 0.29, 0.24, 0.18],
		[-0.47, 0.32, 0.14, 0.16],
		[-0.6, -0.035, 0.24, 0.4],
	]

	for (let y = 0; y < size; y += 1) {
		const ny = ((y + 0.5) * inverseScale - 320) / 240
		for (let x = 0; x < size; x += 1) {
			const nx = ((x + 0.5) * inverseScale - 320) / 240
			const squaredRadius = nx * nx + ny * ny
			if (squaredRadius > 1.006) continue
			const coverage = Math.min(
				1,
				Math.max(0, (1 - Math.sqrt(squaredRadius)) * 240 * pixelRatio + 0.5),
			)
			if (coverage === 0) continue
			const nz = Math.sqrt(Math.max(0, 1 - squaredRadius))
			const u = Math.atan2(nx, nz) / (Math.PI / 2)
			const v = Math.asin(Math.max(-1, Math.min(1, ny))) / (Math.PI / 2)
			const broad = sampleNoise(u * 7 + 19, v * 7 + 53, noise)
			const terrain = sampleNoise(u * 19 + 79, v * 19 + 11, noise)
			const mottling = sampleNoise(u * 53 + 107, v * 53 + 97, noise)
			const grain = sampleNoise(u * 149 + 163, v * 149 + 37, noise)
			const dust = sampleNoise(u * 397 + 41, v * 397 + 211, noise)
			const warpedU = u + (terrain - 0.5) * 0.13 + (mottling - 0.5) * 0.025
			const warpedV =
				v + (sampleNoise(u * 13 + 137, v * 13 + 71, noise) - 0.5) * 0.11
			let sea = 0
			for (const [centerX, centerY, radiusX, radiusY] of maria) {
				const dx = (warpedU - centerX) / radiusX
				const dy = (warpedV - centerY) / radiusY
				sea = Math.max(
					sea,
					1 - smoothstep(0.55, 1.13, dx * dx + dy * dy + (broad - 0.5) * 0.3),
				)
			}
			const relief = sampleCraterField(u, v, craters)
			const regolith =
				0.91 +
				(broad - 0.5) * 0.13 +
				(terrain - 0.5) * 0.13 +
				(mottling - 0.5) * 0.15 +
				(grain - 0.5) * 0.09 +
				(dust - 0.5) * 0.047
			const albedo =
				regolith * (1 - sea * (0.29 + broad * 0.1)) + relief * (1 - sea * 0.48)
			const umbra = smoothstep(-0.62, 0.91, nx * 0.58 + ny * 0.79)
			const illumination = Math.max(
				0.42,
				0.68 + nz * 0.32 - nx * 0.07 - ny * 0.04,
			)
			const copper = smoothstep(0, 0.59, umbra)
			const wine = smoothstep(0.38, 1, umbra)
			const red = (218 - copper * 48) * (1 - wine) + 65 * wine
			const green = (159 - copper * 77) * (1 - wine) + 24 * wine
			const blue = (105 - copper * 49) * (1 - wine) + 33 * wine
			const textureLight = albedo * illumination
			const index = (y * size + x) * 4
			pixels.data[index] = Math.round(red * textureLight)
			pixels.data[index + 1] = Math.round(green * textureLight)
			pixels.data[index + 2] = Math.round(blue * textureLight)
			pixels.data[index + 3] = Math.round(coverage * 255)
			shadePixels.data[index] = 31
			shadePixels.data[index + 1] = 8
			shadePixels.data[index + 2] = 25
			shadePixels.data[index + 3] = Math.round(coverage * umbra * 0.145 * 255)
		}
	}
	context.putImageData(pixels, 0, 0)
	shadeContext.putImageData(shadePixels, 0, 0)
	return { moon, shade }
}

function createCraterField(noise: Float32Array) {
	const field = new Float32Array(512 * 512)
	const craters = [
		[-0.34, 0.055, 0.049, 0.87],
		[-0.55, 0.12, 0.027, 0.73],
		[-0.07, 0.58, 0.039, 0.9],
		[0.41, 0.49, 0.043, 0.63],
		[0.17, 0.61, 0.068, 0.41],
		[0.44, -0.53, 0.034, 0.64],
	]
	for (let index = 0; index < 165; index += 1) {
		const x = noise[(index * 173 + 23) & 65535] * 1.96 - 0.98
		const y = noise[(index * 173 + 47) & 65535] * 1.96 - 0.98
		const size = noise[(index * 173 + 79) & 65535]
		craters.push([
			x,
			y,
			0.006 + size * size * 0.034,
			0.27 + noise[(index * 173 + 137) & 65535] * 0.45,
		])
	}
	for (const [centerU, centerV, radius, strength] of craters) {
		const centerX = (centerU + 1) * 255.5
		const centerY = (centerV + 1) * 255.5
		const pixelRadius = radius * 255.5
		const bound = Math.ceil(pixelRadius * 1.4)
		const minimumX = Math.max(0, Math.floor(centerX - bound))
		const maximumX = Math.min(511, Math.ceil(centerX + bound))
		const minimumY = Math.max(0, Math.floor(centerY - bound))
		const maximumY = Math.min(511, Math.ceil(centerY + bound))
		for (let y = minimumY; y <= maximumY; y += 1) {
			for (let x = minimumX; x <= maximumX; x += 1) {
				const dx = (x - centerX) / pixelRadius
				const dy = (y - centerY) / pixelRadius
				const distance = Math.sqrt(dx * dx + dy * dy)
				if (distance > 1.35) continue
				const irregularity = sampleNoise(x * 0.28, y * 0.28, noise)
				const edge = distance + (irregularity - 0.5) * 0.1
				const rim = Math.exp(-((edge - 0.94) ** 2) / 0.035)
				const basin = Math.max(0, 1 - edge * edge)
				const direction = (-dx * 0.64 - dy * 0.77) / Math.max(0.15, distance)
				// Diffuse relief lights one side of the rim instead of outlining a circle.
				field[y * 512 + x] +=
					strength *
					(rim * direction * 0.15 - basin * direction * 0.035 - basin * 0.028)
			}
		}
	}
	return field
}

function sampleCraterField(u: number, v: number, field: Float32Array) {
	const x = Math.max(0, Math.min(511, (u + 1) * 255.5))
	const y = Math.max(0, Math.min(511, (v + 1) * 255.5))
	const left = Math.min(510, Math.floor(x))
	const top = Math.min(510, Math.floor(y))
	const fx = x - left
	const fy = y - top
	const index = top * 512 + left
	const first = field[index] * (1 - fx) + field[index + 1] * fx
	const second = field[index + 512] * (1 - fx) + field[index + 513] * fx
	return first * (1 - fy) + second * fy
}

function createNoiseTable() {
	const noise = new Float32Array(65536)
	for (let index = 0; index < noise.length; index += 1) {
		let value = Math.imul(index + 7517, 0x45d9f3b)
		value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
		noise[index] = ((value ^ (value >>> 16)) >>> 0) / 4294967295
	}
	return noise
}

function sampleNoise(x: number, y: number, noise: Float32Array) {
	const left = Math.floor(x)
	const top = Math.floor(y)
	const fractionX = x - left
	const fractionY = y - top
	const blendX = fractionX * fractionX * (3 - 2 * fractionX)
	const blendY = fractionY * fractionY * (3 - 2 * fractionY)
	const firstRow = (top & 255) * 256
	const secondRow = ((top + 1) & 255) * 256
	const firstColumn = left & 255
	const secondColumn = (left + 1) & 255
	const first =
		noise[firstRow + firstColumn] * (1 - blendX) +
		noise[firstRow + secondColumn] * blendX
	const second =
		noise[secondRow + firstColumn] * (1 - blendX) +
		noise[secondRow + secondColumn] * blendX
	return first * (1 - blendY) + second * blendY
}

function smoothstep(start: number, end: number, value: number) {
	const fraction = Math.max(0, Math.min(1, (value - start) / (end - start)))
	return fraction * fraction * (3 - 2 * fraction)
}

function createGlow(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 512,
		height: 512,
		pixelRatio,
	})
	const glow = context.createRadialGradient(256, 256, 0, 256, 256, 254)
	glow.addColorStop(0, 'rgba(188, 108, 73, 0.2)')
	glow.addColorStop(0.26, 'rgba(163, 80, 66, 0.13)')
	glow.addColorStop(0.55, 'rgba(123, 57, 65, 0.044)')
	glow.addColorStop(0.8, 'rgba(105, 49, 67, 0.009)')
	glow.addColorStop(1, 'rgba(105, 49, 67, 0)')
	context.fillStyle = glow
	context.fillRect(0, 0, 512, 512)
	return sprite
}

function createHaze(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 512,
		height: 512,
		pixelRatio,
	})
	const indigo = context.createRadialGradient(222, 222, 0, 246, 243, 244)
	indigo.addColorStop(0, 'rgba(78, 94, 146, 0.26)')
	indigo.addColorStop(0.42, 'rgba(65, 73, 125, 0.14)')
	indigo.addColorStop(0.75, 'rgba(53, 52, 102, 0.035)')
	indigo.addColorStop(1, 'rgba(53, 52, 102, 0)')
	context.fillStyle = indigo
	context.fillRect(0, 0, 512, 512)
	const plum = context.createRadialGradient(311, 300, 0, 282, 273, 226)
	plum.addColorStop(0, 'rgba(110, 61, 97, 0.13)')
	plum.addColorStop(0.56, 'rgba(83, 46, 94, 0.05)')
	plum.addColorStop(1, 'rgba(83, 46, 94, 0)')
	context.fillStyle = plum
	context.fillRect(0, 0, 512, 512)
	return sprite
}

function createStar(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 64,
		height: 64,
		pixelRatio,
	})
	const glow = context.createRadialGradient(32, 32, 0, 32, 32, 24)
	glow.addColorStop(0, 'rgba(255, 247, 223, 0.64)')
	glow.addColorStop(0.2, 'rgba(230, 235, 247, 0.26)')
	glow.addColorStop(0.46, 'rgba(187, 209, 245, 0.055)')
	glow.addColorStop(1, 'rgba(176, 199, 237, 0)')
	context.fillStyle = glow
	context.fillRect(0, 0, 64, 64)
	context.fillStyle = '#fff3d9'
	context.beginPath()
	context.arc(32, 32, 5, 0, Math.PI * 2)
	context.fill()
	context.fillStyle = '#fffefa'
	context.beginPath()
	context.arc(32, 32, 2.6, 0, Math.PI * 2)
	context.fill()
	return sprite
}

function createGlint(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 64,
		height: 64,
		pixelRatio,
	})
	const glow = context.createRadialGradient(32, 32, 0, 32, 32, 29)
	glow.addColorStop(0, 'rgba(242, 249, 255, 0.75)')
	glow.addColorStop(0.17, 'rgba(210, 229, 255, 0.34)')
	glow.addColorStop(0.44, 'rgba(163, 192, 239, 0.09)')
	glow.addColorStop(1, 'rgba(163, 192, 239, 0)')
	context.fillStyle = glow
	context.fillRect(0, 0, 64, 64)
	context.fillStyle = 'rgba(226, 240, 255, 0.66)'
	context.beginPath()
	context.moveTo(32, 17)
	context.quadraticCurveTo(34, 29, 45, 32)
	context.quadraticCurveTo(34, 34, 32, 47)
	context.quadraticCurveTo(30, 34, 19, 32)
	context.quadraticCurveTo(30, 30, 32, 17)
	context.fill()
	context.fillStyle = '#edf4ff'
	context.beginPath()
	context.arc(32, 32, 4.7, 0, Math.PI * 2)
	context.fill()
	context.fillStyle = '#fffefa'
	context.beginPath()
	context.arc(32, 32, 2.7, 0, Math.PI * 2)
	context.fill()
	return sprite
}

function createNebula(): Sprite {
	const { sprite, context } = createCanvas({
		width: 1024,
		height: 640,
		pixelRatio: 1,
	})
	const pixels = context.createImageData(1024, 640)
	const noise = createNoiseTable()
	for (let y = 0; y < 640; y += 1) {
		const v = (y + 0.5) / 320 - 1
		const verticalEdge = 1 - smoothstep(0.62, 1, Math.abs(v))
		for (let x = 0; x < 1024; x += 1) {
			const u = (x + 0.5) / 512 - 1
			const horizontalEdge = 1 - smoothstep(0.66, 1, Math.abs(u))
			const warpU =
				u + (sampleNoise(u * 3.1 + 47, v * 3.7 + 173, noise) - 0.5) * 0.24
			const warpV =
				v + (sampleNoise(u * 3.9 + 151, v * 3.3 + 71, noise) - 0.5) * 0.2
			const broad = sampleNoise(warpU * 3.7 + 31, warpV * 4.8 + 89, noise)
			const medium = sampleNoise(warpU * 8.1 + 131, warpV * 10.3 + 37, noise)
			const fine = sampleNoise(warpU * 19 + 79, warpV * 24 + 181, noise)
			const wisps = sampleNoise(
				warpU * 29 + warpV * 11 + 211,
				warpV * 57 - warpU * 13 + 17,
				noise,
			)
			const clouds = smoothstep(
				0.26,
				0.72,
				broad * 0.48 + medium * 0.28 + fine * 0.15 + wisps * 0.09,
			)
			const gaps = smoothstep(
				0.48,
				0.79,
				sampleNoise(warpU * 4.6 + 53, warpV * 8.2 + 107, noise),
			)
			const diagonal = v + u * 0.31
			const envelope = Math.exp(
				-((u + 0.08) ** 2) * 0.85 - diagonal * diagonal * 1.4,
			)
			const alpha =
				clouds *
				(1 - gaps * 0.83) *
				envelope *
				horizontalEdge *
				verticalEdge *
				0.54
			const plum = sampleNoise(u * 2.3 + 97, v * 2.7 + 227, noise)
			const light = 0.84 + wisps * 0.23
			const index = (y * 1024 + x) * 4
			pixels.data[index] = Math.round((86 + plum * 40) * light)
			pixels.data[index + 1] = Math.round((112 - plum * 28) * light)
			pixels.data[index + 2] = Math.round((162 - plum * 27) * light)
			pixels.data[index + 3] = Math.round(alpha * 255)
		}
	}
	context.putImageData(pixels, 0, 0)
	return sprite
}

function createCanvas({
	width,
	height,
	pixelRatio,
}: {
	width: number
	height: number
	pixelRatio: number
}) {
	const canvas = document.createElement('canvas')
	canvas.width = Math.round(width * pixelRatio)
	canvas.height = Math.round(height * pixelRatio)
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create total lunar eclipse artwork')
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	return { sprite: { canvas, width, height }, context }
}

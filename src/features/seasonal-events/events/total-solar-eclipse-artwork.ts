type Sprite = {
	canvas: HTMLCanvasElement
	width: number
	height: number
}

export function createTotalSolarEclipseArtwork({ dpr }: { dpr: number }): {
	corona: Sprite
	filaments: Sprite
	moon: Sprite
	glow: Sprite
	star: Sprite
	haze: Sprite
	radius: number
} {
	const pixelRatio = Number.isFinite(dpr) ? Math.min(2, Math.max(1, dpr)) : 1
	const heroPixelRatio = Math.min(1.5, pixelRatio)
	const noise = createNoiseTable()
	return {
		corona: createCorona(heroPixelRatio, noise),
		filaments: createOuterStreamers(pixelRatio, noise),
		moon: createMoon(heroPixelRatio),
		glow: createGlow(pixelRatio),
		star: createStar(pixelRatio),
		haze: createHaze(pixelRatio),
		radius: 125,
	}
}

function createCorona(pixelRatio: number, noise: Float32Array): Sprite {
	const { sprite: corona, context } = createCanvas({
		width: 800,
		height: 800,
		pixelRatio,
	})
	const size = corona.canvas.width
	const pixels = context.createImageData(size, size)
	const angular = createAngularProfiles(noise)
	const radial = createRadialProfiles()
	const inverseScale = 800 / size
	const tau = Math.PI * 2

	// Changing density along each curved fiber prevents unbroken radial rays.
	for (let y = 0; y < size; y += 1) {
		const dy = (y + 0.5) * inverseScale - 400
		for (let x = 0; x < size; x += 1) {
			const dx = (x + 0.5) * inverseScale - 400
			const radius = Math.sqrt(dx * dx + dy * dy)
			if (radius < 124 || radius >= 382) continue
			const distance = Math.max(0, radius - 125)
			const angle = Math.atan2(dy, dx)
			const turn = angle / tau + 0.5
			const angularIndex = Math.min(4095, Math.floor(turn * 4096))
			const radialIndex = Math.min(1535, Math.floor(radius * 4))
			const warp =
				turn +
				(angular.bend[angularIndex] * distance) / (distance + 80) +
				(sampleCloud(turn * 11, distance / 76, 11, 701, noise) - 0.5) * 0.013 +
				0.0028 * Math.sin(distance * 0.028 + angle * 3)
			const folds = sampleCloud(warp * 39, distance / 67, 39, 31, noise)
			const strands = sampleCloud(
				warp * 257 + distance * 0.011,
				distance / 43,
				257,
				137,
				noise,
			)
			const fine = sampleCloud(
				warp * 613 - distance * 0.024 + Math.sin(distance * 0.035 + angle * 5),
				distance / 27,
				613,
				419,
				noise,
			)
			const envelope =
				Math.exp(-distance / angular.length[angularIndex]) *
				angular.strength[angularIndex]
			const outer =
				envelope *
				(0.14 + folds * 0.24 + strands * strands * 0.23 + fine * fine * 0.17)
			const alpha =
				Math.min(1, radial.inner[radialIndex] + outer) *
				radial.edge[radialIndex]
			const warmth = radial.warmth[radialIndex]
			const index = (y * size + x) * 4
			pixels.data[index] = Math.round(221 + warmth * 34)
			pixels.data[index + 1] = Math.round(231 + warmth * 22)
			pixels.data[index + 2] = Math.round(244 - warmth * 3)
			pixels.data[index + 3] = Math.round(alpha * 255)
		}
	}
	context.putImageData(pixels, 0, 0)
	drawProminences(context)
	return corona
}

function createOuterStreamers(pixelRatio: number, noise: Float32Array): Sprite {
	const { sprite, context } = createCanvas({
		width: 2200,
		height: 2200,
		pixelRatio: Math.min(1400, Math.round(1100 * pixelRatio)) / 2200,
	})
	const size = sprite.canvas.width
	const pixels = context.createImageData(size, size)
	const profiles = createStreamerProfiles(noise)
	const inverseScale = 2200 / size
	const tau = Math.PI * 2
	for (let y = 0; y < size; y += 1) {
		const dy = (y + 0.5) * inverseScale - 1100
		for (let x = 0; x < size; x += 1) {
			const dx = (x + 0.5) * inverseScale - 1100
			const radius = Math.sqrt(dx * dx + dy * dy)
			if (radius < 125 || radius > 1060) continue
			const distance = radius - 125
			const angle = Math.atan2(dy, dx)
			const turn = angle / tau + 0.5
			const warp =
				turn +
				0.011 * Math.sin(distance * 0.006 + angle * 2) +
				(sampleCloud(turn * 13, distance / 230, 13, 709, noise) - 0.5) *
					0.016 *
					Math.min(1, distance / 120)
			const wrapped = ((warp % 1) + 1) % 1
			const profileIndex = Math.floor(wrapped * 8192)
			const reach = profiles.reach[profileIndex]
			if (radius >= reach) continue
			const folds = sampleCloud(warp * 37, distance / 158, 37, 31, noise)
			const strands = sampleCloud(
				warp * 239 + distance * 0.006,
				distance / 103,
				239,
				137,
				noise,
			)
			const fine = sampleCloud(
				warp * 587 - distance * 0.012 + Math.sin(distance * 0.013 + angle * 5),
				distance / 61,
				587,
				419,
				noise,
			)
			const strandReach =
				reach * (0.62 + 0.38 * sampleNoise(warp * 71, 71, 563, noise))
			const plumeTail = 1 - smoothstep(reach * 0.48, reach, radius)
			const strandTail = 1 - smoothstep(strandReach * 0.53, strandReach, radius)
			const envelope =
				Math.exp(-distance / (reach * 0.61)) *
				profiles.strength[profileIndex] *
				smoothstep(125, 151, radius)
			const density =
				(0.018 + folds * 0.105) * plumeTail +
				(strands * 0.12 + fine * fine * 0.13) * strandTail
			const index = (y * size + x) * 4
			pixels.data[index] = 214
			pixels.data[index + 1] = 226
			pixels.data[index + 2] = 242
			pixels.data[index + 3] = Math.round(envelope * density * 255)
		}
	}
	context.putImageData(pixels, 0, 0)
	return sprite
}

function createStreamerProfiles(noise: Float32Array) {
	const reach = new Float32Array(8192)
	const strength = new Float32Array(8192)
	const plumes = [
		[2.94, 0.32, 790, 1.48],
		[2.2, 0.25, 635, 1.34],
		[-2.6, 0.23, 430, 0.83],
		[1.32, 0.17, 330, 0.93],
		[-0.17, 0.26, 245, 0.76],
		[-1.05, 0.19, 140, 0.65],
		[0.53, 0.15, 105, 0.65],
	]
	for (let index = 0; index < 8192; index += 1) {
		const turn = index / 8192
		const angle = (turn - 0.5) * Math.PI * 2
		let extension = 0
		let brightness = 0
		for (const [direction, width, length, opacity] of plumes) {
			const difference = Math.atan2(
				Math.sin(angle - direction),
				Math.cos(angle - direction),
			)
			const weight = Math.exp(-(difference * difference) / (2 * width * width))
			extension = Math.max(extension, length * weight)
			brightness = Math.max(brightness, opacity * weight)
		}
		const variation = sampleNoise(turn * 19, 19, 73, noise)
		reach[index] = (260 + extension) * (0.92 + variation * 0.08)
		strength[index] = (0.1 + brightness) * (0.85 + variation * 0.3)
	}
	return { reach, strength }
}

function createAngularProfiles(noise: Float32Array) {
	const length = new Float32Array(4096)
	const strength = new Float32Array(4096)
	const bend = new Float32Array(4096)
	for (let index = 0; index < 4096; index += 1) {
		const turn = index / 4096
		const angle = (turn - 0.5) * Math.PI * 2
		const equator = Math.abs(Math.cos(angle + 0.29))
		const broad = sampleNoise(turn * 9, 9, 11, noise)
		const fine = sampleNoise(turn * 23, 23, 83, noise)
		length[index] =
			22 + equator * equator * (21 + broad * 21) + broad * 19 + fine * 7
		strength[index] = 0.46 + broad * 0.42 + equator * 0.22
		bend[index] = (sampleNoise(turn * 13, 13, 251, noise) - 0.5) * 0.042
	}
	return { length, strength, bend }
}

function createRadialProfiles() {
	const inner = new Float32Array(1536)
	const edge = new Float32Array(1536)
	const warmth = new Float32Array(1536)
	for (let index = 0; index < 1536; index += 1) {
		const radius = index / 4
		const distance = Math.max(0, radius - 125)
		inner[index] =
			0.98 * Math.exp(-distance / 2.7) +
			0.43 * Math.exp(-distance / 10) +
			0.16 * Math.exp(-distance / 29)
		edge[index] =
			smoothstep(124, 125.3, radius) * (1 - smoothstep(242, 366, radius))
		warmth[index] = Math.exp(-distance / 33)
	}
	return { inner, edge, warmth }
}

function createNoiseTable() {
	const noise = new Float32Array(2048)
	for (let index = 0; index < noise.length; index += 1) {
		let value = Math.imul(index + 1937, 0x45d9f3b)
		value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
		noise[index] = ((value ^ (value >>> 16)) >>> 0) / 4294967295
	}
	return noise
}

function sampleNoise(
	position: number,
	period: number,
	offset: number,
	noise: Float32Array,
) {
	const cell = Math.floor(position)
	const wrapped = ((cell % period) + period) % period
	const first = noise[wrapped + offset]
	const second = noise[((wrapped + 1) % period) + offset]
	const fraction = position - cell
	const blend = fraction * fraction * (3 - 2 * fraction)
	return first + (second - first) * blend
}

function sampleCloud(
	position: number,
	depth: number,
	period: number,
	offset: number,
	noise: Float32Array,
) {
	const row = Math.floor(depth)
	const fraction = depth - row
	const blend = fraction * fraction * (3 - 2 * fraction)
	const first = sampleNoise(
		position,
		period,
		(offset + row * 113) & 1023,
		noise,
	)
	const second = sampleNoise(
		position,
		period,
		(offset + (row + 1) * 113) & 1023,
		noise,
	)
	return first + (second - first) * blend
}

function smoothstep(start: number, end: number, value: number) {
	const fraction = Math.max(0, Math.min(1, (value - start) / (end - start)))
	return fraction * fraction * (3 - 2 * fraction)
}

function drawProminences(context: CanvasRenderingContext2D) {
	context.save()
	context.translate(400, 400)
	context.lineCap = 'round'
	for (const [angle, height, width] of [
		[-0.51, 3.7, 3.5],
		[1.06, 2.3, 2.1],
		[2.66, 5.2, 4.1],
	]) {
		context.save()
		context.rotate(angle)
		context.strokeStyle = 'rgba(213, 116, 133, 0.48)'
		context.lineWidth = 2.7
		context.beginPath()
		context.moveTo(124.7, -width)
		context.bezierCurveTo(
			125 + height,
			-width * 1.1,
			125 + height,
			width * 0.9,
			124.8,
			width,
		)
		context.stroke()
		context.strokeStyle = 'rgba(255, 185, 185, 0.74)'
		context.lineWidth = 0.8
		context.stroke()
		context.restore()
	}
	context.restore()
	return context
}

function createMoon(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 800,
		height: 800,
		pixelRatio,
	})
	const surface = context.createRadialGradient(366, 369, 0, 400, 400, 125)
	surface.addColorStop(0, '#05080d')
	surface.addColorStop(0.8, '#04070b')
	surface.addColorStop(1, '#030609')
	context.fillStyle = surface
	context.beginPath()
	context.arc(400, 400, 125, 0, Math.PI * 2)
	context.fill()
	return sprite
}

function createGlow(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 256,
		height: 256,
		pixelRatio,
	})
	const glow = context.createRadialGradient(128, 128, 0, 128, 128, 128)
	glow.addColorStop(0, 'rgba(255, 247, 229, 0.32)')
	glow.addColorStop(0.16, 'rgba(241, 236, 223, 0.21)')
	glow.addColorStop(0.44, 'rgba(207, 215, 228, 0.075)')
	glow.addColorStop(0.76, 'rgba(173, 190, 215, 0.014)')
	glow.addColorStop(1, 'rgba(173, 190, 215, 0)')
	context.fillStyle = glow
	context.fillRect(0, 0, 256, 256)
	return sprite
}

function createStar(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 64,
		height: 64,
		pixelRatio,
	})
	const glow = context.createRadialGradient(32, 32, 0, 32, 32, 29)
	glow.addColorStop(0, 'rgba(246, 245, 232, 0.84)')
	glow.addColorStop(0.08, 'rgba(231, 236, 241, 0.45)')
	glow.addColorStop(0.33, 'rgba(189, 209, 236, 0.08)')
	glow.addColorStop(1, 'rgba(189, 209, 236, 0)')
	context.fillStyle = glow
	context.fillRect(0, 0, 64, 64)
	context.fillStyle = 'rgba(255, 249, 228, 0.8)'
	context.beginPath()
	context.arc(32, 32, 1.4, 0, Math.PI * 2)
	context.fill()
	return sprite
}

function createHaze(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 512,
		height: 512,
		pixelRatio,
	})
	const haze = context.createRadialGradient(244, 267, 0, 256, 256, 252)
	haze.addColorStop(0, 'rgba(86, 121, 161, 0.26)')
	haze.addColorStop(0.34, 'rgba(63, 91, 135, 0.16)')
	haze.addColorStop(0.68, 'rgba(43, 58, 106, 0.055)')
	haze.addColorStop(1, 'rgba(43, 58, 106, 0)')
	context.fillStyle = haze
	context.fillRect(0, 0, 512, 512)
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
	if (!context) throw new Error('Unable to create total solar eclipse artwork')
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	return { sprite: { canvas, width, height }, context }
}

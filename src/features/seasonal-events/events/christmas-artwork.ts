type TreeLight = {
	x: number
	y: number
	phase: number
	size: number
}

type ChristmasArtwork = {
	canvas: HTMLCanvasElement
	width: number
	height: number
	baseY: number
	star: { x: number; y: number }
	lights: TreeLight[]
}

type Bough = {
	x: number
	y: number
	length: number
	angle: number
	depth: number
	seed: number
}

export function createChristmasArtwork({
	dpr,
}: {
	dpr: number
}): ChristmasArtwork {
	const width = 440
	const height = 560
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	const canvas = document.createElement('canvas')
	canvas.width = Math.round(width * pixelRatio)
	canvas.height = Math.round(height * pixelRatio)
	const context = canvas.getContext('2d')
	if (!context) {
		throw new Error('Unable to create the Christmas artwork canvas')
	}
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	context.lineCap = 'round'
	context.lineJoin = 'round'

	drawTrunk(context)
	drawTreeShadow(context)
	const boughs = createBoughs()
	for (const bough of boughs) {
		drawBough({ context, bough })
	}
	drawCrown(context)
	const lights = drawLightStrands(context)
	drawOrnaments(context)
	for (const light of lights) {
		drawBulb({ context, light })
	}
	const star = { x: 220, y: 34 }
	drawStar({ context, star })

	return { canvas, width, height, baseY: 548, star, lights }
}

function drawTrunk(context: CanvasRenderingContext2D) {
	const bark = context.createLinearGradient(209, 0, 231, 0)
	bark.addColorStop(0, '#1e231e')
	bark.addColorStop(0.35, '#514333')
	bark.addColorStop(0.54, '#6a5340')
	bark.addColorStop(1, '#292b23')
	context.fillStyle = bark
	context.beginPath()
	context.moveTo(218.5, 61)
	context.lineTo(209, 548)
	context.quadraticCurveTo(220, 551, 231, 548)
	context.lineTo(221.5, 61)
	context.closePath()
	context.fill()
	context.strokeStyle = 'rgba(16, 24, 21, 0.5)'
	context.lineWidth = 1.2
	for (let index = 0; index < 5; index += 1) {
		context.beginPath()
		context.moveTo(212 + index * 3.6, 516)
		context.lineTo(212.5 + index * 3.8, 547)
		context.stroke()
	}
	return context
}

function drawTreeShadow(context: CanvasRenderingContext2D) {
	const shade = context.createLinearGradient(70, 0, 356, 0)
	shade.addColorStop(0, '#0b2829')
	shade.addColorStop(0.43, '#0b211f')
	shade.addColorStop(0.68, '#102b26')
	shade.addColorStop(1, '#122d2c')
	context.fillStyle = shade
	context.beginPath()
	context.moveTo(220, 57)
	for (const direction of [-1, 1]) {
		for (let step = 0; step < 12; step += 1) {
			const layer = direction === -1 ? step : 11 - step
			const y = 91 + layer * 36
			const extent = 17 + layer * 14.5
			if (direction === 1 && step === 0) {
				context.lineTo(256, 513)
			}
			context.lineTo(220 + direction * extent, y + 26)
			context.lineTo(220 + direction * (extent * 0.77), y + 9)
		}
	}
	context.closePath()
	context.fill()
	return context
}

function createBoughs(): Bough[] {
	const random = createRandom(271227)
	const boughs: Bough[] = []
	for (let layer = 0; layer < 13; layer += 1) {
		const y = 91 + layer * 32.5
		const span = 17 + layer * 13.4
		for (const side of [-1, 1]) {
			boughs.push({
				x: 220 + (random() - 0.5) * 9,
				y: y - 5 + random() * 13,
				length: span * (0.87 + random() * 0.2),
				angle: side === 1 ? 0.17 + random() * 0.1 : Math.PI - 0.2,
				depth: 0.38,
				seed: Math.floor(random() * 1000000),
			})
			boughs.push({
				x: 220 + (random() - 0.5) * 12,
				y: y - 10 + random() * 8,
				length: span * (0.89 + random() * 0.16),
				angle:
					side === 1 ? 0.24 + random() * 0.13 : Math.PI - 0.2 - random() * 0.16,
				depth: 0.68 + random() * 0.32,
				seed: Math.floor(random() * 1000000),
			})
		}
	}
	return boughs.sort((left, right) => {
		if (left.depth < 0.5 || right.depth < 0.5) {
			return left.depth - right.depth || right.y - left.y
		}
		return right.y - left.y
	})
}

function drawBough({
	context,
	bough,
}: {
	context: CanvasRenderingContext2D
	bough: Bough
}) {
	const random = createRandom(bough.seed)
	const { length, depth } = bough
	const isLeft = Math.cos(bough.angle) < 0
	const mirror = isLeft ? -1 : 1
	context.save()
	context.translate(bough.x, bough.y)
	context.rotate(isLeft ? bough.angle - Math.PI : bough.angle)
	context.scale(mirror, 1)

	const thickness = 9 + length * 0.115
	const shade = context.createLinearGradient(0, -thickness, 0, thickness)
	shade.addColorStop(0, depth < 0.5 ? '#173a35' : '#24483c')
	shade.addColorStop(0.4, depth < 0.5 ? '#102c28' : '#173b2f')
	shade.addColorStop(1, '#0b2622')
	context.fillStyle = shade
	context.beginPath()
	context.moveTo(-5, 8)
	for (let step = 0; step <= 17; step += 1) {
		const progress = step / 17
		const envelope = Math.sin(progress * Math.PI * 0.9) * (1 - progress * 0.62)
		const y = -envelope * thickness - random() * 5
		context.lineTo(progress * length, y)
		context.lineTo(progress * length - 3, y + 5)
	}
	context.lineTo(length + 5, -3)
	for (let step = 17; step >= 0; step -= 1) {
		const progress = step / 17
		const y = (1 - progress) * thickness * 0.8 + random() * 5
		context.lineTo(progress * length, y)
		context.lineTo(progress * length - 5, y - 4)
	}
	context.closePath()
	context.fill()
	context.strokeStyle = depth < 0.5 ? '#1c352b' : '#4a4e32'
	context.lineWidth = 1.3
	context.beginPath()
	context.moveTo(0, 4)
	context.quadraticCurveTo(length * 0.6, 12, length, -2)
	context.stroke()

	const count = Math.max(7, Math.round(length / 7))
	for (let index = 0; index < count; index += 1) {
		const progress = (index + 0.4) / count
		const x = progress * length
		const y = Math.sin(progress * Math.PI) * 4
		for (const direction of [-1, 1]) {
			drawNeedleSpray({
				context,
				x,
				y,
				angle: direction * (0.42 + random() * 0.32),
				length: (11 + thickness * 0.7) * (1 - progress * 0.62),
				depth: depth * (direction === -1 ? 1 : 0.75),
				random,
			})
		}
	}
	if (depth > 0.7 && length > 35 && random() > 0.43) {
		drawBranchSnow({ context, length, random })
	}
	context.restore()
	return context
}

function drawNeedleSpray({
	context,
	x,
	y,
	angle,
	length,
	depth,
	random,
}: {
	context: CanvasRenderingContext2D
	x: number
	y: number
	angle: number
	length: number
	depth: number
	random: () => number
}) {
	const cosine = Math.cos(angle)
	const sine = Math.sin(angle)
	const green = Math.round(53 + depth * 35)
	const blue = Math.round(41 + depth * 24)
	context.strokeStyle = `rgba(${Math.round(26 + depth * 12)}, ${green}, ${blue}, 0.88)`
	context.lineWidth = depth > 0.65 ? 0.95 : 1.2
	context.beginPath()
	context.moveTo(x, y)
	context.lineTo(x + cosine * length, y + sine * length)
	const count = Math.max(4, Math.round(length * 0.7))
	for (let index = 0; index < count; index += 1) {
		const progress = index / count
		const stemX = x + cosine * length * progress
		const stemY = y + sine * length * progress
		for (const side of [-1, 1]) {
			const needle = (3 + random() * 5) * (1 - progress * 0.48)
			const spread = angle + side * (0.58 + random() * 0.45)
			context.moveTo(stemX, stemY)
			context.lineTo(
				stemX + Math.cos(spread) * needle,
				stemY + Math.sin(spread) * needle,
			)
		}
	}
	context.stroke()
	if (depth > 0.72) {
		context.strokeStyle = 'rgba(126, 164, 155, 0.26)'
		context.lineWidth = 0.55
		context.beginPath()
		context.moveTo(x + cosine * length * 0.7, y + sine * length * 0.7)
		context.lineTo(x + cosine * (length + 2), y + sine * (length + 2))
		context.stroke()
	}
	return context
}

function drawBranchSnow({
	context,
	length,
	random,
}: {
	context: CanvasRenderingContext2D
	length: number
	random: () => number
}) {
	context.strokeStyle = 'rgba(184, 205, 207, 0.48)'
	context.lineWidth = 1.4
	context.beginPath()
	const start = length * (0.35 + random() * 0.25)
	context.moveTo(start, -8)
	context.quadraticCurveTo(start + 9, -6, start + 20, -10)
	context.stroke()
	context.fillStyle = 'rgba(211, 228, 225, 0.58)'
	for (let index = 0; index < 9; index += 1) {
		context.beginPath()
		context.ellipse(
			start + random() * 23,
			-6 - random() * 5,
			0.8 + random() * 1.5,
			0.5 + random() * 0.4,
			-0.2,
			0,
			Math.PI * 2,
		)
		context.fill()
	}
	return context
}

function drawCrown(context: CanvasRenderingContext2D) {
	const random = createRandom(8291)
	for (let index = 0; index < 18; index += 1) {
		const y = 61 + index * 2.9
		for (const side of [-1, 1]) {
			drawNeedleSpray({
				context,
				x: 220,
				y,
				angle: side === -1 ? -2.55 : -0.59,
				length: 4 + index * 0.75,
				depth: 0.95,
				random,
			})
		}
	}
	return context
}

function drawLightStrands(context: CanvasRenderingContext2D): TreeLight[] {
	const lights: TreeLight[] = []
	const rows = [
		{ y: 114, span: 23, drop: 19, count: 4 },
		{ y: 171, span: 47, drop: 29, count: 6 },
		{ y: 231, span: 74, drop: 35, count: 8 },
		{ y: 297, span: 105, drop: 41, count: 10 },
		{ y: 369, span: 134, drop: 45, count: 12 },
		{ y: 444, span: 162, drop: 43, count: 14 },
	]
	const random = createRandom(241225)
	for (const [rowIndex, row] of rows.entries()) {
		const left = 220 - row.span
		const right = 220 + row.span
		const tilt = rowIndex % 2 === 0 ? 9 : -8
		context.strokeStyle = 'rgba(22, 36, 24, 0.92)'
		context.lineWidth = 1.8
		context.beginPath()
		context.moveTo(left, row.y)
		context.quadraticCurveTo(220, row.y + row.drop * 2, right, row.y + tilt)
		context.stroke()
		context.strokeStyle = 'rgba(153, 120, 55, 0.53)'
		context.lineWidth = 0.65
		context.stroke()
		for (let index = 0; index < row.count; index += 1) {
			const progress = (index + 0.35 + random() * 0.3) / row.count
			const remaining = 1 - progress
			lights.push({
				x: left + (right - left) * progress,
				y:
					remaining * remaining * row.y +
					2 * remaining * progress * (row.y + row.drop * 2) +
					progress * progress * (row.y + tilt),
				phase: random() * Math.PI * 2,
				size: 1.05 + random() * 0.55,
			})
		}
	}
	return lights
}

function drawOrnaments(context: CanvasRenderingContext2D) {
	const ornaments = [
		{ x: 232, y: 129, size: 4.1, isRed: true },
		{ x: 195, y: 180, size: 5, isRed: false },
		{ x: 247, y: 209, size: 5.8, isRed: true },
		{ x: 213, y: 233, size: 4.7, isRed: false },
		{ x: 174, y: 251, size: 6.2, isRed: true },
		{ x: 280, y: 278, size: 5.4, isRed: false },
		{ x: 235, y: 299, size: 6.4, isRed: true },
		{ x: 153, y: 316, size: 5.5, isRed: false },
		{ x: 192, y: 342, size: 6.6, isRed: true },
		{ x: 300, y: 367, size: 6.2, isRed: true },
		{ x: 248, y: 390, size: 5.7, isRed: false },
		{ x: 134, y: 402, size: 6.4, isRed: true },
		{ x: 191, y: 424, size: 6.5, isRed: false },
		{ x: 321, y: 448, size: 6.6, isRed: false },
		{ x: 269, y: 462, size: 7, isRed: true },
		{ x: 98, y: 471, size: 5.8, isRed: false },
		{ x: 164, y: 493, size: 7, isRed: true },
	]
	for (const { x, y, size, isRed } of ornaments) {
		context.strokeStyle = 'rgba(171, 139, 68, 0.76)'
		context.lineWidth = 0.55
		context.beginPath()
		context.moveTo(x - 1, y - size - 7)
		context.lineTo(x, y - size)
		context.stroke()
		const glass = context.createRadialGradient(
			x - size * 0.36,
			y - size * 0.45,
			size * 0.04,
			x + size * 0.2,
			y + size * 0.2,
			size * 1.2,
		)
		glass.addColorStop(0, isRed ? '#dc8d72' : '#ffedb1')
		glass.addColorStop(0.24, isRed ? '#b14637' : '#cfa851')
		glass.addColorStop(0.58, isRed ? '#7b262c' : '#91723d')
		glass.addColorStop(0.88, isRed ? '#401d25' : '#56462b')
		glass.addColorStop(1, isRed ? '#6d3433' : '#ac8d4e')
		context.fillStyle = glass
		context.beginPath()
		context.arc(x, y, size, 0, Math.PI * 2)
		context.fill()
		context.fillStyle = '#b49656'
		context.fillRect(x - 1.7, y - size - 1.5, 3.4, 2)
		context.fillStyle = 'rgba(255, 242, 208, 0.67)'
		context.beginPath()
		context.ellipse(
			x - size * 0.36,
			y - size * 0.4,
			size * 0.17,
			size * 0.29,
			0.56,
			0,
			Math.PI * 2,
		)
		context.fill()
	}
	return context
}

function drawBulb({
	context,
	light,
}: {
	context: CanvasRenderingContext2D
	light: TreeLight
}) {
	const glow = context.createRadialGradient(
		light.x,
		light.y,
		0,
		light.x,
		light.y,
		12,
	)
	glow.addColorStop(0, 'rgba(255, 207, 108, 0.31)')
	glow.addColorStop(0.24, 'rgba(255, 183, 76, 0.13)')
	glow.addColorStop(1, 'rgba(255, 166, 63, 0)')
	context.fillStyle = glow
	context.fillRect(light.x - 12, light.y - 12, 24, 24)
	context.fillStyle = '#fff0c5'
	context.beginPath()
	context.ellipse(
		light.x,
		light.y,
		light.size * 0.77,
		light.size,
		0,
		0,
		Math.PI * 2,
	)
	context.fill()
	return context
}

function drawStar({
	context,
	star,
}: {
	context: CanvasRenderingContext2D
	star: { x: number; y: number }
}) {
	context.strokeStyle = '#937a3f'
	context.lineWidth = 1.3
	context.beginPath()
	context.moveTo(star.x, star.y + 12)
	context.lineTo(star.x, 63)
	context.stroke()
	const gold = context.createLinearGradient(
		star.x - 14,
		star.y - 17,
		star.x + 14,
		star.y + 17,
	)
	gold.addColorStop(0, '#fff5cb')
	gold.addColorStop(0.35, '#ead397')
	gold.addColorStop(0.55, '#c99949')
	gold.addColorStop(1, '#896432')
	context.fillStyle = gold
	context.beginPath()
	for (let point = 0; point < 10; point += 1) {
		const angle = -Math.PI / 2 + (point * Math.PI) / 5
		const radius = point % 2 === 0 ? 16 : 7.1
		const x = star.x + Math.cos(angle) * radius
		const y = star.y + Math.sin(angle) * radius
		if (point === 0) context.moveTo(x, y)
		else context.lineTo(x, y)
	}
	context.closePath()
	context.fill()
	context.strokeStyle = 'rgba(255, 240, 187, 0.76)'
	context.lineWidth = 0.7
	context.stroke()
	for (let point = 0; point < 5; point += 1) {
		const angle = -Math.PI / 2 + (point * Math.PI * 2) / 5
		const nextAngle = angle + Math.PI / 5
		context.fillStyle =
			point < 2 ? 'rgba(255, 248, 215, 0.38)' : 'rgba(102, 63, 27, 0.23)'
		context.beginPath()
		context.moveTo(star.x, star.y)
		context.lineTo(star.x + Math.cos(angle) * 16, star.y + Math.sin(angle) * 16)
		context.lineTo(
			star.x + Math.cos(nextAngle) * 7.1,
			star.y + Math.sin(nextAngle) * 7.1,
		)
		context.closePath()
		context.fill()
	}
	return context
}

function createRandom(seed: number): () => number {
	let state = seed >>> 0
	return () => {
		state = (Math.imul(1664525, state) + 1013904223) >>> 0
		return state / 4294967296
	}
}

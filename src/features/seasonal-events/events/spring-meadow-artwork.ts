type BotanicalSprite = {
	canvas: HTMLCanvasElement
	width: number
	height: number
	baseX: number
	baseY: number
}

type FlowerKind = 'ivory' | 'pink' | 'blue' | 'yellow'

type FlowerStem = {
	x: number
	y: number
	radius: number
	bend: number
	tilt: number
	isBud?: boolean
}

type FlowerSpec = {
	width: number
	height: number
	kind: FlowerKind
	stems: FlowerStem[]
}

type Point = { x: number; y: number }

export function createSpringMeadowArtwork({ dpr }: { dpr: number }): {
	flowers: BotanicalSprite[]
	grasses: BotanicalSprite[]
} {
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	const flowers: FlowerSpec[] = [
		{
			width: 112,
			height: 218,
			kind: 'ivory',
			stems: [
				{ x: 48, y: 41, radius: 23, bend: 19, tilt: -0.15 },
				{ x: 82, y: 98, radius: 11, bend: -4, tilt: 0.2 },
				{ x: 26, y: 129, radius: 5, bend: -14, tilt: -0.3, isBud: true },
			],
		},
		{
			width: 112,
			height: 230,
			kind: 'pink',
			stems: [
				{ x: 64, y: 40, radius: 25, bend: -13, tilt: 0.14 },
				{ x: 29, y: 102, radius: 6, bend: -18, tilt: -0.4, isBud: true },
				{ x: 88, y: 134, radius: 13, bend: 20, tilt: 0.3 },
			],
		},
		{
			width: 100,
			height: 210,
			kind: 'blue',
			stems: [
				{ x: 57, y: 37, radius: 9, bend: 9, tilt: 0.1 },
				{ x: 28, y: 64, radius: 8, bend: -17, tilt: -0.25 },
				{ x: 75, y: 87, radius: 9, bend: 18, tilt: 0.3 },
				{ x: 33, y: 112, radius: 7, bend: -19, tilt: -0.1 },
				{ x: 45, y: 22, radius: 3.5, bend: -8, tilt: -0.3, isBud: true },
			],
		},
		{
			width: 100,
			height: 182,
			kind: 'yellow',
			stems: [
				{ x: 40, y: 40, radius: 17, bend: 17, tilt: -0.2 },
				{ x: 75, y: 87, radius: 11, bend: 18, tilt: 0.3 },
				{ x: 23, y: 103, radius: 4, bend: -19, tilt: -0.4, isBud: true },
			],
		},
		{
			width: 112,
			height: 174,
			kind: 'ivory',
			stems: [
				{ x: 37, y: 41, radius: 17, bend: -16, tilt: -0.23 },
				{ x: 81, y: 75, radius: 15, bend: 16, tilt: 0.22 },
				{ x: 58, y: 103, radius: 4, bend: -9, tilt: 0.12, isBud: true },
			],
		},
		{
			width: 108,
			height: 196,
			kind: 'pink',
			stems: [
				{ x: 39, y: 42, radius: 21, bend: -13, tilt: -0.17 },
				{ x: 80, y: 90, radius: 6, bend: 20, tilt: 0.28, isBud: true },
			],
		},
	]
	return {
		flowers: flowers.map((spec, index) =>
			createFlowerSprite({ spec, index, dpr: pixelRatio }),
		),
		grasses: Array.from({ length: 4 }, (_, index) =>
			createGrassSprite({ index, dpr: pixelRatio }),
		),
	}
}

function createFlowerSprite({
	spec,
	index,
	dpr,
}: {
	spec: FlowerSpec
	index: number
	dpr: number
}): BotanicalSprite {
	const { sprite, context } = createSurface({ ...spec, dpr })
	const base = { x: sprite.baseX, y: sprite.baseY }
	for (const [stemIndex, stem] of spec.stems.entries()) {
		const control = {
			x: base.x + stem.bend,
			y: stem.y + (base.y - stem.y) * 0.57,
		}
		const end = { x: stem.x, y: stem.y + stem.radius * 0.16 }
		const stemGradient = context.createLinearGradient(0, stem.y, 0, base.y)
		stemGradient.addColorStop(0, '#9aa96c')
		stemGradient.addColorStop(0.5, '#74955a')
		stemGradient.addColorStop(1, '#466d4a')
		context.strokeStyle = stemGradient
		context.lineWidth = stemIndex === 0 ? 2 : 1.25
		context.lineCap = 'round'
		context.beginPath()
		context.moveTo(base.x, base.y)
		context.quadraticCurveTo(control.x, control.y, end.x, end.y)
		context.stroke()
		context.strokeStyle = 'rgba(181, 200, 136, 0.45)'
		context.lineWidth = 0.45
		context.stroke()

		const leafCount = stemIndex === 0 ? 3 : 1
		for (let leafIndex = 0; leafIndex < leafCount; leafIndex += 1) {
			const progress = 0.24 + leafIndex * 0.21 + stemIndex * 0.08
			const anchor = getStemPoint({ base, control, end, progress })
			const side = (leafIndex + stemIndex + index) % 2 === 0 ? -1 : 1
			context.save()
			context.translate(anchor.x, anchor.y)
			context.rotate(side * (0.8 + noise(index + leafIndex * 7) * 0.3))
			if (spec.kind === 'pink') {
				drawFeatheryLeaf(context, 32 - leafIndex * 3)
			} else {
				drawLeaf({
					context,
					length: (spec.kind === 'blue' ? 24 : 32) - leafIndex * 4,
					width: spec.kind === 'blue' ? 5 : 7.5,
				})
			}
			context.restore()
		}
	}

	for (const [stemIndex, stem] of spec.stems.entries()) {
		context.save()
		context.translate(stem.x, stem.y)
		context.rotate(stem.tilt)
		if (stem.isBud) {
			drawBud({ context, kind: spec.kind, radius: stem.radius })
		} else {
			drawFlower({
				context,
				kind: spec.kind,
				radius: stem.radius,
				seed: index * 13 + stemIndex * 7,
			})
		}
		context.restore()
	}
	return sprite
}

function createGrassSprite({
	index,
	dpr,
}: {
	index: number
	dpr: number
}): BotanicalSprite {
	const { sprite, context } = createSurface({ width: 130, height: 98, dpr })
	for (let blade = 0; blade < 25; blade += 1) {
		const seed = index * 101 + blade * 3.7
		const rootX = sprite.baseX + (noise(seed) - 0.5) * 55
		const tipX = Math.max(
			5,
			Math.min(125, rootX + (noise(seed + 1) - 0.5) * 79),
		)
		const tipY = sprite.baseY - 23 - noise(seed + 2) * 65
		const thickness = 0.75 + noise(seed + 3) * 1.8
		const bend = (tipX - rootX) * 0.26 + (index - 1.5) * 4
		const gradient = context.createLinearGradient(
			rootX,
			sprite.baseY,
			tipX,
			tipY,
		)
		gradient.addColorStop(0, '#395e40')
		gradient.addColorStop(0.44, blade % 3 === 0 ? '#8eab64' : '#638b54')
		gradient.addColorStop(1, blade % 4 === 0 ? '#b7c487' : '#90ad6e')
		context.fillStyle = gradient
		context.beginPath()
		context.moveTo(rootX - thickness, sprite.baseY)
		context.bezierCurveTo(
			rootX + bend - thickness,
			sprite.baseY - 20,
			tipX - bend,
			tipY + 14,
			tipX,
			tipY,
		)
		context.bezierCurveTo(
			tipX - bend + 2,
			tipY + 20,
			rootX + bend + thickness,
			sprite.baseY - 18,
			rootX + thickness * 0.5,
			sprite.baseY,
		)
		context.closePath()
		context.fill()
	}
	return sprite
}

function drawLeaf({
	context,
	length,
	width,
}: {
	context: CanvasRenderingContext2D
	length: number
	width: number
}) {
	const gradient = context.createLinearGradient(-width, 0, width, -length)
	gradient.addColorStop(0, '#446e49')
	gradient.addColorStop(0.48, '#6c955a')
	gradient.addColorStop(1, '#a9bb7c')
	context.fillStyle = gradient
	context.beginPath()
	context.moveTo(0, 0)
	context.bezierCurveTo(
		-width,
		-length * 0.28,
		-width,
		-length * 0.64,
		1,
		-length,
	)
	context.bezierCurveTo(width * 0.8, -length * 0.59, width, -length * 0.3, 0, 0)
	context.fill()
	context.strokeStyle = 'rgba(204, 216, 151, 0.52)'
	context.lineWidth = 0.65
	context.beginPath()
	context.moveTo(0, 0)
	context.quadraticCurveTo(-1, -length * 0.48, 1, -length + 1)
	for (let vein = 1; vein < 4; vein += 1) {
		const y = -length * (0.17 + vein * 0.15)
		context.moveTo(0, y)
		context.quadraticCurveTo(
			-width * 0.3,
			y - 1,
			-width * 0.53,
			y - length * 0.14,
		)
		context.moveTo(0, y - 1)
		context.quadraticCurveTo(
			width * 0.3,
			y - 3,
			width * 0.49,
			y - length * 0.18,
		)
	}
	context.stroke()
	return context
}

function drawFeatheryLeaf(context: CanvasRenderingContext2D, length: number) {
	context.strokeStyle = '#769962'
	context.lineWidth = 0.9
	context.beginPath()
	context.moveTo(0, 0)
	context.quadraticCurveTo(-2, -length * 0.5, 0, -length)
	context.stroke()
	for (let pair = 0; pair < 4; pair += 1) {
		for (const side of [-1, 1]) {
			context.save()
			context.translate(-0.5, -length * (0.17 + pair * 0.16))
			context.rotate(side * (0.67 + pair * 0.06))
			drawLeaf({ context, length: length * (0.56 - pair * 0.085), width: 1.9 })
			context.restore()
		}
	}
	return context
}

function drawFlower({
	context,
	kind,
	radius,
	seed,
}: {
	context: CanvasRenderingContext2D
	kind: FlowerKind
	radius: number
	seed: number
}) {
	const petalCount = kind === 'pink' ? 8 : kind === 'blue' ? 5 : 16
	const centerRadius = radius * (kind === 'blue' ? 0.2 : 0.24)
	context.scale(1, kind === 'blue' ? 0.91 : 0.82)
	for (let petal = 0; petal < petalCount; petal += 1) {
		const variation = noise(seed + petal * 2.4)
		const length = radius * (0.87 + variation * 0.19)
		const width =
			length * (kind === 'pink' ? 0.43 : kind === 'blue' ? 0.48 : 0.18)
		context.save()
		context.rotate((petal / petalCount) * Math.PI * 2 + variation * 0.09)
		const gradient = context.createLinearGradient(0, -centerRadius, 0, -length)
		if (kind === 'pink') {
			gradient.addColorStop(0, '#c7819c')
			gradient.addColorStop(0.45, '#e9b2c4')
			gradient.addColorStop(1, '#f6d8df')
		} else if (kind === 'blue') {
			gradient.addColorStop(0, '#817dae')
			gradient.addColorStop(0.55, '#aaaed6')
			gradient.addColorStop(1, '#ccd4ed')
		} else if (kind === 'yellow') {
			gradient.addColorStop(0, '#d3ac59')
			gradient.addColorStop(0.5, '#ead18b')
			gradient.addColorStop(1, '#f5e5b4')
		} else {
			gradient.addColorStop(0, '#d1d3b6')
			gradient.addColorStop(0.4, '#ebe9d8')
			gradient.addColorStop(1, '#fff7e6')
		}
		context.fillStyle = gradient
		context.beginPath()
		context.moveTo(-width * 0.2, -centerRadius * 0.56)
		context.bezierCurveTo(
			-width * 0.8,
			-length * 0.48,
			-width * 1.03,
			-length * 0.85,
			-width * 0.5,
			-length,
		)
		if (kind === 'pink') {
			context.quadraticCurveTo(-width * 0.18, -length * 0.93, 0, -length * 0.98)
			context.quadraticCurveTo(
				width * 0.27,
				-length * 0.93,
				width * 0.5,
				-length,
			)
		} else {
			context.quadraticCurveTo(0, -length * 1.09, width * 0.5, -length)
		}
		context.bezierCurveTo(
			width,
			-length * 0.85,
			width * 0.8,
			-length * 0.45,
			width * 0.15,
			-centerRadius * 0.56,
		)
		context.closePath()
		context.fill()
		context.strokeStyle =
			kind === 'pink' ? 'rgba(146, 94, 126, 0.18)' : 'rgba(118, 124, 112, 0.14)'
		context.lineWidth = 0.45
		context.beginPath()
		context.moveTo(0, -centerRadius)
		context.quadraticCurveTo(-width * 0.15, -length * 0.6, 0, -length * 0.88)
		if (kind === 'pink') {
			context.moveTo(-width * 0.1, -centerRadius)
			context.quadraticCurveTo(
				-width * 0.48,
				-length * 0.6,
				-width * 0.35,
				-length * 0.9,
			)
			context.moveTo(width * 0.1, -centerRadius)
			context.quadraticCurveTo(
				width * 0.48,
				-length * 0.6,
				width * 0.35,
				-length * 0.9,
			)
		}
		context.stroke()
		context.restore()
	}

	const center = context.createRadialGradient(
		-centerRadius * 0.25,
		-centerRadius * 0.3,
		0,
		0,
		0,
		centerRadius,
	)
	center.addColorStop(0, kind === 'blue' ? '#f3e5b4' : '#ecd487')
	center.addColorStop(0.55, '#d5b365')
	center.addColorStop(1, '#997a40')
	context.fillStyle = center
	context.beginPath()
	context.arc(0, 0, centerRadius, 0, Math.PI * 2)
	context.fill()
	const stamenCount = kind === 'blue' ? 7 : 31
	for (let stamen = 0; stamen < stamenCount; stamen += 1) {
		const distance = Math.sqrt(stamen / stamenCount) * centerRadius * 0.86
		const angle = stamen * 2.39996
		context.fillStyle = stamen % 3 === 0 ? '#977941' : '#f5dda0'
		context.beginPath()
		context.arc(
			Math.cos(angle) * distance,
			Math.sin(angle) * distance,
			Math.max(0.3, radius * 0.026),
			0,
			Math.PI * 2,
		)
		context.fill()
	}
	return context
}

function drawBud({
	context,
	kind,
	radius,
}: {
	context: CanvasRenderingContext2D
	kind: FlowerKind
	radius: number
}) {
	const gradient = context.createLinearGradient(-radius, 0, radius, -radius)
	gradient.addColorStop(0, kind === 'pink' ? '#a6798a' : '#879d70')
	gradient.addColorStop(0.5, kind === 'pink' ? '#e4b6c4' : '#d9dfbd')
	gradient.addColorStop(1, kind === 'blue' ? '#b7bcdd' : '#e5d6b4')
	context.fillStyle = gradient
	context.beginPath()
	context.ellipse(0, -radius * 0.5, radius * 0.7, radius, 0, 0, Math.PI * 2)
	context.fill()
	context.strokeStyle = 'rgba(90, 113, 75, 0.55)'
	context.lineWidth = 0.5
	context.beginPath()
	context.moveTo(0, radius * 0.4)
	context.quadraticCurveTo(-radius * 0.3, -radius * 0.5, 0, -radius * 1.4)
	context.stroke()
	context.fillStyle = '#718b57'
	context.beginPath()
	context.moveTo(-radius * 0.75, -radius * 0.4)
	context.quadraticCurveTo(-radius * 0.5, radius * 0.9, 0, radius * 0.7)
	context.quadraticCurveTo(
		radius * 0.5,
		radius * 0.8,
		radius * 0.75,
		-radius * 0.4,
	)
	context.lineTo(radius * 0.25, radius * 0.1)
	context.lineTo(0, -radius * 0.2)
	context.lineTo(-radius * 0.25, radius * 0.1)
	context.closePath()
	context.fill()
	return context
}

function createSurface({
	width,
	height,
	dpr,
}: {
	width: number
	height: number
	dpr: number
}) {
	const canvas = document.createElement('canvas')
	canvas.width = Math.round(width * dpr)
	canvas.height = Math.round(height * dpr)
	const context = canvas.getContext('2d')
	if (!context) {
		throw new Error('Unable to create spring meadow artwork')
	}
	context.setTransform(dpr, 0, 0, dpr, 0, 0)
	return {
		context,
		sprite: { canvas, width, height, baseX: width / 2, baseY: height - 3 },
	}
}

function getStemPoint({
	base,
	control,
	end,
	progress,
}: {
	base: Point
	control: Point
	end: Point
	progress: number
}): Point {
	const inverse = 1 - progress
	return {
		x:
			inverse * inverse * base.x +
			2 * inverse * progress * control.x +
			progress * progress * end.x,
		y:
			inverse * inverse * base.y +
			2 * inverse * progress * control.y +
			progress * progress * end.y,
	}
}

function noise(seed: number) {
	const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
	return value - Math.floor(value)
}

type Point = { x: number; y: number }

type Stem = {
	start: Point
	control1: Point
	control2: Point
	end: Point
	width: number
}

type Blossom = Point & {
	size: number
	rotation: number
	delay: number
	variant: number
}

type SpringBranchArtwork = {
	canvas: HTMLCanvasElement
	width: number
	height: number
	blossomSprites: HTMLCanvasElement[]
	blossoms: Blossom[]
}

export function createSpringBranchArtwork({
	dpr,
}: {
	dpr: number
}): SpringBranchArtwork {
	const width = 680
	const height = 320
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	const { canvas, context } = createCanvas({ width, height, pixelRatio })
	const random = createRandom(200327)
	const stems = createStems()
	const blossoms: Blossom[] = []

	for (const stem of stems) {
		drawStem({ context, stem, random })
	}
	for (const [index, stem] of stems.entries()) {
		if (index === 0) continue
		for (let leaf = 0; leaf < 3; leaf += 1) {
			const progress = 0.38 + leaf * 0.22
			const point = pointOnStem({ stem, progress })
			const direction = leaf % 2 === 0 ? -1 : 1
			drawLeaf({
				context,
				point,
				angle: direction * (0.7 + random() * 0.7) - 0.6,
				size: 11 + random() * 10,
				isYoung: leaf === 2,
			})
		}
		const count = index === 4 || index === 8 ? 4 : 3
		for (let flower = 0; flower < count; flower += 1) {
			const angle = -2.45 + flower * 2.18 + random() * 0.35
			const distance = flower === 0 ? 5 : 14 + random() * 7
			const x = stem.end.x + Math.cos(angle) * distance
			const y = stem.end.y + Math.sin(angle) * distance
			const anchor = pointOnStem({ stem, progress: 0.86 })
			drawFlowerStem({ context, anchor, point: { x, y } })
			blossoms.push({
				x,
				y,
				size: 20 + random() * 14,
				rotation: random() * Math.PI * 2,
				delay: (x / width) * 0.85 + random() * 0.6,
				variant: (index + flower) % 3,
			})
		}
		const budAnchor = pointOnStem({ stem, progress: 0.65 })
		const bud = {
			x: budAnchor.x + (index % 2 === 0 ? -12 : 14),
			y: budAnchor.y - 13,
		}
		drawFlowerStem({ context, anchor: budAnchor, point: bud })
		drawBud({ context, point: bud, rotation: index * 0.48 - 1.2 })
	}

	const blossomSprites = Array.from({ length: 3 }, (_, variant) =>
		createBlossomSprite({ pixelRatio, variant }),
	)
	return { canvas, width, height, blossomSprites, blossoms }
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
	if (!context) {
		throw new Error('Unable to create the spring branch artwork canvas')
	}
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	context.lineCap = 'round'
	context.lineJoin = 'round'
	return { canvas, context }
}

function createStems(): Stem[] {
	const main: Stem = {
		start: { x: -28, y: 43 },
		control1: { x: 123, y: 65 },
		control2: { x: 334, y: 77 },
		end: { x: 557, y: 150 },
		width: 19,
	}
	const limbs = [
		{ at: 0.17, end: { x: 139, y: 29 }, width: 5.3 },
		{ at: 0.27, end: { x: 191, y: 177 }, width: 5.4 },
		{ at: 0.41, end: { x: 282, y: 34 }, width: 4.3 },
		{ at: 0.49, end: { x: 346, y: 207 }, width: 4.7 },
		{ at: 0.66, end: { x: 411, y: 37 }, width: 3.1 },
		{ at: 0.73, end: { x: 467, y: 263 }, width: 3.6 },
		{ at: 0.87, end: { x: 553, y: 89 }, width: 2.5 },
		{ at: 0.94, end: { x: 603, y: 190 }, width: 1.8 },
		{ at: 0.98, end: { x: 579, y: 144 }, width: 1.3 },
	]
	return [
		main,
		...limbs.map(({ at, end, width }) => {
			const start = pointOnStem({ stem: main, progress: at })
			const deltaX = end.x - start.x
			const deltaY = end.y - start.y
			return {
				start,
				control1: {
					x: start.x + deltaX * 0.64,
					y: start.y + deltaY * 0.12,
				},
				control2: {
					x: end.x - deltaX * 0.36,
					y: end.y - deltaY * 0.14,
				},
				end,
				width,
			}
		}),
	]
}

function drawStem({
	context,
	stem,
	random,
}: {
	context: CanvasRenderingContext2D
	stem: Stem
	random: () => number
}) {
	const edges: { left: Point; right: Point }[] = []
	for (let index = 0; index <= 44; index += 1) {
		const progress = index / 44
		const point = pointOnStem({ stem, progress })
		const next = pointOnStem({ stem, progress: Math.min(1, progress + 0.015) })
		const previous = pointOnStem({
			stem,
			progress: Math.max(0, progress - 0.015),
		})
		const angle = Math.atan2(next.y - previous.y, next.x - previous.x)
		const radius = (stem.width * Math.pow(1 - progress, 1.12) + 0.65) / 2
		const roughness = 1 + (random() - 0.5) * 0.16
		const normalX = -Math.sin(angle) * radius * roughness
		const normalY = Math.cos(angle) * radius * roughness
		edges.push({
			left: { x: point.x + normalX, y: point.y + normalY },
			right: { x: point.x - normalX, y: point.y - normalY },
		})
	}
	const bark = context.createLinearGradient(
		stem.start.x,
		stem.start.y - 11,
		stem.end.x,
		stem.end.y + 13,
	)
	bark.addColorStop(0, '#66534c')
	bark.addColorStop(0.38, '#80675d')
	bark.addColorStop(0.75, '#66564d')
	bark.addColorStop(1, '#85725d')
	context.fillStyle = bark
	context.beginPath()
	for (const [index, edge] of edges.entries()) {
		if (index === 0) context.moveTo(edge.left.x, edge.left.y)
		else context.lineTo(edge.left.x, edge.left.y)
	}
	for (let index = edges.length - 1; index >= 0; index -= 1) {
		context.lineTo(edges[index].right.x, edges[index].right.y)
	}
	context.closePath()
	context.fill()
	context.lineWidth = stem.width > 10 ? 1.2 : 0.7
	context.strokeStyle = 'rgba(212, 181, 151, 0.34)'
	context.beginPath()
	for (const [index, edge] of edges.entries()) {
		if (index === 0) context.moveTo(edge.right.x, edge.right.y)
		else context.lineTo(edge.right.x, edge.right.y)
	}
	context.stroke()
	context.strokeStyle = 'rgba(47, 43, 37, 0.32)'
	context.lineWidth = 0.65
	for (let index = 0; index < stem.width * 3; index += 1) {
		const progress = random() * 0.84
		const start = pointOnStem({ stem, progress })
		const end = pointOnStem({
			stem,
			progress: progress + 0.012 + random() * 0.018,
		})
		const offset = (random() - 0.5) * stem.width * (1 - progress) * 0.72
		context.beginPath()
		context.moveTo(start.x, start.y + offset)
		context.quadraticCurveTo(
			(start.x + end.x) / 2,
			start.y + offset - 0.7,
			end.x,
			end.y + offset,
		)
		context.stroke()
	}
	return context
}

function drawLeaf({
	context,
	point,
	angle,
	size,
	isYoung,
}: {
	context: CanvasRenderingContext2D
	point: Point
	angle: number
	size: number
	isYoung: boolean
}) {
	context.save()
	context.translate(point.x, point.y)
	context.rotate(angle)
	const leaf = context.createLinearGradient(0, -size * 0.3, 0, size * 0.25)
	leaf.addColorStop(0, isYoung ? '#b3bd85' : '#91a77b')
	leaf.addColorStop(0.48, isYoung ? '#9dab73' : '#789571')
	leaf.addColorStop(0.51, isYoung ? '#83975e' : '#638568')
	leaf.addColorStop(1, isYoung ? '#819564' : '#53765c')
	context.fillStyle = leaf
	context.beginPath()
	context.moveTo(0, 0)
	context.bezierCurveTo(
		size * 0.25,
		-size * 0.39,
		size * 0.69,
		-size * 0.27,
		size,
		-size * 0.12,
	)
	context.bezierCurveTo(
		size * 0.73,
		size * 0.27,
		size * 0.29,
		size * 0.33,
		0,
		0,
	)
	context.fill()
	context.strokeStyle = 'rgba(211, 223, 168, 0.56)'
	context.lineWidth = 0.65
	context.beginPath()
	context.moveTo(0, 0)
	context.quadraticCurveTo(size * 0.55, size * 0.04, size * 0.95, -size * 0.11)
	for (let index = 1; index <= 4; index += 1) {
		const x = size * index * 0.16
		context.moveTo(x, 0)
		context.lineTo(x + size * 0.12, -size * 0.18)
		context.moveTo(x, 0)
		context.lineTo(x + size * 0.12, size * 0.17)
	}
	context.stroke()
	context.restore()
	return context
}

function drawFlowerStem({
	context,
	anchor,
	point,
}: {
	context: CanvasRenderingContext2D
	anchor: Point
	point: Point
}) {
	context.strokeStyle = '#88946c'
	context.lineWidth = 0.8
	context.beginPath()
	context.moveTo(anchor.x, anchor.y)
	context.quadraticCurveTo(
		anchor.x + (point.x - anchor.x) * 0.4,
		point.y + 3,
		point.x,
		point.y,
	)
	context.stroke()
	return context
}

function drawBud({
	context,
	point,
	rotation,
}: {
	context: CanvasRenderingContext2D
	point: Point
	rotation: number
}) {
	context.save()
	context.translate(point.x, point.y)
	context.rotate(rotation)
	const blush = context.createLinearGradient(-3, 0, 3, 0)
	blush.addColorStop(0, '#b77d83')
	blush.addColorStop(0.45, '#e8b6b7')
	blush.addColorStop(0.7, '#edd0c7')
	blush.addColorStop(1, '#bf8b93')
	context.fillStyle = blush
	context.beginPath()
	context.moveTo(0, 3)
	context.bezierCurveTo(-6, 0, -3, -7, 0, -8)
	context.bezierCurveTo(3.5, -5, 4.5, 0, 0, 3)
	context.fill()
	context.fillStyle = '#7e8d61'
	context.beginPath()
	context.moveTo(-3, 0)
	context.lineTo(0, 4)
	context.lineTo(3, -1)
	context.lineTo(0, 1)
	context.fill()
	context.restore()
	return context
}

function createBlossomSprite({
	pixelRatio,
	variant,
}: {
	pixelRatio: number
	variant: number
}): HTMLCanvasElement {
	const { canvas, context } = createCanvas({
		width: 80,
		height: 80,
		pixelRatio,
	})
	const random = createRandom(8391 + variant * 73)
	context.translate(40, 40)
	for (let petal = 0; petal < 5; petal += 1) {
		context.save()
		context.rotate((petal * Math.PI * 2) / 5 + variant * 0.14)
		const reach = 29 + random() * 5
		const breadth = 12 + random() * 2.5
		const blush = context.createLinearGradient(0, 3, 0, -reach)
		blush.addColorStop(0, variant === 2 ? '#cd8e9e' : '#dda5af')
		blush.addColorStop(0.24, variant === 1 ? '#ecd4cf' : '#f0ccd0')
		blush.addColorStop(0.65, variant === 2 ? '#f0dce0' : '#f8e9e1')
		blush.addColorStop(1, variant === 1 ? '#fff8e9' : '#ffefec')
		context.fillStyle = blush
		context.beginPath()
		context.moveTo(-2, 4)
		context.bezierCurveTo(
			-breadth * 0.65,
			-6,
			-breadth * 1.22,
			-reach * 0.66,
			-breadth * 0.6,
			-reach * 0.93,
		)
		context.bezierCurveTo(
			-breadth * 0.32,
			-reach * 1.05,
			-2,
			-reach * 1.01,
			0,
			-reach * 0.89,
		)
		context.bezierCurveTo(
			3,
			-reach * 1.02,
			breadth * 0.61,
			-reach * 1.04,
			breadth * 0.83,
			-reach * 0.81,
		)
		context.bezierCurveTo(
			breadth * 1.16,
			-reach * 0.41,
			breadth * 0.5,
			-7,
			2,
			4,
		)
		context.closePath()
		context.fill()
		context.strokeStyle = 'rgba(189, 135, 146, 0.3)'
		context.lineWidth = 0.65
		context.stroke()
		context.strokeStyle = 'rgba(197, 131, 149, 0.24)'
		context.lineWidth = 0.5
		for (let vein = -2; vein <= 2; vein += 1) {
			context.beginPath()
			context.moveTo(vein * 0.75, -3)
			context.bezierCurveTo(
				vein * 1.9,
				-reach * 0.24,
				vein * 3.1,
				-reach * 0.51,
				vein * 3.2,
				-reach * 0.77,
			)
			context.stroke()
		}
		context.restore()
	}
	const heart = context.createRadialGradient(0, 0, 0, 0, 0, 8)
	heart.addColorStop(0, '#bd996b')
	heart.addColorStop(0.47, '#d9b496')
	heart.addColorStop(1, 'rgba(222, 169, 168, 0)')
	context.fillStyle = heart
	context.beginPath()
	context.arc(0, 0, 8, 0, Math.PI * 2)
	context.fill()
	for (let stamen = 0; stamen < 19; stamen += 1) {
		const angle = (stamen * Math.PI * 2) / 19 + random() * 0.15
		const radius = 6 + random() * 6
		const x = Math.cos(angle) * radius
		const y = Math.sin(angle) * radius
		context.strokeStyle = 'rgba(160, 112, 98, 0.74)'
		context.lineWidth = 0.55
		context.beginPath()
		context.moveTo(Math.cos(angle) * 2, Math.sin(angle) * 2)
		context.quadraticCurveTo(x * 0.7 + 0.8, y * 0.55, x, y)
		context.stroke()
		context.fillStyle = stamen % 3 === 0 ? '#b4944b' : '#d1b461'
		context.beginPath()
		context.ellipse(x, y, 1.1, 0.8, angle, 0, Math.PI * 2)
		context.fill()
	}
	return canvas
}

function pointOnStem({
	stem,
	progress,
}: {
	stem: Stem
	progress: number
}): Point {
	const inverse = 1 - progress
	return {
		x:
			inverse ** 3 * stem.start.x +
			3 * inverse ** 2 * progress * stem.control1.x +
			3 * inverse * progress ** 2 * stem.control2.x +
			progress ** 3 * stem.end.x,
		y:
			inverse ** 3 * stem.start.y +
			3 * inverse ** 2 * progress * stem.control1.y +
			3 * inverse * progress ** 2 * stem.control2.y +
			progress ** 3 * stem.end.y,
	}
}

function createRandom(seed: number): () => number {
	let state = seed >>> 0
	return () => {
		state = (Math.imul(1664525, state) + 1013904223) >>> 0
		return state / 4294967296
	}
}

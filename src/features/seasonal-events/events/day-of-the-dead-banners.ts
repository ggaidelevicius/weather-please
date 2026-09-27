export function createDayOfTheDeadBanners({
	dpr,
}: {
	dpr: number
}): HTMLCanvasElement[] {
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	const palettes = [
		['#dc699f', '#c94582', '#a82f6a'],
		['#53c5bd', '#30a5a6', '#247e8b'],
		['#f7c966', '#e8a63b', '#d18727'],
		['#b28bcf', '#9564b9', '#79439a'],
		['#f1937e', '#e57162', '#c65054'],
	]
	return palettes.map((colors, variant) => {
		const canvas = document.createElement('canvas')
		canvas.width = Math.round(128 * pixelRatio)
		canvas.height = Math.round(160 * pixelRatio)
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create the papel picado artwork canvas')
		}
		context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
		const paper = context.createLinearGradient(20, 8, 114, 148)
		paper.addColorStop(0, colors[0])
		paper.addColorStop(0.48, colors[1])
		paper.addColorStop(1, colors[2])
		context.fillStyle = paper
		paperOutline(context)
		context.fill()
		context.strokeStyle = 'rgba(255, 236, 205, 0.2)'
		context.lineWidth = 0.7
		context.stroke()
		context.fillStyle = 'rgba(255, 244, 219, 0.06)'
		context.fillRect(63.5, 9, 0.8, 128)

		context.globalCompositeOperation = 'destination-out'
		context.fillStyle = '#000'
		cutLaceBorder(context)
		if (variant === 0 || variant === 4) {
			cutSkull({ context, hasFloralEyes: variant === 4 })
		} else if (variant === 2) {
			cutGeometricFlower(context)
		} else {
			cutFloralSprig({ context, isRounded: variant === 1 })
		}
		context.globalCompositeOperation = 'source-over'
		return canvas
	})
}

function cutDiamond({
	context,
	height,
	width,
	x,
	y,
}: {
	context: CanvasRenderingContext2D
	height: number
	width: number
	x: number
	y: number
}) {
	context.beginPath()
	context.moveTo(x, y - height)
	context.lineTo(x + width, y)
	context.lineTo(x, y + height)
	context.lineTo(x - width, y)
	context.closePath()
	context.fill()
	return context
}

function cutFloralSprig({
	context,
	isRounded,
}: {
	context: CanvasRenderingContext2D
	isRounded: boolean
}) {
	cutRosette({
		context,
		petals: isRounded ? 8 : 6,
		radius: isRounded ? 28 : 26,
		x: 64,
		y: 68,
	})
	context.lineWidth = 2
	context.strokeStyle = '#000'
	context.beginPath()
	context.moveTo(64, 101)
	context.quadraticCurveTo(65, 110, 63, 123)
	context.stroke()
	for (const [x, y, length, side] of [
		[58, 107, 21, -1],
		[69, 116, 21, 1],
		[37, 85, 17, -1],
		[91, 87, 17, 1],
	]) {
		cutPetal({ angle: side * 0.94, context, length, width: 5, x, y })
	}
	cutRosette({ context, petals: 5, radius: 7, x: 39, y: 37 })
	cutRosette({ context, petals: 5, radius: 7, x: 89, y: 37 })
	return context
}

function cutGeometricFlower(context: CanvasRenderingContext2D) {
	cutDiamond({ context, height: 5, width: 5, x: 64, y: 77 })
	for (let ray = 0; ray < 8; ray += 1) {
		context.save()
		context.translate(64, 77)
		context.rotate((ray / 8) * Math.PI * 2)
		context.beginPath()
		context.moveTo(0, -10)
		context.lineTo(-5.8, -22)
		context.lineTo(0, -32)
		context.lineTo(5.8, -22)
		context.closePath()
		context.fill()
		context.beginPath()
		context.arc(0, -37.5, 2.1, 0, Math.PI * 2)
		context.fill()
		context.restore()
	}
	for (const y of [35, 119]) {
		cutDiamond({ context, height: 4.5, width: 4, x: 64, y })
		cutPetal({ angle: -Math.PI / 2, context, length: 12, width: 3.8, x: 53, y })
		cutPetal({ angle: Math.PI / 2, context, length: 12, width: 3.8, x: 75, y })
	}
	return context
}

function cutLaceBorder(context: CanvasRenderingContext2D) {
	for (let index = 0; index < 7; index += 1) {
		const y = 32 + index * 14
		for (const x of [15, 113]) {
			cutDiamond({ context, height: 4.6, width: 3.3, x, y })
			context.beginPath()
			context.arc(x, y + 7, 1.3, 0, Math.PI * 2)
			context.fill()
		}
	}
	for (let index = 0; index < 7; index += 1) {
		cutDiamond({
			context,
			height: 3.7,
			width: 3.4,
			x: 28 + index * 12,
			y: 22,
		})
	}
	for (let scallop = 0; scallop < 5; scallop += 1) {
		const x = 17.6 + scallop * 23.2
		context.beginPath()
		context.ellipse(x, 138.5, 2.2, 4.6, 0, 0, Math.PI * 2)
		context.fill()
		for (const side of [-1, 1]) {
			context.beginPath()
			context.ellipse(
				x + side * 5.3,
				136,
				1.8,
				3.5,
				side * 0.62,
				0,
				Math.PI * 2,
			)
			context.fill()
		}
	}
	for (const [x, angle] of [
		[30, -0.72],
		[98, 0.72],
	]) {
		cutPetal({ angle, context, length: 12, width: 4, x, y: 43 })
		cutPetal({
			angle: Math.PI - angle,
			context,
			length: 12,
			width: 4,
			x,
			y: 112,
		})
	}
	return context
}

function cutPetal({
	angle,
	context,
	length,
	width,
	x,
	y,
}: {
	angle: number
	context: CanvasRenderingContext2D
	length: number
	width: number
	x: number
	y: number
}) {
	context.save()
	context.translate(x, y)
	context.rotate(angle)
	context.beginPath()
	context.moveTo(0, 0)
	context.bezierCurveTo(
		-width,
		-length * 0.28,
		-width,
		-length * 0.83,
		0,
		-length,
	)
	context.bezierCurveTo(width, -length * 0.83, width, -length * 0.28, 0, 0)
	context.fill()
	context.restore()
	return context
}

function cutRosette({
	context,
	petals,
	radius,
	x,
	y,
}: {
	context: CanvasRenderingContext2D
	petals: number
	radius: number
	x: number
	y: number
}) {
	context.beginPath()
	context.arc(x, y, radius * 0.14, 0, Math.PI * 2)
	context.fill()
	for (let petal = 0; petal < petals; petal += 1) {
		const angle = (petal / petals) * Math.PI * 2
		cutPetal({
			angle,
			context,
			length: radius * 0.73,
			width: radius * (petals < 7 ? 0.24 : 0.19),
			x: x + Math.sin(angle) * radius * 0.27,
			y: y - Math.cos(angle) * radius * 0.27,
		})
	}
	return context
}

function cutSkull({
	context,
	hasFloralEyes,
}: {
	context: CanvasRenderingContext2D
	hasFloralEyes: boolean
}) {
	for (const side of [-1, 1]) {
		context.save()
		context.translate(64, 0)
		context.scale(side, 1)
		context.beginPath()
		context.moveTo(17, 47)
		context.bezierCurveTo(34, 51, 39, 71, 32, 88)
		context.quadraticCurveTo(28, 98, 20, 103)
		context.lineTo(20, 96)
		context.bezierCurveTo(30, 82, 31, 62, 17, 54)
		context.closePath()
		context.fill()
		context.restore()
	}
	for (const x of [52, 76]) {
		if (hasFloralEyes) {
			cutRosette({ context, petals: 6, radius: 9.4, x, y: 76 })
		} else {
			context.beginPath()
			context.ellipse(x, 76, 7.5, 8.5, (x < 64 ? -1 : 1) * 0.18, 0, Math.PI * 2)
			context.fill()
		}
		cutPetal({
			angle: x < 64 ? -0.4 : 0.4,
			context,
			length: 5,
			width: 2,
			x,
			y: 63,
		})
	}
	context.beginPath()
	context.moveTo(64, 84)
	context.bezierCurveTo(61, 85, 58.5, 91, 61, 92)
	context.lineTo(64, 90)
	context.lineTo(67, 92)
	context.bezierCurveTo(69.5, 91, 67, 85, 64, 84)
	context.fill()
	for (let tooth = 0; tooth < 5; tooth += 1) {
		const x = 49 + tooth * 6.3
		const y = 99 + Math.sin((tooth / 4) * Math.PI) * 2.4
		context.beginPath()
		context.moveTo(x, y - 3)
		context.lineTo(x + 4, y - 2.5)
		context.lineTo(x + 3.8, y + 3)
		context.lineTo(x + 0.2, y + 2.5)
		context.closePath()
		context.fill()
	}
	cutRosette({ context, petals: 6, radius: 10.5, x: 64, y: 39 })
	cutPetal({ angle: -1.04, context, length: 13, width: 4, x: 59, y: 118 })
	cutPetal({ angle: 1.04, context, length: 13, width: 4, x: 69, y: 118 })
	cutDiamond({ context, height: 4, width: 3, x: 64, y: 121 })
	return context
}

function paperOutline(context: CanvasRenderingContext2D) {
	context.beginPath()
	context.moveTo(6, 8)
	context.lineTo(122, 8)
	context.lineTo(122, 137)
	for (let scallop = 0; scallop < 5; scallop += 1) {
		const right = 122 - scallop * 23.2
		context.quadraticCurveTo(right - 11.6, 159, right - 23.2, 137)
	}
	context.lineTo(6, 8)
	context.closePath()
	return context
}

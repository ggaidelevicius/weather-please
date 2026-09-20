type Candle = {
	x: number
	y: number
	phase: number
}

type HanukkahArtwork = {
	baseY: number
	canvas: HTMLCanvasElement
	width: number
	height: number
	candles: Candle[]
}

export function createHanukkahArtwork({
	dpr,
}: {
	dpr: number
}): HanukkahArtwork {
	const width = 640
	const height = 310
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	const canvas = document.createElement('canvas')
	canvas.width = Math.round(width * pixelRatio)
	canvas.height = Math.round(height * pixelRatio)
	const context = canvas.getContext('2d')
	if (!context) {
		throw new Error('Unable to create the Hanukkah artwork canvas')
	}
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

	const candles = Array.from({ length: 9 }, (_, index) => ({
		x: 104 + index * 54,
		y: index === 4 ? 42 : 78,
		phase: index * 2.39996,
	}))

	drawBranches(context)
	drawPedestal(context)
	for (const candle of candles) {
		drawCandle({ context, candle })
	}

	return { baseY: 292, canvas, width, height, candles }
}

function drawBranches(context: CanvasRenderingContext2D) {
	context.lineCap = 'round'
	context.lineJoin = 'round'

	for (let pair = 4; pair >= 1; pair -= 1) {
		const span = pair * 54
		const bottom = 163 + pair * 21
		const path = new Path2D()
		path.moveTo(320 - span, 151)
		path.bezierCurveTo(
			320 - span,
			bottom - 12,
			320 - span * 0.6,
			bottom,
			320,
			bottom,
		)
		path.bezierCurveTo(
			320 + span * 0.6,
			bottom,
			320 + span,
			bottom - 12,
			320 + span,
			151,
		)

		context.strokeStyle = '#30291f'
		context.lineWidth = 9
		context.stroke(path)
		context.strokeStyle = createBrassGradient({
			context,
			left: 320 - span,
			right: 320 + span,
		})
		context.lineWidth = 6.5
		context.stroke(path)
		context.strokeStyle = 'rgba(255, 230, 171, 0.38)'
		context.lineWidth = 1.1
		context.stroke(path)
	}

	const stem = createBrassGradient({ context, left: 314, right: 326 })
	context.fillStyle = stem
	context.beginPath()
	context.moveTo(316.8, 110)
	context.lineTo(323.2, 110)
	context.bezierCurveTo(323.2, 159, 324.6, 223, 325.5, 261)
	context.lineTo(314.5, 261)
	context.bezierCurveTo(315.4, 223, 316.8, 159, 316.8, 110)
	context.closePath()
	context.fill()
	context.fillStyle = 'rgba(251, 230, 179, 0.38)'
	context.fillRect(318, 115, 1.2, 143)

	for (const y of [154, 252, 257]) {
		context.fillStyle = createBrassGradient({
			context,
			left: 312,
			right: 328,
		})
		context.beginPath()
		context.roundRect(312, y, 16, 3.5, 1.5)
		context.fill()
		context.fillStyle = 'rgba(255, 228, 173, 0.45)'
		context.fillRect(314, y, 9, 0.7)
	}

	return context
}

function drawPedestal(context: CanvasRenderingContext2D) {
	context.fillStyle = createBrassGradient({
		context,
		left: 272,
		right: 368,
	})
	context.beginPath()
	context.moveTo(314.5, 259)
	context.bezierCurveTo(314, 268, 305, 274, 286, 278)
	context.quadraticCurveTo(320, 285, 354, 278)
	context.bezierCurveTo(335, 274, 326, 268, 325.5, 259)
	context.closePath()
	context.fill()
	context.strokeStyle = 'rgba(248, 222, 164, 0.55)'
	context.lineWidth = 0.8
	context.beginPath()
	context.moveTo(315.5, 262)
	context.bezierCurveTo(314, 270, 302, 276, 289, 278)
	context.stroke()

	for (const step of [
		{ x: 282, y: 278, width: 76, height: 6 },
		{ x: 272, y: 284, width: 96, height: 8 },
	]) {
		context.fillStyle = createBrassGradient({
			context,
			left: step.x,
			right: step.x + step.width,
		})
		context.beginPath()
		context.roundRect(step.x, step.y, step.width, step.height, 2)
		context.fill()
		context.fillStyle = 'rgba(248, 224, 171, 0.52)'
		context.fillRect(step.x + 2, step.y, step.width - 4, 0.8)
		context.fillStyle = 'rgba(37, 29, 20, 0.56)'
		context.fillRect(
			step.x + 1,
			step.y + step.height - 1.2,
			step.width - 2,
			1.2,
		)
	}

	context.strokeStyle = 'rgba(72, 48, 27, 0.6)'
	context.lineWidth = 0.8
	context.beginPath()
	context.moveTo(299, 281)
	context.quadraticCurveTo(320, 284, 341, 281)
	context.stroke()
	return context
}

function drawCandle({
	context,
	candle,
}: {
	context: CanvasRenderingContext2D
	candle: Candle
}) {
	const { x, y } = candle
	const top = y + 6
	const cup = top + 52
	const wax = context.createLinearGradient(x - 7, 0, x + 7, 0)
	wax.addColorStop(0, '#8da5b6')
	wax.addColorStop(0.19, '#d4e2e6')
	wax.addColorStop(0.43, '#fff2d2')
	wax.addColorStop(0.68, '#e6e5d9')
	wax.addColorStop(1, '#a5b5bf')
	context.fillStyle = wax
	context.beginPath()
	context.moveTo(x - 5.8, top)
	context.bezierCurveTo(x - 2, top + 1.8, x + 1, top + 2, x + 5.8, top)
	context.lineTo(x + 7, cup - 1)
	context.quadraticCurveTo(x, cup + 1, x - 7, cup - 1)
	context.closePath()
	context.fill()

	context.strokeStyle = 'rgba(255, 244, 215, 0.55)'
	context.lineWidth = 1.8
	context.beginPath()
	context.moveTo(x - 3.4, top + 3)
	context.bezierCurveTo(x - 2.8, top + 7, x - 3.8, top + 18, x - 2.8, top + 23)
	context.stroke()
	context.strokeStyle = 'rgba(112, 139, 155, 0.3)'
	context.lineWidth = 0.8
	context.beginPath()
	context.moveTo(x + 3.4, top + 3)
	context.bezierCurveTo(x + 2.5, top + 7, x + 3.8, top + 13, x + 2.5, top + 16)
	context.stroke()

	context.fillStyle = '#f3deaf'
	context.beginPath()
	context.ellipse(x, top + 0.7, 5.7, 1.9, 0, 0, Math.PI * 2)
	context.fill()
	context.fillStyle = '#b59b71'
	context.beginPath()
	context.ellipse(x, top + 0.2, 2.5, 0.8, 0, 0, Math.PI * 2)
	context.fill()
	context.strokeStyle = '#47352b'
	context.lineWidth = 1.6
	context.beginPath()
	context.moveTo(x, top + 0.5)
	context.quadraticCurveTo(x + 0.9, y + 3, x, y)
	context.stroke()

	context.fillStyle = createBrassGradient({
		context,
		left: x - 16,
		right: x + 16,
	})
	context.fillRect(x - 3.4, cup + 9, 6.8, 7)
	context.beginPath()
	context.moveTo(x - 15, cup)
	context.quadraticCurveTo(x - 12.5, cup + 11, x - 4, cup + 12)
	context.lineTo(x + 4, cup + 12)
	context.quadraticCurveTo(x + 12.5, cup + 11, x + 15, cup)
	context.closePath()
	context.fill()
	context.fillStyle = '#786039'
	context.beginPath()
	context.ellipse(x, cup, 15.5, 3.1, 0, 0, Math.PI * 2)
	context.fill()
	context.strokeStyle = '#dfbd77'
	context.lineWidth = 1.2
	context.stroke()
	context.fillStyle = 'rgba(241, 215, 165, 0.75)'
	context.beginPath()
	context.ellipse(x - 1, cup - 0.2, 8, 1.4, 0, 0, Math.PI * 2)
	context.fill()
	context.strokeStyle = 'rgba(249, 225, 172, 0.55)'
	context.lineWidth = 0.8
	context.beginPath()
	context.moveTo(x - 12, cup + 2.6)
	context.quadraticCurveTo(x - 9, cup + 8, x - 5, cup + 9.3)
	context.stroke()
	return context
}

function createBrassGradient({
	context,
	left,
	right,
}: {
	context: CanvasRenderingContext2D
	left: number
	right: number
}) {
	const gradient = context.createLinearGradient(left, 0, right, 0)
	gradient.addColorStop(0, '#706042')
	gradient.addColorStop(0.13, '#c7a76b')
	gradient.addColorStop(0.28, '#f1d99e')
	gradient.addColorStop(0.43, '#b18a4d')
	gradient.addColorStop(0.59, '#775931')
	gradient.addColorStop(0.76, '#cfac68')
	gradient.addColorStop(0.9, '#9c7b43')
	gradient.addColorStop(1, '#5c4b32')
	return gradient
}

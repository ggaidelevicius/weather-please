type LanternArtwork = {
	canvas: HTMLCanvasElement
	width: number
	height: number
	anchorX: number
	anchorY: number
	lightX: number
	lightY: number
}

type LunarNewYearArtwork = {
	lanterns: LanternArtwork[]
	glow: HTMLCanvasElement
	haze: HTMLCanvasElement
}

export function createLunarNewYearArtwork({
	dpr,
}: {
	dpr: number
}): LunarNewYearArtwork {
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	const lanterns = [
		{ radius: 80, edge: '#82172a', middle: '#da3632', center: '#f57538' },
		{ radius: 68, edge: '#78152d', middle: '#c52f43', center: '#ec6545' },
		{ radius: 76, edge: '#951921', middle: '#e23b29', center: '#fb8339' },
	].map((palette, variant) => createLantern({ pixelRatio, palette, variant }))
	const glow = createRadialSprite({
		pixelRatio,
		stops: [
			[0, 'rgba(255, 199, 102, 0.8)'],
			[0.18, 'rgba(255, 187, 82, 0.5)'],
			[0.45, 'rgba(251, 157, 56, 0.17)'],
			[0.75, 'rgba(241, 116, 39, 0.03)'],
			[1, 'rgba(241, 116, 39, 0)'],
		],
	})
	const haze = createRadialSprite({
		pixelRatio,
		stops: [
			[0, 'rgba(230, 91, 59, 0.58)'],
			[0.28, 'rgba(244, 123, 64, 0.35)'],
			[0.57, 'rgba(251, 172, 79, 0.13)'],
			[0.82, 'rgba(222, 74, 61, 0.025)'],
			[1, 'rgba(222, 74, 61, 0)'],
		],
	})
	return { lanterns, glow, haze }
}

function createLantern({
	pixelRatio,
	palette,
	variant,
}: {
	pixelRatio: number
	palette: { radius: number; edge: string; middle: string; center: string }
	variant: number
}): LanternArtwork {
	const width = 240
	const height = 300
	const { canvas, context } = createCanvas({ width, height, pixelRatio })
	const { radius } = palette
	context.lineCap = 'round'
	context.lineJoin = 'round'
	const paper = context.createLinearGradient(120 - radius, 0, 120 + radius, 0)
	paper.addColorStop(0, palette.edge)
	paper.addColorStop(0.16, palette.middle)
	paper.addColorStop(0.44, palette.center)
	paper.addColorStop(0.61, palette.middle)
	paper.addColorStop(1, palette.edge)
	context.fillStyle = paper
	context.beginPath()
	context.moveTo(97, 52)
	context.bezierCurveTo(
		120 - radius * 0.79,
		54,
		120 - radius,
		80,
		120 - radius,
		124,
	)
	context.bezierCurveTo(120 - radius, 166, 120 - radius * 0.72, 189, 99, 197)
	context.lineTo(141, 197)
	context.bezierCurveTo(
		120 + radius * 0.72,
		189,
		120 + radius,
		166,
		120 + radius,
		124,
	)
	context.bezierCurveTo(120 + radius, 80, 120 + radius * 0.79, 54, 143, 52)
	context.closePath()
	context.fill()
	const illumination = context.createRadialGradient(112, 139, 3, 120, 127, 83)
	illumination.addColorStop(0, 'rgba(255, 207, 105, 0.43)')
	illumination.addColorStop(0.36, 'rgba(255, 179, 79, 0.26)')
	illumination.addColorStop(0.76, 'rgba(252, 108, 44, 0.04)')
	illumination.addColorStop(1, 'rgba(252, 108, 44, 0)')
	context.fillStyle = illumination
	context.fill()
	context.strokeStyle = 'rgba(95, 12, 29, 0.57)'
	context.lineWidth = 1.4
	context.stroke()

	for (let y = 66; y < 188; y += 3.8) {
		const span = radius * Math.sqrt(1 - ((y - 124) / 74) ** 2) * 0.96
		context.strokeStyle =
			y % 2 < 1 ? 'rgba(255, 192, 130, 0.095)' : 'rgba(107, 21, 32, 0.09)'
		context.lineWidth = 0.55
		context.beginPath()
		context.moveTo(120 - span, y)
		context.quadraticCurveTo(119, y + 2.2, 120 + span, y)
		context.stroke()
	}
	for (let rib = -4; rib <= 4; rib += 1) {
		const position = rib / 4
		context.beginPath()
		context.moveTo(120 + position * 22, 54)
		context.bezierCurveTo(
			120 + position * radius * 1.24,
			87,
			120 + position * radius * 1.24,
			161,
			120 + position * 22,
			196,
		)
		context.strokeStyle = 'rgba(115, 26, 23, 0.4)'
		context.lineWidth = rib === 0 ? 1.5 : 2.8
		context.stroke()
		context.strokeStyle = 'rgba(255, 203, 111, 0.51)'
		context.lineWidth = 0.75
		context.stroke()
	}
	for (const y of [66, 181]) {
		const span = radius * 0.62
		context.strokeStyle = '#c99542'
		context.lineWidth = 2
		context.beginPath()
		context.moveTo(120 - span, y)
		context.quadraticCurveTo(120, y + (y < 100 ? 10 : 8), 120 + span, y)
		context.stroke()
		context.strokeStyle = 'rgba(255, 229, 158, 0.54)'
		context.lineWidth = 0.65
		context.stroke()
	}
	drawPaperPattern({ context, radius, variant })
	drawCap({ context, y: 43, width: 65, height: 12 })
	drawCap({ context, y: 194, width: 57, height: 11 })
	context.strokeStyle = '#d6ab5c'
	context.lineWidth = 2.1
	context.beginPath()
	context.ellipse(120, 38, 4.1, 5.1, 0, 0, Math.PI * 2)
	context.stroke()
	context.strokeStyle = 'rgba(255, 235, 178, 0.65)'
	context.lineWidth = 0.7
	context.beginPath()
	context.arc(119.5, 38, 3.5, Math.PI * 0.9, Math.PI * 1.8)
	context.stroke()
	drawTassel({ context, variant })
	return {
		canvas,
		width,
		height,
		anchorX: 120,
		anchorY: 36,
		lightX: 120,
		lightY: 124,
	}
}

function drawPaperPattern({
	context,
	radius,
	variant,
}: {
	context: CanvasRenderingContext2D
	radius: number
	variant: number
}) {
	context.strokeStyle = 'rgba(255, 203, 108, 0.32)'
	context.lineWidth = 0.75
	for (const side of [-1, 1]) {
		for (const y of [105, 143]) {
			const x = 120 + side * radius * 0.39
			const spread = variant === 1 ? 6.5 : 5.5
			context.beginPath()
			context.moveTo(x, y - spread)
			context.quadraticCurveTo(x + 1.5, y - 1.5, x + spread, y)
			context.quadraticCurveTo(x + 1.5, y + 1.5, x, y + spread)
			context.quadraticCurveTo(x - 1.5, y + 1.5, x - spread, y)
			context.quadraticCurveTo(x - 1.5, y - 1.5, x, y - spread)
			context.stroke()
			context.fillStyle = 'rgba(255, 207, 118, 0.36)'
			context.beginPath()
			context.arc(x, y, 0.9, 0, Math.PI * 2)
			context.fill()
		}
	}
	return context
}

function drawCap({
	context,
	y,
	width,
	height,
}: {
	context: CanvasRenderingContext2D
	y: number
	width: number
	height: number
}) {
	const left = 120 - width / 2
	const right = 120 + width / 2
	const gold = context.createLinearGradient(left, 0, right, 0)
	gold.addColorStop(0, '#885122')
	gold.addColorStop(0.19, '#c79037')
	gold.addColorStop(0.4, '#f4d68b')
	gold.addColorStop(0.58, '#d9ac56')
	gold.addColorStop(1, '#8b5729')
	context.fillStyle = gold
	context.beginPath()
	context.moveTo(left + 3, y)
	context.quadraticCurveTo(120, y - 3.5, right - 3, y)
	context.lineTo(right, y + height - 2)
	context.quadraticCurveTo(120, y + height + 3, left, y + height - 2)
	context.closePath()
	context.fill()
	context.strokeStyle = '#f5d18a'
	context.lineWidth = 1
	context.beginPath()
	context.moveTo(left + 3, y + 1)
	context.quadraticCurveTo(120, y - 2.5, right - 3, y + 1)
	context.stroke()
	context.strokeStyle = 'rgba(84, 39, 18, 0.61)'
	context.beginPath()
	context.moveTo(left + 1, y + height - 2)
	context.quadraticCurveTo(120, y + height + 2, right - 1, y + height - 2)
	context.stroke()
	context.strokeStyle = 'rgba(104, 53, 21, 0.35)'
	context.lineWidth = 0.7
	for (let x = left + 7; x < right - 5; x += 5) {
		context.beginPath()
		context.moveTo(x, y + 3)
		context.lineTo(x, y + height - 3)
		context.stroke()
	}
	return context
}

function drawTassel({
	context,
	variant,
}: {
	context: CanvasRenderingContext2D
	variant: number
}) {
	context.strokeStyle = '#a32b2c'
	context.lineWidth = 3
	context.beginPath()
	context.moveTo(120, 205)
	context.quadraticCurveTo(118.5, 214, 120, 222)
	context.stroke()
	context.strokeStyle = '#e8b653'
	context.lineWidth = 0.75
	context.beginPath()
	context.moveTo(119, 205)
	context.lineTo(119, 221)
	context.stroke()
	context.strokeStyle = '#c13a35'
	context.lineWidth = 2.8
	for (const side of [-1, 1]) {
		context.beginPath()
		context.moveTo(120, 219)
		context.bezierCurveTo(120 + side * 11, 213, 120 + side * 12, 226, 120, 225)
		context.bezierCurveTo(120 + side * 9, 232, 120 + side * 7, 218, 120, 219)
		context.stroke()
	}
	const silk = context.createLinearGradient(110, 0, 130, 0)
	silk.addColorStop(0, '#882030')
	silk.addColorStop(0.36, '#d84237')
	silk.addColorStop(0.54, '#f27642')
	silk.addColorStop(1, '#9d2730')
	context.strokeStyle = silk
	for (let strand = -5; strand <= 5; strand += 1) {
		context.lineWidth = strand % 2 === 0 ? 1.25 : 0.75
		context.beginPath()
		context.moveTo(120 + strand * 0.45, 232)
		context.bezierCurveTo(
			120 + strand * 0.8,
			242,
			120 + strand * 1.15,
			259,
			120 + strand * 1.2 + Math.sin(strand * 1.8 + variant),
			272 + Math.cos(strand * 1.6) * 2,
		)
		context.stroke()
	}
	context.fillStyle = '#d9a847'
	context.fillRect(116.4, 228, 7.2, 5.7)
	context.fillStyle = '#ffe0a0'
	context.fillRect(117, 228.5, 1, 4)
	context.strokeStyle = 'rgba(248, 194, 88, 0.6)'
	context.lineWidth = 0.65
	context.beginPath()
	context.moveTo(119.4, 235)
	context.quadraticCurveTo(117.9, 251, 118.5, 272)
	context.stroke()
	return context
}

function createRadialSprite({
	pixelRatio,
	stops,
}: {
	pixelRatio: number
	stops: readonly (readonly [number, string])[]
}): HTMLCanvasElement {
	const { canvas, context } = createCanvas({
		width: 256,
		height: 256,
		pixelRatio,
	})
	const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128)
	for (const [offset, color] of stops) gradient.addColorStop(offset, color)
	context.fillStyle = gradient
	context.fillRect(0, 0, 256, 256)
	return canvas
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
	if (!context)
		throw new Error('Unable to create the lunar new year artwork canvas')
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	return { canvas, context }
}

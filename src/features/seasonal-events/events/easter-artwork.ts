type EasterArtwork = {
	eggs: HTMLCanvasElement[]
	flowers: HTMLCanvasElement[]
	glow: HTMLCanvasElement
}

type Palette = { color: string; light: string; shade: string }

export function createEasterArtwork({ dpr }: { dpr: number }): EasterArtwork {
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	const eggs = [
		{ color: '#c4b5fd', light: '#e7ddff', shade: '#a182d2' },
		{ color: '#f9a8d4', light: '#ffdaec', shade: '#df80b1' },
		{ color: '#93c5fd', light: '#d0eaff', shade: '#659ddd' },
		{ color: '#86efac', light: '#d4fae0', shade: '#5ac399' },
		{ color: '#fde68a', light: '#fff5c4', shade: '#e0bd58' },
		{ color: '#fdba74', light: '#ffdfc9', shade: '#e69a69' },
	].map((palette, variant) => createEgg({ palette, pixelRatio, variant }))
	const flowers = [
		{ color: '#fff3ce', light: '#fffdf0', shade: '#efd99d' },
		{ color: '#f9a8d4', light: '#ffe0ee', shade: '#e879af' },
		{ color: '#d0b7f4', light: '#f0e6ff', shade: '#aa89da' },
	].map((palette, variant) => createFlower({ palette, pixelRatio, variant }))
	const { canvas: glow, context } = createCanvas({ pixelRatio, size: 256 })
	const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128)
	gradient.addColorStop(0, 'rgba(255, 215, 195, 0.58)')
	gradient.addColorStop(0.24, 'rgba(253, 193, 204, 0.43)')
	gradient.addColorStop(0.54, 'rgba(249, 168, 212, 0.18)')
	gradient.addColorStop(0.8, 'rgba(249, 168, 212, 0.035)')
	gradient.addColorStop(1, 'rgba(249, 168, 212, 0)')
	context.fillStyle = gradient
	context.fillRect(0, 0, 256, 256)
	return { eggs, flowers, glow }
}

function createCanvas({
	pixelRatio,
	size,
}: {
	pixelRatio: number
	size: number
}) {
	const canvas = document.createElement('canvas')
	canvas.width = Math.round(size * pixelRatio)
	canvas.height = canvas.width
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create the Easter artwork canvas')
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	return { canvas, context }
}

function createEgg({
	palette,
	pixelRatio,
	variant,
}: {
	palette: Palette
	pixelRatio: number
	variant: number
}): HTMLCanvasElement {
	const { canvas, context } = createCanvas({ pixelRatio, size: 128 })
	const shell = context.createRadialGradient(52, 44, 6, 66, 64, 46)
	shell.addColorStop(0, palette.light)
	shell.addColorStop(0.47, palette.color)
	shell.addColorStop(0.79, palette.color)
	shell.addColorStop(1, palette.shade)
	context.fillStyle = shell
	context.shadowColor = palette.color
	context.shadowBlur = 8 * pixelRatio
	context.beginPath()
	context.moveTo(64, 29)
	context.bezierCurveTo(51, 29, 38, 56, 38, 73)
	context.bezierCurveTo(38, 91, 48, 99, 64, 99)
	context.bezierCurveTo(80, 99, 90, 91, 90, 73)
	context.bezierCurveTo(90, 56, 77, 29, 64, 29)
	context.closePath()
	context.fill()
	context.shadowBlur = 0
	context.save()
	context.clip()
	drawEggPattern({ context, variant })
	const curvature = context.createLinearGradient(38, 0, 90, 0)
	curvature.addColorStop(0, 'rgba(111, 77, 127, 0.13)')
	curvature.addColorStop(0.28, 'rgba(111, 77, 127, 0)')
	curvature.addColorStop(0.72, 'rgba(111, 77, 127, 0)')
	curvature.addColorStop(1, 'rgba(111, 77, 127, 0.11)')
	context.fillStyle = curvature
	context.fillRect(38, 29, 52, 70)
	context.restore()
	return canvas
}

function createFlower({
	palette,
	pixelRatio,
	variant,
}: {
	palette: Palette
	pixelRatio: number
	variant: number
}): HTMLCanvasElement {
	const { canvas, context } = createCanvas({ pixelRatio, size: 128 })
	context.translate(64, 64)
	context.shadowColor = palette.color
	context.shadowBlur = 7 * pixelRatio
	const petalCount = variant === 0 ? 9 : 6
	for (let petal = 0; petal < petalCount; petal += 1) {
		context.save()
		context.rotate((petal * Math.PI * 2) / petalCount + variant * 0.18)
		const gradient = context.createLinearGradient(-8, -28, 8, -2)
		gradient.addColorStop(0, palette.light)
		gradient.addColorStop(0.5, palette.color)
		gradient.addColorStop(1, palette.shade)
		context.fillStyle = gradient
		const breadth = variant === 0 ? 8 : 12
		context.beginPath()
		context.moveTo(-3, -2)
		context.bezierCurveTo(-breadth, -10, -breadth * 1.2, -28, -3, -31)
		context.bezierCurveTo(breadth * 0.8, -35, breadth * 1.3, -15, 3, -2)
		context.closePath()
		context.fill()
		context.restore()
	}
	context.shadowBlur = 3 * pixelRatio
	context.shadowColor = '#f3c866'
	const gold = context.createRadialGradient(-2, -2, 1, 0, 0, 10)
	gold.addColorStop(0, variant === 2 ? '#fff6d5' : '#fff0ac')
	gold.addColorStop(0.55, '#f8d469')
	gold.addColorStop(1, '#e5ac42')
	context.fillStyle = gold
	context.beginPath()
	context.arc(0, 0, variant === 0 ? 10 : 8.5, 0, Math.PI * 2)
	context.fill()
	return canvas
}

function drawBand({
	color,
	context,
	width,
	y,
}: {
	color: string
	context: CanvasRenderingContext2D
	width: number
	y: number
}) {
	context.strokeStyle = color
	context.lineWidth = width
	context.beginPath()
	context.moveTo(31, y - 2)
	context.bezierCurveTo(48, y + 1, 60, y + 5, 73, y + 2)
	context.quadraticCurveTo(86, y, 97, y - 2)
	context.stroke()
	return context
}

function drawEggPattern({
	context,
	variant,
}: {
	context: CanvasRenderingContext2D
	variant: number
}) {
	context.lineCap = 'round'
	context.lineJoin = 'round'
	if (variant === 0) {
		for (const y of [53, 78]) {
			drawBand({ color: '#fff0bf', context, width: 8, y })
		}
		drawBand({ color: '#f179ae', context, width: 4, y: 66 })
	} else if (variant === 1) {
		context.fillStyle = '#fff5cc'
		for (const [x, y] of [
			[56, 44],
			[76, 51],
			[47, 63],
			[64, 66],
			[82, 73],
			[52, 84],
			[72, 89],
		]) {
			context.beginPath()
			context.arc(x, y, 4.7, 0, Math.PI * 2)
			context.fill()
		}
	} else if (variant === 2 || variant === 4) {
		context.strokeStyle = variant === 2 ? '#fff2c7' : '#b598dc'
		context.lineWidth = variant === 2 ? 5.2 : 5.8
		for (const y of [56, 78]) {
			context.beginPath()
			context.moveTo(32, y - 4)
			for (let point = 0; point < 7; point += 1) {
				context.lineTo(38 + point * 10, y + (point % 2 === 0 ? 4 : -4))
			}
			context.stroke()
		}
		if (variant === 4) {
			drawBand({ color: '#fff8df', context, width: 4, y: 67 })
		}
	} else if (variant === 3) {
		for (const { x, y } of [
			{ x: 56, y: 52 },
			{ x: 72, y: 78 },
		]) {
			context.fillStyle = '#fff7da'
			for (let petal = 0; petal < 5; petal += 1) {
				const angle = (petal * Math.PI * 2) / 5
				context.beginPath()
				context.ellipse(
					x + Math.cos(angle) * 5.5,
					y + Math.sin(angle) * 5.5,
					4.2,
					3.4,
					angle,
					0,
					Math.PI * 2,
				)
				context.fill()
			}
			context.fillStyle = '#f1b955'
			context.beginPath()
			context.arc(x, y, 3.3, 0, Math.PI * 2)
			context.fill()
		}
	} else {
		for (const y of [52, 81]) {
			drawBand({ color: '#87cdb9', context, width: 6.5, y })
		}
		context.fillStyle = '#fff4d6'
		for (const x of [48, 64, 80]) {
			context.beginPath()
			context.arc(x, 67, 4.3, 0, Math.PI * 2)
			context.fill()
		}
	}
	return context
}

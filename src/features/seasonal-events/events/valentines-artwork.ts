type ValentinesArtwork = {
	hearts: HTMLCanvasElement[]
	bokeh: HTMLCanvasElement
	haze: HTMLCanvasElement
}

type HeartPalette = { inner: string; mid: string; outer: string }

export function createValentinesArtwork({
	dpr,
}: {
	dpr: number
}): ValentinesArtwork {
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	const hearts = HEART_PALETTES.map((palette) =>
		createHeart({ palette, pixelRatio, isOutline: false }),
	)
	for (const palette of [HEART_PALETTES[0], HEART_PALETTES[7]]) {
		hearts.push(createHeart({ palette, pixelRatio, isOutline: true }))
	}
	const bokeh = createRadialSprite({
		size: 128,
		pixelRatio,
		radius: 53,
		stops: [
			[0, 'rgba(255, 184, 186, 0.36)'],
			[0.4, 'rgba(255, 184, 186, 0.34)'],
			[0.66, 'rgba(255, 174, 182, 0.2)'],
			[0.86, 'rgba(255, 163, 179, 0.055)'],
			[1, 'rgba(255, 163, 179, 0)'],
		],
	})
	const haze = createRadialSprite({
		size: 256,
		pixelRatio,
		radius: 128,
		stops: [
			[0, 'rgba(244, 114, 182, 0.5)'],
			[0.24, 'rgba(246, 113, 163, 0.38)'],
			[0.48, 'rgba(251, 113, 133, 0.23)'],
			[0.77, 'rgba(251, 123, 147, 0.045)'],
			[1, 'rgba(251, 123, 147, 0)'],
		],
	})
	return { hearts, bokeh, haze }
}

const HEART_PALETTES = [
	{ inner: '#ffe1f2', mid: '#ff8fc1', outer: '#e11d48' },
	{ inner: '#ffd1e8', mid: '#ff6ea8', outer: '#d81b60' },
	{ inner: '#ffbfe3', mid: '#ff5faa', outer: '#c2185b' },
	{ inner: '#ffb3e1', mid: '#ff4da0', outer: '#b3125e' },
	{ inner: '#ff9ad5', mid: '#ff3b86', outer: '#ad1457' },
	{ inner: '#ffc1c1', mid: '#ff6b6b', outer: '#b91c1c' },
	{ inner: '#ffd6d6', mid: '#fb7185', outer: '#be123c' },
	{ inner: '#ffe4e6', mid: '#fb7185', outer: '#e11d48' },
] as const

function createHeart({
	palette,
	pixelRatio,
	isOutline,
}: {
	palette: HeartPalette
	pixelRatio: number
	isOutline: boolean
}): HTMLCanvasElement {
	const { canvas, context } = createCanvas({ size: 128, pixelRatio })
	context.lineCap = 'round'
	context.lineJoin = 'round'
	context.shadowColor = palette.mid
	context.shadowBlur = (isOutline ? 7 : 11) * pixelRatio
	context.beginPath()
	context.moveTo(64, 47)
	context.bezierCurveTo(59, 32, 40, 30, 33, 45)
	context.bezierCurveTo(25, 62, 43, 79, 64, 94)
	context.bezierCurveTo(85, 79, 103, 62, 95, 45)
	context.bezierCurveTo(88, 30, 69, 32, 64, 47)
	context.closePath()
	if (isOutline) {
		const rim = context.createLinearGradient(34, 35, 91, 91)
		rim.addColorStop(0, palette.inner)
		rim.addColorStop(0.47, palette.mid)
		rim.addColorStop(1, palette.inner)
		context.strokeStyle = rim
		context.lineWidth = 1.5
		context.stroke()
		return canvas
	}
	const satin = context.createRadialGradient(49, 45, 3, 64, 61, 43)
	satin.addColorStop(0, palette.inner)
	satin.addColorStop(0.32, palette.mid)
	satin.addColorStop(0.68, palette.mid)
	satin.addColorStop(1, palette.outer)
	context.fillStyle = satin
	context.fill()
	context.shadowBlur = 0
	context.strokeStyle = 'rgba(255, 215, 230, 0.26)'
	context.lineWidth = 0.75
	context.stroke()
	const sheen = context.createLinearGradient(39, 41, 59, 56)
	sheen.addColorStop(0, 'rgba(255, 237, 245, 0)')
	sheen.addColorStop(0.44, 'rgba(255, 237, 245, 0.36)')
	sheen.addColorStop(1, 'rgba(255, 237, 245, 0)')
	context.strokeStyle = sheen
	context.lineWidth = 1.2
	context.beginPath()
	context.moveTo(38, 50)
	context.bezierCurveTo(39, 39, 51, 37, 58, 44)
	context.stroke()
	return canvas
}

function createRadialSprite({
	size,
	pixelRatio,
	radius,
	stops,
}: {
	size: number
	pixelRatio: number
	radius: number
	stops: readonly (readonly [number, string])[]
}): HTMLCanvasElement {
	const { canvas, context } = createCanvas({ size, pixelRatio })
	const center = size / 2
	const gradient = context.createRadialGradient(
		center,
		center,
		0,
		center,
		center,
		radius,
	)
	for (const [offset, color] of stops) gradient.addColorStop(offset, color)
	context.fillStyle = gradient
	context.fillRect(0, 0, size, size)
	return canvas
}

function createCanvas({
	size,
	pixelRatio,
}: {
	size: number
	pixelRatio: number
}) {
	const canvas = document.createElement('canvas')
	canvas.width = Math.round(size * pixelRatio)
	canvas.height = canvas.width
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create the Valentine artwork canvas')
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	return { canvas, context }
}

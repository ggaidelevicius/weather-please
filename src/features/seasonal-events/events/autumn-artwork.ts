type AutumnArtwork = {
	leaves: HTMLCanvasElement[]
	light: HTMLCanvasElement
	canopy: HTMLCanvasElement
	canopyWidth: number
	canopyHeight: number
}

export function createAutumnArtwork({ dpr }: { dpr: number }): AutumnArtwork {
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	const palettes = [
		['#c28b32', '#efc462', '#dca43f'],
		['#bc652c', '#e99a47', '#d78032'],
		['#a9552c', '#d9853e', '#c56b31'],
	]
	const leaves = palettes.flatMap((palette) =>
		Array.from({ length: 3 }, (_, shape) =>
			createLeaf({ pixelRatio, palette, shape }),
		),
	)
	const light = createLight(pixelRatio)
	const canopyWidth = 600
	const canopyHeight = 230
	const canopy = createCanopy({
		pixelRatio,
		width: canopyWidth,
		height: canopyHeight,
	})
	return { leaves, light, canopy, canopyWidth, canopyHeight }
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
	if (!context) throw new Error('Unable to create the autumn artwork canvas')
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	context.lineCap = 'round'
	return { canvas, context }
}

function createLeaf({
	pixelRatio,
	palette,
	shape,
}: {
	pixelRatio: number
	palette: string[]
	shape: number
}): HTMLCanvasElement {
	const { canvas, context } = createCanvas({
		width: 64,
		height: 64,
		pixelRatio,
	})
	context.translate(32, 30)
	const fold = context.createLinearGradient(-20, -5, 18, 5)
	fold.addColorStop(0, palette[0])
	fold.addColorStop(0.47, palette[1])
	fold.addColorStop(0.52, palette[2])
	fold.addColorStop(1, palette[0])
	context.fillStyle = fold
	context.beginPath()
	context.moveTo(0, 21)
	if (shape === 0) {
		context.bezierCurveTo(-21, 12, -21, -5, -8, -17)
		context.quadraticCurveTo(-2, -21, 3, -25)
		context.bezierCurveTo(6, -18, 21, -10, 17, 4)
		context.quadraticCurveTo(15, 14, 0, 21)
	} else if (shape === 1) {
		context.quadraticCurveTo(-8, 17, -17, 17)
		context.lineTo(-13, 8)
		context.quadraticCurveTo(-21, 5, -25, -2)
		context.lineTo(-14, -3)
		context.lineTo(-16, -16)
		context.quadraticCurveTo(-9, -13, -6, -9)
		context.quadraticCurveTo(-5, -20, 0, -26)
		context.quadraticCurveTo(5, -18, 6, -10)
		context.lineTo(17, -17)
		context.lineTo(14, -3)
		context.lineTo(25, -5)
		context.quadraticCurveTo(23, 3, 13, 8)
		context.lineTo(16, 17)
		context.quadraticCurveTo(7, 15, 0, 21)
	} else {
		context.bezierCurveTo(-13, 11, -13, -6, 11, -25)
		context.bezierCurveTo(4, -11, 13, -6, 10, 4)
		context.quadraticCurveTo(8, 14, 0, 21)
	}
	context.closePath()
	context.fill()
	context.strokeStyle = 'rgba(230, 204, 153, 0.25)'
	context.lineWidth = 0.7
	context.beginPath()
	context.moveTo(0, 20)
	context.quadraticCurveTo(shape === 2 ? -4 : 2, 0, shape === 2 ? 9 : 1, -20)
	context.stroke()
	context.strokeStyle = palette[0]
	context.lineWidth = 1.1
	context.beginPath()
	context.moveTo(0, 19)
	context.quadraticCurveTo(-1, 24, 2, 29)
	context.stroke()
	return canvas
}

function createLight(pixelRatio: number): HTMLCanvasElement {
	const { canvas, context } = createCanvas({
		width: 128,
		height: 128,
		pixelRatio,
	})
	const light = context.createRadialGradient(64, 64, 0, 64, 64, 64)
	light.addColorStop(0, 'rgba(255, 232, 187, 0.8)')
	light.addColorStop(0.2, 'rgba(250, 220, 166, 0.66)')
	light.addColorStop(0.45, 'rgba(241, 199, 138, 0.34)')
	light.addColorStop(0.72, 'rgba(224, 173, 112, 0.09)')
	light.addColorStop(1, 'rgba(218, 162, 101, 0)')
	context.fillStyle = light
	context.fillRect(0, 0, 128, 128)
	return canvas
}

function createCanopy({
	pixelRatio,
	width,
	height,
}: {
	pixelRatio: number
	width: number
	height: number
}): HTMLCanvasElement {
	const source = createCanvas({ width, height, pixelRatio })
	const random = createRandom(220927)
	for (let cluster = 0; cluster < 17; cluster += 1) {
		const isAlongLeft = cluster > 12
		const x = isAlongLeft ? -7 : cluster * 47 - 20
		const y = isAlongLeft ? 90 + (cluster - 13) * 32 : -9 + random() * 27
		for (let leaf = 0; leaf < 4; leaf += 1) {
			source.context.fillStyle = `rgba(0, 0, 0, ${0.32 + random() * 0.32})`
			source.context.beginPath()
			source.context.ellipse(
				x + (random() - 0.5) * 52,
				y + (random() - 0.25) * 62,
				22 + random() * 29,
				10 + random() * 17,
				random() * Math.PI,
				0,
				Math.PI * 2,
			)
			source.context.fill()
		}
	}
	const { canvas, context } = createCanvas({ width, height, pixelRatio })
	context.filter = `blur(${8 * pixelRatio}px)`
	context.drawImage(source.canvas, 0, 0, width, height)
	context.filter = 'none'
	context.globalCompositeOperation = 'destination-in'
	const horizontalFade = context.createLinearGradient(0, 0, width, 0)
	horizontalFade.addColorStop(0, '#000')
	horizontalFade.addColorStop(0.62, 'rgba(0, 0, 0, 0.75)')
	horizontalFade.addColorStop(1, 'rgba(0, 0, 0, 0)')
	context.fillStyle = horizontalFade
	context.fillRect(0, 0, width, height)
	const verticalFade = context.createLinearGradient(0, 0, 0, height)
	verticalFade.addColorStop(0, '#000')
	verticalFade.addColorStop(0.5, 'rgba(0, 0, 0, 0.65)')
	verticalFade.addColorStop(1, 'rgba(0, 0, 0, 0)')
	context.fillStyle = verticalFade
	context.fillRect(0, 0, width, height)
	context.globalCompositeOperation = 'source-over'
	return canvas
}

function createRandom(seed: number): () => number {
	let state = seed >>> 0
	return () => {
		state = (Math.imul(1664525, state) + 1013904223) >>> 0
		return state / 4294967296
	}
}

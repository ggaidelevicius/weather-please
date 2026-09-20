type SummerSolsticeArtwork = {
	sunlight: HTMLCanvasElement
	pollen: HTMLCanvasElement[]
	bokeh: HTMLCanvasElement
}

export function createSummerSolsticeArtwork(): SummerSolsticeArtwork {
	const sunlight = createRadialSprite({
		size: 256,
		radius: 128,
		stops: [
			[0, 'rgba(255, 218, 110, 0.9)'],
			[0.18, 'rgba(255, 218, 110, 0.64)'],
			[0.46, 'rgba(255, 218, 110, 0.26)'],
			[0.76, 'rgba(255, 218, 110, 0.055)'],
			[1, 'rgba(255, 218, 110, 0)'],
		],
	})
	const pollen = [
		'252, 211, 77',
		'253, 230, 138',
		'253, 186, 116',
		'254, 243, 199',
		'251, 191, 36',
		'253, 164, 175',
	].map((color) =>
		createRadialSprite({
			size: 64,
			radius: 28,
			stops: [
				[0, `rgba(${color}, 0.95)`],
				[0.35, `rgba(${color}, 0.8)`],
				[0.62, `rgba(${color}, 0.38)`],
				[0.82, `rgba(${color}, 0.09)`],
				[1, `rgba(${color}, 0)`],
			],
		}),
	)
	const bokeh = createRadialSprite({
		size: 64,
		radius: 27,
		stops: [
			[0, 'rgba(245, 210, 142, 0.36)'],
			[0.47, 'rgba(245, 210, 142, 0.35)'],
			[0.64, 'rgba(245, 210, 142, 0.28)'],
			[0.81, 'rgba(245, 210, 142, 0.11)'],
			[1, 'rgba(245, 210, 142, 0)'],
		],
	})
	return { sunlight, pollen, bokeh }
}

function createRadialSprite({
	size,
	radius,
	stops,
}: {
	size: number
	radius: number
	stops: readonly (readonly [number, string])[]
}): HTMLCanvasElement {
	const { canvas, context } = createCanvas({ width: size, height: size })
	const center = size / 2
	const gradient = context.createRadialGradient(
		center,
		center,
		0,
		center,
		center,
		radius,
	)
	for (const [offset, color] of stops) {
		gradient.addColorStop(offset, color)
	}
	context.fillStyle = gradient
	context.fillRect(0, 0, size, size)
	return canvas
}

function createCanvas({ width, height }: { width: number; height: number }) {
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	const context = canvas.getContext('2d')
	if (!context) {
		throw new Error('Unable to create the summer solstice artwork canvas')
	}
	return { canvas, context }
}

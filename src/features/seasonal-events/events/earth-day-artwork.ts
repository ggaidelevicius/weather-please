export type EarthParticleKind = 'leaf' | 'sprout' | 'drop' | 'flower'

type EarthDayArtwork = {
	glow: HTMLCanvasElement
	sprites: Record<EarthParticleKind, HTMLCanvasElement[]>
}

export function createEarthDayArtwork(): EarthDayArtwork {
	return {
		glow: createGlow(),
		sprites: {
			leaf: ['#4ade80', '#22c55e', '#86efac'].map(createLeaf),
			sprout: ['#34d399', '#2dd4bf', '#a7f3d0'].map(createSprout),
			drop: ['#7dd3fc', '#38bdf8', '#60a5fa'].map(createDrop),
			flower: FLOWER_PALETTES.map(createFlower),
		},
	}
}

const FLOWER_PALETTES = [
	{ inner: '#fbcfe8', mid: '#f472b6', outer: '#fb7185' },
	{ inner: '#fecdd3', mid: '#fb7185', outer: '#f97316' },
	{ inner: '#fde68a', mid: '#facc15', outer: '#f59e0b' },
	{ inner: '#f5d0fe', mid: '#f0abfc', outer: '#c084fc' },
	{ inner: '#c7d2fe', mid: '#a5b4fc', outer: '#818cf8' },
	{ inner: '#e9d5ff', mid: '#d8b4fe', outer: '#a855f7' },
	{ inner: '#fed7aa', mid: '#fdba74', outer: '#fb923c' },
	{ inner: '#bbf7d0', mid: '#86efac', outer: '#4ade80' },
	{ inner: '#a7f3d0', mid: '#5eead4', outer: '#2dd4bf' },
	{ inner: '#bae6fd', mid: '#7dd3fc', outer: '#38bdf8' },
	{ inner: '#c7d2fe', mid: '#a5b4fc', outer: '#6366f1' },
	{ inner: '#fee2e2', mid: '#fca5a5', outer: '#f87171' },
	{ inner: '#fef3c7', mid: '#fcd34d', outer: '#f59e0b' },
	{ inner: '#dcfce7', mid: '#86efac', outer: '#22c55e' },
	{ inner: '#cffafe', mid: '#67e8f9', outer: '#22d3ee' },
	{ inner: '#fce7f3', mid: '#f9a8d4', outer: '#ec4899' },
	{ inner: '#ede9fe', mid: '#c4b5fd', outer: '#8b5cf6' },
	{ inner: '#ffe4e6', mid: '#fda4af', outer: '#fb7185' },
	{ inner: '#ffedd5', mid: '#fdba74', outer: '#f97316' },
] as const

function createGlow(): HTMLCanvasElement {
	const { canvas, context } = createCanvas(256)
	const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128)
	gradient.addColorStop(0, 'rgba(34, 197, 94, 0.35)')
	gradient.addColorStop(0.45, 'rgba(16, 185, 129, 0.18)')
	gradient.addColorStop(0.75, 'rgba(15, 23, 42, 0)')
	gradient.addColorStop(1, 'rgba(15, 23, 42, 0)')
	context.fillStyle = gradient
	context.fillRect(0, 0, 256, 256)
	return canvas
}

function createLeaf(color: string): HTMLCanvasElement {
	const { canvas, context } = createParticleCanvas(color)
	context.beginPath()
	context.moveTo(7, -32)
	context.bezierCurveTo(-10, -27, -25, -10, -20, 9)
	context.bezierCurveTo(-17, 23, -4, 27, -2, 32)
	context.bezierCurveTo(16, 20, 23, 2, 15, -13)
	context.quadraticCurveTo(8, -24, 7, -32)
	context.closePath()
	context.fill()
	context.shadowBlur = 0
	const sheen = context.createLinearGradient(-23, -8, 17, 10)
	sheen.addColorStop(0, 'rgba(236, 253, 245, 0)')
	sheen.addColorStop(0.4, 'rgba(236, 253, 245, 0.22)')
	sheen.addColorStop(0.59, 'rgba(236, 253, 245, 0.035)')
	sheen.addColorStop(1, 'rgba(236, 253, 245, 0)')
	context.fillStyle = sheen
	context.fill()
	context.strokeStyle = 'rgba(220, 252, 231, 0.43)'
	context.lineWidth = 1.2
	context.beginPath()
	context.moveTo(-2, 27)
	context.bezierCurveTo(-5, 12, 4, -8, 7, -27)
	context.stroke()
	return canvas
}

function createSprout(color: string): HTMLCanvasElement {
	const { canvas, context } = createParticleCanvas(color)
	context.lineWidth = 3
	context.beginPath()
	context.moveTo(-3, 31)
	context.bezierCurveTo(3, 19, -4, 11, 0, 2)
	context.stroke()
	context.beginPath()
	context.moveTo(0, 6)
	context.bezierCurveTo(-19, 9, -34, -6, -30, -23)
	context.bezierCurveTo(-13, -28, -1, -13, 0, 6)
	context.closePath()
	context.fill()
	context.beginPath()
	context.moveTo(-1, 5)
	context.bezierCurveTo(0, -14, 15, -31, 31, -27)
	context.bezierCurveTo(34, -8, 20, 7, -1, 5)
	context.closePath()
	context.fill()
	context.shadowBlur = 0
	context.strokeStyle = 'rgba(220, 252, 231, 0.42)'
	context.lineWidth = 1.15
	context.beginPath()
	context.moveTo(-1, 5)
	context.quadraticCurveTo(-16, -1, -25, -18)
	context.moveTo(0, 5)
	context.quadraticCurveTo(13, -3, 26, -21)
	context.stroke()
	return canvas
}

function createDrop(color: string): HTMLCanvasElement {
	const { canvas, context } = createParticleCanvas(color)
	const water = context.createRadialGradient(-7, 3, 2, 0, 6, 34)
	water.addColorStop(0, `${color}f5`)
	water.addColorStop(0.48, `${color}e8`)
	water.addColorStop(1, `${color}a8`)
	context.fillStyle = water
	context.beginPath()
	context.moveTo(0, -32)
	context.bezierCurveTo(-5, -19, -24, -4, -23, 11)
	context.bezierCurveTo(-21, 36, 21, 36, 23, 11)
	context.bezierCurveTo(25, -4, 8, -19, 0, -32)
	context.closePath()
	context.fill()
	context.shadowBlur = 0
	context.strokeStyle = 'rgba(240, 249, 255, 0.7)'
	context.lineWidth = 2.5
	context.beginPath()
	context.moveTo(-10, -5)
	context.bezierCurveTo(-16, 2, -16, 10, -11, 15)
	context.stroke()
	context.fillStyle = 'rgba(240, 249, 255, 0.38)'
	context.beginPath()
	context.ellipse(9, 20, 4, 1.9, -0.4, 0, Math.PI * 2)
	context.fill()
	return canvas
}

function createFlower(
	palette: (typeof FLOWER_PALETTES)[number],
	index: number,
): HTMLCanvasElement {
	const { canvas, context } = createParticleCanvas(palette.mid)
	const petalCount = index % 3 === 0 ? 6 : 5
	for (let petal = 0; petal < petalCount; petal += 1) {
		context.save()
		context.rotate((petal * Math.PI * 2) / petalCount + index * 0.13)
		const gradient = context.createRadialGradient(-2, -18, 2, 0, -17, 17)
		gradient.addColorStop(0, palette.inner)
		gradient.addColorStop(0.55, palette.mid)
		gradient.addColorStop(1, palette.outer)
		context.fillStyle = gradient
		context.beginPath()
		context.moveTo(-3, 3)
		context.bezierCurveTo(-11, -4, -16, -23, -8, -29)
		context.bezierCurveTo(-2, -35, 7, -33, 11, -25)
		context.bezierCurveTo(15, -15, 11, -4, 3, 3)
		context.closePath()
		context.fill()
		context.restore()
	}
	context.shadowColor = '#fde68a'
	context.shadowBlur = 5
	const center = context.createRadialGradient(-2, -2, 0, 0, 0, 9)
	center.addColorStop(0, '#fef3c7')
	center.addColorStop(0.58, '#fde68a')
	center.addColorStop(1, '#facc15')
	context.fillStyle = center
	context.beginPath()
	context.arc(0, 0, 8.5, 0, Math.PI * 2)
	context.fill()
	return canvas
}

function createParticleCanvas(color: string) {
	const { canvas, context } = createCanvas(128)
	context.translate(64, 64)
	context.lineCap = 'round'
	context.lineJoin = 'round'
	context.fillStyle = color
	context.strokeStyle = color
	context.shadowColor = color
	context.shadowBlur = 8
	return { canvas, context }
}

function createCanvas(size: number) {
	const canvas = document.createElement('canvas')
	canvas.width = size
	canvas.height = size
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create the Earth Day artwork canvas')
	return { canvas, context }
}

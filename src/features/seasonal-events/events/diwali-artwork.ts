type Sprite = {
	canvas: HTMLCanvasElement
	width: number
	height: number
}

type DiyaSprite = Sprite & {
	flameX: number
	flameY: number
	baseY: number
}

export function createDiwaliArtwork({ dpr }: { dpr: number }): {
	diyas: DiyaSprite[]
	flame: Sprite
	rangoli: Sprite
	glow: Sprite
	ember: Sprite
} {
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	return {
		diyas: [0, 1, 2].map((variant) => createDiya({ pixelRatio, variant })),
		flame: createFlame(pixelRatio),
		rangoli: createRangoli(pixelRatio),
		glow: createGlow({ pixelRatio, isEmber: false }),
		ember: createGlow({ pixelRatio, isEmber: true }),
	}
}

function createDiya({
	pixelRatio,
	variant,
}: {
	pixelRatio: number
	variant: number
}): DiyaSprite {
	const { sprite, context } = createCanvas({
		width: 220,
		height: 130,
		pixelRatio,
	})
	const palettes = [
		['#e5a261', '#b86135', '#703727'],
		['#eac485', '#b18548', '#635034'],
		['#d97879', '#9c4554', '#512c39'],
	]
	const [light, color, shade] = palettes[variant]
	const body = context.createLinearGradient(57, 55, 143, 121)
	body.addColorStop(0, light)
	body.addColorStop(0.4, color)
	body.addColorStop(1, shade)
	context.fillStyle = shade
	context.beginPath()
	context.ellipse(110, 116, 25, 2, 0, 0, Math.PI * 2)
	context.fill()
	context.fillStyle = body
	diyaOutline(context)
	context.fill()
	context.save()
	context.clip()
	const reflection = context.createRadialGradient(164, 55, 0, 142, 65, 95)
	reflection.addColorStop(0, 'rgba(255, 222, 149, 0.35)')
	reflection.addColorStop(0.45, 'rgba(250, 194, 116, 0.13)')
	reflection.addColorStop(1, 'rgba(250, 194, 116, 0)')
	context.fillStyle = reflection
	context.fillRect(25, 48, 174, 73)
	context.strokeStyle = 'rgba(248, 210, 138, 0.83)'
	context.lineWidth = 1.4
	context.beginPath()
	context.moveTo(40, 77)
	context.bezierCurveTo(77, 99, 140, 106, 177, 69)
	context.stroke()
	for (let scallop = 0; scallop < 7; scallop += 1) {
		const x = 48 + scallop * 19
		const y = 79 + Math.sin((scallop / 6) * Math.PI) * 16
		context.beginPath()
		context.moveTo(x - 7, y - 2)
		context.quadraticCurveTo(x, y + 8, x + 7, y - 2)
		context.stroke()
		context.fillStyle = '#f0cb8a'
		context.beginPath()
		context.arc(x, y + 6.4, 1.5, 0, Math.PI * 2)
		context.fill()
		context.fillStyle = 'rgba(255, 229, 176, 0.53)'
		context.beginPath()
		context.arc(x, y - 4.5, 1.15, 0, Math.PI * 2)
		context.fill()
	}
	context.strokeStyle = 'rgba(235, 183, 115, 0.36)'
	context.lineWidth = 1
	context.beginPath()
	context.moveTo(63, 102)
	context.quadraticCurveTo(109, 121, 151, 103)
	context.stroke()
	context.restore()

	const rim = context.createLinearGradient(25, 43, 192, 73)
	rim.addColorStop(0, '#b97946')
	rim.addColorStop(0.3, '#f2c786')
	rim.addColorStop(0.65, variant === 1 ? '#bf965d' : '#bc7843')
	rim.addColorStop(1, '#f1c67d')
	context.fillStyle = rim
	context.beginPath()
	context.moveTo(29, 58)
	context.bezierCurveTo(39, 29, 114, 33, 152, 45)
	context.quadraticCurveTo(176, 51, 194, 40)
	context.bezierCurveTo(190, 65, 157, 83, 103, 81)
	context.bezierCurveTo(61, 80, 34, 71, 29, 58)
	context.closePath()
	context.fill()
	const oil = context.createLinearGradient(93, 38, 117, 78)
	oil.addColorStop(0, '#6e4027')
	oil.addColorStop(0.45, '#9f5c2b')
	oil.addColorStop(1, '#ce984d')
	context.fillStyle = oil
	context.beginPath()
	context.moveTo(39, 57)
	context.bezierCurveTo(47, 39, 111, 40, 150, 52)
	context.quadraticCurveTo(170, 57, 181, 50)
	context.bezierCurveTo(170, 67, 142, 75, 103, 73)
	context.bezierCurveTo(70, 72, 45, 66, 39, 57)
	context.closePath()
	context.fill()
	context.save()
	context.clip()
	const oilLight = context.createRadialGradient(160, 52, 0, 159, 55, 62)
	oilLight.addColorStop(0, 'rgba(255, 222, 135, 0.67)')
	oilLight.addColorStop(0.32, 'rgba(248, 187, 94, 0.27)')
	oilLight.addColorStop(1, 'rgba(244, 168, 67, 0)')
	context.fillStyle = oilLight
	context.fillRect(36, 38, 153, 43)
	context.restore()
	context.strokeStyle = 'rgba(255, 223, 157, 0.63)'
	context.lineWidth = 1.2
	context.beginPath()
	context.moveTo(37, 59)
	context.bezierCurveTo(56, 82, 152, 89, 182, 54)
	context.stroke()
	context.strokeStyle = '#ae814b'
	context.lineWidth = 5.2
	context.lineCap = 'round'
	context.beginPath()
	context.moveTo(164, 56)
	context.quadraticCurveTo(176, 52, 182, 37)
	context.stroke()
	context.strokeStyle = '#f1d29a'
	context.lineWidth = 2.7
	context.stroke()
	context.strokeStyle = '#5d3829'
	context.lineWidth = 2.8
	context.beginPath()
	context.moveTo(179.6, 43)
	context.lineTo(182, 37)
	context.stroke()
	return { ...sprite, flameX: 182, flameY: 37, baseY: 118 }
}

function diyaOutline(context: CanvasRenderingContext2D) {
	context.beginPath()
	context.moveTo(29, 58)
	context.bezierCurveTo(37, 94, 58, 116, 107, 117)
	context.bezierCurveTo(144, 118, 177, 95, 191, 49)
	context.bezierCurveTo(156, 64, 79, 75, 29, 58)
	context.closePath()
	return context
}

function createFlame(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 96,
		height: 128,
		pixelRatio,
	})
	const halo = context.createRadialGradient(48, 78, 0, 48, 78, 47)
	halo.addColorStop(0, 'rgba(255, 201, 98, 0.22)')
	halo.addColorStop(0.43, 'rgba(255, 165, 62, 0.1)')
	halo.addColorStop(1, 'rgba(255, 139, 38, 0)')
	context.fillStyle = halo
	context.fillRect(0, 0, 96, 128)
	const flame = context.createLinearGradient(0, 15, 0, 128)
	flame.addColorStop(0, '#ffb744')
	flame.addColorStop(0.3, '#ffd778')
	flame.addColorStop(0.74, '#ffefb3')
	flame.addColorStop(1, '#f6bf5d')
	context.fillStyle = flame
	context.beginPath()
	context.moveTo(48, 128)
	context.bezierCurveTo(23, 118, 23, 94, 41, 59)
	context.quadraticCurveTo(52, 37, 48, 14)
	context.bezierCurveTo(55, 41, 78, 82, 70, 108)
	context.quadraticCurveTo(65, 123, 48, 128)
	context.fill()
	context.fillStyle = '#fff7d5'
	context.beginPath()
	context.moveTo(48, 127)
	context.bezierCurveTo(34, 116, 39, 99, 49, 76)
	context.bezierCurveTo(58, 101, 63, 116, 48, 127)
	context.fill()
	return sprite
}

function createRangoli(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 512,
		height: 512,
		pixelRatio,
	})
	context.translate(256, 256)
	context.lineJoin = 'round'
	for (let petal = 0; petal < 32; petal += 1) {
		context.save()
		context.rotate((petal / 32) * Math.PI * 2)
		drawRangoliPetal({
			context,
			inner: 179,
			outer: 233,
			width: 12,
			color: petal % 2 === 0 ? '#b24774' : '#d16683',
			border: '#edbd73',
			seed: petal,
		})
		context.restore()
	}
	for (let petal = 0; petal < 16; petal += 1) {
		context.save()
		context.rotate(((petal + 0.5) / 16) * Math.PI * 2)
		drawRangoliPetal({
			context,
			inner: 126,
			outer: 203,
			width: 24,
			color: petal % 2 === 0 ? '#3faaa2' : '#277f81',
			border: '#edc47d',
			seed: petal + 32,
		})
		context.restore()
	}
	drawDottedRing({ context, radius: 198, count: 64, size: 2, color: '#f7d99e' })
	for (let petal = 0; petal < 16; petal += 1) {
		context.save()
		context.rotate((petal / 16) * Math.PI * 2)
		drawRangoliPetal({
			context,
			inner: 65,
			outer: 160,
			width: 28,
			color: petal % 2 === 0 ? '#d65e8b' : '#ac3d70',
			border: '#f1c382',
			seed: petal + 48,
		})
		context.restore()
	}
	for (let petal = 0; petal < 8; petal += 1) {
		context.save()
		context.rotate(((petal + 0.25) / 8) * Math.PI * 2)
		drawRangoliPetal({
			context,
			inner: 24,
			outer: 112,
			width: 29,
			color: petal % 2 === 0 ? '#e7a443' : '#f3bf65',
			border: '#ffdfa0',
			seed: petal + 64,
		})
		context.restore()
	}
	drawDottedRing({
		context,
		radius: 127,
		count: 48,
		size: 2.2,
		color: '#f5d294',
	})
	for (const [radius, color] of [
		[44, '#763457'],
		[36, '#efbd64'],
		[27, '#bd4d7a'],
		[15, '#389c99'],
		[6, '#f7d78d'],
	] as const) {
		context.fillStyle = color
		context.globalAlpha = 0.94
		context.beginPath()
		for (let point = 0; point < 96; point += 1) {
			const angle = (point / 96) * Math.PI * 2
			const edge = radius + (rangoliGrain(point + radius * 17) - 0.5) * 1.2
			const x = Math.cos(angle) * edge
			const y = Math.sin(angle) * edge
			if (point === 0) context.moveTo(x, y)
			else context.lineTo(x, y)
		}
		context.closePath()
		context.fill()
	}
	context.globalAlpha = 1
	drawDottedRing({
		context,
		radius: 32,
		count: 16,
		size: 1.5,
		color: '#864555',
	})
	drawDottedRing({
		context,
		radius: 20,
		count: 12,
		size: 1.5,
		color: '#ffdea1',
	})
	applyRangoliPowder(context)
	return sprite
}

function drawRangoliPetal({
	context,
	inner,
	outer,
	width,
	color,
	border,
	seed,
}: {
	context: CanvasRenderingContext2D
	inner: number
	outer: number
	width: number
	color: string
	border: string
	seed: number
}) {
	const length = outer - inner
	const leftWidth = width * (0.97 + rangoliGrain(seed * 7) * 0.06)
	const rightWidth = width * (0.97 + rangoliGrain(seed * 7 + 1) * 0.06)
	const tipX = (rangoliGrain(seed * 7 + 2) - 0.5) * 1.6
	const tipY = -outer + (rangoliGrain(seed * 7 + 3) - 0.5) * 1.8
	context.fillStyle = color
	context.strokeStyle = border
	context.lineWidth = 1.3
	context.globalAlpha = 0.9 + rangoliGrain(seed * 7 + 4) * 0.06
	context.beginPath()
	context.moveTo(0, -inner)
	context.bezierCurveTo(
		-leftWidth,
		-inner - length * 0.3,
		-leftWidth,
		-outer + length * 0.2,
		tipX,
		tipY,
	)
	context.bezierCurveTo(
		rightWidth,
		-outer + length * 0.2,
		rightWidth,
		-inner - length * 0.3,
		0,
		-inner,
	)
	context.fill()
	context.globalAlpha = 0.27
	context.stroke()
	context.lineWidth = 0.8
	context.globalAlpha = 0.13
	context.beginPath()
	context.moveTo(0, -inner - length * 0.3)
	context.quadraticCurveTo(-width * 0.12, -inner - length * 0.6, 0, -outer + 8)
	context.stroke()
	context.globalAlpha = 0.68
	context.fillStyle = border
	context.beginPath()
	context.arc(
		0,
		-outer + length * 0.22,
		Math.min(2.4, width * 0.1),
		0,
		Math.PI * 2,
	)
	context.fill()
	context.globalAlpha = 1
	return context
}

function drawDottedRing({
	context,
	radius,
	count,
	size,
	color,
}: {
	context: CanvasRenderingContext2D
	radius: number
	count: number
	size: number
	color: string
}) {
	context.fillStyle = color
	for (let dot = 0; dot < count; dot += 1) {
		const seed = radius * 13 + dot * 5
		const angle =
			(dot / count) * Math.PI * 2 + (rangoliGrain(seed) - 0.5) * 0.005
		const distance = radius + (rangoliGrain(seed + 1) - 0.5) * 1.2
		context.globalAlpha = 0.62 + rangoliGrain(seed + 2) * 0.16
		context.beginPath()
		context.ellipse(
			Math.cos(angle) * distance,
			Math.sin(angle) * distance,
			size * (0.9 + rangoliGrain(seed + 3) * 0.2),
			size,
			angle,
			0,
			Math.PI * 2,
		)
		context.fill()
	}
	context.globalAlpha = 1
	return context
}

function applyRangoliPowder(context: CanvasRenderingContext2D) {
	context.save()
	context.globalCompositeOperation = 'source-atop'
	for (let patch = 0; patch < 24; patch += 1) {
		const x = (rangoliGrain(patch * 3 + 503) - 0.5) * 460
		const y = (rangoliGrain(patch * 3 + 504) - 0.5) * 460
		const radius = 18 + rangoliGrain(patch * 3 + 505) * 35
		const pigment = context.createRadialGradient(x, y, 0, x, y, radius)
		pigment.addColorStop(0, 'rgba(94, 59, 57, 0.11)')
		pigment.addColorStop(1, 'rgba(94, 59, 57, 0)')
		context.fillStyle = pigment
		context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
	}
	for (let grain = 0; grain < 7_500; grain += 1) {
		const seed = grain * 4 + 1201
		const x = (rangoliGrain(seed) - 0.5) * 480
		const y = (rangoliGrain(seed + 1) - 0.5) * 480
		const size = 0.3 + rangoliGrain(seed + 2) * 0.65
		context.fillStyle = grain % 3 === 0 ? '#f4d3a4' : '#735155'
		context.globalAlpha = 0.08 + rangoliGrain(seed + 3) * 0.18
		context.beginPath()
		context.arc(x, y, size, 0, Math.PI * 2)
		context.fill()
	}
	context.globalCompositeOperation = 'destination-out'
	context.fillStyle = '#000'
	for (let grain = 0; grain < 6_000; grain += 1) {
		const seed = grain * 4 + 41003
		const x = (rangoliGrain(seed) - 0.5) * 480
		const y = (rangoliGrain(seed + 1) - 0.5) * 480
		const size = 0.45 + rangoliGrain(seed + 2) * 0.65
		context.globalAlpha = 0.14 + rangoliGrain(seed + 3) * 0.3
		context.beginPath()
		context.arc(x, y, size, 0, Math.PI * 2)
		context.fill()
	}
	context.restore()
	return context
}

function rangoliGrain(seed: number) {
	let hash = Math.imul(seed ^ 0x9e3779b9, 0x7feb352d)
	hash = Math.imul(hash ^ (hash >>> 16), 0x846ca68b)
	return ((hash ^ (hash >>> 15)) >>> 0) / 0xffffffff
}

function createGlow({
	pixelRatio,
	isEmber,
}: {
	pixelRatio: number
	isEmber: boolean
}): Sprite {
	const size = isEmber ? 64 : 256
	const { sprite, context } = createCanvas({
		width: size,
		height: size,
		pixelRatio,
	})
	const center = size / 2
	const gradient = context.createRadialGradient(
		center,
		center,
		0,
		center,
		center,
		center,
	)
	if (isEmber) {
		gradient.addColorStop(0, 'rgba(255, 248, 211, 0.95)')
		gradient.addColorStop(0.06, 'rgba(255, 221, 145, 0.83)')
		gradient.addColorStop(0.18, 'rgba(247, 179, 77, 0.38)')
		gradient.addColorStop(0.46, 'rgba(245, 142, 44, 0.065)')
	} else {
		gradient.addColorStop(0, 'rgba(255, 198, 106, 0.56)')
		gradient.addColorStop(0.22, 'rgba(245, 165, 71, 0.29)')
		gradient.addColorStop(0.52, 'rgba(220, 120, 47, 0.095)')
		gradient.addColorStop(0.8, 'rgba(191, 88, 43, 0.018)')
	}
	gradient.addColorStop(1, 'rgba(198, 97, 40, 0)')
	context.fillStyle = gradient
	context.fillRect(0, 0, size, size)
	return sprite
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
	if (!context) throw new Error('Unable to create Diwali artwork')
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	return { sprite: { canvas, width, height }, context }
}

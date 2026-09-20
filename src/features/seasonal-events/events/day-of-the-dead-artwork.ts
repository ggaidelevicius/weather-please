type DayOfTheDeadArtwork = {
	skulls: HTMLCanvasElement[]
	marigolds: HTMLCanvasElement[]
	petals: HTMLCanvasElement[]
	butterflies: HTMLCanvasElement[]
	candle: HTMLCanvasElement
	flame: HTMLCanvasElement
	glow: HTMLCanvasElement
}

export function createDayOfTheDeadArtwork({
	dpr,
}: {
	dpr: number
}): DayOfTheDeadArtwork {
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	return {
		skulls: [0, 1].map((variant) => createSkull({ pixelRatio, variant })),
		marigolds: [0, 1, 2].map((variant) =>
			createMarigold({ pixelRatio, variant }),
		),
		petals: [0, 1, 2].map((variant) => createPetal({ pixelRatio, variant })),
		butterflies: [0, 1].map((variant) =>
			createButterfly({ pixelRatio, variant }),
		),
		candle: createCandle({ pixelRatio }),
		flame: createFlame({ pixelRatio }),
		glow: createGlow({ pixelRatio }),
	}
}

function createSkull({
	pixelRatio,
	variant,
}: {
	pixelRatio: number
	variant: number
}) {
	const { canvas, context } = createCanvas({ width: 256, pixelRatio })
	const pink = variant === 0 ? '#e94b8b' : '#a962c8'
	const turquoise = variant === 0 ? '#27b5b1' : '#36bca6'
	const ivory = context.createRadialGradient(102, 87, 9, 141, 150, 120)
	ivory.addColorStop(0, '#fffae8')
	ivory.addColorStop(0.55, '#f4e9d1')
	ivory.addColorStop(1, '#d4bfae')
	context.fillStyle = ivory
	context.strokeStyle = '#9b7a84'
	context.lineWidth = 2
	context.beginPath()
	context.moveTo(128, 45)
	context.bezierCurveTo(75, 44, 53, 75, 53, 116)
	context.bezierCurveTo(51, 144, 60, 163, 79, 173)
	context.bezierCurveTo(88, 180, 79, 196, 86, 218)
	context.bezierCurveTo(91, 236, 107, 236, 128, 236)
	context.bezierCurveTo(149, 236, 165, 236, 170, 218)
	context.bezierCurveTo(177, 196, 168, 180, 177, 173)
	context.bezierCurveTo(196, 163, 205, 144, 203, 116)
	context.bezierCurveTo(203, 75, 181, 44, 128, 45)
	context.closePath()
	context.fill()
	context.stroke()
	context.lineCap = 'round'
	context.lineJoin = 'round'
	for (const [x, color] of [
		[94, pink],
		[162, turquoise],
	] as const) {
		paintFlower({
			context,
			x,
			y: 125,
			radius: 27,
			petals: 10,
			color,
			center: '#574067',
		})
		context.strokeStyle = '#f6c25e'
		context.lineWidth = 2
		context.beginPath()
		context.arc(x, 125, 13.5, 0, Math.PI * 2)
		context.stroke()
		context.fillStyle = '#f7d079'
		for (let dot = 0; dot < 10; dot += 1) {
			const angle = (dot * Math.PI * 2) / 10
			context.beginPath()
			context.arc(
				x + Math.cos(angle) * 21.2,
				125 + Math.sin(angle) * 21.2,
				1.5,
				0,
				Math.PI * 2,
			)
			context.fill()
		}
	}
	context.fillStyle = pink
	context.strokeStyle = '#bc775c'
	context.lineWidth = 0.8
	context.beginPath()
	context.moveTo(128, 94)
	context.bezierCurveTo(123, 88, 112, 82, 117, 74)
	context.bezierCurveTo(121, 68, 127, 73, 128, 77)
	context.bezierCurveTo(132, 68, 140, 70, 141, 77)
	context.bezierCurveTo(142, 83, 134, 90, 128, 94)
	context.closePath()
	context.fill()
	context.stroke()
	paintFlower({
		context,
		x: 128,
		y: 56,
		radius: 10,
		petals: 7,
		color: '#e7a333',
		center: '#fbe098',
	})
	for (const direction of [-1, 1]) {
		context.save()
		context.translate(128, 0)
		context.scale(direction, 1)
		context.strokeStyle = turquoise
		context.lineWidth = 2.4
		context.beginPath()
		context.moveTo(20, 95)
		context.bezierCurveTo(39, 100, 54, 87, 46, 76)
		context.bezierCurveTo(39, 67, 32, 78, 41, 82)
		context.stroke()
		context.strokeStyle = pink
		context.lineWidth = 2.2
		context.beginPath()
		context.moveTo(26, 182)
		context.bezierCurveTo(34, 165, 55, 183, 61, 166)
		context.bezierCurveTo(65, 151, 46, 151, 48, 163)
		context.stroke()
		context.fillStyle = turquoise
		context.beginPath()
		context.moveTo(35, 174)
		context.quadraticCurveTo(42, 160, 40, 152)
		context.quadraticCurveTo(26, 161, 35, 174)
		context.fill()
		context.fillStyle = '#dca23f'
		for (const [x, y, radius] of [
			[60, 91, 2.3],
			[63, 98, 1.7],
			[17, 100, 1.7],
			[23, 63, 2.1],
			[32, 67, 1.5],
			[23, 187, 2],
		]) {
			context.beginPath()
			context.arc(x, y, radius, 0, Math.PI * 2)
			context.fill()
		}
		context.restore()
	}
	context.fillStyle = '#68475e'
	context.beginPath()
	context.moveTo(128, 167)
	context.bezierCurveTo(122, 162, 117, 164, 119, 171)
	context.lineTo(128, 181)
	context.lineTo(137, 171)
	context.bezierCurveTo(139, 164, 134, 162, 128, 167)
	context.fill()
	context.strokeStyle = '#876473'
	context.lineWidth = 1.6
	context.fillStyle = '#fff5dc'
	for (let tooth = 0; tooth < 8; tooth += 1) {
		const x = 91 + tooth * 9.25
		const curve = Math.sin(((tooth + 0.5) * Math.PI) / 8) * 5
		context.beginPath()
		context.moveTo(x, 196 + curve)
		context.quadraticCurveTo(x + 4.6, 193 + curve, x + 9.25, 196 + curve)
		context.lineTo(x + 8.4, 216 + curve)
		context.quadraticCurveTo(x + 4.5, 219 + curve, x + 0.8, 216 + curve)
		context.closePath()
		context.fill()
		context.stroke()
	}
	context.beginPath()
	context.moveTo(91, 206)
	context.quadraticCurveTo(128, 218, 165, 206)
	context.stroke()
	context.strokeStyle = turquoise
	context.lineWidth = 2
	context.beginPath()
	context.moveTo(109, 228)
	context.quadraticCurveTo(128, 237, 147, 228)
	context.stroke()
	return canvas
}

function paintFlower({
	context,
	x,
	y,
	radius,
	petals,
	color,
	center,
}: {
	context: CanvasRenderingContext2D
	x: number
	y: number
	radius: number
	petals: number
	color: string
	center: string
}) {
	context.save()
	context.translate(x, y)
	context.fillStyle = color
	for (let index = 0; index < petals; index += 1) {
		const angle = (index * Math.PI * 2) / petals
		context.beginPath()
		context.ellipse(
			Math.cos(angle) * radius * 0.65,
			Math.sin(angle) * radius * 0.65,
			radius * 0.35,
			radius * 0.2,
			angle,
			0,
			Math.PI * 2,
		)
		context.fill()
	}
	context.fillStyle = center
	context.beginPath()
	context.arc(0, 0, radius * 0.54, 0, Math.PI * 2)
	context.fill()
	context.restore()
	return context
}

function createMarigold({
	pixelRatio,
	variant,
}: {
	pixelRatio: number
	variant: number
}) {
	const { canvas, context } = createCanvas({ width: 128, pixelRatio })
	context.translate(64, 64)
	const palettes = [
		['#ffd052', '#f49b1c', '#bd4d15'],
		['#ffe07b', '#fdbb35', '#cf721a'],
		['#ffb942', '#ee841b', '#b74619'],
	]
	const [light, color, shade] = palettes[variant]
	context.fillStyle = shade
	context.beginPath()
	context.arc(0, 0, 36, 0, Math.PI * 2)
	context.fill()
	for (let ring = 0; ring < 5; ring += 1) {
		const count = 20 - ring * 3
		const distance = 31 - ring * 6.2
		const length = 14.3 - ring * 1.55
		const breadth = 8.5 - ring * 1.1
		for (let index = 0; index < count; index += 1) {
			context.save()
			context.rotate(
				(index * Math.PI * 2) / count + ring * 0.39 + variant * 0.15,
			)
			context.translate(0, -distance)
			const petal = context.createLinearGradient(0, -length, 0, length * 0.65)
			petal.addColorStop(0, light)
			petal.addColorStop(0.35, color)
			petal.addColorStop(1, shade)
			context.fillStyle = petal
			context.strokeStyle = 'rgba(151, 61, 16, 0.22)'
			context.lineWidth = 0.65
			context.beginPath()
			context.moveTo(0, length * 0.65)
			context.bezierCurveTo(
				-breadth,
				2,
				-breadth,
				-length * 0.5,
				-breadth * 0.5,
				-length,
			)
			context.quadraticCurveTo(
				-breadth * 0.15,
				-length * 0.7,
				0,
				-length * 0.91,
			)
			context.quadraticCurveTo(
				breadth * 0.4,
				-length * 1.11,
				breadth * 0.62,
				-length * 0.75,
			)
			context.bezierCurveTo(
				breadth,
				-length * 0.2,
				breadth * 0.65,
				2,
				0,
				length * 0.65,
			)
			context.closePath()
			context.fill()
			context.stroke()
			context.restore()
		}
	}
	return canvas
}

function createPetal({
	pixelRatio,
	variant,
}: {
	pixelRatio: number
	variant: number
}) {
	const { canvas, context } = createCanvas({ width: 64, pixelRatio })
	const gradient = context.createLinearGradient(23, 18, 40, 47)
	gradient.addColorStop(0, ['#ffd369', '#ffe198', '#ffc35b'][variant])
	gradient.addColorStop(0.48, ['#f7a82f', '#ffc047', '#f59a26'][variant])
	gradient.addColorStop(1, '#cf681c')
	context.fillStyle = gradient
	context.beginPath()
	context.moveTo(31, 48)
	context.bezierCurveTo(22, 38, 19, 22, 27, 17)
	context.quadraticCurveTo(31, 20, 36, 17)
	context.bezierCurveTo(46, 22, 41, 39, 31, 48)
	context.fill()
	context.strokeStyle = 'rgba(255, 226, 133, 0.5)'
	context.lineWidth = 1
	context.beginPath()
	context.moveTo(31, 44)
	context.quadraticCurveTo(29, 31, 33, 23)
	context.stroke()
	return canvas
}

function createButterfly({
	pixelRatio,
	variant,
}: {
	pixelRatio: number
	variant: number
}) {
	const { canvas, context } = createCanvas({ width: 128, pixelRatio })
	context.lineCap = 'round'
	context.lineJoin = 'round'
	for (const direction of [-1, 1]) {
		context.save()
		context.translate(64, 64)
		context.scale(direction, 1)
		const wing = context.createLinearGradient(0, 19, 41, -29)
		wing.addColorStop(0, '#f2b441')
		wing.addColorStop(0.46, variant === 0 ? '#ed8d26' : '#eeb139')
		wing.addColorStop(1, variant === 0 ? '#cc601c' : '#d67e24')
		context.fillStyle = wing
		context.strokeStyle = '#493031'
		context.lineWidth = 3.8
		context.beginPath()
		context.moveTo(1, 3)
		context.bezierCurveTo(8, -16, 31, -42, 39, -40)
		context.bezierCurveTo(50, -36, 43, -12, 37, 0)
		context.quadraticCurveTo(26, 13, 1, 13)
		context.closePath()
		context.fill()
		context.stroke()
		context.beginPath()
		context.moveTo(2, 9)
		context.bezierCurveTo(24, 1, 43, 13, 35, 30)
		context.bezierCurveTo(28, 46, 10, 43, 1, 20)
		context.closePath()
		context.fill()
		context.stroke()
		context.lineWidth = 1.15
		for (const [x, y, bend] of [
			[37, -35, 11],
			[41, -20, 7],
			[35, -3, 5],
			[24, 6, 0],
			[33, 24, 9],
			[22, 38, 3],
			[11, 33, 0],
		]) {
			context.beginPath()
			context.moveTo(2, 10)
			context.quadraticCurveTo(x * 0.5 + bend, y * 0.35, x, y)
			context.stroke()
		}
		context.beginPath()
		context.moveTo(14, -17)
		context.quadraticCurveTo(20, -21, 31, -17)
		context.lineTo(30, -4)
		context.quadraticCurveTo(18, 1, 9, 0)
		context.stroke()
		context.fillStyle = '#fff2c9'
		for (const [x, y, radius] of [
			[38, -34, 1.8],
			[41, -26, 1.6],
			[40, -18, 1.5],
			[36, -9, 1.45],
			[31, 28, 1.5],
			[26, 35, 1.5],
			[18, 36, 1.4],
			[10, 28, 1.25],
		]) {
			context.beginPath()
			context.arc(x, y, radius, 0, Math.PI * 2)
			context.fill()
		}
		context.restore()
	}
	context.fillStyle = '#483035'
	context.beginPath()
	context.ellipse(64, 73, 3, 18, 0, 0, Math.PI * 2)
	context.fill()
	context.beginPath()
	context.arc(64, 56, 3.4, 0, Math.PI * 2)
	context.fill()
	context.strokeStyle = '#5d4140'
	context.lineWidth = 1
	context.beginPath()
	context.moveTo(63, 56)
	context.quadraticCurveTo(60, 45, 55, 44)
	context.moveTo(65, 56)
	context.quadraticCurveTo(68, 45, 73, 44)
	context.stroke()
	return canvas
}

function createCandle({ pixelRatio }: { pixelRatio: number }) {
	const { canvas, context } = createCanvas({
		width: 128,
		height: 256,
		pixelRatio,
	})
	const wax = context.createLinearGradient(35, 0, 93, 0)
	wax.addColorStop(0, '#b79167')
	wax.addColorStop(0.21, '#ead1a4')
	wax.addColorStop(0.46, '#fff0ca')
	wax.addColorStop(0.76, '#ebd3a5')
	wax.addColorStop(1, '#b59067')
	context.fillStyle = wax
	context.beginPath()
	context.moveTo(36, 91)
	context.lineTo(36, 230)
	context.bezierCurveTo(36, 241, 92, 241, 92, 230)
	context.lineTo(92, 91)
	context.closePath()
	context.fill()
	context.fillStyle = '#f6e3b8'
	context.beginPath()
	context.ellipse(64, 91, 28, 8, 0, 0, Math.PI * 2)
	context.fill()
	const melt = context.createLinearGradient(0, 89, 0, 145)
	melt.addColorStop(0, '#f9e7bd')
	melt.addColorStop(1, '#ddbd8e')
	context.fillStyle = melt
	context.beginPath()
	context.moveTo(37, 92)
	context.quadraticCurveTo(42, 97, 45, 96)
	context.lineTo(46, 125)
	context.bezierCurveTo(46, 133, 53, 133, 53, 124)
	context.lineTo(54, 99)
	context.quadraticCurveTo(58, 98, 61, 100)
	context.lineTo(62, 111)
	context.bezierCurveTo(62, 117, 68, 117, 69, 111)
	context.lineTo(70, 99)
	context.quadraticCurveTo(76, 98, 79, 98)
	context.lineTo(80, 138)
	context.bezierCurveTo(80, 146, 86, 146, 86, 137)
	context.lineTo(88, 97)
	context.lineTo(92, 92)
	context.quadraticCurveTo(63, 99, 37, 92)
	context.fill()
	context.fillStyle = '#cba36c'
	context.beginPath()
	context.ellipse(64, 91, 9, 3, 0, 0, Math.PI * 2)
	context.fill()
	context.strokeStyle = '#694739'
	context.lineWidth = 2.3
	context.lineCap = 'round'
	context.beginPath()
	context.moveTo(64, 91)
	context.quadraticCurveTo(67, 82, 64, 74)
	context.stroke()
	return canvas
}

function createFlame({ pixelRatio }: { pixelRatio: number }) {
	const { canvas, context } = createCanvas({ width: 128, pixelRatio })
	const halo = context.createRadialGradient(64, 76, 1, 64, 76, 47)
	halo.addColorStop(0, 'rgba(255, 200, 93, 0.42)')
	halo.addColorStop(0.33, 'rgba(255, 163, 58, 0.21)')
	halo.addColorStop(0.7, 'rgba(245, 127, 35, 0.04)')
	halo.addColorStop(1, 'rgba(245, 127, 35, 0)')
	context.fillStyle = halo
	context.fillRect(0, 0, 128, 128)
	const fire = context.createLinearGradient(0, 40, 0, 97)
	fire.addColorStop(0, '#ffb74c')
	fire.addColorStop(0.52, '#ffde87')
	fire.addColorStop(0.85, '#fff1bb')
	fire.addColorStop(1, '#edb85c')
	context.fillStyle = fire
	context.beginPath()
	context.moveTo(65, 40)
	context.bezierCurveTo(69, 54, 79, 71, 75, 85)
	context.bezierCurveTo(72, 98, 56, 100, 53, 87)
	context.bezierCurveTo(49, 74, 59, 57, 65, 40)
	context.fill()
	context.fillStyle = '#fff6ce'
	context.beginPath()
	context.moveTo(64, 66)
	context.bezierCurveTo(70, 77, 73, 90, 64, 96)
	context.bezierCurveTo(54, 89, 60, 77, 64, 66)
	context.fill()
	return canvas
}

function createGlow({ pixelRatio }: { pixelRatio: number }) {
	const { canvas, context } = createCanvas({ width: 256, pixelRatio })
	const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128)
	gradient.addColorStop(0, 'rgba(255, 192, 88, 0.62)')
	gradient.addColorStop(0.24, 'rgba(247, 159, 58, 0.34)')
	gradient.addColorStop(0.52, 'rgba(234, 125, 42, 0.13)')
	gradient.addColorStop(0.8, 'rgba(225, 112, 38, 0.025)')
	gradient.addColorStop(1, 'rgba(225, 112, 38, 0)')
	context.fillStyle = gradient
	context.fillRect(0, 0, 256, 256)
	return canvas
}

function createCanvas({
	width,
	height = width,
	pixelRatio,
}: {
	width: number
	height?: number
	pixelRatio: number
}) {
	const canvas = document.createElement('canvas')
	canvas.width = Math.round(width * pixelRatio)
	canvas.height = Math.round(height * pixelRatio)
	const context = canvas.getContext('2d')
	if (!context)
		throw new Error('Unable to create the Day of the Dead artwork canvas')
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	return { canvas, context }
}

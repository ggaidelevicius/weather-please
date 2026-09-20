type HalloweenArtwork = {
	moon: HTMLCanvasElement
	pumpkins: HTMLCanvasElement[]
	pumpkinLights: HTMLCanvasElement[]
	ghosts: HTMLCanvasElement[]
	bats: HTMLCanvasElement[]
	haze: HTMLCanvasElement
	ember: HTMLCanvasElement
}

export function createHalloweenArtwork({
	dpr,
}: {
	dpr: number
}): HalloweenArtwork {
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	const pumpkins = [0, 1, 2].map((variant) =>
		createPumpkin({ pixelRatio, variant }),
	)
	return {
		moon: createMoon({ pixelRatio }),
		pumpkins: pumpkins.map(({ pumpkin }) => pumpkin),
		pumpkinLights: pumpkins.map(({ light }) => light),
		ghosts: [0, 1].map((variant) => createGhost({ pixelRatio, variant })),
		bats: [0, 1, 2].map((variant) => createBat({ pixelRatio, variant })),
		haze: createRadialSprite({
			pixelRatio,
			size: 256,
			stops: [
				[0, 'rgba(142, 83, 199, 0.48)'],
				[0.28, 'rgba(117, 65, 165, 0.32)'],
				[0.58, 'rgba(100, 57, 147, 0.13)'],
				[0.83, 'rgba(84, 46, 127, 0.025)'],
				[1, 'rgba(84, 46, 127, 0)'],
			],
		}),
		ember: createRadialSprite({
			pixelRatio,
			size: 64,
			stops: [
				[0, 'rgba(255, 241, 183, 1)'],
				[0.055, 'rgba(255, 207, 106, 0.95)'],
				[0.14, 'rgba(255, 153, 57, 0.65)'],
				[0.38, 'rgba(251, 120, 34, 0.17)'],
				[0.72, 'rgba(251, 120, 34, 0.025)'],
				[1, 'rgba(251, 120, 34, 0)'],
			],
		}),
	}
}

function createMoon({ pixelRatio }: { pixelRatio: number }) {
	const canvas = createRadialSprite({
		pixelRatio,
		size: 320,
		stops: [
			[0, 'rgba(222, 208, 246, 0.42)'],
			[0.4, 'rgba(211, 191, 243, 0.3)'],
			[0.56, 'rgba(193, 164, 230, 0.12)'],
			[0.78, 'rgba(167, 125, 213, 0.035)'],
			[1, 'rgba(167, 125, 213, 0)'],
		],
	})
	const context = getContext(canvas)
	const moonlight = context.createRadialGradient(137, 132, 3, 170, 167, 81)
	moonlight.addColorStop(0, '#fff5dc')
	moonlight.addColorStop(0.46, '#e8deec')
	moonlight.addColorStop(0.82, '#c7b7da')
	moonlight.addColorStop(1, '#9c88b7')
	context.fillStyle = moonlight
	context.beginPath()
	context.arc(160, 160, 66, 0, Math.PI * 2)
	context.fill()
	context.save()
	context.clip()
	for (const [x, y, radius, opacity] of [
		[129, 143, 20, 0.13],
		[140, 124, 10, 0.1],
		[185, 160, 26, 0.12],
		[168, 195, 16, 0.1],
		[121, 181, 12, 0.09],
		[198, 124, 13, 0.09],
		[154, 164, 7, 0.08],
	]) {
		const crater = context.createRadialGradient(x, y, 0, x, y, radius)
		crater.addColorStop(0, `rgba(103, 81, 137, ${opacity})`)
		crater.addColorStop(0.7, `rgba(103, 81, 137, ${opacity * 0.6})`)
		crater.addColorStop(1, 'rgba(103, 81, 137, 0)')
		context.fillStyle = crater
		context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
	}
	context.restore()
	return canvas
}

function createPumpkin({
	pixelRatio,
	variant,
}: {
	pixelRatio: number
	variant: number
}) {
	const { canvas: pumpkin, context } = createCanvas({ size: 256, pixelRatio })
	const stem = context.createLinearGradient(119, 40, 140, 80)
	stem.addColorStop(0, '#9a955a')
	stem.addColorStop(0.45, '#686c3c')
	stem.addColorStop(1, '#373e27')
	context.fillStyle = stem
	context.beginPath()
	context.moveTo(116, 85)
	context.bezierCurveTo(124, 65, 118, 48, 132, 35)
	context.quadraticCurveTo(138, 33, 144, 40)
	context.bezierCurveTo(132, 51, 133, 65, 141, 86)
	context.closePath()
	context.fill()
	context.strokeStyle = 'rgba(210, 203, 129, 0.34)'
	context.lineWidth = 2
	context.beginPath()
	context.moveTo(126, 78)
	context.bezierCurveTo(128, 63, 125, 48, 136, 39)
	context.stroke()
	const shell = context.createRadialGradient(94, 112, 8, 135, 163, 121)
	shell.addColorStop(0, variant === 1 ? '#f5ae4f' : '#f3a13e')
	shell.addColorStop(0.42, variant === 2 ? '#d97720' : '#e18728')
	shell.addColorStop(0.8, '#b95519')
	shell.addColorStop(1, '#6b2b20')
	context.fillStyle = shell
	pumpkinOutline(context)
	context.fill()
	context.save()
	context.clip()
	for (const [x, radius, shade] of [
		[73, 42, 0.26],
		[181, 42, 0.32],
		[104, 47, 0.19],
		[150, 47, 0.22],
		[128, 37, 0.13],
	]) {
		const rib = context.createLinearGradient(x - radius, 0, x + radius, 0)
		rib.addColorStop(0, `rgba(94, 33, 22, ${shade})`)
		rib.addColorStop(0.32, 'rgba(255, 192, 91, 0.15)')
		rib.addColorStop(0.56, 'rgba(255, 171, 59, 0.09)')
		rib.addColorStop(1, `rgba(101, 34, 17, ${shade})`)
		context.fillStyle = rib
		context.beginPath()
		context.ellipse(x, 152, radius, 76, 0, 0, Math.PI * 2)
		context.fill()
	}
	context.lineWidth = 1.25
	for (const offset of [-65, -35, 34, 65]) {
		context.strokeStyle = 'rgba(105, 42, 20, 0.22)'
		context.beginPath()
		context.moveTo(128 + offset * 0.43, 80)
		context.bezierCurveTo(
			128 + offset * 1.35,
			110,
			128 + offset * 1.4,
			189,
			128 + offset * 0.47,
			227,
		)
		context.stroke()
	}
	const underside = context.createLinearGradient(0, 173, 0, 227)
	underside.addColorStop(0, 'rgba(59, 24, 32, 0)')
	underside.addColorStop(1, 'rgba(59, 24, 32, 0.38)')
	context.fillStyle = underside
	context.fillRect(28, 173, 202, 55)
	context.restore()
	context.lineJoin = 'round'
	context.strokeStyle = '#783512'
	context.lineWidth = 4
	carvedFace({ context, variant })
	context.stroke()
	const firelight = context.createLinearGradient(0, 108, 0, 202)
	firelight.addColorStop(0, '#fbd67b')
	firelight.addColorStop(0.42, '#ffbc50')
	firelight.addColorStop(1, '#ffe5a0')
	context.fillStyle = firelight
	context.shadowColor = '#ff9c35'
	context.shadowBlur = 4 * pixelRatio
	context.fill()
	const { canvas: light, context: lightContext } = createCanvas({
		size: 256,
		pixelRatio,
	})
	lightContext.fillStyle = '#ffdf94'
	lightContext.shadowColor = '#ffae45'
	lightContext.shadowBlur = 11 * pixelRatio
	carvedFace({ context: lightContext, variant })
	lightContext.fill()
	return { pumpkin, light }
}

function pumpkinOutline(context: CanvasRenderingContext2D) {
	context.beginPath()
	context.moveTo(128, 81)
	context.bezierCurveTo(103, 69, 89, 78, 79, 78)
	context.bezierCurveTo(47, 72, 28, 104, 31, 153)
	context.bezierCurveTo(32, 198, 49, 225, 85, 222)
	context.bezierCurveTo(105, 229, 116, 226, 128, 225)
	context.bezierCurveTo(149, 229, 161, 225, 177, 223)
	context.bezierCurveTo(211, 226, 227, 196, 226, 153)
	context.bezierCurveTo(228, 108, 211, 74, 180, 78)
	context.bezierCurveTo(163, 77, 152, 72, 128, 81)
	context.closePath()
	return context
}

function carvedFace({
	context,
	variant,
}: {
	context: CanvasRenderingContext2D
	variant: number
}) {
	context.beginPath()
	if (variant === 0) {
		for (const x of [82, 160]) {
			context.moveTo(x, 112)
			context.lineTo(x - 13, 140)
			context.lineTo(x + 19, 137)
			context.closePath()
		}
		context.moveTo(127, 141)
		context.lineTo(117, 157)
		context.lineTo(136, 157)
		context.closePath()
		context.moveTo(68, 166)
		context.quadraticCurveTo(78, 174, 90, 176)
		context.lineTo(92, 185)
		context.lineTo(103, 186)
		context.lineTo(104, 178)
		context.quadraticCurveTo(135, 187, 158, 178)
		context.lineTo(159, 184)
		context.lineTo(170, 180)
		context.lineTo(170, 174)
		context.lineTo(189, 163)
		context.bezierCurveTo(174, 211, 89, 216, 68, 166)
	} else if (variant === 1) {
		context.moveTo(67, 132)
		context.quadraticCurveTo(87, 102, 108, 134)
		context.quadraticCurveTo(91, 124, 67, 132)
		context.closePath()
		context.moveTo(149, 132)
		context.quadraticCurveTo(170, 105, 190, 137)
		context.quadraticCurveTo(168, 126, 149, 132)
		context.closePath()
		context.moveTo(79, 165)
		context.quadraticCurveTo(125, 190, 178, 162)
		context.quadraticCurveTo(170, 187, 153, 193)
		context.lineTo(151, 184)
		context.lineTo(137, 187)
		context.lineTo(138, 197)
		context.quadraticCurveTo(98, 204, 79, 165)
	} else {
		context.moveTo(64, 116)
		context.lineTo(107, 130)
		context.quadraticCurveTo(95, 153, 76, 139)
		context.closePath()
		context.moveTo(151, 130)
		context.lineTo(190, 112)
		context.lineTo(180, 137)
		context.quadraticCurveTo(163, 150, 151, 130)
		context.closePath()
		context.moveTo(127, 145)
		context.lineTo(119, 159)
		context.lineTo(136, 157)
		context.closePath()
		context.moveTo(78, 176)
		context.lineTo(94, 166)
		context.lineTo(108, 178)
		context.lineTo(127, 171)
		context.lineTo(145, 179)
		context.lineTo(163, 166)
		context.lineTo(183, 173)
		context.lineTo(163, 195)
		context.lineTo(146, 187)
		context.lineTo(126, 201)
		context.lineTo(106, 187)
		context.lineTo(93, 193)
	}
	context.closePath()
	return context
}

function createGhost({
	pixelRatio,
	variant,
}: {
	pixelRatio: number
	variant: number
}) {
	const { canvas, context } = createCanvas({ size: 128, pixelRatio })
	const cloth = context.createLinearGradient(38, 27, 81, 111)
	cloth.addColorStop(0, variant === 0 ? '#f3effa' : '#e5dcf9')
	cloth.addColorStop(0.4, variant === 0 ? '#d8cfe8' : '#c7b5e8')
	cloth.addColorStop(0.75, 'rgba(191, 171, 219, 0.74)')
	cloth.addColorStop(1, 'rgba(170, 144, 203, 0.32)')
	context.fillStyle = cloth
	context.shadowColor = '#c6a5f1'
	context.shadowBlur = 7 * pixelRatio
	context.beginPath()
	context.moveTo(35, 67)
	context.bezierCurveTo(34, 37, 43, 22, 63, 22)
	context.bezierCurveTo(85, 21, 94, 43, 91, 63)
	context.bezierCurveTo(88, 80, 89, 91, 99, 101)
	context.bezierCurveTo(85, 103, 82, 90, 76, 97)
	context.bezierCurveTo(66, 110, 63, 111, 56, 100)
	context.bezierCurveTo(49, 93, 39, 111, 29, 103)
	context.bezierCurveTo(36, 93, 32, 83, 35, 67)
	context.closePath()
	context.fill()
	context.shadowBlur = 0
	context.save()
	context.clip()
	context.lineCap = 'round'
	context.lineWidth = 2.2
	context.strokeStyle = 'rgba(249, 244, 255, 0.24)'
	for (const [x, bend] of [
		[45, -3],
		[61, 3],
		[81, -5],
	]) {
		context.beginPath()
		context.moveTo(x, 65)
		context.bezierCurveTo(x + bend, 75, x - bend, 88, x + bend, 100)
		context.stroke()
	}
	context.restore()
	context.fillStyle = '#4b385e'
	for (const [x, y, tilt] of [
		[54, 49, -0.13],
		[74, 50, 0.13],
	]) {
		context.beginPath()
		context.ellipse(x, y + variant * 2, 3.5, 5.1, tilt, 0, Math.PI * 2)
		context.fill()
	}
	return canvas
}

function createBat({
	pixelRatio,
	variant,
}: {
	pixelRatio: number
	variant: number
}) {
	const { canvas, context } = createCanvas({ size: 128, pixelRatio })
	const wingTipY = [34, 51, 75][variant]
	const wing = context.createLinearGradient(0, 35, 0, 94)
	wing.addColorStop(0, '#655077')
	wing.addColorStop(0.42, '#44334f')
	wing.addColorStop(1, '#2c223a')
	context.fillStyle = wing
	context.strokeStyle = 'rgba(173, 139, 198, 0.42)'
	context.lineWidth = 0.8
	context.lineJoin = 'round'
	for (const direction of [-1, 1]) {
		context.save()
		context.translate(64, 0)
		context.scale(direction, 1)
		context.beginPath()
		context.moveTo(4, 61)
		context.bezierCurveTo(20, 53, 31, wingTipY + 4, 53, wingTipY)
		context.quadraticCurveTo(35, wingTipY + 22, 43, 87)
		context.quadraticCurveTo(30, 75, 23, 89)
		context.quadraticCurveTo(13, 77, 4, 80)
		context.closePath()
		context.fill()
		context.stroke()
		context.restore()
	}
	context.fillStyle = '#3b2b47'
	context.beginPath()
	context.moveTo(56, 58)
	context.lineTo(56, 47)
	context.lineTo(63, 54)
	context.lineTo(69, 48)
	context.lineTo(72, 60)
	context.bezierCurveTo(76, 68, 72, 82, 64, 91)
	context.bezierCurveTo(57, 82, 51, 69, 56, 58)
	context.closePath()
	context.fill()
	return canvas
}

function createRadialSprite({
	size,
	pixelRatio,
	stops,
}: {
	size: number
	pixelRatio: number
	stops: [number, string][]
}) {
	const { canvas, context } = createCanvas({ size, pixelRatio })
	const center = size / 2
	const gradient = context.createRadialGradient(
		center,
		center,
		0,
		center,
		center,
		center,
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
	const context = getContext(canvas)
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	return { canvas, context }
}

function getContext(canvas: HTMLCanvasElement) {
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create the Halloween artwork canvas')
	return context
}

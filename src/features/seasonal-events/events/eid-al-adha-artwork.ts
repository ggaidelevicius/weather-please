type Sprite = {
	canvas: HTMLCanvasElement
	width: number
	height: number
}

type LanternSprite = Sprite & {
	lightX: number
	lightY: number
	baseY: number
}

export function createEidAlAdhaArtwork({ dpr }: { dpr: number }): {
	crescent: Sprite
	lanterns: LanternSprite[]
	glow: Sprite
	haze: Sprite
	star: Sprite
} {
	const pixelRatio = Number.isFinite(dpr) ? Math.min(2, Math.max(1, dpr)) : 1
	return {
		crescent: createCrescent(pixelRatio),
		lanterns: [0, 1, 2].map((variant) =>
			createLantern({ pixelRatio, variant }),
		),
		glow: createGlow(pixelRatio),
		haze: createHaze(pixelRatio),
		star: createStar(pixelRatio),
	}
}

function createCrescent(pixelRatio: number): Sprite {
	const { sprite: surface, context } = createCanvas({
		width: 320,
		height: 320,
		pixelRatio,
	})
	const moon = context.createRadialGradient(218, 119, 3, 169, 169, 112)
	moon.addColorStop(0, '#fff1c6')
	moon.addColorStop(0.43, '#edcf8e')
	moon.addColorStop(0.79, '#caab6f')
	moon.addColorStop(1, '#a78d5f')
	context.fillStyle = moon
	context.beginPath()
	context.arc(160, 160, 97, 0, Math.PI * 2)
	context.fill()
	context.save()
	context.clip()
	for (const [x, y, radius, alpha] of [
		[227, 127, 14, 0.07],
		[235, 158, 20, 0.065],
		[216, 194, 17, 0.075],
		[191, 222, 24, 0.06],
		[178, 236, 11, 0.08],
	]) {
		const variation = context.createRadialGradient(x, y, 0, x, y, radius)
		variation.addColorStop(0, `rgba(109, 93, 62, ${alpha})`)
		variation.addColorStop(1, 'rgba(109, 93, 62, 0)')
		context.fillStyle = variation
		context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
	}
	context.restore()
	context.globalCompositeOperation = 'destination-out'
	context.fillStyle = '#000'
	context.beginPath()
	context.arc(134, 145, 93, 0, Math.PI * 2)
	context.fill()
	context.globalCompositeOperation = 'source-over'
	const { sprite, context: composite } = createCanvas({
		width: 320,
		height: 320,
		pixelRatio,
	})
	composite.shadowColor = 'rgba(240, 204, 130, 0.2)'
	composite.shadowBlur = 19 * pixelRatio
	composite.drawImage(surface.canvas, 0, 0, 320, 320)
	return sprite
}

function createLantern({
	pixelRatio,
	variant,
}: {
	pixelRatio: number
	variant: number
}): LanternSprite {
	const { sprite, context } = createCanvas({
		width: 200,
		height: 320,
		pixelRatio,
	})
	const brass = context.createLinearGradient(44, 0, 157, 0)
	brass.addColorStop(0, '#4a4534')
	brass.addColorStop(0.16, '#a3864f')
	brass.addColorStop(0.32, '#e0c88d')
	brass.addColorStop(0.46, '#af9156')
	brass.addColorStop(0.68, '#c6aa6d')
	brass.addColorStop(0.85, '#806b43')
	brass.addColorStop(1, '#474235')
	context.lineJoin = 'round'
	context.lineCap = 'round'
	context.save()
	context.translate(100, 302)
	context.scale(1, 0.12)
	const shadow = context.createRadialGradient(0, 0, 9, 0, 0, 88)
	shadow.addColorStop(0, 'rgba(1, 10, 8, 0.55)')
	shadow.addColorStop(0.56, 'rgba(1, 10, 8, 0.23)')
	shadow.addColorStop(1, 'rgba(1, 10, 8, 0)')
	context.fillStyle = shadow
	context.fillRect(-88, -88, 176, 176)
	context.restore()

	drawHandle(context, brass)
	drawRoof({ context, brass, variant })
	drawGlass({ context, variant })
	drawFrame(context, brass)
	drawBase(context, brass)
	return { ...sprite, lightX: 100, lightY: 188, baseY: 302 }
}

function drawHandle(context: CanvasRenderingContext2D, brass: CanvasGradient) {
	context.strokeStyle = '#494538'
	context.lineWidth = 4.7
	context.beginPath()
	context.moveTo(79, 69)
	context.lineTo(79, 45)
	context.bezierCurveTo(79, 16, 121, 16, 121, 45)
	context.lineTo(121, 69)
	context.stroke()
	context.strokeStyle = brass
	context.lineWidth = 2.7
	context.stroke()
	context.strokeStyle = 'rgba(245, 222, 161, 0.72)'
	context.lineWidth = 0.7
	context.beginPath()
	context.moveTo(80, 48)
	context.bezierCurveTo(79, 22, 111, 18, 118, 38)
	context.stroke()
	context.fillStyle = brass
	context.beginPath()
	context.ellipse(100, 66, 7, 3, 0, 0, Math.PI * 2)
	context.fill()
	context.fillRect(96.5, 58, 7, 8)
	context.beginPath()
	context.arc(100, 56.5, 4.2, 0, Math.PI * 2)
	context.fill()
	return context
}

function drawRoof({
	context,
	brass,
	variant,
}: {
	context: CanvasRenderingContext2D
	brass: CanvasGradient
	variant: number
}) {
	context.fillStyle = brass
	context.beginPath()
	context.moveTo(48, 112)
	if (variant === 2) {
		context.lineTo(62, 88)
		context.lineTo(88, 74)
		context.lineTo(100, 67)
		context.lineTo(112, 74)
		context.lineTo(138, 88)
		context.lineTo(152, 112)
	} else {
		context.bezierCurveTo(57, 91, 79, 87, 88, 78)
		context.quadraticCurveTo(96, 73, 100, 67)
		context.quadraticCurveTo(104, 73, 112, 78)
		context.bezierCurveTo(121, 87, 143, 91, 152, 112)
	}
	context.closePath()
	context.fill()
	context.save()
	context.clip()
	const roofShade = context.createLinearGradient(0, 73, 0, 113)
	roofShade.addColorStop(0, 'rgba(255, 227, 163, 0.05)')
	roofShade.addColorStop(0.62, 'rgba(10, 31, 23, 0.03)')
	roofShade.addColorStop(1, 'rgba(17, 28, 21, 0.48)')
	context.fillStyle = roofShade
	context.fillRect(45, 66, 110, 48)
	context.strokeStyle = 'rgba(61, 54, 34, 0.52)'
	context.lineWidth = 1.2
	for (const x of [66, 82, 118, 134]) {
		context.beginPath()
		context.moveTo(100, 69)
		context.quadraticCurveTo((x + 100) / 2, 84, x, 111)
		context.stroke()
	}
	context.restore()
	context.strokeStyle = 'rgba(244, 219, 153, 0.63)'
	context.lineWidth = 0.9
	context.beginPath()
	context.moveTo(54, 108)
	context.quadraticCurveTo(66, 91, 87, 80)
	context.stroke()
	context.fillStyle = '#293c2e'
	for (const x of [65, 79, 93, 107, 121, 135]) {
		context.beginPath()
		context.moveTo(x - 2.4, 108)
		context.lineTo(x - 2.4, 104)
		context.quadraticCurveTo(x, 99, x + 2.4, 104)
		context.lineTo(x + 2.4, 108)
		context.fill()
	}
	context.fillStyle = brass
	context.beginPath()
	context.moveTo(47, 112)
	context.lineTo(153, 112)
	context.lineTo(158, 117)
	context.lineTo(139, 126)
	context.lineTo(61, 126)
	context.lineTo(42, 117)
	context.closePath()
	context.fill()
	context.strokeStyle = 'rgba(246, 224, 166, 0.77)'
	context.lineWidth = 1.1
	context.beginPath()
	context.moveTo(44, 117)
	context.lineTo(62, 122)
	context.lineTo(138, 122)
	context.lineTo(156, 117)
	context.stroke()
	context.strokeStyle = 'rgba(45, 44, 30, 0.56)'
	context.beginPath()
	context.moveTo(61, 125)
	context.lineTo(139, 125)
	context.stroke()
	return context
}

function drawGlass({
	context,
	variant,
}: {
	context: CanvasRenderingContext2D
	variant: number
}) {
	const [shade, middle, light] = [
		['#62532e', '#b9934d', '#debe77'],
		['#163e32', '#347b55', '#81a976'],
		['#504d3a', '#897657', '#c2a272'],
	][variant]
	const glass = context.createLinearGradient(45, 150, 151, 231)
	glass.addColorStop(0, shade)
	glass.addColorStop(0.33, middle)
	glass.addColorStop(0.52, light)
	glass.addColorStop(0.77, middle)
	glass.addColorStop(1, shade)
	context.fillStyle = glass
	glassOutline(context)
	context.fill()
	context.save()
	context.clip()
	const lightPool = context.createRadialGradient(100, 188, 0, 100, 188, 78)
	lightPool.addColorStop(0, 'rgba(255, 231, 163, 0.7)')
	lightPool.addColorStop(0.22, 'rgba(245, 209, 126, 0.36)')
	lightPool.addColorStop(0.55, 'rgba(238, 190, 103, 0.1)')
	lightPool.addColorStop(1, 'rgba(236, 185, 97, 0)')
	context.fillStyle = lightPool
	context.fillRect(44, 125, 112, 148)
	context.fillStyle = 'rgba(11, 34, 24, 0.37)'
	context.beginPath()
	context.moveTo(47, 121)
	context.lineTo(67, 127)
	context.lineTo(67, 269)
	context.lineTo(47, 256)
	context.closePath()
	context.fill()
	context.fillStyle = 'rgba(14, 31, 22, 0.48)'
	context.beginPath()
	context.moveTo(133, 127)
	context.lineTo(153, 121)
	context.lineTo(153, 256)
	context.lineTo(133, 269)
	context.closePath()
	context.fill()
	context.fillStyle = 'rgba(255, 244, 205, 0.09)'
	context.beginPath()
	context.moveTo(70, 126)
	context.lineTo(87, 126)
	context.lineTo(74, 264)
	context.lineTo(70, 264)
	context.closePath()
	context.fill()
	context.beginPath()
	context.moveTo(136, 128)
	context.lineTo(140, 127)
	context.lineTo(143, 256)
	context.lineTo(139, 259)
	context.closePath()
	context.fill()
	const candle = context.createLinearGradient(92, 0, 108, 0)
	candle.addColorStop(0, '#b69c63')
	candle.addColorStop(0.45, '#e9d295')
	candle.addColorStop(1, '#9e8654')
	context.fillStyle = candle
	context.fillRect(93, 204, 14, 39)
	context.fillStyle = 'rgba(241, 218, 161, 0.9)'
	context.beginPath()
	context.ellipse(100, 204, 7, 2, 0, 0, Math.PI * 2)
	context.fill()
	const flame = context.createLinearGradient(100, 175, 100, 204)
	flame.addColorStop(0, '#e5bc70')
	flame.addColorStop(0.4, '#fff1bc')
	flame.addColorStop(1, '#efc77b')
	context.fillStyle = flame
	context.beginPath()
	context.moveTo(100, 204)
	context.bezierCurveTo(89, 196, 96, 184, 101, 175)
	context.bezierCurveTo(101, 186, 111, 197, 100, 204)
	context.fill()
	context.fillStyle = 'rgba(255, 246, 203, 0.92)'
	context.beginPath()
	context.ellipse(100, 198, 2.5, 5, 0, 0, Math.PI * 2)
	context.fill()
	context.strokeStyle = 'rgba(248, 222, 152, 0.1)'
	context.lineWidth = 0.65
	for (let line = 0; line < 12; line += 1) {
		const x = 49 + line * 9
		context.beginPath()
		context.moveTo(x, 128)
		context.bezierCurveTo(x - 1.5, 169, x + 1, 205, x, 262)
		context.stroke()
	}
	context.restore()
	return context
}

function glassOutline(context: CanvasRenderingContext2D) {
	context.beginPath()
	context.moveTo(49, 123)
	context.lineTo(66, 127)
	context.lineTo(134, 127)
	context.lineTo(151, 123)
	context.lineTo(151, 256)
	context.lineTo(134, 269)
	context.lineTo(66, 269)
	context.lineTo(49, 256)
	context.closePath()
	return context
}

function drawFrame(context: CanvasRenderingContext2D, brass: CanvasGradient) {
	context.strokeStyle = '#4c4933'
	context.lineWidth = 4.4
	glassOutline(context)
	context.stroke()
	context.strokeStyle = brass
	context.lineWidth = 2.6
	context.stroke()
	context.beginPath()
	for (const x of [66, 134]) {
		context.moveTo(x, 126)
		context.lineTo(x, 269)
	}
	context.stroke()
	context.lineWidth = 1.3
	context.beginPath()
	context.moveTo(72, 262)
	context.lineTo(72, 166)
	context.bezierCurveTo(72, 151, 87, 144, 100, 132)
	context.bezierCurveTo(113, 144, 128, 151, 128, 166)
	context.lineTo(128, 262)
	context.stroke()
	context.strokeStyle = 'rgba(233, 209, 143, 0.56)'
	context.lineWidth = 0.85
	for (const x of [57.5, 142.5]) {
		for (let row = 0; row < 8; row += 1) {
			const y = 142 + row * 15
			context.beginPath()
			context.moveTo(x, y - 7)
			context.quadraticCurveTo(x + 9, y, x, y + 7)
			context.quadraticCurveTo(x - 9, y, x, y - 7)
			context.stroke()
		}
	}
	for (const y of [152, 252]) {
		for (const x of [82, 100, 118]) {
			context.beginPath()
			context.moveTo(x, y - 6)
			context.lineTo(x + 6, y)
			context.lineTo(x, y + 6)
			context.lineTo(x - 6, y)
			context.closePath()
			context.stroke()
			context.fillStyle = 'rgba(241, 216, 153, 0.58)'
			context.beginPath()
			context.arc(x, y, 1.05, 0, Math.PI * 2)
			context.fill()
		}
	}
	context.strokeStyle = 'rgba(254, 234, 177, 0.62)'
	context.lineWidth = 0.7
	context.beginPath()
	context.moveTo(65, 129)
	context.lineTo(65, 265)
	context.moveTo(133, 132)
	context.lineTo(133, 265)
	context.stroke()
	context.fillStyle = brass
	for (const y of [171, 232]) context.fillRect(125, y, 5, 5)
	context.strokeStyle = '#e2c588'
	context.lineWidth = 1.3
	context.beginPath()
	context.arc(77, 205, 2, 0, Math.PI * 2)
	context.stroke()
	return context
}

function drawBase(context: CanvasRenderingContext2D, brass: CanvasGradient) {
	context.fillStyle = brass
	context.beginPath()
	context.moveTo(47, 257)
	context.lineTo(65, 268)
	context.lineTo(135, 268)
	context.lineTo(153, 257)
	context.lineTo(157, 268)
	context.lineTo(137, 282)
	context.lineTo(63, 282)
	context.lineTo(43, 268)
	context.closePath()
	context.fill()
	context.fillStyle = '#66583a'
	context.beginPath()
	context.moveTo(51, 278)
	context.lineTo(67, 284)
	context.lineTo(133, 284)
	context.lineTo(149, 278)
	context.lineTo(149, 292)
	context.lineTo(132, 300)
	context.lineTo(68, 300)
	context.lineTo(51, 292)
	context.closePath()
	context.fill()
	context.fillStyle = brass
	context.beginPath()
	context.moveTo(46, 278)
	context.lineTo(64, 287)
	context.lineTo(136, 287)
	context.lineTo(154, 278)
	context.lineTo(159, 283)
	context.lineTo(138, 294)
	context.lineTo(62, 294)
	context.lineTo(41, 283)
	context.closePath()
	context.fill()
	context.fillRect(57, 293, 18, 9)
	context.fillRect(125, 293, 18, 9)
	context.fillStyle = 'rgba(25, 31, 21, 0.4)'
	context.fillRect(57, 299, 18, 3)
	context.fillRect(125, 299, 18, 3)
	context.strokeStyle = 'rgba(244, 217, 150, 0.77)'
	context.lineWidth = 1.1
	context.beginPath()
	context.moveTo(46, 268)
	context.lineTo(64, 278)
	context.lineTo(136, 278)
	context.lineTo(154, 268)
	context.moveTo(45, 283)
	context.lineTo(63, 290)
	context.lineTo(137, 290)
	context.lineTo(155, 283)
	context.stroke()
	context.fillStyle = 'rgba(251, 225, 163, 0.65)'
	for (let dot = 0; dot < 10; dot += 1) {
		context.beginPath()
		context.arc(69 + dot * 7, 272.5, 0.85, 0, Math.PI * 2)
		context.fill()
	}
	return context
}

function createGlow(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 256,
		height: 256,
		pixelRatio,
	})
	const glow = context.createRadialGradient(128, 128, 0, 128, 128, 128)
	glow.addColorStop(0, 'rgba(255, 224, 153, 0.53)')
	glow.addColorStop(0.17, 'rgba(245, 202, 124, 0.28)')
	glow.addColorStop(0.45, 'rgba(221, 169, 87, 0.085)')
	glow.addColorStop(0.76, 'rgba(204, 150, 70, 0.014)')
	glow.addColorStop(1, 'rgba(204, 150, 70, 0)')
	context.fillStyle = glow
	context.fillRect(0, 0, 256, 256)
	return sprite
}

function createHaze(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 512,
		height: 512,
		pixelRatio,
	})
	const emerald = context.createRadialGradient(235, 269, 0, 256, 256, 253)
	emerald.addColorStop(0, 'rgba(39, 125, 86, 0.33)')
	emerald.addColorStop(0.39, 'rgba(33, 98, 68, 0.2)')
	emerald.addColorStop(0.72, 'rgba(27, 70, 53, 0.065)')
	emerald.addColorStop(1, 'rgba(27, 70, 53, 0)')
	context.fillStyle = emerald
	context.fillRect(0, 0, 512, 512)
	return sprite
}

function createStar(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 64,
		height: 64,
		pixelRatio,
	})
	const glow = context.createRadialGradient(32, 32, 0, 32, 32, 28)
	glow.addColorStop(0, 'rgba(255, 241, 200, 0.78)')
	glow.addColorStop(0.1, 'rgba(247, 222, 159, 0.42)')
	glow.addColorStop(0.4, 'rgba(221, 194, 127, 0.08)')
	glow.addColorStop(1, 'rgba(221, 194, 127, 0)')
	context.fillStyle = glow
	context.fillRect(0, 0, 64, 64)
	context.fillStyle = 'rgba(255, 242, 203, 0.78)'
	context.beginPath()
	context.moveTo(32, 19)
	context.quadraticCurveTo(33, 30, 42, 32)
	context.quadraticCurveTo(33, 33, 32, 45)
	context.quadraticCurveTo(31, 34, 22, 32)
	context.quadraticCurveTo(31, 31, 32, 19)
	context.fill()
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
	if (!context) throw new Error('Unable to create Eid al-Adha artwork')
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	return { sprite: { canvas, width, height }, context }
}

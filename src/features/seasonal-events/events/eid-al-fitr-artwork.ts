type Sprite = {
	canvas: HTMLCanvasElement
	width: number
	height: number
}

type LanternSprite = Sprite & {
	anchorX: number
	anchorY: number
	lightX: number
	lightY: number
}

export function createEidAlFitrArtwork({ dpr }: { dpr: number }): {
	crescent: Sprite
	lanterns: LanternSprite[]
	glow: Sprite
	haze: Sprite
	star: Sprite
	rosette: Sprite
} {
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	return {
		crescent: createCrescent(pixelRatio),
		lanterns: [0, 1, 2].map((variant) =>
			createLantern({ pixelRatio, variant }),
		),
		glow: createGlow(pixelRatio),
		haze: createHaze(pixelRatio),
		star: createStar(pixelRatio),
		rosette: createRosette(pixelRatio),
	}
}

function createCrescent(pixelRatio: number): Sprite {
	const { sprite: surface, context } = createCanvas({
		width: 320,
		height: 320,
		pixelRatio,
	})
	const moon = context.createRadialGradient(104, 126, 4, 153, 170, 109)
	moon.addColorStop(0, '#fff6df')
	moon.addColorStop(0.44, '#eae4cd')
	moon.addColorStop(0.78, '#cfcdbb')
	moon.addColorStop(1, '#aaa991')
	context.fillStyle = moon
	context.beginPath()
	context.arc(160, 160, 97, 0, Math.PI * 2)
	context.fill()
	context.save()
	context.clip()
	for (const [x, y, radius, alpha] of [
		[91, 120, 16, 0.075],
		[108, 154, 21, 0.08],
		[94, 185, 12, 0.065],
		[137, 217, 22, 0.065],
		[112, 206, 9, 0.06],
		[148, 238, 11, 0.08],
	]) {
		const crater = context.createRadialGradient(x, y, 0, x, y, radius)
		crater.addColorStop(0, `rgba(96, 105, 110, ${alpha})`)
		crater.addColorStop(1, 'rgba(96, 105, 110, 0)')
		context.fillStyle = crater
		context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
	}
	context.restore()
	context.globalCompositeOperation = 'destination-out'
	context.fillStyle = '#000'
	context.beginPath()
	context.arc(185, 145, 93, 0, Math.PI * 2)
	context.fill()
	context.globalCompositeOperation = 'source-over'
	const { sprite, context: composite } = createCanvas({
		width: 320,
		height: 320,
		pixelRatio,
	})
	composite.shadowColor = 'rgba(246, 225, 184, 0.19)'
	composite.shadowBlur = 18 * pixelRatio
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
		width: 180,
		height: 280,
		pixelRatio,
	})
	const brass = context.createLinearGradient(40, 0, 140, 0)
	brass.addColorStop(0, '#725d42')
	brass.addColorStop(0.22, '#c6a56b')
	brass.addColorStop(0.43, '#ead29a')
	brass.addColorStop(0.65, '#ac8953')
	brass.addColorStop(1, '#66563f')
	context.strokeStyle = brass
	context.lineWidth = 2.2
	context.lineCap = 'round'
	context.lineJoin = 'round'
	context.beginPath()
	context.ellipse(90, 23, 7, 9, 0, 0, Math.PI * 2)
	context.moveTo(90, 32)
	context.lineTo(90, 46)
	context.stroke()
	context.fillStyle = brass
	context.beginPath()
	context.arc(90, 42, 3.4, 0, Math.PI * 2)
	context.fill()
	context.beginPath()
	context.moveTo(90, 46)
	context.lineTo(137, 91)
	context.lineTo(43, 91)
	context.closePath()
	context.fill()
	context.strokeStyle = 'rgba(245, 221, 164, 0.65)'
	context.lineWidth = 1
	context.beginPath()
	context.moveTo(49, 87)
	context.lineTo(90, 50)
	context.lineTo(130, 87)
	context.stroke()
	context.strokeStyle = 'rgba(72, 63, 52, 0.6)'
	for (const direction of [-1, 1]) {
		context.beginPath()
		context.moveTo(90, 53)
		context.lineTo(90 + direction * 23, 86)
		context.stroke()
		for (let vent = 0; vent < 3; vent += 1) {
			const x = 90 + direction * (9 + vent * 7.5)
			const y = 69 + vent * 7
			context.fillStyle = variant === 1 ? '#496969' : '#67533d'
			context.beginPath()
			context.moveTo(x, y - 4)
			context.lineTo(x + 2.4, y)
			context.lineTo(x, y + 4)
			context.lineTo(x - 2.4, y)
			context.closePath()
			context.fill()
		}
	}

	const glass = context.createLinearGradient(42, 112, 132, 206)
	const glassColors = [
		[
			'rgba(203, 158, 83, 0.35)',
			'rgba(250, 208, 125, 0.7)',
			'rgba(160, 113, 65, 0.35)',
		],
		[
			'rgba(47, 122, 124, 0.56)',
			'rgba(137, 183, 154, 0.57)',
			'rgba(42, 89, 103, 0.5)',
		],
		[
			'rgba(88, 100, 132, 0.5)',
			'rgba(188, 181, 158, 0.6)',
			'rgba(74, 78, 111, 0.5)',
		],
	][variant]
	glass.addColorStop(0, glassColors[0])
	glass.addColorStop(0.46, glassColors[1])
	glass.addColorStop(1, glassColors[2])
	context.fillStyle = glass
	lanternBody(context)
	context.fill()
	context.save()
	context.clip()
	const light = context.createRadialGradient(90, 169, 2, 90, 169, 57)
	light.addColorStop(0, 'rgba(255, 231, 172, 0.64)')
	light.addColorStop(0.4, 'rgba(244, 195, 113, 0.25)')
	light.addColorStop(1, 'rgba(236, 174, 88, 0)')
	context.fillStyle = light
	context.fillRect(37, 105, 106, 123)
	context.fillStyle = 'rgba(58, 60, 57, 0.16)'
	context.beginPath()
	context.moveTo(44, 94)
	context.lineTo(64, 98)
	context.lineTo(65, 219)
	context.lineTo(40, 190)
	context.closePath()
	context.fill()
	context.beginPath()
	context.moveTo(117, 97)
	context.lineTo(134, 94)
	context.lineTo(140, 190)
	context.lineTo(115, 219)
	context.closePath()
	context.fill()
	context.fillStyle = 'rgba(252, 223, 163, 0.65)'
	context.fillRect(85, 182, 10, 25)
	context.beginPath()
	context.moveTo(90, 181)
	context.bezierCurveTo(80, 174, 85, 161, 91, 151)
	context.bezierCurveTo(93, 163, 100, 174, 90, 181)
	context.fill()
	context.restore()

	context.strokeStyle = brass
	context.lineWidth = 3.1
	lanternBody(context)
	context.stroke()
	context.lineWidth = 2.3
	context.beginPath()
	context.moveTo(64, 94)
	context.lineTo(65, 218)
	context.moveTo(116, 94)
	context.lineTo(115, 218)
	context.moveTo(45, 94)
	context.lineTo(135, 94)
	context.moveTo(43, 199)
	context.lineTo(63, 217)
	context.lineTo(117, 217)
	context.lineTo(137, 199)
	context.stroke()
	context.lineWidth = 1.2
	context.beginPath()
	context.moveTo(70, 210)
	context.lineTo(70, 129)
	context.quadraticCurveTo(72, 116, 90, 103)
	context.quadraticCurveTo(108, 116, 110, 129)
	context.lineTo(110, 210)
	context.stroke()
	context.strokeStyle = 'rgba(236, 209, 148, 0.67)'
	context.lineWidth = 0.9
	for (const x of [53, 127]) {
		for (let cell = 0; cell < 5; cell += 1) {
			const y = 121 + cell * 16
			context.beginPath()
			context.moveTo(x, y - 7)
			context.lineTo(x + 5.5, y)
			context.lineTo(x, y + 7)
			context.lineTo(x - 5.5, y)
			context.closePath()
			context.stroke()
		}
	}
	context.fillStyle = brass
	context.beginPath()
	context.moveTo(62, 223)
	context.lineTo(118, 223)
	context.lineTo(101, 240)
	context.lineTo(79, 240)
	context.closePath()
	context.fill()
	context.fillRect(77, 240, 26, 3)
	context.beginPath()
	context.moveTo(90, 244)
	context.bezierCurveTo(99, 251, 96, 258, 90, 263)
	context.bezierCurveTo(84, 258, 81, 251, 90, 244)
	context.fill()
	context.strokeStyle = 'rgba(250, 224, 168, 0.68)'
	context.lineWidth = 0.9
	context.beginPath()
	context.moveTo(68, 226)
	context.lineTo(112, 226)
	context.moveTo(88, 249)
	context.quadraticCurveTo(85, 255, 90, 259)
	context.stroke()
	return { ...sprite, anchorX: 90, anchorY: 14, lightX: 90, lightY: 169 }
}

function lanternBody(context: CanvasRenderingContext2D) {
	context.beginPath()
	context.moveTo(46, 94)
	context.lineTo(134, 94)
	context.lineTo(140, 190)
	context.lineTo(118, 223)
	context.lineTo(62, 223)
	context.lineTo(40, 190)
	context.closePath()
	return context
}

function createRosette(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 384,
		height: 384,
		pixelRatio,
	})
	context.translate(192, 192)
	context.strokeStyle = 'rgba(195, 171, 117, 0.69)'
	context.lineWidth = 1.1
	context.lineJoin = 'round'
	context.beginPath()
	for (let point = 0; point < 16; point += 1) {
		const angle = (point / 16) * Math.PI * 2
		const radius = point % 2 === 0 ? 163 : 115
		const x = Math.cos(angle) * radius
		const y = Math.sin(angle) * radius
		if (point === 0) context.moveTo(x, y)
		else context.lineTo(x, y)
	}
	context.closePath()
	context.stroke()
	for (let point = 0; point < 8; point += 1) {
		context.save()
		context.rotate((point / 8) * Math.PI * 2)
		context.strokeStyle = 'rgba(114, 160, 148, 0.64)'
		context.beginPath()
		context.moveTo(0, -146)
		context.lineTo(42, -87)
		context.lineTo(0, -53)
		context.lineTo(-42, -87)
		context.closePath()
		context.stroke()
		context.strokeStyle = 'rgba(205, 185, 139, 0.55)'
		context.beginPath()
		context.moveTo(-31, -91)
		context.lineTo(0, -127)
		context.lineTo(31, -91)
		context.stroke()
		context.beginPath()
		context.arc(0, -171, 2, 0, Math.PI * 2)
		context.stroke()
		context.restore()
	}
	for (const rotation of [0, Math.PI / 4]) {
		context.save()
		context.rotate(rotation)
		context.strokeStyle = 'rgba(208, 186, 137, 0.67)'
		context.beginPath()
		context.rect(-60, -60, 120, 120)
		context.stroke()
		context.restore()
	}
	context.strokeStyle = 'rgba(125, 161, 149, 0.58)'
	context.beginPath()
	for (let point = 0; point < 8; point += 1) {
		const angle = (point / 8) * Math.PI * 2 + Math.PI / 8
		const x = Math.cos(angle) * 48
		const y = Math.sin(angle) * 48
		if (point === 0) context.moveTo(x, y)
		else context.lineTo(x, y)
	}
	context.closePath()
	context.stroke()
	return sprite
}

function createGlow(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 256,
		height: 256,
		pixelRatio,
	})
	const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128)
	gradient.addColorStop(0, 'rgba(255, 224, 160, 0.48)')
	gradient.addColorStop(0.18, 'rgba(250, 202, 128, 0.25)')
	gradient.addColorStop(0.48, 'rgba(230, 170, 91, 0.07)')
	gradient.addColorStop(0.8, 'rgba(209, 147, 79, 0.012)')
	gradient.addColorStop(1, 'rgba(202, 138, 79, 0)')
	context.fillStyle = gradient
	context.fillRect(0, 0, 256, 256)
	return sprite
}

function createHaze(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 512,
		height: 512,
		pixelRatio,
	})
	const teal = context.createRadialGradient(207, 278, 0, 231, 256, 247)
	teal.addColorStop(0, 'rgba(76, 138, 132, 0.28)')
	teal.addColorStop(0.42, 'rgba(50, 104, 112, 0.13)')
	teal.addColorStop(0.75, 'rgba(44, 74, 110, 0.035)')
	teal.addColorStop(1, 'rgba(44, 74, 110, 0)')
	context.fillStyle = teal
	context.fillRect(0, 0, 512, 512)
	const indigo = context.createRadialGradient(310, 176, 0, 290, 219, 203)
	indigo.addColorStop(0, 'rgba(104, 101, 163, 0.14)')
	indigo.addColorStop(0.6, 'rgba(75, 81, 140, 0.06)')
	indigo.addColorStop(1, 'rgba(64, 72, 126, 0)')
	context.fillStyle = indigo
	context.fillRect(0, 0, 512, 512)
	return sprite
}

function createStar(pixelRatio: number): Sprite {
	const { sprite, context } = createCanvas({
		width: 64,
		height: 64,
		pixelRatio,
	})
	const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 28)
	gradient.addColorStop(0, 'rgba(255, 239, 198, 0.8)')
	gradient.addColorStop(0.09, 'rgba(250, 219, 164, 0.5)')
	gradient.addColorStop(0.4, 'rgba(220, 195, 148, 0.08)')
	gradient.addColorStop(1, 'rgba(210, 189, 146, 0)')
	context.fillStyle = gradient
	context.fillRect(0, 0, 64, 64)
	context.fillStyle = 'rgba(255, 242, 204, 0.72)'
	context.beginPath()
	context.moveTo(32, 17)
	context.quadraticCurveTo(33, 30, 43, 32)
	context.quadraticCurveTo(33, 33, 32, 47)
	context.quadraticCurveTo(31, 34, 21, 32)
	context.quadraticCurveTo(31, 31, 32, 17)
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
	if (!context) throw new Error('Unable to create Eid al-Fitr artwork')
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	return { sprite: { canvas, width, height }, context }
}

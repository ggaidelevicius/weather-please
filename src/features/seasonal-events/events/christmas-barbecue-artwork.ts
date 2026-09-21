type ChristmasBarbecueArtwork = {
	canvas: HTMLCanvasElement
	width: number
	height: number
	baseY: number
	grill: { x: number; y: number; width: number }
}

export function createChristmasBarbecueArtwork({
	dpr,
}: {
	dpr: number
}): ChristmasBarbecueArtwork {
	const width = 420
	const height = 360
	const baseY = 348
	const pixelRatio = Math.min(2, Math.max(1, dpr))
	const canvas = document.createElement('canvas')
	canvas.width = Math.round(width * pixelRatio)
	canvas.height = Math.round(height * pixelRatio)
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Christmas barbecue artwork')
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	context.lineCap = 'round'
	context.lineJoin = 'round'

	drawStand(context)
	drawOpenLid(context)
	drawSideShelf(context)
	drawBowl(context)
	drawCookingGrate(context)
	drawFood(context)
	drawPlateAndTongs(context)
	drawFestiveTowel(context)

	return {
		canvas,
		width,
		height,
		baseY,
		grill: { x: 238 / width, y: 181 / height, width: 216 / width },
	}
}

function drawStand(context: CanvasRenderingContext2D) {
	const legs = [
		{ startX: 236, startY: 253, endX: 236, endY: 344 },
		{ startX: 293, startY: 235, endX: 310, endY: 344 },
		{ startX: 183, startY: 238, endX: 163, endY: 344 },
	]
	for (const leg of legs) {
		context.strokeStyle = '#273837'
		context.lineWidth = 9
		context.beginPath()
		context.moveTo(leg.startX, leg.startY)
		context.lineTo(leg.endX, leg.endY)
		context.stroke()
		context.strokeStyle = '#bec7ba'
		context.lineWidth = 4
		context.stroke()
		context.strokeStyle = '#eef0d4a6'
		context.lineWidth = 1
		context.beginPath()
		context.moveTo(leg.startX - 2, leg.startY)
		context.lineTo(leg.endX - 2, leg.endY - 2)
		context.stroke()
	}

	context.fillStyle = '#41504b'
	context.beginPath()
	context.moveTo(175, 291)
	context.lineTo(294, 289)
	context.lineTo(304, 308)
	context.lineTo(171, 309)
	context.closePath()
	context.fill()
	context.strokeStyle = '#8c9b87'
	context.lineWidth = 1.3
	for (let index = 0; index < 9; index += 1) {
		const x = 182 + index * 13
		context.beginPath()
		context.moveTo(x, 294)
		context.lineTo(x - 2, 305)
		context.stroke()
	}
	context.strokeStyle = '#b3ba9b'
	context.beginPath()
	context.moveTo(172, 308)
	context.lineTo(304, 307)
	context.stroke()

	context.fillStyle = '#273d37'
	for (const leg of legs) {
		context.beginPath()
		context.roundRect(leg.endX - 7, 340, 14, 8, 3)
		context.fill()
	}
	return context
}

function drawOpenLid(context: CanvasRenderingContext2D) {
	context.strokeStyle = '#2c3d3c'
	context.lineWidth = 8
	context.beginPath()
	context.moveTo(176, 147)
	context.lineTo(169, 180)
	context.moveTo(301, 147)
	context.lineTo(308, 180)
	context.stroke()

	const shell = context.createLinearGradient(139, 68, 341, 159)
	shell.addColorStop(0, '#a4a78d')
	shell.addColorStop(0.12, '#6d7b72')
	shell.addColorStop(0.48, '#3c514b')
	shell.addColorStop(1, '#283d3c')
	context.fillStyle = shell
	context.beginPath()
	context.moveTo(132, 153)
	context.bezierCurveTo(126, 86, 166, 47, 235, 45)
	context.bezierCurveTo(304, 42, 347, 83, 344, 151)
	context.bezierCurveTo(302, 177, 175, 179, 132, 153)
	context.closePath()
	context.fill()
	context.strokeStyle = '#e0c58caa'
	context.lineWidth = 1.5
	context.stroke()

	const interior = context.createRadialGradient(235, 150, 15, 235, 119, 110)
	interior.addColorStop(0, '#74634c')
	interior.addColorStop(0.45, '#3d4840')
	interior.addColorStop(0.85, '#1c302e')
	interior.addColorStop(1, '#384c44')
	context.fillStyle = interior
	context.beginPath()
	context.moveTo(143, 150)
	context.bezierCurveTo(140, 94, 173, 58, 236, 56)
	context.bezierCurveTo(298, 54, 335, 91, 332, 149)
	context.bezierCurveTo(290, 167, 181, 169, 143, 150)
	context.closePath()
	context.fill()
	context.strokeStyle = '#101f1e'
	context.lineWidth = 3
	context.stroke()

	context.strokeStyle = '#9a9a7142'
	context.lineWidth = 1
	for (let index = 0; index < 3; index += 1) {
		const inset = index * 8
		context.beginPath()
		context.moveTo(158 + inset, 147)
		context.bezierCurveTo(
			149 + inset,
			78 + inset,
			318 - inset,
			70 + inset,
			317 - inset,
			145,
		)
		context.stroke()
	}

	context.strokeStyle = '#adbaaa'
	context.lineWidth = 4
	context.beginPath()
	context.moveTo(214, 47)
	context.lineTo(214, 34)
	context.moveTo(262, 47)
	context.lineTo(261, 34)
	context.stroke()
	const handle = context.createLinearGradient(0, 25, 0, 38)
	handle.addColorStop(0, '#ac7549')
	handle.addColorStop(0.35, '#d3aa6e')
	handle.addColorStop(1, '#765235')
	context.fillStyle = handle
	context.beginPath()
	context.roundRect(204, 24, 68, 14, 6)
	context.fill()
	context.strokeStyle = '#f4d29385'
	context.lineWidth = 1
	context.beginPath()
	context.moveTo(211, 27)
	context.lineTo(266, 27)
	context.stroke()
	return context
}

function drawSideShelf(context: CanvasRenderingContext2D) {
	context.fillStyle = '#99774f'
	context.fillRect(29, 299, 105, 9)
	context.fillStyle = '#d6b680'
	context.fillRect(29, 299, 105, 2)
	for (const leg of [
		{ topX: 27, bottomX: 20 },
		{ topX: 123, bottomX: 131 },
	]) {
		const timber = context.createLinearGradient(leg.topX, 0, leg.topX + 12, 0)
		timber.addColorStop(0, '#d1ad77')
		timber.addColorStop(0.6, '#b18c59')
		timber.addColorStop(1, '#795c3c')
		context.fillStyle = timber
		context.beginPath()
		context.moveTo(leg.topX, 194)
		context.lineTo(leg.topX + 11, 194)
		context.lineTo(leg.bottomX + 11, 348)
		context.lineTo(leg.bottomX, 348)
		context.closePath()
		context.fill()
		context.strokeStyle = '#ebcd9580'
		context.lineWidth = 1
		context.beginPath()
		context.moveTo(leg.topX + 2, 209)
		context.lineTo(leg.bottomX + 2, 346)
		context.stroke()
		context.fillStyle = '#665435'
		context.beginPath()
		context.arc(leg.topX + 5.5, 214, 1.3, 0, Math.PI * 2)
		context.fill()
	}
	const apron = context.createLinearGradient(0, 205, 0, 224)
	apron.addColorStop(0, '#b08b58')
	apron.addColorStop(1, '#967247')
	context.fillStyle = apron
	context.fillRect(31, 203, 102, 20)
	context.fillStyle = '#ddbb81'
	context.fillRect(31, 221, 102, 2)
	const edge = context.createLinearGradient(0, 197, 0, 210)
	edge.addColorStop(0, '#c9a46e')
	edge.addColorStop(1, '#a78050')
	context.fillStyle = edge
	context.beginPath()
	context.moveTo(16, 198)
	context.lineTo(147, 197)
	context.lineTo(147, 209)
	context.lineTo(16, 210)
	context.closePath()
	context.fill()
	const wood = context.createLinearGradient(0, 168, 0, 201)
	wood.addColorStop(0, '#e1c28a')
	wood.addColorStop(0.4, '#c4a16e')
	wood.addColorStop(1, '#97784f')
	context.fillStyle = wood
	context.beginPath()
	context.moveTo(27, 168)
	context.lineTo(138, 171)
	context.lineTo(147, 197)
	context.lineTo(16, 198)
	context.closePath()
	context.fill()
	context.strokeStyle = '#6c573c70'
	context.lineWidth = 1
	for (let index = 0; index < 3; index += 1) {
		context.beginPath()
		context.moveTo(24 - index * 2, 177 + index * 7)
		context.lineTo(140 + index * 2, 179 + index * 6)
		context.stroke()
	}
	context.strokeStyle = '#f7d99f80'
	context.beginPath()
	context.moveTo(21, 195)
	context.lineTo(142, 195)
	context.stroke()
	return context
}

function drawBowl(context: CanvasRenderingContext2D) {
	context.strokeStyle = '#98a897'
	context.lineWidth = 5
	context.beginPath()
	context.moveTo(345, 176)
	context.lineTo(366, 181)
	context.lineTo(365, 199)
	context.lineTo(342, 199)
	context.stroke()
	context.strokeStyle = '#30413a'
	context.lineWidth = 8
	context.beginPath()
	context.moveTo(367, 184)
	context.lineTo(366, 195)
	context.stroke()

	const enamel = context.createLinearGradient(143, 177, 319, 254)
	enamel.addColorStop(0, '#a4a68b')
	enamel.addColorStop(0.15, '#788273')
	enamel.addColorStop(0.5, '#4b6054')
	enamel.addColorStop(0.82, '#324945')
	enamel.addColorStop(1, '#223937')
	context.fillStyle = enamel
	context.beginPath()
	context.moveTo(126, 182)
	context.bezierCurveTo(128, 232, 163, 266, 237, 268)
	context.bezierCurveTo(310, 267, 349, 234, 350, 181)
	context.closePath()
	context.fill()
	context.strokeStyle = '#efd0978c'
	context.lineWidth = 1.4
	context.beginPath()
	context.moveTo(136, 203)
	context.bezierCurveTo(151, 240, 176, 253, 211, 257)
	context.stroke()
	context.strokeStyle = '#0e242778'
	context.lineWidth = 3
	context.beginPath()
	context.moveTo(322, 217)
	context.quadraticCurveTo(291, 254, 240, 257)
	context.stroke()

	context.fillStyle = '#bbbea0'
	context.beginPath()
	context.ellipse(238, 236, 14, 7.5, 0, 0, Math.PI * 2)
	context.fill()
	context.fillStyle = '#425849'
	for (const x of [232, 238, 244]) {
		context.beginPath()
		context.ellipse(x, 235, 1.4, 3, 0.2, 0, Math.PI * 2)
		context.fill()
	}
	return context
}

function drawCookingGrate(context: CanvasRenderingContext2D) {
	context.fillStyle = '#a7ae90'
	context.beginPath()
	context.ellipse(238, 181, 112, 35, 0, 0, Math.PI * 2)
	context.fill()
	context.fillStyle = '#122a26'
	context.beginPath()
	context.ellipse(238, 180, 106, 30, 0, 0, Math.PI * 2)
	context.fill()
	context.save()
	context.clip()

	const coals = context.createLinearGradient(0, 160, 0, 210)
	coals.addColorStop(0, '#263b2e')
	coals.addColorStop(1, '#704e30')
	context.fillStyle = coals
	context.fillRect(128, 150, 220, 64)
	for (let index = 0; index < 24; index += 1) {
		context.fillStyle = index % 4 === 0 ? '#b0743d' : '#28372a'
		const x = 143 + ((index * 47) % 188)
		const y = 157 + ((index * 19) % 44)
		context.beginPath()
		context.ellipse(x, y, 8, 3.5, index * 1.7, 0, Math.PI * 2)
		context.fill()
	}
	context.strokeStyle = '#101d1d'
	context.lineWidth = 4
	for (let index = 0; index < 20; index += 1) {
		const x = 112 + index * 13
		context.beginPath()
		context.moveTo(x, 149)
		context.lineTo(x + 28, 214)
		context.stroke()
		context.strokeStyle = '#afb398'
		context.lineWidth = 1.3
		context.stroke()
		context.strokeStyle = '#101d1d'
		context.lineWidth = 4
	}
	context.strokeStyle = '#8d967b'
	context.lineWidth = 1.5
	for (const y of [164, 180, 196]) {
		context.beginPath()
		context.moveTo(129, y)
		context.lineTo(348, y)
		context.stroke()
	}
	context.restore()
	context.strokeStyle = '#d2c99b'
	context.lineWidth = 1.5
	context.beginPath()
	context.ellipse(238, 180, 107, 30.5, 0, 0, Math.PI * 2)
	context.stroke()
	return context
}

function drawFood(context: CanvasRenderingContext2D) {
	for (const sausage of [
		{ x: 157, y: 172, angle: -0.1, length: 47 },
		{ x: 173, y: 184, angle: 0.04, length: 52 },
		{ x: 189, y: 198, angle: 0.08, length: 50 },
		{ x: 211, y: 165, angle: 0.1, length: 44 },
		{ x: 228, y: 178, angle: 0.16, length: 48 },
		{ x: 246, y: 194, angle: 0.18, length: 45 },
	]) {
		drawSausage({ context, ...sausage })
	}
	for (const skewer of [
		{ x: 274, y: 158, angle: 0.29 },
		{ x: 289, y: 171, angle: 0.37 },
	]) {
		drawSkewer({ context, ...skewer })
	}
	return context
}

function drawSausage({
	context,
	x,
	y,
	angle,
	length,
}: {
	context: CanvasRenderingContext2D
	x: number
	y: number
	angle: number
	length: number
}) {
	context.save()
	context.translate(x, y)
	context.rotate(angle)
	context.fillStyle = '#121e19a6'
	context.beginPath()
	context.ellipse(length / 2, 3.5, length * 0.54, 5.5, 0, 0, Math.PI * 2)
	context.fill()
	const casing = context.createLinearGradient(0, -6, 0, 6)
	casing.addColorStop(0, '#e4ad58')
	casing.addColorStop(0.3, '#bd7a35')
	casing.addColorStop(0.65, '#8b4727')
	casing.addColorStop(1, '#583022')
	context.fillStyle = casing
	context.beginPath()
	context.moveTo(4, -4)
	context.bezierCurveTo(length * 0.33, -7, length * 0.69, -7, length - 3, -4)
	context.bezierCurveTo(length + 4, -2, length + 2, 5, length - 4, 5)
	context.bezierCurveTo(length * 0.6, 2, length * 0.3, 3, 5, 5)
	context.bezierCurveTo(-2, 5, -3, -1, 4, -4)
	context.closePath()
	context.fill()
	context.strokeStyle = '#522e20'
	context.lineWidth = 1
	context.stroke()
	context.save()
	context.clip()
	context.strokeStyle = '#573324'
	context.lineWidth = 2.2
	for (let index = 0; index < 5; index += 1) {
		const position = 8 + index * (length / 6)
		context.beginPath()
		context.moveTo(position, -6)
		context.lineTo(position + 3, 1)
		context.stroke()
	}
	context.restore()
	context.strokeStyle = '#f5cb7480'
	context.lineWidth = 1
	context.beginPath()
	context.moveTo(7, -3)
	context.quadraticCurveTo(length * 0.5, -5, length - 7, -3)
	context.stroke()
	context.restore()
	return context
}

function drawSkewer({
	context,
	x,
	y,
	angle,
}: {
	context: CanvasRenderingContext2D
	x: number
	y: number
	angle: number
}) {
	context.save()
	context.translate(x, y)
	context.rotate(angle)
	context.strokeStyle = '#dec28a'
	context.lineWidth = 1.5
	context.beginPath()
	context.moveTo(-6, 0)
	context.lineTo(47, 0)
	context.stroke()
	const colors = [
		['#a7b55b', '#496a35'],
		['#e3b950', '#a57125'],
		['#d97041', '#8c3828'],
		['#b8c46c', '#58773a'],
		['#edc661', '#bc8538'],
	]
	for (const [index, [light, shade]] of colors.entries()) {
		const x = index * 8.1
		const vegetable = context.createLinearGradient(x, -5, x + 6, 5)
		vegetable.addColorStop(0, light)
		vegetable.addColorStop(1, shade)
		context.fillStyle = vegetable
		context.beginPath()
		context.roundRect(x, -5, 7, 9.5, 2)
		context.fill()
		context.strokeStyle = '#443c245e'
		context.lineWidth = 1.6
		context.beginPath()
		context.moveTo(x + 2, -3)
		context.lineTo(x + 4, 2)
		context.stroke()
	}
	context.restore()
	return context
}

function drawPlateAndTongs(context: CanvasRenderingContext2D) {
	context.fillStyle = '#614b344d'
	context.beginPath()
	context.ellipse(72, 187, 40, 12, 0, 0, Math.PI * 2)
	context.fill()
	context.fillStyle = '#bebf9f'
	context.beginPath()
	context.ellipse(71, 182, 37, 12, 0, 0, Math.PI * 2)
	context.fill()
	const ceramic = context.createLinearGradient(0, 169, 0, 190)
	ceramic.addColorStop(0, '#fff4c9')
	ceramic.addColorStop(1, '#e1dfb7')
	context.fillStyle = ceramic
	context.beginPath()
	context.ellipse(71, 180, 37, 11, 0, 0, Math.PI * 2)
	context.fill()
	context.strokeStyle = '#b2b894'
	context.lineWidth = 1
	context.beginPath()
	context.ellipse(71, 180, 27, 7, 0, 0, Math.PI * 2)
	context.stroke()

	context.save()
	context.translate(94, 173)
	context.rotate(-0.36)
	context.strokeStyle = '#5e6a5a'
	context.lineWidth = 4
	context.beginPath()
	context.moveTo(-8, 5)
	context.quadraticCurveTo(15, 1, 40, -3)
	context.quadraticCurveTo(46, -4, 40, 0)
	context.lineTo(-8, 12)
	context.stroke()
	context.strokeStyle = '#e2e5c9'
	context.lineWidth = 1.5
	context.stroke()
	context.fillStyle = '#c7cead'
	for (const y of [4, 11]) {
		context.beginPath()
		context.roundRect(-17, y - 2, 13, 5, 2)
		context.fill()
		context.strokeStyle = '#65775e'
		context.lineWidth = 0.7
		for (let index = 0; index < 3; index += 1) {
			context.beginPath()
			context.moveTo(-15 + index * 3, y - 1)
			context.lineTo(-15 + index * 3, y + 2)
			context.stroke()
		}
	}
	context.restore()
	return context
}

function drawFestiveTowel(context: CanvasRenderingContext2D) {
	const fabric = context.createLinearGradient(37, 0, 79, 0)
	fabric.addColorStop(0, '#c7c5a1')
	fabric.addColorStop(0.25, '#fff0c6')
	fabric.addColorStop(0.53, '#d9d5af')
	fabric.addColorStop(0.8, '#f5e5be')
	fabric.addColorStop(1, '#a5ac8f')
	context.fillStyle = fabric
	context.beginPath()
	context.moveTo(37, 192)
	context.lineTo(75, 192)
	context.bezierCurveTo(77, 211, 70, 239, 77, 267)
	context.quadraticCurveTo(67, 272, 58, 268)
	context.quadraticCurveTo(46, 274, 36, 268)
	context.bezierCurveTo(41, 240, 37, 213, 37, 192)
	context.closePath()
	context.fill()
	context.save()
	context.clip()
	context.fillStyle = '#b5473eaa'
	for (const x of [42, 64]) context.fillRect(x, 191, 6, 83)
	for (const y of [206, 229, 252]) context.fillRect(35, y, 46, 6)
	context.fillStyle = '#9b303788'
	for (const x of [42, 64]) {
		for (const y of [206, 229, 252]) context.fillRect(x, y, 6, 6)
	}
	context.restore()
	context.strokeStyle = '#e9dfb6'
	context.lineWidth = 1
	for (let index = 0; index < 9; index += 1) {
		const x = 38 + index * 4.4
		context.beginPath()
		context.moveTo(x, 269)
		context.lineTo(x + 0.8, 273 + Math.sin(index) * 1.3)
		context.stroke()
	}
	return context
}

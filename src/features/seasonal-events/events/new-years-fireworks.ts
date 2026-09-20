type FireworkVariant = 'willow' | 'chrysanthemum' | 'peony' | 'ring'

type FireworkParticle = {
	color: string
	cosine: number
	gravity: number
	lifetime: number
	phase: number
	satellites: { cosine: number; sine: number }[] | null
	sine: number
	size: number
	speed: number
}

type FireworkFrame = {
	age: number
	centerX: number
	centerY: number
	distances: Float64Array
	falls: Float64Array
	hasSatellites: boolean
	satelliteDrift: number
	satelliteFade: number
	satelliteFall: number
}

export type NewYearsFirework = {
	age: number
	ascentDuration: number
	duration: number
	frame: FireworkFrame
	launchX: number
	particles: FireworkParticle[]
	variant: FireworkVariant
	x: number
	y: number
}

export function createNewYearsFirework({
	x,
	y,
	delay = 0,
	paletteIndex = 0,
	variant = VARIANTS[Math.abs(paletteIndex) % VARIANTS.length],
}: {
	x: number
	y: number
	delay?: number
	paletteIndex?: number
	variant?: FireworkVariant
}): NewYearsFirework {
	const palette = PALETTES[Math.abs(paletteIndex) % PALETTES.length]
	const ascentDuration = 0.95 + Math.random() * 0.2
	const rotation = Math.random() * Math.PI * 2
	const particles = Array.from({ length: 96 }, (_, index) => {
		const isInnerShell = index >= 72
		const shellIndex = isInnerShell ? index - 72 : index
		const shellCount = isInnerShell ? 24 : 72
		const angle =
			(shellIndex / shellCount) * Math.PI * 2 +
			rotation +
			(Math.random() - 0.5) * 0.045
		const isWillow = variant === 'willow'
		const speed = isInnerShell
			? 0.35 + Math.random() * 0.2
			: 0.8 + Math.random() * (variant === 'peony' ? 0.35 : 0.2)
		const gravity = (isWillow ? 0.082 : 0.053) + Math.random() * 0.015
		const lifetime = (isWillow ? 4.15 : 3.55) + Math.random() * 0.4
		const phase = Math.random() * Math.PI * 2
		const size = 1 + Math.random() * 0.75
		const satellites =
			!isInnerShell && index % 6 === 0
				? Array.from({ length: 3 }, (_, branch) => {
						const angle = phase + (branch / 3) * Math.PI * 2
						return { cosine: Math.cos(angle), sine: Math.sin(angle) }
					})
				: null

		return {
			color: isInnerShell
				? palette[2]
				: palette[index % 7 === 0 ? 2 : index % 3 === 0 ? 1 : 0],
			cosine: Math.cos(angle),
			gravity,
			lifetime,
			phase,
			satellites,
			sine: Math.sin(angle) * (variant === 'ring' ? 0.68 : 1),
			size,
			speed,
		}
	})

	return {
		age: -delay,
		ascentDuration,
		duration: ascentDuration + 4.6,
		frame: {
			age: 0,
			centerX: 0,
			centerY: 0,
			distances: new Float64Array(12),
			falls: new Float64Array(12),
			hasSatellites: false,
			satelliteDrift: 0,
			satelliteFade: 0,
			satelliteFall: 0,
		},
		launchX: x < 0.5 ? Math.max(0.03, x - 0.14) : Math.min(0.97, x + 0.14),
		particles,
		variant,
		x,
		y,
	}
}

export function drawNewYearsFirework({
	context,
	firework,
	width,
	height,
	sparkSprite,
}: {
	context: CanvasRenderingContext2D
	firework: NewYearsFirework
	width: number
	height: number
	sparkSprite: HTMLCanvasElement
}): void {
	if (firework.age < 0 || firework.age >= firework.duration) return

	context.save()
	context.globalCompositeOperation = 'lighter'
	context.lineCap = 'round'
	const centerX = firework.x * width
	const centerY = firework.y * height

	if (firework.age < firework.ascentDuration) {
		drawRocket({ context, firework, width, height, sparkSprite })
		context.restore()
		return
	}

	const age = firework.age - firework.ascentDuration
	const radius = Math.min(width * 0.25, height * 0.31, 240)
	const { frame } = firework
	frame.age = age
	frame.centerX = centerX
	frame.centerY = centerY
	frame.hasSatellites = age > 0.9 && age < 3.2
	const tailStart = Math.max(
		0,
		age - (firework.variant === 'willow' ? 1.1 : 0.68),
	)
	const splitAge = age - 0.9

	// All particles share these sample times; keep their drag and gravity in doubles.
	for (let sample = 0; sample < 12; sample += 1) {
		const sampleAge =
			sample < 10
				? tailStart + (age - tailStart) * (sample / 9)
				: sample === 10
					? age
					: 0.9 + splitAge * 0.65
		frame.distances[sample] = (1 - Math.exp(-sampleAge * 1.3)) * radius
		frame.falls[sample] = sampleAge * sampleAge * radius
	}
	if (frame.hasSatellites) {
		frame.satelliteDrift = splitAge * radius * 0.11
		frame.satelliteFade = Math.max(0, 1 - splitAge / 2.3)
		frame.satelliteFall = splitAge * splitAge * radius * 0.055
	}
	const flash = Math.max(0, 1 - age / 0.65)
	if (flash > 0) {
		const flashSize = radius * (0.3 + age * 1.4)
		context.globalAlpha = flash * flash * 0.45
		context.drawImage(
			sparkSprite,
			centerX - flashSize / 2,
			centerY - flashSize / 2,
			flashSize,
			flashSize,
		)
	}

	for (const particle of firework.particles) {
		if (age >= particle.lifetime) continue
		drawParticle(context, particle, frame, sparkSprite)
	}

	context.restore()
}

const VARIANTS: FireworkVariant[] = ['willow', 'chrysanthemum', 'peony', 'ring']
const PALETTES = [
	['#ffc765', '#ffe1a0', '#fff4da'],
	['#ff9189', '#ffd4a8', '#fff0d5'],
	['#b79aff', '#e2bcff', '#fff0fd'],
	['#83d9ff', '#b6ebff', '#effcff'],
	['#ffbb69', '#ffd88c', '#fff6d9'],
]

function drawRocket({
	context,
	firework,
	width,
	height,
	sparkSprite,
}: {
	context: CanvasRenderingContext2D
	firework: NewYearsFirework
	width: number
	height: number
	sparkSprite: HTMLCanvasElement
}) {
	const progress = firework.age / firework.ascentDuration
	const startX = firework.launchX * width
	const startY = height * 1.04
	const targetX = firework.x * width
	const targetY = firework.y * height
	const ascent = 1 - (1 - progress) ** 1.65
	const headX = startX + (targetX - startX) * ascent
	const headY =
		startY + (targetY - startY) * ascent - Math.sin(progress * Math.PI) * 22
	const tailStart = Math.max(0, progress - 0.23)
	const tailAscent = 1 - (1 - tailStart) ** 1.65
	let fromX = startX + (targetX - startX) * tailAscent
	let fromY =
		startY +
		(targetY - startY) * tailAscent -
		Math.sin(tailStart * Math.PI) * 22
	context.strokeStyle = '#f4b94e'
	context.lineWidth = 1.6

	for (let segment = 0; segment < 8; segment += 1) {
		const sampleProgress =
			tailStart + (progress - tailStart) * ((segment + 1) / 8)
		const sampleAscent = 1 - (1 - sampleProgress) ** 1.65
		const toX = startX + (targetX - startX) * sampleAscent
		const toY =
			startY +
			(targetY - startY) * sampleAscent -
			Math.sin(sampleProgress * Math.PI) * 22
		context.globalAlpha = (segment / 8) * 0.62
		context.beginPath()
		context.moveTo(fromX, fromY)
		context.lineTo(toX, toY)
		context.stroke()
		fromX = toX
		fromY = toY
	}

	context.globalAlpha = 0.65
	context.drawImage(sparkSprite, headX - 13, headY - 13, 26, 26)
	context.fillStyle = '#fff3cf'
	context.globalAlpha = 0.95
	context.beginPath()
	context.arc(headX, headY, 1.7, 0, Math.PI * 2)
	context.fill()
}

function drawParticle(
	context: CanvasRenderingContext2D,
	particle: FireworkParticle,
	frame: FireworkFrame,
	sparkSprite: HTMLCanvasElement,
) {
	const { age, centerX, centerY, distances, falls } = frame
	const progress = age / particle.lifetime
	const fade = Math.min(1, (1 - progress) * 3)
	const shimmer =
		progress > 0.5 ? 0.65 + Math.sin(age * 19 + particle.phase) * 0.35 : 1
	const opacity = fade * shimmer
	const headDistance = distances[10] * particle.speed
	const headX = centerX + particle.cosine * headDistance
	const headY =
		centerY + particle.sine * headDistance + falls[10] * particle.gravity
	context.strokeStyle = particle.color

	// Sampling the trajectory preserves the long, falling trails of real shells.
	for (let section = 0; section < 3; section += 1) {
		context.globalAlpha = opacity * (0.1 + section * 0.22)
		context.lineWidth = particle.size * (0.45 + section * 0.25)
		context.beginPath()
		for (let step = 0; step <= 3; step += 1) {
			const sample = section * 3 + step
			const distance = distances[sample] * particle.speed
			const x = centerX + particle.cosine * distance
			const y =
				centerY + particle.sine * distance + falls[sample] * particle.gravity
			if (step === 0) context.moveTo(x, y)
			else context.lineTo(x, y)
		}
		context.stroke()
	}

	const headSize = particle.size * Math.max(0.4, 1 - progress * 0.65)
	context.globalAlpha = opacity * 0.95
	context.fillStyle = particle.color
	context.beginPath()
	context.arc(headX, headY, headSize, 0, Math.PI * 2)
	context.fill()

	if (particle.size > 1.3) {
		const glowSize = headSize * 9
		context.globalAlpha = opacity * 0.38
		context.drawImage(
			sparkSprite,
			headX - glowSize / 2,
			headY - glowSize / 2,
			glowSize,
			glowSize,
		)
	}

	if (particle.satellites && frame.hasSatellites) {
		const originDistance = distances[11] * particle.speed
		const originX = centerX + particle.cosine * originDistance
		const originY =
			centerY + particle.sine * originDistance + falls[11] * particle.gravity
		context.globalAlpha = opacity * frame.satelliteFade * 0.72
		context.strokeStyle = '#ffe9bb'
		context.lineWidth = 0.8
		context.beginPath()
		for (const satellite of particle.satellites) {
			const x = originX + satellite.cosine * frame.satelliteDrift
			const y =
				originY + satellite.sine * frame.satelliteDrift + frame.satelliteFall
			context.moveTo(x - satellite.cosine * 4, y - 4)
			context.lineTo(x, y)
		}
		context.stroke()
	}
}

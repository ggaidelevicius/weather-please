import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'
import { Hemisphere } from '../core/types'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createChristmasArtwork } from './christmas-artwork'
import { createChristmasBarbecueArtwork } from './christmas-barbecue-artwork'
import { createChristmasSummerSun } from './christmas-summer-artwork'

type Snowflake = {
	depth: number
	phase: number
	size: number
	speed: number
	x: number
	y: number
}

export async function launchChristmasScene({
	hemisphere = Hemisphere.Northern,
}: {
	hemisphere?: Hemisphere
} = {}): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	const isSummer = hemisphere === Hemisphere.Southern
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Christmas scene canvas')
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const lightSprite = createLightSprite()
	const sunshine = isSummer ? createChristmasSummerSun() : null
	const snowSprite = isSummer ? null : createSnowSprite()
	const snow = Array.from({ length: isSummer ? 0 : 180 }, (_, index) =>
		createSnowflake(index),
	)
	const stars = Array.from({ length: isSummer ? 0 : 45 }, () => ({
		phase: Math.random() * Math.PI * 2,
		x: Math.random(),
		y: Math.random() * 0.72,
	}))
	const glints = Array.from({ length: isSummer ? 10 : 0 }, (_, index) => ({
		phase: Math.random() * Math.PI * 2,
		size: randomInRange({ min: 5, max: 12 }),
		speed: randomInRange({ min: 0.005, max: 0.012 }),
		x: index % 2 === 0 ? Math.random() * 0.28 : 0.78 + Math.random() * 0.22,
		y: 0.45 + Math.random() * 0.55,
	}))
	let artwork: ReturnType<typeof createChristmasArtwork> | null = null
	let landscape: HTMLCanvasElement | null = null
	let barbecue: ReturnType<typeof createChristmasBarbecueArtwork> | null = null
	let artworkDpr = 0
	let landscapeHeight = 0
	let width = window.innerWidth
	let height = window.innerHeight
	let elapsed = 0
	let lastTime = performance.now()
	let shouldAnimate = !motionPreference.matches
	let hasCanceled = false
	let animationFrameId: null | number = null
	let animationGeneration = 0

	canvas.setAttribute('aria-hidden', 'true')
	canvas.setAttribute('data-christmas', 'true')
	canvas.setAttribute('data-christmas-season', isSummer ? 'summer' : 'winter')
	Object.assign(canvas.style, {
		background: isSummer
			? 'radial-gradient(ellipse at 88% 13%, #fff1b8b3, #ffd77875 24%, transparent 59%), linear-gradient(180deg, #4a9fbe8a, #8aafad66 38%, #e9bc6480 76%, #bd95475c)'
			: 'radial-gradient(ellipse at 10% 85%, #c59a3428, transparent 48%), radial-gradient(ellipse at 80% 15%, #456b9a28, transparent 65%), radial-gradient(ellipse at 100% 100%, #25544622, transparent 50%)',
		inset: '0',
		mixBlendMode: 'screen',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})
	document.body.appendChild(canvas)
	const animationController = createSettingsModalAnimationController()

	const drawSnow = (isForeground: boolean, opacity: number) => {
		if (!snowSprite) return
		context.fillStyle = '#e1eaf4'
		for (const flake of snow) {
			if (flake.depth > 0 !== isForeground) continue
			const span = height + 36
			const y = ((flake.y * span + elapsed * flake.speed) % span) - 18
			const drift = elapsed * (2 + flake.depth * 1.8)
			const sway =
				Math.sin(elapsed * 0.35 + flake.phase) * (7 + flake.depth * 5)
			const x = ((flake.x * (width + 60) + drift + sway) % (width + 60)) - 30
			context.globalAlpha =
				opacity * (flake.depth === 0 ? 0.28 : flake.depth === 1 ? 0.5 : 0.38)
			if (flake.depth === 0) {
				context.fillRect(x, y, flake.size, flake.size)
			} else {
				const size = flake.size * (flake.depth === 2 ? 4 : 2.8)
				context.drawImage(snowSprite, x - size / 2, y - size / 2, size, size)
			}
		}
	}

	const drawSummerGlints = (opacity: number) => {
		for (const glint of glints) {
			const phase = elapsed * glint.speed + glint.phase
			const x = glint.x * width + Math.sin(phase * 3) * 16
			const y = glint.y * height + Math.cos(phase * 2) * 12
			const shimmer = Math.max(0, Math.sin(elapsed * 0.55 + glint.phase)) ** 4
			context.globalAlpha = opacity * (0.07 + shimmer * 0.36)
			context.drawImage(lightSprite, x, y, glint.size, glint.size)
		}
	}

	const drawSummerBarbecue = (opacity: number) => {
		if (!barbecue) return
		const scale = Math.min(
			0.95,
			(height * 0.38) / barbecue.height,
			(width * 0.55) / barbecue.width,
		)
		const sceneWidth = barbecue.width * scale
		const sceneHeight = barbecue.height * scale
		const x = width - sceneWidth - Math.min(24, width * 0.02)
		const y = height - barbecue.baseY * scale
		context.globalAlpha = opacity
		context.drawImage(barbecue.canvas, x, y, sceneWidth, sceneHeight)
		const grillX = x + barbecue.grill.x * sceneWidth
		const grillY = y + barbecue.grill.y * sceneHeight
		const grillWidth = barbecue.grill.width * sceneWidth
		context.strokeStyle = '#fff4d0'
		context.lineWidth = Math.max(0.7, 1.6 * scale)
		context.lineCap = 'round'
		for (let index = 0; index < 5; index += 1) {
			const progress = (elapsed * 0.16 + index * 0.19) % 1
			const rise = progress * 100 * scale
			const sway = Math.sin(elapsed * 0.8 + index * 2) * 9 * scale
			const steamX = grillX + (index / 4 - 0.5) * grillWidth * 0.72
			const steamY = grillY - rise
			context.globalAlpha = opacity * Math.sin(progress * Math.PI) * 0.24
			context.beginPath()
			context.moveTo(steamX, steamY)
			context.bezierCurveTo(
				steamX - 8 * scale + sway,
				steamY - 12 * scale,
				steamX + 10 * scale + sway,
				steamY - 28 * scale,
				steamX + sway,
				steamY - 42 * scale,
			)
			context.stroke()
		}
	}

	const drawScene = () => {
		if (!artwork) return
		context.clearRect(0, 0, width, height)
		const reveal = shouldAnimate ? Math.min(1, elapsed / 1.8) : 1
		const opacity = 1 - (1 - reveal) ** 3
		if (sunshine) {
			const sunSize = Math.min(width * 0.8, height * 0.7, 600)
			context.globalAlpha = opacity * 0.9
			context.drawImage(
				sunshine,
				width * 0.87 - sunSize / 2,
				height * 0.14 - sunSize / 2,
				sunSize,
				sunSize,
			)
		}
		const scale = Math.min(
			(height * 0.68) / artwork.height,
			(width * (isSummer ? 0.6 : 0.78)) / artwork.width,
			1,
		)
		const treeWidth = artwork.width * scale
		const treeHeight = artwork.height * scale
		const treeX = -treeWidth * 0.16
		const treeY = height - artwork.baseY * scale + 10

		context.fillStyle = isSummer ? '#f4dfb7' : '#bfd1e9'
		for (const star of stars) {
			context.globalAlpha =
				opacity * (0.17 + Math.sin(elapsed * 0.45 + star.phase) * 0.07)
			context.fillRect(star.x * width, star.y * height, 1, 1)
		}
		drawSnow(false, opacity)

		context.globalAlpha = opacity
		if (landscape) {
			context.drawImage(
				landscape,
				0,
				height - landscapeHeight,
				width,
				landscapeHeight,
			)
		}
		context.drawImage(artwork.canvas, treeX, treeY, treeWidth, treeHeight)
		drawSummerBarbecue(opacity)

		context.globalCompositeOperation = 'lighter'
		for (const light of artwork.lights) {
			const warmth =
				0.65 +
				Math.sin(elapsed * 0.9 + light.phase) * 0.14 +
				Math.sin(elapsed * 1.7 + light.phase * 0.7) * 0.07
			const x = treeX + light.x * scale
			const y = treeY + light.y * scale
			const haloSize = light.size * 13 * scale
			context.globalAlpha = opacity * warmth * 0.68
			context.drawImage(
				lightSprite,
				x - haloSize / 2,
				y - haloSize / 2,
				haloSize,
				haloSize,
			)
			context.globalAlpha = opacity * warmth
			context.fillStyle = '#fff1c5'
			context.beginPath()
			context.arc(
				x,
				y,
				Math.max(0.6, light.size * 0.65 * scale),
				0,
				Math.PI * 2,
			)
			context.fill()
		}

		const starX = treeX + artwork.star.x * scale
		const starY = treeY + artwork.star.y * scale
		const starSize = 85 * scale
		context.globalAlpha = opacity * (0.3 + Math.sin(elapsed * 0.7) * 0.045)
		context.drawImage(
			lightSprite,
			starX - starSize / 2,
			starY - starSize / 2,
			starSize,
			starSize,
		)
		context.globalCompositeOperation = 'source-over'
		drawSnow(true, opacity)
		drawSummerGlints(opacity)
		context.globalAlpha = 1
	}

	const resizeCanvas = () => {
		width = Math.max(1, window.innerWidth)
		height = Math.max(1, window.innerHeight)
		const dpr = getCanvasDpr({ height, maxDpr: 2, width })
		canvas.width = Math.round(width * dpr)
		canvas.height = Math.round(height * dpr)
		canvas.style.width = `${width}px`
		canvas.style.height = `${height}px`
		context.setTransform(dpr, 0, 0, dpr, 0, 0)
		if (!artwork || artworkDpr !== dpr) {
			artwork = createChristmasArtwork({ dpr, hasSnow: !isSummer })
			barbecue = isSummer ? createChristmasBarbecueArtwork({ dpr }) : null
			artworkDpr = dpr
		}
		landscapeHeight = Math.min(height * 0.22, 160)
		landscape = isSummer
			? null
			: createLandscape({ width, height: landscapeHeight, dpr })
		drawScene()
	}

	const renderFrame = (time: number, generation: number) => {
		// A settings-resume callback may already be queued when visibility changes.
		if (hasCanceled || generation !== animationGeneration) return
		animationFrameId = null
		if (!shouldAnimate || document.hidden) return
		if (!animationController.isPaused()) {
			elapsed += Math.min((time - lastTime) / 1000, 0.05)
			lastTime = time
			drawScene()
		}
		animationFrameId = animationController.requestAnimationFrame((nextTime) =>
			renderFrame(nextTime, generation),
		)
	}

	const syncAnimation = () => {
		animationGeneration += 1
		if (animationFrameId !== null) {
			animationController.cancelAnimationFrame(animationFrameId)
			animationFrameId = null
		}
		shouldAnimate = !motionPreference.matches
		lastTime = performance.now()
		if (!shouldAnimate) {
			drawScene()
		} else if (!document.hidden) {
			const generation = animationGeneration
			animationFrameId = animationController.requestAnimationFrame((time) =>
				renderFrame(time, generation),
			)
		}
	}

	const cleanup = () => {
		hasCanceled = true
		if (animationFrameId !== null) {
			animationController.cancelAnimationFrame(animationFrameId)
		}
		animationController.dispose()
		window.removeEventListener('resize', resizeCanvas)
		document.removeEventListener('visibilitychange', syncAnimation)
		motionPreference.removeEventListener('change', syncAnimation)
		canvas.remove()
	}

	try {
		resizeCanvas()
		window.addEventListener('resize', resizeCanvas)
		document.addEventListener('visibilitychange', syncAnimation)
		motionPreference.addEventListener('change', syncAnimation)
		syncAnimation()
	} catch (error) {
		cleanup()
		throw error
	}
	return cleanup
}

function createSnowflake(index: number): Snowflake {
	const depth = index < 90 ? 0 : index < 160 ? 1 : 2
	return {
		depth,
		phase: Math.random() * Math.PI * 2,
		size: randomInRange({ min: 0.6 + depth * 0.6, max: 1.1 + depth * 0.9 }),
		speed: randomInRange({ min: 9 + depth * 13, max: 17 + depth * 15 }),
		x: Math.random(),
		y: Math.random(),
	}
}

function createLightSprite(): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = 64
	canvas.height = 64
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Christmas light glow')
	const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
	gradient.addColorStop(0, '#fffbe7')
	gradient.addColorStop(0.12, '#ffe5abe0')
	gradient.addColorStop(0.38, '#eeba5a55')
	gradient.addColorStop(1, '#eeba5a00')
	context.fillStyle = gradient
	context.fillRect(0, 0, 64, 64)
	return canvas
}

function createSnowSprite(): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = 32
	canvas.height = 32
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Christmas snowflake')
	const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16)
	gradient.addColorStop(0, '#f1f6ff')
	gradient.addColorStop(0.25, '#e2edf9e0')
	gradient.addColorStop(0.55, '#dce8f34d')
	gradient.addColorStop(1, '#dce8f300')
	context.fillStyle = gradient
	context.fillRect(0, 0, 32, 32)
	return canvas
}

function createLandscape({
	width,
	height,
	dpr,
}: {
	width: number
	height: number
	dpr: number
}): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = Math.round(width * dpr)
	canvas.height = Math.round(height * dpr)
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create Christmas snowdrifts')
	context.setTransform(dpr, 0, 0, dpr, 0, 0)

	const backSnow = context.createLinearGradient(0, height * 0.7, 0, height)
	backSnow.addColorStop(0, '#788d9e85')
	backSnow.addColorStop(1, '#2a3b4c66')
	context.fillStyle = backSnow
	context.beginPath()
	context.moveTo(0, height * 0.77)
	context.bezierCurveTo(
		width * 0.22,
		height * 0.61,
		width * 0.44,
		height * 0.99,
		width * 0.7,
		height * 0.82,
	)
	context.quadraticCurveTo(width * 0.9, height * 0.7, width, height * 0.75)
	context.lineTo(width, height)
	context.lineTo(0, height)
	context.closePath()
	context.fill()

	const frontSnow = context.createLinearGradient(0, height * 0.8, 0, height)
	frontSnow.addColorStop(0, '#abb9c2a6')
	frontSnow.addColorStop(1, '#50616f80')
	context.fillStyle = frontSnow
	context.beginPath()
	context.moveTo(0, height * 0.9)
	context.bezierCurveTo(
		width * 0.18,
		height,
		width * 0.35,
		height * 0.69,
		width * 0.59,
		height * 0.9,
	)
	context.quadraticCurveTo(width * 0.81, height * 1.04, width, height * 0.88)
	context.lineTo(width, height)
	context.lineTo(0, height)
	context.closePath()
	context.fill()

	for (let index = 0; index < 7; index += 1) {
		const x = width * (0.77 + index * 0.044)
		const treeHeight = height * (0.34 + Math.sin(index * 2.1) * 0.13)
		const baseY = height * (0.88 + (index % 3) * 0.012)
		const topY = baseY - treeHeight
		const trunkWidth = Math.max(1.5, treeHeight * 0.045)
		const tiers = Array.from({ length: 6 }, (_, tier) => ({
			y: topY + treeHeight * (0.2 + tier * 0.14),
			halfWidth: treeHeight * (0.07 + tier * 0.04),
		}))

		context.fillStyle = '#14252bb3'
		context.beginPath()
		context.ellipse(
			x,
			baseY,
			treeHeight * 0.23,
			Math.max(1, treeHeight * 0.035),
			0,
			0,
			Math.PI * 2,
		)
		context.fill()
		context.fillStyle = '#41443a'
		context.fillRect(
			x - trunkWidth / 2,
			baseY - treeHeight * 0.2,
			trunkWidth,
			treeHeight * 0.2,
		)

		const foliage = context.createLinearGradient(
			x - treeHeight * 0.27,
			0,
			x + treeHeight * 0.27,
			0,
		)
		foliage.addColorStop(0, index % 2 === 0 ? '#2c4942' : '#30494a')
		foliage.addColorStop(0.48, '#213b35')
		foliage.addColorStop(1, '#142c2c')
		context.fillStyle = foliage
		context.beginPath()
		context.moveTo(x, topY)
		for (const tier of tiers) {
			context.lineTo(x + tier.halfWidth, tier.y)
			context.lineTo(x + tier.halfWidth * 0.57, tier.y - treeHeight * 0.035)
		}
		context.lineTo(x, baseY - treeHeight * 0.09)
		for (let tier = tiers.length - 1; tier >= 0; tier -= 1) {
			context.lineTo(
				x - tiers[tier].halfWidth * 0.57,
				tiers[tier].y - treeHeight * 0.035,
			)
			context.lineTo(x - tiers[tier].halfWidth, tiers[tier].y)
		}
		context.closePath()
		context.fill()
	}
	return canvas
}

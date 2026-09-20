import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'
import { getCanvasDpr, randomInRange } from '../core/utils'
import { createAutumnArtwork } from './autumn-artwork'

type Leaf = {
	depth: number
	phase: number
	rotation: number
	size: number
	speed: number
	spin: number
	variant: number
	x: number
	y: number
}

export async function launchAutumnEquinoxLeaves(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Unable to create autumn atmosphere canvas')
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	let artwork: ReturnType<typeof createAutumnArtwork> | null = null
	let artworkDpr = 0
	let width = Math.max(1, window.innerWidth)
	let height = Math.max(1, window.innerHeight)
	const leaves = Array.from({ length: 32 }, (_, index) => createLeaf(index))
	let shouldAnimate = !motionPreference.matches
	let elapsed = shouldAnimate ? 0 : 4
	let lastTime = performance.now()
	let hasCanceled = false
	let animationFrameId: null | number = null
	let animationGeneration = 0

	canvas.setAttribute('aria-hidden', 'true')
	canvas.setAttribute('data-autumn-equinox', 'true')
	Object.assign(canvas.style, {
		background:
			'radial-gradient(ellipse at 6% 7%, #b7834f28, transparent 64%), radial-gradient(ellipse at 98% 62%, #66547524, transparent 70%), radial-gradient(ellipse at 40% 100%, #8764461c, transparent 60%)',
		inset: '0',
		mixBlendMode: 'screen',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})
	document.body.appendChild(canvas)
	const animationController = createSettingsModalAnimationController()

	const advanceLeaves = (delta: number) => {
		const gust = getGust(elapsed)
		for (const leaf of leaves) {
			const wind =
				4 +
				gust * (19 + leaf.depth * 7) +
				Math.sin(elapsed * 0.3 + leaf.phase) * 3
			leaf.x = (leaf.x + (wind * delta) / (width + 100)) % 1
			leaf.y = (leaf.y + ((leaf.speed - gust * 5) * delta) / (height + 100)) % 1
			leaf.rotation += (leaf.spin + gust * 0.55) * delta
		}
		return leaves
	}

	const drawScene = () => {
		if (!artwork) return
		context.clearRect(0, 0, width, height)
		const reveal = Math.min(1, elapsed / 2.6)
		const opacity = 1 - (1 - reveal) ** 3
		const gust = getGust(elapsed)
		const drift = Math.sin(elapsed * 0.13) * 0.012 + gust * 0.018

		context.globalAlpha = opacity * (0.13 + gust * 0.022)
		context.drawImage(
			artwork.light,
			width * (-0.41 + drift),
			-height * 0.5,
			width * 1.4,
			height * 1.55,
		)
		context.globalAlpha = opacity * (0.047 + Math.sin(elapsed * 0.17) * 0.008)
		context.drawImage(
			artwork.light,
			width * (0.18 + drift * 1.6),
			-height * 0.26,
			width * 0.75,
			height * 0.92,
		)
		context.globalAlpha = opacity * 0.038
		context.drawImage(
			artwork.light,
			width * (-0.32 + drift * 0.6),
			height * 0.6,
			width * 0.95,
			height * 0.72,
		)

		const canopyWidth = Math.min(width * 0.9, 800)
		const canopyHeight =
			(canopyWidth * artwork.canopyHeight) / artwork.canopyWidth
		// The cached mask breaks up the light without adding a solid tree silhouette.
		context.globalCompositeOperation = 'destination-out'
		context.globalAlpha = 0.65
		context.drawImage(
			artwork.canopy,
			-35 + drift * 450,
			-24 + gust * 6,
			canopyWidth,
			canopyHeight,
		)
		context.save()
		context.translate(width + 30 - drift * 260, -34)
		context.scale(-1, 1)
		context.globalAlpha = 0.45
		context.drawImage(
			artwork.canopy,
			0,
			0,
			canopyWidth * 0.74,
			canopyHeight * 0.74,
		)
		context.restore()
		context.globalCompositeOperation = 'source-over'

		const leafCount = width < 600 ? 18 : leaves.length
		for (let index = 0; index < leafCount; index += 1) {
			const leaf = leaves[index]
			const sway = Math.sin(elapsed * 0.45 + leaf.phase)
			const x = leaf.x * (width + 100) - 50 + sway * (7 + leaf.depth * 3)
			const y =
				leaf.y * (height + 100) - 50 + Math.cos(elapsed * 0.38 + leaf.phase) * 4
			const size = leaf.size * (width < 600 ? 0.8 : 1)
			const turn = 0.18 + Math.abs(Math.cos(elapsed * 0.7 + leaf.phase)) * 0.82
			context.save()
			context.translate(x, y)
			context.rotate(leaf.rotation + sway * 0.18)
			context.scale(turn, 1)
			context.globalAlpha =
				opacity * (0.22 + leaf.depth * 0.09) * (0.82 + turn * 0.18)
			context.drawImage(
				artwork.leaves[leaf.variant],
				-size / 2,
				-size / 2,
				size,
				size,
			)
			context.restore()
		}
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
			artwork = createAutumnArtwork({ dpr })
			artworkDpr = dpr
		}
		drawScene()
	}

	const renderFrame = (time: number, generation: number) => {
		// A settings-resume callback may already be queued when visibility changes.
		if (hasCanceled || generation !== animationGeneration) return
		animationFrameId = null
		if (!shouldAnimate || document.hidden) return
		if (!animationController.isPaused()) {
			const delta = Math.min(Math.max(0, (time - lastTime) / 1000), 0.05)
			elapsed += delta
			lastTime = time
			advanceLeaves(delta)
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
			elapsed = Math.max(elapsed, 4)
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

function createLeaf(index: number): Leaf {
	const depth = index % 7 === 0 ? 2 : index % 3 === 0 ? 0 : 1
	return {
		depth,
		phase: randomInRange({ min: 0, max: Math.PI * 2 }),
		rotation: randomInRange({ min: 0, max: Math.PI * 2 }),
		size: randomInRange({ min: 12 + depth * 8, max: 18 + depth * 9 }),
		speed: randomInRange({ min: 7 + depth * 5, max: 12 + depth * 5 }),
		spin: randomInRange({ min: -0.32, max: 0.32 }),
		variant: index % 9,
		x: (index * 0.618034 + Math.random() * 0.08) % 1,
		y: (index * 0.414214 + Math.random() * 0.08) % 1,
	}
}

function getGust(time: number) {
	return (
		Math.max(0, Math.sin(time * 0.21 - 0.9)) ** 6 *
		(0.8 + Math.sin(time * 0.067) * 0.2)
	)
}

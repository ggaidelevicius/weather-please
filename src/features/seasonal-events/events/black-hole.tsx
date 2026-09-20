import {
	ClampToEdgeWrapping,
	LinearFilter,
	RepeatWrapping,
	TextureLoader,
	WebGLRenderer,
} from 'three'
import type { Texture } from 'three'
import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import milkywayData from '../assets/milkyway.jpg'
import starNoiseData from '../assets/star_noise.png'
import { getCanvasDpr } from '../core/utils'
import { createBlackHoleScene } from './black-hole-scene'

const BLACK_HOLE_MOUNT_DELAY_MS = 900
const BLACK_HOLE_TEXTURE_TIMEOUT_MS = 15_000
const DISK_ROTATION_SPEED = 0.02

export async function launchBlackHoleEvent(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let hasCanceled = false
	let lastTime: number | null = null
	let animationFrameId: number | null = null
	let animationGeneration = 0
	let elapsed = 0
	let rotation = 0
	let width = Math.max(1, window.innerWidth)
	let height = Math.max(1, window.innerHeight)
	let dpr = 1
	let renderer: WebGLRenderer | null = null
	let scene: ReturnType<typeof createBlackHoleScene> | null = null
	let unsubscribeSettings = () => {}
	const textures = new Set<Texture>()
	const pendingLoads = new Set<() => void>()
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	let hasRevealed = motionPreference.matches
	const canvas = document.createElement('canvas')
	canvas.dataset.blackHole = 'true'
	canvas.setAttribute('aria-hidden', 'true')
	Object.assign(canvas.style, {
		inset: '0',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})

	const loadTexture = (url: string, shouldRepeat = false) =>
		new Promise<Texture>((resolve, reject) => {
			let hasSettled = false
			const finish = (texture: Texture | null, error?: unknown) => {
				if (hasSettled) return
				hasSettled = true
				window.clearTimeout(timeoutId)
				pendingLoads.delete(cancel)
				if (texture) resolve(texture)
				else reject(error)
			}
			const cancel = () =>
				finish(null, new Error('Black hole texture loading canceled'))
			const timeoutId = window.setTimeout(
				() => finish(null, new Error('Black hole texture loading timed out')),
				BLACK_HOLE_TEXTURE_TIMEOUT_MS,
			)
			pendingLoads.add(cancel)
			try {
				const texture = new TextureLoader().load(
					url,
					(loaded) => {
						if (hasCanceled || hasSettled) return
						loaded.magFilter = LinearFilter
						loaded.minFilter = LinearFilter
						loaded.wrapS = shouldRepeat ? RepeatWrapping : ClampToEdgeWrapping
						loaded.wrapT = shouldRepeat ? RepeatWrapping : ClampToEdgeWrapping
						finish(loaded)
					},
					undefined,
					(error) => finish(null, error),
				)
				textures.add(texture)
			} catch (error) {
				finish(null, error)
			}
		})

	const drawScene = () => {
		scene?.render({
			width,
			height,
			dpr,
			time: rotation,
			reveal: hasRevealed ? 1 : 1 - (1 - Math.min(1, elapsed / 2.8)) ** 3,
		})
	}
	const resizeScene = () => {
		if (hasCanceled || !renderer || !scene) return
		try {
			width = Math.max(1, window.innerWidth)
			height = Math.max(1, window.innerHeight)
			dpr = getCanvasDpr({ height, width, maxDpr: 1.2, maxPixels: 1_600_000 })
			renderer.setPixelRatio(dpr)
			renderer.setSize(width, height, false)
			canvas.style.width = `${width}px`
			canvas.style.height = `${height}px`
			drawScene()
		} catch (error) {
			handleFailure(error)
		}
	}
	const canAnimate = () =>
		!motionPreference.matches && !document.hidden && !isSettingsModalOpen()
	const renderFrame = (time: number, generation: number) => {
		if (hasCanceled || generation !== animationGeneration) return
		animationFrameId = null
		if (!canAnimate()) return
		const delta =
			lastTime === null ? 0 : Math.max(0, Math.min(50, time - lastTime)) / 1000
		lastTime = time
		elapsed += delta
		rotation = (rotation + delta * DISK_ROTATION_SPEED) % (Math.PI * 2)
		try {
			drawScene()
			animationFrameId = window.requestAnimationFrame((nextTime) =>
				renderFrame(nextTime, generation),
			)
		} catch (error) {
			handleFailure(error)
		}
	}
	const syncAnimation = () => {
		if (hasCanceled || !scene) return
		animationGeneration += 1
		if (animationFrameId !== null) {
			window.cancelAnimationFrame(animationFrameId)
			animationFrameId = null
		}
		lastTime = null
		try {
			if (motionPreference.matches) {
				hasRevealed = true
				drawScene()
			} else if (canAnimate()) {
				const generation = animationGeneration
				animationFrameId = window.requestAnimationFrame((time) =>
					renderFrame(time, generation),
				)
			}
		} catch (error) {
			handleFailure(error)
		}
	}
	const cleanup = () => {
		if (hasCanceled) return
		hasCanceled = true
		window.clearTimeout(timeoutId)
		if (animationFrameId !== null) {
			window.cancelAnimationFrame(animationFrameId)
			animationFrameId = null
		}
		for (const cancel of pendingLoads) cancel()
		pendingLoads.clear()
		unsubscribeSettings()
		window.removeEventListener('resize', resizeScene)
		document.removeEventListener('visibilitychange', syncAnimation)
		motionPreference.removeEventListener('change', syncAnimation)
		canvas.remove()
		scene?.dispose()
		for (const texture of textures) texture.dispose()
		textures.clear()
		renderer?.dispose()
		renderer?.forceContextLoss()
	}
	const handleFailure = (error: unknown) => {
		if (hasCanceled) return
		cleanup()
		console.error('Failed to launch Event Horizon Day scene', error)
	}
	const mount = async () => {
		try {
			const [bgTexture, starTexture] = await Promise.all([
				loadTexture(milkywayData.src),
				loadTexture(starNoiseData.src, true),
			])
			if (hasCanceled) return
			renderer = new WebGLRenderer({
				canvas,
				alpha: true,
				antialias: false,
				powerPreference: 'low-power',
			})
			renderer.setClearColor(0x000000, 0)
			scene = createBlackHoleScene({
				renderer,
				bgTexture,
				starTexture,
			})
			hasRevealed = motionPreference.matches
			document.body.appendChild(canvas)
			resizeScene()
			if (hasCanceled) return
			window.addEventListener('resize', resizeScene)
			document.addEventListener('visibilitychange', syncAnimation)
			motionPreference.addEventListener('change', syncAnimation)
			unsubscribeSettings = onSettingsModalStateChange(syncAnimation)
			syncAnimation()
		} catch (error) {
			handleFailure(error)
		}
	}
	const timeoutId = window.setTimeout(() => {
		if (!hasCanceled) void mount()
	}, BLACK_HOLE_MOUNT_DELAY_MS)
	return cleanup
}

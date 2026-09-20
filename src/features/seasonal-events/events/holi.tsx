import { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import {
	isSettingsModalOpen,
	onSettingsModalStateChange,
} from '../../../shared/lib/settings-modal-state'
import { getCanvasDpr } from '../core/utils'
import { createHoliParticles, updateHoliParticles } from './holi-particles'

const HOLI_MOUNT_DELAY_MS = 900

export async function launchHoliColors(): Promise<() => void> {
	if (typeof window === 'undefined') return () => {}

	let disposeScene = () => {}
	let hasCanceled = false
	const timeoutId = window.setTimeout(() => {
		if (hasCanceled) return
		try {
			disposeScene = mountHoli()
		} catch (error) {
			console.error('Failed to launch Holi colours', error)
		}
	}, HOLI_MOUNT_DELAY_MS)

	return () => {
		hasCanceled = true
		window.clearTimeout(timeoutId)
		disposeScene()
	}
}

function mountHoli() {
	const canvas = document.createElement('canvas')
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const scene = new Scene()
	const camera = new PerspectiveCamera(60, 1, 0.1, 30)
	let renderer: WebGLRenderer | null = null
	let particles: ReturnType<typeof createHoliParticles> | null = null
	let width = Math.max(1, window.innerWidth)
	let height = Math.max(1, window.innerHeight)
	let dpr = 1
	let elapsed = 0
	let hasRevealed = motionPreference.matches
	let lastTime: number | null = null
	let animationFrameId: number | null = null
	let animationGeneration = 0
	let hasCanceled = false
	let unsubscribeSettings = () => {}

	canvas.dataset.holi = 'true'
	canvas.setAttribute('aria-hidden', 'true')
	Object.assign(canvas.style, {
		inset: '0',
		mixBlendMode: 'screen',
		pointerEvents: 'none',
		position: 'fixed',
		zIndex: '0',
	})

	const drawScene = () => {
		if (!renderer || !particles) return
		updateHoliParticles({
			particles,
			elapsed,
			hasRevealed,
			isCompact: width < 600,
			dpr,
		})
		renderer.render(scene, camera)
	}
	const resizeScene = () => {
		if (!renderer) return
		width = Math.max(1, window.innerWidth)
		height = Math.max(1, window.innerHeight)
		dpr = getCanvasDpr({ height, maxDpr: 1.6, width })
		renderer.setPixelRatio(dpr)
		renderer.setSize(width, height, false)
		canvas.style.width = `${width}px`
		canvas.style.height = `${height}px`
		camera.aspect = width / height
		camera.position.z = width < 600 ? 3.4 : 2.35
		camera.updateProjectionMatrix()
		drawScene()
	}
	const canAnimate = () =>
		!motionPreference.matches && !document.hidden && !isSettingsModalOpen()
	const renderFrame = (time: number, generation: number) => {
		if (hasCanceled || generation !== animationGeneration) return
		animationFrameId = null
		if (!canAnimate()) return
		const delta =
			lastTime === null ? 0 : Math.max(0, Math.min(50, time - lastTime))
		lastTime = time
		elapsed += delta / 1000
		drawScene()
		animationFrameId = window.requestAnimationFrame((nextTime) =>
			renderFrame(nextTime, generation),
		)
	}
	const syncAnimation = () => {
		animationGeneration += 1
		if (animationFrameId !== null) {
			window.cancelAnimationFrame(animationFrameId)
			animationFrameId = null
		}
		lastTime = null
		if (motionPreference.matches) {
			hasRevealed = true
			drawScene()
		} else if (canAnimate()) {
			const generation = animationGeneration
			animationFrameId = window.requestAnimationFrame((time) =>
				renderFrame(time, generation),
			)
		}
	}
	const cleanup = () => {
		if (hasCanceled) return
		hasCanceled = true
		if (animationFrameId !== null) {
			window.cancelAnimationFrame(animationFrameId)
			animationFrameId = null
		}
		unsubscribeSettings()
		window.removeEventListener('resize', resizeScene)
		document.removeEventListener('visibilitychange', syncAnimation)
		motionPreference.removeEventListener('change', syncAnimation)
		canvas.remove()
		if (particles) {
			scene.remove(particles.points)
			particles.geometry.dispose()
			particles.material.dispose()
		}
		renderer?.dispose()
		renderer?.forceContextLoss()
	}

	try {
		renderer = new WebGLRenderer({
			canvas,
			alpha: true,
			antialias: false,
			powerPreference: 'low-power',
		})
		renderer.setClearColor(0x000000, 0)
		particles = createHoliParticles()
		scene.add(particles.points)
		document.body.appendChild(canvas)
		resizeScene()
		window.addEventListener('resize', resizeScene)
		document.addEventListener('visibilitychange', syncAnimation)
		motionPreference.addEventListener('change', syncAnimation)
		unsubscribeSettings = onSettingsModalStateChange(syncAnimation)
		syncAnimation()
	} catch (error) {
		cleanup()
		throw error
	}
	return cleanup
}

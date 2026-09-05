import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'
import { randomInRange, getCanvasDpr } from '../core/utils'

const WINTER_MOUNT_DELAY_MS = 900

const WINTER_FIELD_OPACITY = '0.6'

const WINTER_FIELD_FILTER = 'saturate(115%)'

const WINTER_FIELD_MAX_DPR = 2

const WINTER_FIELD_MARGIN = 150

const WINTER_PARTICLE_COUNT = 90

const WINTER_FADE_IN_DELAY_RANGE = { max: 2600, min: 0 }

const WINTER_FADE_IN_DURATION_RANGE = { max: 2100, min: 1200 }

const WINTER_SIZE_RANGE = { max: 11, min: 4 }

const WINTER_VELOCITY_X_RANGE = { max: 6, min: -6 }

const WINTER_VELOCITY_Y_RANGE = { max: 5, min: -5 }

const WINTER_SWAY_RANGE = { max: 6, min: 1.5 }

const WINTER_ROTATION_SPEED_RANGE = { max: 0.25, min: -0.25 }

const WINTER_SWAY_SPEED_X = 0.00045

const WINTER_SWAY_SPEED_Y = 0.0004

const WINTER_GLOW_RANGE = { max: 14, min: 6 }

const WINTER_AURORA_OPACITY = '0.55'

const WINTER_AURORA_GRADIENT =
	'radial-gradient(120% 80% at 15% 0%, rgba(59, 130, 246, 0.3), rgba(14, 116, 144, 0.12) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(129, 140, 248, 0.22), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(52, 211, 153, 0.18), rgba(15, 23, 42, 0) 70%)'

const WINTER_COLORS = [
	'#e0f2fe',
	'#bae6fd',
	'#c7d2fe',
	'#e9d5ff',
	'#f8fafc',
	'#a5f3fc',
]

export async function launchWinterSolstice() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const animationController = createSettingsModalAnimationController({
			shouldAnimate,
		})
		const style = document.createElement('style')
		const overlay = document.createElement('div')
		const aurora = document.createElement('div')
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for winter solstice canvas')
		}

		type Particle = {
			birthTime: number
			color: string
			fadeDuration: number
			glow: number
			opacity: number
			phase: number
			rotation: number
			rotationSpeed: number
			size: number
			sway: number
			vx: number
			vy: number
			x: number
			y: number
		}

		let timeoutId: null | number = null
		let animationFrameId: null | number = null
		let hasCanceled = false
		let width = window.innerWidth
		let height = window.innerHeight
		let particles: Particle[] = []
		let lastTime = performance.now()

		const randomColor = () =>
			WINTER_COLORS[Math.floor(Math.random() * WINTER_COLORS.length)]
		const createParticle = (time: number): Particle => ({
			birthTime: time + randomInRange(WINTER_FADE_IN_DELAY_RANGE),
			color: randomColor(),
			fadeDuration: randomInRange(WINTER_FADE_IN_DURATION_RANGE),
			glow: randomInRange(WINTER_GLOW_RANGE),
			opacity: randomInRange({ max: 0.7, min: 0.35 }),
			phase: randomInRange({ max: Math.PI * 2, min: 0 }),
			rotation: randomInRange({ max: Math.PI * 2, min: 0 }),
			rotationSpeed: randomInRange(WINTER_ROTATION_SPEED_RANGE),
			size: randomInRange(WINTER_SIZE_RANGE),
			sway: randomInRange(WINTER_SWAY_RANGE),
			vx: randomInRange(WINTER_VELOCITY_X_RANGE),
			vy: randomInRange(WINTER_VELOCITY_Y_RANGE),
			x: randomInRange({
				max: width + WINTER_FIELD_MARGIN,
				min: -WINTER_FIELD_MARGIN,
			}),
			y: randomInRange({
				max: height + WINTER_FIELD_MARGIN,
				min: -WINTER_FIELD_MARGIN,
			}),
		})
		const resetParticles = (time: number) => {
			particles = Array.from({ length: WINTER_PARTICLE_COUNT }, () =>
				createParticle(time),
			)
		}
		const respawnParticle = (particle: Particle, time: number) => {
			Object.assign(particle, createParticle(time))
		}
		const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)
		const resizeCanvas = () => {
			const nextWidth = window.innerWidth
			const nextHeight = window.innerHeight
			const prevWidth = width
			const prevHeight = height
			width = nextWidth
			height = nextHeight
			const dpr = getCanvasDpr({ height, maxDpr: WINTER_FIELD_MAX_DPR, width })

			canvas.width = Math.round(width * dpr)
			canvas.height = Math.round(height * dpr)
			canvas.style.width = `${width}px`
			canvas.style.height = `${height}px`
			context.setTransform(dpr, 0, 0, dpr, 0, 0)

			const now = performance.now()
			if (particles.length === 0) {
				resetParticles(now)
				return
			}

			const scaleX = prevWidth > 0 ? width / prevWidth : 1
			const scaleY = prevHeight > 0 ? height / prevHeight : 1
			for (const particle of particles) {
				particle.x = (particle.x - prevWidth / 2) * scaleX + width / 2
				particle.y = (particle.y - prevHeight / 2) * scaleY + height / 2

				if (
					particle.x < -WINTER_FIELD_MARGIN ||
					particle.x > width + WINTER_FIELD_MARGIN ||
					particle.y < -WINTER_FIELD_MARGIN ||
					particle.y > height + WINTER_FIELD_MARGIN
				) {
					respawnParticle(particle, now)
				}
			}
		}
		const revealParticles = (time: number) => {
			for (const particle of particles) {
				particle.birthTime = time - particle.fadeDuration
			}
		}
		const drawParticle = (particle: Particle, time: number) => {
			const lifeProgress = (time - particle.birthTime) / particle.fadeDuration
			if (lifeProgress < 0) {
				return
			}

			const eased = easeOutCubic(Math.min(1, lifeProgress))
			const twinkle = 0.6 + Math.sin(time * 0.002 + particle.phase) * 0.4
			const alpha = particle.opacity * eased * twinkle
			const glowRadius = particle.size * 2.3

			context.save()
			context.translate(particle.x, particle.y)
			context.rotate(particle.rotation)

			context.globalAlpha = alpha * 0.35
			const glow = context.createRadialGradient(0, 0, 0, 0, 0, glowRadius)
			glow.addColorStop(0, particle.color)
			glow.addColorStop(1, 'rgba(15, 23, 42, 0)')
			context.fillStyle = glow
			context.beginPath()
			context.arc(0, 0, glowRadius, 0, Math.PI * 2)
			context.fill()

			context.globalAlpha = alpha
			context.strokeStyle = particle.color
			context.lineWidth = Math.max(0.8, particle.size * 0.12)
			context.shadowColor = particle.color
			context.shadowBlur = particle.glow
			context.beginPath()
			context.moveTo(-particle.size, 0)
			context.lineTo(particle.size, 0)
			context.moveTo(0, -particle.size)
			context.lineTo(0, particle.size)
			context.stroke()
			context.shadowBlur = 0
			context.shadowColor = 'transparent'
			context.restore()
		}
		const updateParticle = (
			particle: Particle,
			delta: number,
			time: number,
		) => {
			if (time < particle.birthTime) {
				return
			}

			const sway =
				Math.sin(time * WINTER_SWAY_SPEED_X + particle.phase) * particle.sway
			const lift =
				Math.cos(time * WINTER_SWAY_SPEED_Y + particle.phase) *
				particle.sway *
				0.35

			particle.x += (particle.vx + sway) * delta
			particle.y += (particle.vy + lift) * delta
			particle.rotation += particle.rotationSpeed * delta

			if (
				particle.x < -WINTER_FIELD_MARGIN ||
				particle.x > width + WINTER_FIELD_MARGIN ||
				particle.y < -WINTER_FIELD_MARGIN ||
				particle.y > height + WINTER_FIELD_MARGIN
			) {
				respawnParticle(particle, time)
			}
		}
		const renderFrame = (time: number) => {
			if (hasCanceled) return
			const delta = Math.min(0.05, (time - lastTime) / 1000)
			lastTime = time

			context.clearRect(0, 0, width, height)
			for (const particle of particles) {
				updateParticle(particle, delta, time)
				drawParticle(particle, time)
			}

			animationFrameId = animationController.requestAnimationFrame(renderFrame)
		}
		const drawStaticFrame = () => {
			revealParticles(performance.now())
			context.clearRect(0, 0, width, height)
			for (const particle of particles) {
				drawParticle(particle, performance.now())
			}
		}
		const mountWinterSolstice = () => {
			if (hasCanceled) return

			style.setAttribute('data-winter-solstice', 'aurora')
			style.textContent = `
@keyframes winter-solstice-aurora-reveal {
	0% { opacity: 0; transform: translate3d(-2%, -3%, 0) scale(1.02); }
	100% { opacity: ${WINTER_AURORA_OPACITY}; transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes winter-solstice-aurora-drift {
	0% { transform: translate3d(0, 0, 0) scale(1); }
	50% { transform: translate3d(2%, -1.5%, 0) scale(1.02); }
	100% { transform: translate3d(0, 0, 0) scale(1); }
}
`

			overlay.setAttribute('aria-hidden', 'true')
			overlay.style.position = 'fixed'
			overlay.style.inset = '0'
			overlay.style.pointerEvents = 'none'
			overlay.style.zIndex = '0'
			overlay.style.mixBlendMode = 'screen'

			aurora.style.position = 'absolute'
			aurora.style.inset = '-15% -10% 0 -10%'
			aurora.style.background = WINTER_AURORA_GRADIENT
			aurora.style.opacity = shouldAnimate ? '0' : WINTER_AURORA_OPACITY
			aurora.style.filter = 'blur(24px)'
			aurora.style.willChange = 'opacity, transform'

			if (shouldAnimate) {
				aurora.style.animation =
					'winter-solstice-aurora-reveal 4.6s ease-out 0.8s forwards, winter-solstice-aurora-drift 18s ease-in-out infinite 4.6s'
			}

			overlay.appendChild(aurora)
			document.head.appendChild(style)
			document.body.appendChild(overlay)

			canvas.setAttribute('aria-hidden', 'true')
			canvas.style.position = 'fixed'
			canvas.style.inset = '0'
			canvas.style.pointerEvents = 'none'
			canvas.style.zIndex = '1'
			canvas.style.opacity = WINTER_FIELD_OPACITY
			canvas.style.filter = WINTER_FIELD_FILTER
			canvas.style.mixBlendMode = 'screen'

			document.body.appendChild(canvas)
			resizeCanvas()
			window.addEventListener('resize', resizeCanvas)

			if (shouldAnimate) {
				lastTime = performance.now()
				animationFrameId =
					animationController.requestAnimationFrame(renderFrame)
			} else {
				drawStaticFrame()
			}
		}

		timeoutId = window.setTimeout(mountWinterSolstice, WINTER_MOUNT_DELAY_MS)

		return () => {
			animationController.dispose()
			hasCanceled = true
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId)
			}
			if (animationFrameId !== null) {
				animationController.cancelAnimationFrame(animationFrameId)
			}
			window.removeEventListener('resize', resizeCanvas)
			if (document.body.contains(canvas)) {
				document.body.removeChild(canvas)
			}
			if (overlay.parentElement) {
				overlay.parentElement.removeChild(overlay)
			}
			if (style.parentElement) {
				style.parentElement.removeChild(style)
			}
		}
	} catch (error) {
		console.error('Failed to launch winter solstice', error)
		return () => {}
	}
}

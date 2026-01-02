import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'

const HALLOWEEN_MONTH = 9
const HALLOWEEN_DAY = 31
const HALLOWEEN_MOUNT_DELAY_MS = 900
const HALLOWEEN_FIELD_OPACITY = '0.7'
const HALLOWEEN_FIELD_FILTER = 'saturate(120%)'
const HALLOWEEN_FIELD_MAX_DPR = 2
const HALLOWEEN_FIELD_MARGIN = 160
const HALLOWEEN_PARTICLE_COUNT = 72
const HALLOWEEN_FADE_IN_DELAY_RANGE = { min: 0, max: 2200 }
const HALLOWEEN_FADE_IN_DURATION_RANGE = { min: 900, max: 1600 }
const HALLOWEEN_SCALE_RANGE = { min: 0.45, max: 0.85 }
const HALLOWEEN_SIZE_RANGE = { min: 18, max: 34 }
const HALLOWEEN_VELOCITY_X_RANGE = { min: -10, max: 10 }
const HALLOWEEN_VELOCITY_Y_RANGE = { min: -8, max: 9 }
const HALLOWEEN_SWAY_RANGE = { min: 2.5, max: 9 }
const HALLOWEEN_ROTATION_SPEED_RANGE = { min: -0.35, max: 0.35 }
const HALLOWEEN_SWAY_SPEED_X = 0.0006
const HALLOWEEN_SWAY_SPEED_Y = 0.0005
const HALLOWEEN_GLOW_RANGE = { min: 8, max: 18 }
const HALLOWEEN_GLOW_COLORS = [
	'rgba(251, 146, 60, 0.5)',
	'rgba(168, 85, 247, 0.45)',
	'rgba(248, 250, 252, 0.35)',
]
const HALLOWEEN_EMOJIS = ['🎃', '👻', '🦇', '💀', '🦴', '🕷️', '🕸️']
const HALLOWEEN_FONT =
	'"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
const HALLOWEEN_MOON_OPACITY = '0.45'

export const halloweenEvent: SeasonalEvent = {
	id: 'halloween',
	isActive: isHalloween,
	run: launchHalloweenSpirits,
	tileAccent: {
		colors: ['#f8fafc', '#e2e8f0', '#94a3b8', '#cbd5f5', '#f8fafc'],
	},
}

function isHalloween({ date }: SeasonalEventContext) {
	return date.getMonth() === HALLOWEEN_MONTH && date.getDate() === HALLOWEEN_DAY
}

async function launchHalloweenSpirits() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for halloween canvas')
		}

		type GhostParticle = {
			x: number
			y: number
			vx: number
			vy: number
			size: number
			rotation: number
			rotationSpeed: number
			opacity: number
			emoji: string
			glow: number
			glowColor: string
			phase: number
			sway: number
			birthTime: number
			fadeDuration: number
			scaleFrom: number
			hasSparkle: boolean
			sparklePhase: number
		}
		type EmojiSprite = {
			canvas: HTMLCanvasElement
			displaySize: number
		}

		let timeoutId: number | null = null
		let animationFrameId: number | null = null
		let hasCanceled = false
		let width = window.innerWidth
		let height = window.innerHeight
		let particles: GhostParticle[] = []
		let lastTime = performance.now()
		let overlay: HTMLDivElement | null = null
		let styleEl: HTMLStyleElement | null = null
		const spriteCache = new Map<string, EmojiSprite>()
		const spriteDpr = Math.min(
			window.devicePixelRatio || 1,
			HALLOWEEN_FIELD_MAX_DPR,
		)

		const randomEmoji = () =>
			HALLOWEEN_EMOJIS[Math.floor(Math.random() * HALLOWEEN_EMOJIS.length)]
		const randomGlow = () =>
			HALLOWEEN_GLOW_COLORS[
				Math.floor(Math.random() * HALLOWEEN_GLOW_COLORS.length)
			]
		const createParticle = (time: number): GhostParticle => ({
			x: randomInRange({
				min: -HALLOWEEN_FIELD_MARGIN,
				max: width + HALLOWEEN_FIELD_MARGIN,
			}),
			y: randomInRange({
				min: -HALLOWEEN_FIELD_MARGIN,
				max: height + HALLOWEEN_FIELD_MARGIN,
			}),
			vx: randomInRange(HALLOWEEN_VELOCITY_X_RANGE),
			vy: randomInRange(HALLOWEEN_VELOCITY_Y_RANGE),
			size: randomInRange(HALLOWEEN_SIZE_RANGE),
			rotation: randomInRange({ min: 0, max: Math.PI * 2 }),
			rotationSpeed: randomInRange(HALLOWEEN_ROTATION_SPEED_RANGE),
			opacity: randomInRange({ min: 0.45, max: 0.85 }),
			emoji: randomEmoji(),
			glow: randomInRange(HALLOWEEN_GLOW_RANGE),
			glowColor: randomGlow(),
			phase: randomInRange({ min: 0, max: Math.PI * 2 }),
			sway: randomInRange(HALLOWEEN_SWAY_RANGE),
			birthTime: time + randomInRange(HALLOWEEN_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(HALLOWEEN_FADE_IN_DURATION_RANGE),
			scaleFrom: randomInRange(HALLOWEEN_SCALE_RANGE),
			hasSparkle: Math.random() < 0.22,
			sparklePhase: randomInRange({ min: 0, max: Math.PI * 2 }),
		})
		const getSpriteKey = (
			emoji: string,
			size: number,
			glowColor: string,
			glow: number,
		) => {
			const quantizedSize = Math.max(12, Math.round(size / 2) * 2)
			const quantizedGlow = Math.max(6, Math.round(glow / 2) * 2)
			return `${emoji}-${quantizedSize}-${glowColor}-${quantizedGlow}-${spriteDpr}`
		}
		const getEmojiSprite = (
			emoji: string,
			size: number,
			glowColor: string,
			glow: number,
		): EmojiSprite => {
			const key = getSpriteKey(emoji, size, glowColor, glow)
			const cached = spriteCache.get(key)
			if (cached) {
				return cached
			}

			const quantizedSize = Math.max(12, Math.round(size / 2) * 2)
			const quantizedGlow = Math.max(6, Math.round(glow / 2) * 2)
			const padding = quantizedGlow * 2
			const displaySize = quantizedSize + padding * 2
			const spriteCanvas = document.createElement('canvas')
			spriteCanvas.width = Math.ceil(displaySize * spriteDpr)
			spriteCanvas.height = Math.ceil(displaySize * spriteDpr)

			const spriteContext = spriteCanvas.getContext('2d')
			if (!spriteContext) {
				return { canvas: spriteCanvas, displaySize }
			}

			spriteContext.setTransform(spriteDpr, 0, 0, spriteDpr, 0, 0)
			spriteContext.clearRect(0, 0, displaySize, displaySize)
			spriteContext.font = `${quantizedSize}px ${HALLOWEEN_FONT}`
			spriteContext.textAlign = 'center'
			spriteContext.textBaseline = 'middle'
			spriteContext.shadowColor = glowColor
			spriteContext.shadowBlur = quantizedGlow
			spriteContext.fillText(emoji, displaySize / 2, displaySize / 2)

			const sprite = { canvas: spriteCanvas, displaySize }
			spriteCache.set(key, sprite)
			return sprite
		}
		const resetParticles = (time: number) => {
			particles = Array.from({ length: HALLOWEEN_PARTICLE_COUNT }, () =>
				createParticle(time),
			)
		}
		const respawnParticle = (particle: GhostParticle, time: number) => {
			Object.assign(particle, createParticle(time))
		}
		const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)
		const resizeCanvas = () => {
			const dpr = Math.min(
				window.devicePixelRatio || 1,
				HALLOWEEN_FIELD_MAX_DPR,
			)
			const nextWidth = window.innerWidth
			const nextHeight = window.innerHeight
			const prevWidth = width
			const prevHeight = height
			width = nextWidth
			height = nextHeight

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
					particle.x < -HALLOWEEN_FIELD_MARGIN ||
					particle.x > width + HALLOWEEN_FIELD_MARGIN ||
					particle.y < -HALLOWEEN_FIELD_MARGIN ||
					particle.y > height + HALLOWEEN_FIELD_MARGIN
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
		const drawParticle = (particle: GhostParticle, time: number) => {
			const lifeProgress = (time - particle.birthTime) / particle.fadeDuration
			if (lifeProgress < 0) {
				return
			}

			const eased = easeOutCubic(Math.min(1, lifeProgress))
			const pulse =
				0.75 + Math.sin(time * 0.001 + particle.phase) * particle.sway * 0.04
			const scale = particle.scaleFrom + (1 - particle.scaleFrom) * eased

			context.save()
			context.translate(particle.x, particle.y)
			context.rotate(particle.rotation)
			context.scale(scale, scale)
			const baseAlpha = particle.opacity * eased * pulse
			if (particle.hasSparkle) {
				const sparklePulse =
					(Math.sin(time * 0.0018 + particle.sparklePhase) + 1) / 2
				const sparkleStrength = Math.max(0, sparklePulse - 0.7)
				if (sparkleStrength > 0) {
					const sparkleRadius = particle.size * (0.55 + sparkleStrength * 1.05)
					context.globalAlpha = baseAlpha * sparkleStrength * 0.55
					const sparkleGradient = context.createRadialGradient(
						0,
						0,
						0,
						0,
						0,
						sparkleRadius,
					)
					sparkleGradient.addColorStop(0, 'rgba(255, 244, 214, 0.7)')
					sparkleGradient.addColorStop(0.5, 'rgba(255, 244, 214, 0.18)')
					sparkleGradient.addColorStop(1, 'rgba(255, 244, 214, 0)')
					context.fillStyle = sparkleGradient
					context.shadowColor = 'rgba(255, 244, 214, 0.65)'
					context.shadowBlur = particle.glow * 2.6
					context.beginPath()
					context.arc(0, 0, sparkleRadius, 0, Math.PI * 2)
					context.fill()
					context.shadowBlur = 0
					context.shadowColor = 'transparent'
				}
			}

			context.globalAlpha = baseAlpha
			context.font = `${particle.size}px ${HALLOWEEN_FONT}`
			context.textAlign = 'center'
			context.textBaseline = 'middle'
			const sprite = getEmojiSprite(
				particle.emoji,
				particle.size,
				particle.glowColor,
				particle.glow,
			)
			const drawSize = sprite.displaySize * scale
			context.drawImage(
				sprite.canvas,
				-drawSize / 2,
				-drawSize / 2,
				drawSize,
				drawSize,
			)
			context.restore()
		}
		const updateParticle = (
			particle: GhostParticle,
			delta: number,
			time: number,
		) => {
			if (time < particle.birthTime) {
				return
			}

			const sway =
				Math.sin(time * HALLOWEEN_SWAY_SPEED_X + particle.phase) * particle.sway
			const lift =
				Math.cos(time * HALLOWEEN_SWAY_SPEED_Y + particle.phase) *
				particle.sway *
				0.4

			particle.x += (particle.vx + sway) * delta
			particle.y += (particle.vy + lift) * delta
			particle.rotation += particle.rotationSpeed * delta

			if (
				particle.x < -HALLOWEEN_FIELD_MARGIN ||
				particle.x > width + HALLOWEEN_FIELD_MARGIN ||
				particle.y < -HALLOWEEN_FIELD_MARGIN ||
				particle.y > height + HALLOWEEN_FIELD_MARGIN
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

			animationFrameId = window.requestAnimationFrame(renderFrame)
		}
		const drawStaticFrame = () => {
			revealParticles(performance.now())
			context.clearRect(0, 0, width, height)
			for (const particle of particles) {
				drawParticle(particle, performance.now())
			}
		}

		const mountSpirits = () => {
			if (hasCanceled) return
			const style = document.createElement('style')
			const overlayNode = document.createElement('div')
			const moon = document.createElement('div')

			style.setAttribute('data-halloween', 'overlay')
			style.textContent = `
@keyframes halloween-moon-reveal {
	0% { opacity: 0; transform: translate(0, 0) scale(0.96); }
	100% { opacity: ${HALLOWEEN_MOON_OPACITY}; transform: translate(0, 0) scale(1); }
}
`

			overlayNode.setAttribute('aria-hidden', 'true')
			overlayNode.style.position = 'fixed'
			overlayNode.style.inset = '0'
			overlayNode.style.pointerEvents = 'none'
			overlayNode.style.zIndex = '0'
			overlayNode.style.mixBlendMode = 'screen'

			moon.style.position = 'absolute'
			moon.style.inset = '-35% 0 0 -35%'
			moon.style.opacity = shouldAnimate ? '0' : HALLOWEEN_MOON_OPACITY
			moon.style.background =
				'radial-gradient(circle at 30% 30%, rgba(226, 232, 240, 0.38), rgba(226, 232, 240, 0.12) 35%, rgba(226, 232, 240, 0) 70%)'
			moon.style.filter = 'blur(18px)'

			if (shouldAnimate) {
				moon.style.animation =
					'halloween-moon-reveal 4.2s ease-out 0.8s forwards'
			}

			overlayNode.appendChild(moon)
			document.head.appendChild(style)
			document.body.appendChild(overlayNode)
			overlay = overlayNode
			styleEl = style

			canvas.setAttribute('aria-hidden', 'true')
			canvas.style.position = 'fixed'
			canvas.style.inset = '0'
			canvas.style.pointerEvents = 'none'
			canvas.style.zIndex = '1'
			canvas.style.opacity = HALLOWEEN_FIELD_OPACITY
			canvas.style.filter = HALLOWEEN_FIELD_FILTER
			canvas.style.mixBlendMode = 'screen'

			document.body.appendChild(canvas)
			resizeCanvas()
			window.addEventListener('resize', resizeCanvas)

			if (shouldAnimate) {
				lastTime = performance.now()
				animationFrameId = window.requestAnimationFrame(renderFrame)
			} else {
				drawStaticFrame()
			}
		}

		timeoutId = window.setTimeout(mountSpirits, HALLOWEEN_MOUNT_DELAY_MS)

		return () => {
			hasCanceled = true
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId)
			}
			if (animationFrameId !== null) {
				window.cancelAnimationFrame(animationFrameId)
			}
			window.removeEventListener('resize', resizeCanvas)
			if (document.body.contains(canvas)) {
				document.body.removeChild(canvas)
			}
			if (overlay && overlay.parentElement) {
				overlay.parentElement.removeChild(overlay)
			}
			if (styleEl && styleEl.parentElement) {
				styleEl.parentElement.removeChild(styleEl)
			}
		}
	} catch (error) {
		console.error('Failed to launch halloween spirits', error)
		return () => {}
	}
}

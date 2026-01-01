import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'

const AUTUMN_EQUINOX_DATES_NORTHERN = new Set([
	'2026-09-23',
	'2027-09-23',
	'2028-09-22',
	'2029-09-23',
	'2030-09-23',
	'2031-09-23',
	'2032-09-22',
	'2033-09-23',
	'2034-09-23',
	'2035-09-23',
	'2036-09-22',
	'2037-09-22',
	'2038-09-23',
	'2039-09-23',
	'2040-09-22',
	'2041-09-22',
	'2042-09-22',
	'2043-09-23',
])
const AUTUMN_EQUINOX_DATES_SOUTHERN = new Set([
	'2026-03-20',
	'2027-03-20',
	'2028-03-20',
	'2029-03-20',
	'2030-03-20',
	'2031-03-20',
	'2032-03-20',
	'2033-03-20',
	'2034-03-20',
	'2035-03-20',
	'2036-03-20',
	'2037-03-20',
	'2038-03-20',
	'2039-03-20',
	'2040-03-20',
	'2041-03-20',
	'2042-03-20',
	'2043-03-20',
])
const AUTUMN_MOUNT_DELAY_MS = 900
const AUTUMN_FIELD_OPACITY = '0.65'
const AUTUMN_FIELD_FILTER = 'saturate(120%)'
const AUTUMN_FIELD_MAX_DPR = 2
const AUTUMN_FIELD_MARGIN = 160
const AUTUMN_PARTICLE_COUNT = 62
const AUTUMN_FADE_IN_DELAY_RANGE = { min: 0, max: 2400 }
const AUTUMN_FADE_IN_DURATION_RANGE = { min: 1100, max: 2000 }
const AUTUMN_SCALE_RANGE = { min: 0.55, max: 0.95 }
const AUTUMN_SIZE_RANGE = { min: 18, max: 34 }
const AUTUMN_VELOCITY_X_RANGE = { min: -12, max: 12 }
const AUTUMN_VELOCITY_Y_RANGE = { min: 9, max: 20 }
const AUTUMN_SWAY_RANGE = { min: 3, max: 10 }
const AUTUMN_ROTATION_SPEED_RANGE = { min: -0.45, max: 0.45 }
const AUTUMN_SWAY_SPEED_X = 0.00055
const AUTUMN_SWAY_SPEED_Y = 0.00045
const AUTUMN_GLOW_RANGE = { min: 10, max: 20 }
const AUTUMN_EMOJIS = ['🍁', '🍂']
const AUTUMN_FONT =
	'"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
const AUTUMN_SPAWN_Y_MAX_RATIO = 0.7
const AUTUMN_HAZE_OPACITY = '0.5'
const AUTUMN_HAZE_GRADIENT =
	'radial-gradient(120% 85% at 18% 0%, rgba(251, 191, 36, 0.38), rgba(251, 146, 60, 0.18) 45%, rgba(15, 23, 42, 0) 75%), radial-gradient(80% 70% at 78% 20%, rgba(249, 115, 22, 0.28), rgba(15, 23, 42, 0) 70%)'
const AUTUMN_GLOW_COLORS = [
	'rgba(251, 191, 36, 0.5)',
	'rgba(248, 113, 113, 0.45)',
	'rgba(245, 158, 11, 0.42)',
	'rgba(248, 250, 252, 0.25)',
]

export const autumnEquinoxEvent: SeasonalEvent = {
	id: 'autumn-equinox',
	isActive: isAutumnEquinox,
	run: launchAutumnEquinoxLeaves,
	tileAccent: {
		colors: ['#fed7aa', '#f97316', '#fb7185', '#facc15', '#fed7aa'],
	},
}

function isAutumnEquinox({ date, hemisphere }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const equinoxDates =
		hemisphere === 'southern'
			? AUTUMN_EQUINOX_DATES_SOUTHERN
			: AUTUMN_EQUINOX_DATES_NORTHERN
	return equinoxDates.has(`${year}-${month}-${day}`)
}

async function launchAutumnEquinoxLeaves() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const style = document.createElement('style')
		const overlay = document.createElement('div')
		const haze = document.createElement('div')
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for autumn equinox canvas')
		}

		type LeafParticle = {
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
		let particles: LeafParticle[] = []
		let lastTime = performance.now()
		const spriteCache = new Map<string, EmojiSprite>()
		const spriteDpr = Math.min(
			window.devicePixelRatio || 1,
			AUTUMN_FIELD_MAX_DPR,
		)

		const randomEmoji = () =>
			AUTUMN_EMOJIS[Math.floor(Math.random() * AUTUMN_EMOJIS.length)]
		const randomGlow = () =>
			AUTUMN_GLOW_COLORS[Math.floor(Math.random() * AUTUMN_GLOW_COLORS.length)]
		const createParticle = (time: number): LeafParticle => ({
			x: randomInRange({
				min: -AUTUMN_FIELD_MARGIN,
				max: width + AUTUMN_FIELD_MARGIN,
			}),
			y: randomInRange({
				min: -AUTUMN_FIELD_MARGIN,
				max: height * AUTUMN_SPAWN_Y_MAX_RATIO,
			}),
			vx: randomInRange(AUTUMN_VELOCITY_X_RANGE),
			vy: randomInRange(AUTUMN_VELOCITY_Y_RANGE),
			size: randomInRange(AUTUMN_SIZE_RANGE),
			rotation: randomInRange({ min: 0, max: Math.PI * 2 }),
			rotationSpeed: randomInRange(AUTUMN_ROTATION_SPEED_RANGE),
			opacity: randomInRange({ min: 0.45, max: 0.8 }),
			emoji: randomEmoji(),
			glow: randomInRange(AUTUMN_GLOW_RANGE),
			glowColor: randomGlow(),
			phase: randomInRange({ min: 0, max: Math.PI * 2 }),
			sway: randomInRange(AUTUMN_SWAY_RANGE),
			birthTime: time + randomInRange(AUTUMN_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(AUTUMN_FADE_IN_DURATION_RANGE),
			scaleFrom: randomInRange(AUTUMN_SCALE_RANGE),
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
			spriteContext.font = `${quantizedSize}px ${AUTUMN_FONT}`
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
			particles = Array.from({ length: AUTUMN_PARTICLE_COUNT }, () =>
				createParticle(time),
			)
		}
		const respawnParticle = (particle: LeafParticle, time: number) => {
			Object.assign(particle, createParticle(time))
		}
		const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)
		const resizeCanvas = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, AUTUMN_FIELD_MAX_DPR)
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
					particle.x < -AUTUMN_FIELD_MARGIN ||
					particle.x > width + AUTUMN_FIELD_MARGIN ||
					particle.y > height + AUTUMN_FIELD_MARGIN
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
		const drawParticle = (particle: LeafParticle, time: number) => {
			const lifeProgress = (time - particle.birthTime) / particle.fadeDuration
			if (lifeProgress < 0) {
				return
			}

			const eased = easeOutCubic(Math.min(1, lifeProgress))
			const pulse =
				0.85 + Math.sin(time * 0.001 + particle.phase) * particle.sway * 0.03
			const scale = particle.scaleFrom + (1 - particle.scaleFrom) * eased

			context.save()
			context.translate(particle.x, particle.y)
			context.rotate(particle.rotation)
			context.scale(scale, scale)
			context.globalAlpha = particle.opacity * eased * pulse
			context.font = `${particle.size}px ${AUTUMN_FONT}`
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
			particle: LeafParticle,
			delta: number,
			time: number,
		) => {
			if (time < particle.birthTime) {
				return
			}

			const sway =
				Math.sin(time * AUTUMN_SWAY_SPEED_X + particle.phase) * particle.sway
			const lift =
				Math.cos(time * AUTUMN_SWAY_SPEED_Y + particle.phase) *
				particle.sway *
				0.35

			particle.x += (particle.vx + sway) * delta
			particle.y += (particle.vy + lift) * delta
			particle.rotation += particle.rotationSpeed * delta

			if (
				particle.x < -AUTUMN_FIELD_MARGIN ||
				particle.x > width + AUTUMN_FIELD_MARGIN ||
				particle.y > height + AUTUMN_FIELD_MARGIN
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
		const mountLeaves = () => {
			if (hasCanceled) return

			style.setAttribute('data-autumn-equinox', 'haze')
			style.textContent = `
@keyframes autumn-equinox-haze-reveal {
	0% { opacity: 0; transform: translate3d(-2%, -2%, 0) scale(1.02); }
	100% { opacity: ${AUTUMN_HAZE_OPACITY}; transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes autumn-equinox-haze-drift {
	0% { transform: translate3d(0, 0, 0) scale(1); }
	50% { transform: translate3d(1.5%, -1%, 0) scale(1.02); }
	100% { transform: translate3d(0, 0, 0) scale(1); }
}
`

			overlay.setAttribute('aria-hidden', 'true')
			overlay.style.position = 'fixed'
			overlay.style.inset = '0'
			overlay.style.pointerEvents = 'none'
			overlay.style.zIndex = '0'
			overlay.style.mixBlendMode = 'screen'

			haze.style.position = 'absolute'
			haze.style.inset = '-20% -10% 0 -10%'
			haze.style.background = AUTUMN_HAZE_GRADIENT
			haze.style.opacity = shouldAnimate ? '0' : AUTUMN_HAZE_OPACITY
			haze.style.filter = 'blur(26px)'
			haze.style.willChange = 'opacity, transform'

			if (shouldAnimate) {
				haze.style.animation =
					'autumn-equinox-haze-reveal 4.2s ease-out 0.8s forwards, autumn-equinox-haze-drift 20s ease-in-out infinite 4.2s'
			}

			overlay.appendChild(haze)
			document.head.appendChild(style)
			document.body.appendChild(overlay)

			canvas.setAttribute('aria-hidden', 'true')
			canvas.style.position = 'fixed'
			canvas.style.inset = '0'
			canvas.style.pointerEvents = 'none'
			canvas.style.zIndex = '1'
			canvas.style.opacity = AUTUMN_FIELD_OPACITY
			canvas.style.filter = AUTUMN_FIELD_FILTER
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

		timeoutId = window.setTimeout(mountLeaves, AUTUMN_MOUNT_DELAY_MS)

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
			if (overlay.parentElement) {
				overlay.parentElement.removeChild(overlay)
			}
			if (style.parentElement) {
				style.parentElement.removeChild(style)
			}
		}
	} catch (error) {
		console.error('Failed to launch autumn equinox leaves', error)
		return () => {}
	}
}

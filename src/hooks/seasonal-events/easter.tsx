import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'

const EASTER_MOUNT_DELAY_MS = 900
const EASTER_FIELD_OPACITY = '0.72'
const EASTER_FIELD_FILTER = 'saturate(135%)'
const EASTER_FIELD_MAX_DPR = 2
const EASTER_FIELD_MARGIN = 160
const EASTER_PARTICLE_COUNT = 70
const EASTER_FADE_IN_DELAY_RANGE = { min: 0, max: 2200 }
const EASTER_FADE_IN_DURATION_RANGE = { min: 1000, max: 1900 }
const EASTER_SCALE_RANGE = { min: 0.45, max: 0.85 }
const EASTER_SIZE_RANGE = { min: 16, max: 30 }
const EASTER_VELOCITY_X_RANGE = { min: -8, max: 8 }
const EASTER_VELOCITY_Y_RANGE = { min: -7, max: 6 }
const EASTER_SWAY_RANGE = { min: 2.5, max: 8 }
const EASTER_ROTATION_SPEED_RANGE = { min: -0.35, max: 0.35 }
const EASTER_SWAY_SPEED_X = 0.00055
const EASTER_SWAY_SPEED_Y = 0.00045
const EASTER_GLOW_RANGE = { min: 6, max: 16 }
const EASTER_GLOW_COLORS = [
	'rgba(244, 114, 182, 0.45)',
	'rgba(167, 139, 250, 0.4)',
	'rgba(147, 197, 253, 0.4)',
]
const EASTER_EMOJIS = ['🥚', '🐣', '🐰', '🌷', '🌼', '🌸']
const EASTER_FONT =
	'"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
const EASTER_HALO_OPACITY = '0.5'

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Easter centres on themes of renewal and, in Christian tradition, the
				resurrection of Jesus.
			</Trans>
		</p>
		<p>
			<Trans>
				It is a movable feast, its date determined by the cycle of the moon and
				the arrival of spring in the northern hemisphere.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				From its earliest observances, Christian calendars aligned Easter with
				the spring season and the full moon following the equinox.
			</Trans>
		</p>
		<p>
			<Trans>
				Across many cultures, older symbols of rebirth — such as eggs, blossoms,
				and new growth — became woven into the celebration.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				Sunrise services, fresh mornings, and the simple delight of egg hunts
				carry the feeling of a world beginning again.
			</Trans>
		</p>
		<p>
			<Trans>
				It is a holiday that speaks gently in the language of new beginnings.
			</Trans>
		</p>
	</>
)

export const easterEvent: SeasonalEvent = {
	id: 'easter',
	isActive: isEaster,
	run: launchEaster,
	details: EventDetails,
	tileAccent: {
		colors: ['#fce7f3', '#fbcfe8', '#a5b4fc', '#93c5fd', '#fce7f3'],
	},
}

function isEaster({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const easterDate = getWesternEasterDate(year)
	if (!easterDate) {
		return false
	}

	return (
		date.getMonth() === easterDate.month && date.getDate() === easterDate.day
	)
}

function getWesternEasterDate(
	year: number,
): { month: number; day: number } | null {
	if (!Number.isFinite(year)) {
		return null
	}

	const a = year % 19
	const b = Math.floor(year / 100)
	const c = year % 100
	const d = Math.floor(b / 4)
	const e = b % 4
	const f = Math.floor((b + 8) / 25)
	const g = Math.floor((b - f + 1) / 3)
	const h = (19 * a + b - d - g + 15) % 30
	const i = Math.floor(c / 4)
	const k = c % 4
	const l = (32 + 2 * e + 2 * i - h - k) % 7
	const m = Math.floor((a + 11 * h + 22 * l) / 451)
	const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
	const day = ((h + l - 7 * m + 114) % 31) + 1

	if (month < 0 || month > 11) {
		return null
	}

	return { month, day }
}

async function launchEaster() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for easter canvas')
		}

		type EasterParticle = {
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
		let particles: EasterParticle[] = []
		let lastTime = performance.now()
		let overlay: HTMLDivElement | null = null
		let styleEl: HTMLStyleElement | null = null
		const spriteCache = new Map<string, EmojiSprite>()
		const spriteDpr = Math.min(
			window.devicePixelRatio || 1,
			EASTER_FIELD_MAX_DPR,
		)

		const randomEmoji = () =>
			EASTER_EMOJIS[Math.floor(Math.random() * EASTER_EMOJIS.length)]
		const randomGlow = () =>
			EASTER_GLOW_COLORS[Math.floor(Math.random() * EASTER_GLOW_COLORS.length)]
		const createParticle = (time: number): EasterParticle => ({
			x: randomInRange({
				min: -EASTER_FIELD_MARGIN,
				max: width + EASTER_FIELD_MARGIN,
			}),
			y: randomInRange({
				min: -EASTER_FIELD_MARGIN,
				max: height + EASTER_FIELD_MARGIN,
			}),
			vx: randomInRange(EASTER_VELOCITY_X_RANGE),
			vy: randomInRange(EASTER_VELOCITY_Y_RANGE),
			size: randomInRange(EASTER_SIZE_RANGE),
			rotation: randomInRange({ min: 0, max: Math.PI * 2 }),
			rotationSpeed: randomInRange(EASTER_ROTATION_SPEED_RANGE),
			opacity: randomInRange({ min: 0.45, max: 0.85 }),
			emoji: randomEmoji(),
			glow: randomInRange(EASTER_GLOW_RANGE),
			glowColor: randomGlow(),
			phase: randomInRange({ min: 0, max: Math.PI * 2 }),
			sway: randomInRange(EASTER_SWAY_RANGE),
			birthTime: time + randomInRange(EASTER_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(EASTER_FADE_IN_DURATION_RANGE),
			scaleFrom: randomInRange(EASTER_SCALE_RANGE),
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

			spriteContext.scale(spriteDpr, spriteDpr)
			spriteContext.font = `${quantizedSize}px ${EASTER_FONT}`
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
			particles = Array.from({ length: EASTER_PARTICLE_COUNT }, () =>
				createParticle(time),
			)
		}
		const respawnParticle = (particle: EasterParticle, time: number) => {
			Object.assign(particle, createParticle(time))
		}
		const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)
		const revealParticles = (time: number) => {
			for (const particle of particles) {
				particle.birthTime = time - particle.fadeDuration
			}
		}
		const resizeCanvas = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, EASTER_FIELD_MAX_DPR)
			width = window.innerWidth
			height = window.innerHeight
			canvas.width = Math.round(width * dpr)
			canvas.height = Math.round(height * dpr)
			canvas.style.width = `${width}px`
			canvas.style.height = `${height}px`
			context.setTransform(dpr, 0, 0, dpr, 0, 0)
		}
		const drawParticle = (particle: EasterParticle, time: number) => {
			const lifeProgress = (time - particle.birthTime) / particle.fadeDuration
			if (lifeProgress < 0) {
				return
			}

			const eased = easeOutCubic(Math.min(1, lifeProgress))
			const scale = particle.scaleFrom + (1 - particle.scaleFrom) * eased
			const alpha = particle.opacity * eased
			const twinkle = 1 + Math.sin(time * 0.004 + particle.sparklePhase) * 0.08
			const sprite = getEmojiSprite(
				particle.emoji,
				particle.size * scale,
				particle.glowColor,
				particle.glow,
			)

			context.save()
			context.globalAlpha = alpha * (particle.hasSparkle ? twinkle : 1)
			context.translate(particle.x, particle.y)
			context.rotate(particle.rotation)
			context.drawImage(
				sprite.canvas,
				-sprite.displaySize / 2,
				-sprite.displaySize / 2,
				sprite.displaySize,
				sprite.displaySize,
			)
			context.restore()
		}
		const updateParticle = (
			particle: EasterParticle,
			delta: number,
			time: number,
		) => {
			if (time < particle.birthTime) {
				return
			}

			const sway =
				Math.sin(time * EASTER_SWAY_SPEED_X + particle.phase) * particle.sway
			const lift =
				Math.cos(time * EASTER_SWAY_SPEED_Y + particle.phase) *
				particle.sway *
				0.4

			particle.x += (particle.vx + sway) * delta
			particle.y += (particle.vy + lift) * delta
			particle.rotation += particle.rotationSpeed * delta

			if (
				particle.x < -EASTER_FIELD_MARGIN ||
				particle.x > width + EASTER_FIELD_MARGIN ||
				particle.y < -EASTER_FIELD_MARGIN ||
				particle.y > height + EASTER_FIELD_MARGIN
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

		const mountEaster = () => {
			if (hasCanceled) return
			const style = document.createElement('style')
			const overlayNode = document.createElement('div')
			const halo = document.createElement('div')

			style.setAttribute('data-easter', 'overlay')
			style.textContent = `
@keyframes easter-halo-reveal {
	0% { opacity: 0; transform: translate(0, 0) scale(0.96); }
	100% { opacity: ${EASTER_HALO_OPACITY}; transform: translate(0, 0) scale(1); }
}
`

			overlayNode.setAttribute('aria-hidden', 'true')
			overlayNode.style.position = 'fixed'
			overlayNode.style.inset = '0'
			overlayNode.style.pointerEvents = 'none'
			overlayNode.style.zIndex = '0'
			overlayNode.style.mixBlendMode = 'screen'

			halo.style.position = 'absolute'
			halo.style.inset = '-30% 0 0 -30%'
			halo.style.opacity = shouldAnimate ? '0' : EASTER_HALO_OPACITY
			halo.style.background =
				'radial-gradient(circle at 30% 30%, rgba(248, 113, 113, 0.28), rgba(244, 114, 182, 0.2) 35%, rgba(226, 232, 240, 0) 70%)'
			halo.style.filter = 'blur(22px)'

			if (shouldAnimate) {
				halo.style.animation = 'easter-halo-reveal 4s ease-out 0.8s forwards'
			}

			overlayNode.appendChild(halo)
			document.head.appendChild(style)
			document.body.appendChild(overlayNode)
			overlay = overlayNode
			styleEl = style

			canvas.setAttribute('aria-hidden', 'true')
			canvas.style.position = 'fixed'
			canvas.style.inset = '0'
			canvas.style.pointerEvents = 'none'
			canvas.style.zIndex = '1'
			canvas.style.opacity = EASTER_FIELD_OPACITY
			canvas.style.filter = EASTER_FIELD_FILTER
			canvas.style.mixBlendMode = 'screen'

			document.body.appendChild(canvas)
			resizeCanvas()
			resetParticles(performance.now())
			window.addEventListener('resize', resizeCanvas)

			if (shouldAnimate) {
				lastTime = performance.now()
				animationFrameId = window.requestAnimationFrame(renderFrame)
			} else {
				drawStaticFrame()
			}
		}

		timeoutId = window.setTimeout(mountEaster, EASTER_MOUNT_DELAY_MS)

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
		console.error('Failed to launch easter event', error)
		return () => {}
	}
}

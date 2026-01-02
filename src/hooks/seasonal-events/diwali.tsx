import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'

const DIWALI_DATES = new Set([
	'2026-11-08',
	'2027-10-29',
	'2028-10-17',
	'2029-11-05',
	'2030-10-26',
	'2031-11-14',
	'2032-11-02',
	'2033-10-22',
	'2034-11-10',
	'2035-10-30',
	'2036-10-19',
	'2037-11-07',
	'2038-10-27',
	'2039-10-17',
	'2040-11-04',
	'2041-10-25',
	'2042-11-12',
	'2043-11-01',
])
const DIWALI_MOUNT_DELAY_MS = 900
const DIWALI_FIELD_OPACITY = '0.7'
const DIWALI_FIELD_FILTER = 'saturate(130%)'
const DIWALI_FIELD_MAX_DPR = 2
const DIWALI_FIELD_MARGIN = 150
const DIWALI_PARTICLE_COUNT = 54
const DIWALI_FADE_IN_DELAY_RANGE = { min: 0, max: 2200 }
const DIWALI_FADE_IN_DURATION_RANGE = { min: 1100, max: 1900 }
const DIWALI_SCALE_RANGE = { min: 0.55, max: 0.95 }
const DIWALI_SIZE_RANGE = { min: 18, max: 32 }
const DIWALI_VELOCITY_X_RANGE = { min: -7, max: 7 }
const DIWALI_VELOCITY_Y_RANGE = { min: -4, max: 6 }
const DIWALI_SWAY_RANGE = { min: 2.5, max: 9 }
const DIWALI_ROTATION_SPEED_RANGE = { min: -0.28, max: 0.28 }
const DIWALI_SWAY_SPEED_X = 0.00055
const DIWALI_SWAY_SPEED_Y = 0.0005
const DIWALI_GLOW_RANGE = { min: 10, max: 20 }
const DIWALI_EMOJIS = ['🪔', '✨']
const DIWALI_FONT =
	'"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
const DIWALI_HAZE_OPACITY = '0.6'
const DIWALI_HAZE_GRADIENT =
	'radial-gradient(120% 90% at 18% 70%, rgba(251, 191, 36, 0.4), rgba(249, 115, 22, 0.2) 50%, rgba(15, 23, 42, 0) 80%), radial-gradient(85% 70% at 85% 25%, rgba(244, 114, 182, 0.22), rgba(15, 23, 42, 0) 70%)'
const DIWALI_GLOW_COLORS = [
	'rgba(251, 191, 36, 0.6)',
	'rgba(249, 115, 22, 0.52)',
	'rgba(244, 114, 182, 0.4)',
	'rgba(248, 250, 252, 0.25)',
]

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Diwali is the festival of lights, celebrating renewal, hope, and the
				enduring triumph of light over darkness.
			</Trans>
		</p>
		<p>
			<Trans>
				It is observed by millions across India and by communities around the
				world.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				For many Hindus, the festival marks the return of Rama, Sita, Lakshmana,
				and Hanuman to Ayodhya after their long exile.
			</Trans>
		</p>
		<p>
			<Trans>
				Other traditions honour Lakshmi, the goddess of prosperity and fortune,
				while Jain and Sikh communities observe Diwali through their own sacred
				histories.
			</Trans>
		</p>

		<h2>
			<Trans>Symbols and rituals</Trans>
		</h2>
		<p>
			<Trans>
				Diyas and candles glow along doorways and windows, while rangoli
				patterns bloom across thresholds in colour and light.
			</Trans>
		</p>
		<p>
			<Trans>
				Families exchange sweets and gifts, clean and decorate their homes, and
				offer prayers for health, prosperity, and a bright year ahead.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				At night, lights trace warm constellations across homes and streets,
				turning whole cities into living lanterns.
			</Trans>
		</p>
		<p>
			<Trans>
				The air hums with music, laughter, and the quiet shimmer of celebration.
			</Trans>
		</p>
	</>
)

export const diwaliEvent: SeasonalEvent = {
	id: 'diwali',
	isActive: isDiwali,
	run: launchDiwaliLights,
	details: EventDetails,
	tileAccent: {
		colors: ['#fde68a', '#f59e0b', '#fb7185', '#f97316', '#fde68a'],
	},
}

function isDiwali({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return DIWALI_DATES.has(`${year}-${month}-${day}`)
}

async function launchDiwaliLights() {
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
			throw new Error('Unable to create 2D context for Diwali canvas')
		}

		type LightParticle = {
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
		let particles: LightParticle[] = []
		let lastTime = performance.now()
		const spriteCache = new Map<string, EmojiSprite>()
		const spriteDpr = Math.min(
			window.devicePixelRatio || 1,
			DIWALI_FIELD_MAX_DPR,
		)

		const randomEmoji = () =>
			DIWALI_EMOJIS[Math.floor(Math.random() * DIWALI_EMOJIS.length)]
		const randomGlow = () =>
			DIWALI_GLOW_COLORS[Math.floor(Math.random() * DIWALI_GLOW_COLORS.length)]
		const createParticle = (time: number): LightParticle => ({
			x: randomInRange({
				min: -DIWALI_FIELD_MARGIN,
				max: width + DIWALI_FIELD_MARGIN,
			}),
			y: randomInRange({
				min: -DIWALI_FIELD_MARGIN,
				max: height + DIWALI_FIELD_MARGIN,
			}),
			vx: randomInRange(DIWALI_VELOCITY_X_RANGE),
			vy: randomInRange(DIWALI_VELOCITY_Y_RANGE),
			size: randomInRange(DIWALI_SIZE_RANGE),
			rotation: randomInRange({ min: 0, max: Math.PI * 2 }),
			rotationSpeed: randomInRange(DIWALI_ROTATION_SPEED_RANGE),
			opacity: randomInRange({ min: 0.45, max: 0.8 }),
			emoji: randomEmoji(),
			glow: randomInRange(DIWALI_GLOW_RANGE),
			glowColor: randomGlow(),
			phase: randomInRange({ min: 0, max: Math.PI * 2 }),
			sway: randomInRange(DIWALI_SWAY_RANGE),
			birthTime: time + randomInRange(DIWALI_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(DIWALI_FADE_IN_DURATION_RANGE),
			scaleFrom: randomInRange(DIWALI_SCALE_RANGE),
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
			spriteContext.font = `${quantizedSize}px ${DIWALI_FONT}`
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
			particles = Array.from({ length: DIWALI_PARTICLE_COUNT }, () =>
				createParticle(time),
			)
		}
		const respawnParticle = (particle: LightParticle, time: number) => {
			Object.assign(particle, createParticle(time))
		}
		const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)
		const resizeCanvas = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, DIWALI_FIELD_MAX_DPR)
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
					particle.x < -DIWALI_FIELD_MARGIN ||
					particle.x > width + DIWALI_FIELD_MARGIN ||
					particle.y < -DIWALI_FIELD_MARGIN ||
					particle.y > height + DIWALI_FIELD_MARGIN
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
		const drawParticle = (particle: LightParticle, time: number) => {
			const lifeProgress = (time - particle.birthTime) / particle.fadeDuration
			if (lifeProgress < 0) {
				return
			}

			const eased = easeOutCubic(Math.min(1, lifeProgress))
			const pulse =
				0.8 + Math.sin(time * 0.001 + particle.phase) * particle.sway * 0.03
			const scale = particle.scaleFrom + (1 - particle.scaleFrom) * eased

			context.save()
			context.translate(particle.x, particle.y)
			context.rotate(particle.rotation)
			context.scale(scale, scale)
			context.globalAlpha = particle.opacity * eased * pulse
			context.font = `${particle.size}px ${DIWALI_FONT}`
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
			particle: LightParticle,
			delta: number,
			time: number,
		) => {
			if (time < particle.birthTime) {
				return
			}

			const sway =
				Math.sin(time * DIWALI_SWAY_SPEED_X + particle.phase) * particle.sway
			const lift =
				Math.cos(time * DIWALI_SWAY_SPEED_Y + particle.phase) *
				particle.sway *
				0.35

			particle.x += (particle.vx + sway) * delta
			particle.y += (particle.vy + lift) * delta
			particle.rotation += particle.rotationSpeed * delta

			if (
				particle.x < -DIWALI_FIELD_MARGIN ||
				particle.x > width + DIWALI_FIELD_MARGIN ||
				particle.y < -DIWALI_FIELD_MARGIN ||
				particle.y > height + DIWALI_FIELD_MARGIN
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
		const mountLights = () => {
			if (hasCanceled) return

			style.setAttribute('data-diwali', 'haze')
			style.textContent = `
@keyframes diwali-haze-reveal {
	0% { opacity: 0; transform: translate3d(-2%, 2%, 0) scale(1.02); }
	100% { opacity: ${DIWALI_HAZE_OPACITY}; transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes diwali-haze-drift {
	0% { transform: translate3d(0, 0, 0) scale(1); }
	50% { transform: translate3d(1.5%, -1.5%, 0) scale(1.02); }
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
			haze.style.background = DIWALI_HAZE_GRADIENT
			haze.style.opacity = shouldAnimate ? '0' : DIWALI_HAZE_OPACITY
			haze.style.filter = 'blur(24px)'
			haze.style.willChange = 'opacity, transform'

			if (shouldAnimate) {
				haze.style.animation =
					'diwali-haze-reveal 4.2s ease-out 0.9s forwards, diwali-haze-drift 20s ease-in-out infinite 4.2s'
			}

			overlay.appendChild(haze)
			document.head.appendChild(style)
			document.body.appendChild(overlay)

			canvas.setAttribute('aria-hidden', 'true')
			canvas.style.position = 'fixed'
			canvas.style.inset = '0'
			canvas.style.pointerEvents = 'none'
			canvas.style.zIndex = '1'
			canvas.style.opacity = DIWALI_FIELD_OPACITY
			canvas.style.filter = DIWALI_FIELD_FILTER
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

		timeoutId = window.setTimeout(mountLights, DIWALI_MOUNT_DELAY_MS)

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
		console.error('Failed to launch Diwali lights', error)
		return () => {}
	}
}

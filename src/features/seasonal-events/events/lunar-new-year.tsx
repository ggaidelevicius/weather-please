import { Trans } from '@lingui/react/macro'

import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'
import {
	type SeasonalEvent,
	type SeasonalEventContext,
	SeasonalEventId,
} from '../core/types'
import { getCanvasDpr, randomInRange } from '../core/utils'

const LUNAR_NEW_YEAR_DATES = new Set([
	'2026-02-17',
	'2027-02-06',
	'2028-01-26',
	'2029-02-13',
	'2030-02-03',
	'2031-01-23',
	'2032-02-11',
	'2033-01-31',
	'2034-02-19',
	'2035-02-08',
	'2036-01-28',
	'2037-02-15',
	'2038-02-04',
	'2039-01-24',
	'2040-02-12',
	'2041-02-01',
	'2042-01-22',
	'2043-02-10',
])
const LUNAR_MOUNT_DELAY_MS = 900
const LUNAR_FIELD_OPACITY = '0.75'
const LUNAR_FIELD_FILTER = 'saturate(135%)'
const LUNAR_FIELD_MAX_DPR = 2
const LUNAR_FIELD_MARGIN = 160
const LUNAR_PARTICLE_COUNT = 58
const LUNAR_FADE_IN_DELAY_RANGE = { max: 2400, min: 0 }
const LUNAR_FADE_IN_DURATION_RANGE = { max: 1900, min: 1000 }
const LUNAR_SCALE_RANGE = { max: 0.95, min: 0.55 }
const LUNAR_SIZE_RANGE = { max: 34, min: 18 }
const LUNAR_VELOCITY_X_RANGE = { max: 6, min: -6 }
const LUNAR_VELOCITY_Y_RANGE = { max: -8, min: -18 }
const LUNAR_FLOAT_VELOCITY_Y_RANGE = { max: 2, min: -2 }
const LUNAR_FLOAT_CHANCE = 0.35
const LUNAR_SWAY_RANGE = { max: 7, min: 2 }
const LUNAR_ROTATION_SPEED_RANGE = { max: 0.3, min: -0.3 }
const LUNAR_SWAY_SPEED_X = 0.00045
const LUNAR_SWAY_SPEED_Y = 0.00035
const LUNAR_GLOW_RANGE = { max: 22, min: 10 }
const LUNAR_EMOJIS = ['🏮']
const LUNAR_FONT =
	'"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
const LUNAR_SPAWN_Y_RANGE = { max: 1.05, min: 0.6 }
const LUNAR_HAZE_OPACITY = '0.5'
const LUNAR_HAZE_GRADIENT =
	'radial-gradient(120% 90% at 50% 100%, rgba(251, 191, 36, 0.45), rgba(251, 146, 60, 0.2) 40%, rgba(15, 23, 42, 0) 75%), radial-gradient(90% 80% at 20% 90%, rgba(248, 113, 113, 0.35), rgba(15, 23, 42, 0) 70%)'
const LUNAR_GLOW_COLORS = [
	'rgba(251, 191, 36, 0.6)',
	'rgba(248, 113, 113, 0.45)',
	'rgba(253, 186, 116, 0.4)',
]

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Lunar New Year begins with the first new moon of the lunar calendar and
				unfolds across a festival season lasting up to fifteen days.
			</Trans>
		</p>
		<p>
			<Trans>
				It is marked by family reunions, travel, and the renewal of long-held
				bonds.
			</Trans>
		</p>

		<h2>
			<Trans>Legends and customs</Trans>
		</h2>
		<p>
			<Trans>
				Traditional stories of the monster Nian are said to have inspired the
				use of loud sounds, firecrackers, and the colour red as symbols of
				protection and good fortune.
			</Trans>
		</p>
		<p>
			<Trans>
				Homes are carefully cleaned and decorated to clear away old luck and
				welcome prosperity for the year ahead.
			</Trans>
		</p>

		<h2>
			<Trans>Symbols of luck</Trans>
		</h2>
		<p>
			<Trans>
				Red envelopes, tangerines, and calligraphy couplets express wishes for
				abundance, happiness, and fresh beginnings.
			</Trans>
		</p>
		<p>
			<Trans>
				The zodiac animal associated with the year is believed to shape its
				character and fortunes.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				The season builds toward the Lantern Festival on the fifteenth night,
				when thousands of lanterns are released into the sky.
			</Trans>
		</p>
		<p>
			<Trans>
				Dragon and lion dances wind through streets packed with spectators,
				firecrackers, and the smell of street food — a finale that can last well
				past midnight.
			</Trans>
		</p>
	</>
)

export const lunarNewYearEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.LunarNewYear,
	isActive: isLunarNewYear,
	run: launchLunarNewYear,
	tileAccent: {
		colors: ['#f5e3c1', '#e6b26a', '#c9854a', '#8f5a3a', '#f5e3c1'],
	},
}

function isLunarNewYear({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return LUNAR_NEW_YEAR_DATES.has(`${year}-${month}-${day}`)
}

async function launchLunarNewYear() {
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
		const haze = document.createElement('div')
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for lunar new year canvas')
		}

		type LanternParticle = {
			birthTime: number
			emoji: string
			fadeDuration: number
			glow: number
			glowColor: string
			opacity: number
			phase: number
			rotation: number
			rotationSpeed: number
			scaleFrom: number
			size: number
			sway: number
			vx: number
			vy: number
			x: number
			y: number
		}
		type EmojiSprite = {
			canvas: HTMLCanvasElement
			displaySize: number
		}

		let timeoutId: null | number = null
		let animationFrameId: null | number = null
		let hasCanceled = false
		let width = window.innerWidth
		let height = window.innerHeight
		let particles: LanternParticle[] = []
		let lastTime = performance.now()
		const spriteCache = new Map<string, EmojiSprite>()
		const spriteDpr = Math.min(
			window.devicePixelRatio || 1,
			LUNAR_FIELD_MAX_DPR,
		)

		const randomEmoji = () =>
			LUNAR_EMOJIS[Math.floor(Math.random() * LUNAR_EMOJIS.length)]
		const randomGlow = () =>
			LUNAR_GLOW_COLORS[Math.floor(Math.random() * LUNAR_GLOW_COLORS.length)]
		const createParticle = (time: number): LanternParticle => {
			const vyRange =
				Math.random() < LUNAR_FLOAT_CHANCE
					? LUNAR_FLOAT_VELOCITY_Y_RANGE
					: LUNAR_VELOCITY_Y_RANGE

			return {
				birthTime: time + randomInRange(LUNAR_FADE_IN_DELAY_RANGE),
				emoji: randomEmoji(),
				fadeDuration: randomInRange(LUNAR_FADE_IN_DURATION_RANGE),
				glow: randomInRange(LUNAR_GLOW_RANGE),
				glowColor: randomGlow(),
				opacity: randomInRange({ max: 0.85, min: 0.45 }),
				phase: randomInRange({ max: Math.PI * 2, min: 0 }),
				rotation: randomInRange({ max: Math.PI * 2, min: 0 }),
				rotationSpeed: randomInRange(LUNAR_ROTATION_SPEED_RANGE),
				scaleFrom: randomInRange(LUNAR_SCALE_RANGE),
				size: randomInRange(LUNAR_SIZE_RANGE),
				sway: randomInRange(LUNAR_SWAY_RANGE),
				vx: randomInRange(LUNAR_VELOCITY_X_RANGE),
				vy: randomInRange(vyRange),
				x: randomInRange({
					max: width + LUNAR_FIELD_MARGIN,
					min: -LUNAR_FIELD_MARGIN,
				}),
				y: randomInRange({
					max: height * LUNAR_SPAWN_Y_RANGE.max,
					min: height * LUNAR_SPAWN_Y_RANGE.min,
				}),
			}
		}
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
			spriteContext.font = `${quantizedSize}px ${LUNAR_FONT}`
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
			particles = Array.from({ length: LUNAR_PARTICLE_COUNT }, () =>
				createParticle(time),
			)
		}
		const respawnParticle = (particle: LanternParticle, time: number) => {
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
			const dpr = getCanvasDpr({ height, maxDpr: LUNAR_FIELD_MAX_DPR, width })

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
					particle.x < -LUNAR_FIELD_MARGIN ||
					particle.x > width + LUNAR_FIELD_MARGIN ||
					particle.y < -LUNAR_FIELD_MARGIN ||
					particle.y > height + LUNAR_FIELD_MARGIN
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
		const drawParticle = (particle: LanternParticle, time: number) => {
			const lifeProgress = (time - particle.birthTime) / particle.fadeDuration
			if (lifeProgress < 0) {
				return
			}

			const eased = easeOutCubic(Math.min(1, lifeProgress))
			const pulse =
				0.88 + Math.sin(time * 0.0011 + particle.phase) * particle.sway * 0.03
			const scale = particle.scaleFrom + (1 - particle.scaleFrom) * eased

			context.save()
			context.translate(particle.x, particle.y)
			context.rotate(particle.rotation)
			context.scale(scale, scale)
			context.globalAlpha = particle.opacity * eased * pulse
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
			particle: LanternParticle,
			delta: number,
			time: number,
		) => {
			if (time < particle.birthTime) {
				return
			}

			const sway =
				Math.sin(time * LUNAR_SWAY_SPEED_X + particle.phase) * particle.sway
			const lift =
				Math.cos(time * LUNAR_SWAY_SPEED_Y + particle.phase) *
				particle.sway *
				0.35

			particle.x += (particle.vx + sway) * delta
			particle.y += (particle.vy + lift) * delta
			particle.rotation += particle.rotationSpeed * delta

			if (
				particle.x < -LUNAR_FIELD_MARGIN ||
				particle.x > width + LUNAR_FIELD_MARGIN ||
				particle.y < -LUNAR_FIELD_MARGIN ||
				particle.y > height + LUNAR_FIELD_MARGIN
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
		const mountLanterns = () => {
			if (hasCanceled) return

			style.setAttribute('data-lunar-new-year', 'haze')
			style.textContent = `
@keyframes lunar-new-year-haze-reveal {
	0% { opacity: 0; transform: translate3d(0, 2%, 0) scale(1.02); }
	100% { opacity: ${LUNAR_HAZE_OPACITY}; transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes lunar-new-year-haze-drift {
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
			haze.style.inset = '35% -10% -30% -10%'
			haze.style.background = LUNAR_HAZE_GRADIENT
			haze.style.opacity = shouldAnimate ? '0' : LUNAR_HAZE_OPACITY
			haze.style.filter = 'blur(26px)'
			haze.style.willChange = 'opacity, transform'

			if (shouldAnimate) {
				haze.style.animation =
					'lunar-new-year-haze-reveal 4s ease-out 0.8s forwards, lunar-new-year-haze-drift 20s ease-in-out infinite 4s'
			}

			overlay.appendChild(haze)
			document.head.appendChild(style)
			document.body.appendChild(overlay)

			canvas.setAttribute('aria-hidden', 'true')
			canvas.style.position = 'fixed'
			canvas.style.inset = '0'
			canvas.style.pointerEvents = 'none'
			canvas.style.zIndex = '1'
			canvas.style.opacity = LUNAR_FIELD_OPACITY
			canvas.style.filter = LUNAR_FIELD_FILTER
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

		timeoutId = window.setTimeout(mountLanterns, LUNAR_MOUNT_DELAY_MS)

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
		console.error('Failed to launch lunar new year lanterns', error)
		return () => {}
	}
}

import { Trans } from '@lingui/react/macro'

import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'
import {
	type SeasonalEvent,
	type SeasonalEventContext,
	SeasonalEventId,
} from '../core/types'
import { getCanvasDpr, randomInRange } from '../core/utils'

const DAY_OF_THE_DEAD_MONTH = 10
const DAY_OF_THE_DEAD_DAYS = new Set([1, 2])
const DAY_OF_THE_DEAD_MOUNT_DELAY_MS = 900
const DAY_OF_THE_DEAD_FIELD_OPACITY = '0.75'
const DAY_OF_THE_DEAD_FIELD_FILTER = 'saturate(130%)'
const DAY_OF_THE_DEAD_FIELD_MAX_DPR = 2
const DAY_OF_THE_DEAD_FIELD_MARGIN = 160
const DAY_OF_THE_DEAD_PARTICLE_COUNT = 70
const DAY_OF_THE_DEAD_FADE_IN_DELAY_RANGE = { max: 2200, min: 0 }
const DAY_OF_THE_DEAD_FADE_IN_DURATION_RANGE = { max: 1900, min: 1000 }
const DAY_OF_THE_DEAD_SCALE_RANGE = { max: 0.85, min: 0.45 }
const DAY_OF_THE_DEAD_SIZE_RANGE = { max: 32, min: 18 }
const DAY_OF_THE_DEAD_VELOCITY_X_RANGE = { max: 9, min: -9 }
const DAY_OF_THE_DEAD_VELOCITY_Y_RANGE = { max: 8, min: -6 }
const DAY_OF_THE_DEAD_SWAY_RANGE = { max: 8, min: 2.5 }
const DAY_OF_THE_DEAD_ROTATION_SPEED_RANGE = { max: 0.35, min: -0.35 }
const DAY_OF_THE_DEAD_SWAY_SPEED_X = 0.00055
const DAY_OF_THE_DEAD_SWAY_SPEED_Y = 0.00045
const DAY_OF_THE_DEAD_GLOW_RANGE = { max: 16, min: 6 }
const DAY_OF_THE_DEAD_GLOW_COLORS = [
	'rgba(251, 146, 60, 0.5)',
	'rgba(248, 113, 113, 0.45)',
	'rgba(249, 115, 22, 0.4)',
]
const DAY_OF_THE_DEAD_EMOJIS = ['💀', '🌼', '🕯️', '🦋', '🏵️']
const DAY_OF_THE_DEAD_FONT =
	'"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
const DAY_OF_THE_DEAD_HALO_OPACITY = '0.5'

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Day of the Dead is a celebration of life, memory, and the enduring bond
				between the living and those who have passed.
			</Trans>
		</p>
		<p>
			<Trans>
				Rather than a solemn farewell, it treats remembrance as something
				vibrant, communal, and alive.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The tradition grows from Indigenous Mexican beliefs about death and the
				afterlife, later blending with Catholic observances of All Saints’ and
				All Souls’ Days.
			</Trans>
		</p>
		<p>
			<Trans>
				It is observed across November 1 and 2, with the first day often
				honouring children and the second devoted to adults.
			</Trans>
		</p>

		<h2>
			<Trans>Symbols and offerings</Trans>
		</h2>
		<p>
			<Trans>
				Marigolds, papel picado, sugar skulls, candles, and favourite foods form
				a visual language of welcome and connection.
			</Trans>
		</p>
		<p>
			<Trans>
				Ofrendas commonly include water, salt, and cherished photographs,
				creating a space where memory feels both intimate and shared.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				Families spend the night in cemeteries, cleaning graves, laying marigold
				paths, and sharing meals beside the headstones. It&apos;s social, warm,
				and often funny — people tell stories and play music until morning.
			</Trans>
		</p>
		<p>
			<Trans>
				The marigold paths (cempasúchil) aren&apos;t just decorative. Their
				strong scent is believed to guide the dead back to the living world for
				the night.
			</Trans>
		</p>
	</>
)

export const dayOfTheDeadEvent: SeasonalEvent = {
	details: EventDetails,
	id: SeasonalEventId.DayOfTheDead,
	isActive: isDayOfTheDead,
	run: launchDayOfTheDead,
	tileAccent: {
		colors: ['#fef3c7', '#fdba74', '#fb7185', '#f59e0b', '#fef3c7'],
	},
}

function isDayOfTheDead({ date }: SeasonalEventContext) {
	return (
		date.getMonth() === DAY_OF_THE_DEAD_MONTH &&
		DAY_OF_THE_DEAD_DAYS.has(date.getDate())
	)
}

async function launchDayOfTheDead() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const animationController = createSettingsModalAnimationController({
			shouldAnimate,
		})
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for day of the dead canvas')
		}

		type SpiritParticle = {
			birthTime: number
			emoji: string
			fadeDuration: number
			glow: number
			glowColor: string
			hasSparkle: boolean
			opacity: number
			phase: number
			rotation: number
			rotationSpeed: number
			scaleFrom: number
			size: number
			sparklePhase: number
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
		let particles: SpiritParticle[] = []
		let lastTime = performance.now()
		let overlay: HTMLDivElement | null = null
		let styleEl: HTMLStyleElement | null = null
		const spriteCache = new Map<string, EmojiSprite>()
		const spriteDpr = Math.min(
			window.devicePixelRatio || 1,
			DAY_OF_THE_DEAD_FIELD_MAX_DPR,
		)

		const randomEmoji = () =>
			DAY_OF_THE_DEAD_EMOJIS[
				Math.floor(Math.random() * DAY_OF_THE_DEAD_EMOJIS.length)
			]
		const randomGlow = () =>
			DAY_OF_THE_DEAD_GLOW_COLORS[
				Math.floor(Math.random() * DAY_OF_THE_DEAD_GLOW_COLORS.length)
			]
		const createParticle = (time: number): SpiritParticle => ({
			birthTime: time + randomInRange(DAY_OF_THE_DEAD_FADE_IN_DELAY_RANGE),
			emoji: randomEmoji(),
			fadeDuration: randomInRange(DAY_OF_THE_DEAD_FADE_IN_DURATION_RANGE),
			glow: randomInRange(DAY_OF_THE_DEAD_GLOW_RANGE),
			glowColor: randomGlow(),
			hasSparkle: Math.random() < 0.25,
			opacity: randomInRange({ max: 0.85, min: 0.45 }),
			phase: randomInRange({ max: Math.PI * 2, min: 0 }),
			rotation: randomInRange({ max: Math.PI * 2, min: 0 }),
			rotationSpeed: randomInRange(DAY_OF_THE_DEAD_ROTATION_SPEED_RANGE),
			scaleFrom: randomInRange(DAY_OF_THE_DEAD_SCALE_RANGE),
			size: randomInRange(DAY_OF_THE_DEAD_SIZE_RANGE),
			sparklePhase: randomInRange({ max: Math.PI * 2, min: 0 }),
			sway: randomInRange(DAY_OF_THE_DEAD_SWAY_RANGE),
			vx: randomInRange(DAY_OF_THE_DEAD_VELOCITY_X_RANGE),
			vy: randomInRange(DAY_OF_THE_DEAD_VELOCITY_Y_RANGE),
			x: randomInRange({
				max: width + DAY_OF_THE_DEAD_FIELD_MARGIN,
				min: -DAY_OF_THE_DEAD_FIELD_MARGIN,
			}),
			y: randomInRange({
				max: height + DAY_OF_THE_DEAD_FIELD_MARGIN,
				min: -DAY_OF_THE_DEAD_FIELD_MARGIN,
			}),
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
			spriteContext.font = `${quantizedSize}px ${DAY_OF_THE_DEAD_FONT}`
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
			particles = Array.from({ length: DAY_OF_THE_DEAD_PARTICLE_COUNT }, () =>
				createParticle(time),
			)
		}
		const respawnParticle = (particle: SpiritParticle, time: number) => {
			Object.assign(particle, createParticle(time))
		}
		const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)
		const revealParticles = (time: number) => {
			for (const particle of particles) {
				particle.birthTime = time - particle.fadeDuration
			}
		}
		const resizeCanvas = () => {
			width = window.innerWidth
			height = window.innerHeight
			const dpr = getCanvasDpr({
				height,
				maxDpr: DAY_OF_THE_DEAD_FIELD_MAX_DPR,
				width,
			})
			canvas.width = Math.round(width * dpr)
			canvas.height = Math.round(height * dpr)
			canvas.style.width = `${width}px`
			canvas.style.height = `${height}px`
			context.setTransform(dpr, 0, 0, dpr, 0, 0)
		}
		const drawParticle = (particle: SpiritParticle, time: number) => {
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
			particle: SpiritParticle,
			delta: number,
			time: number,
		) => {
			if (time < particle.birthTime) {
				return
			}

			const sway =
				Math.sin(time * DAY_OF_THE_DEAD_SWAY_SPEED_X + particle.phase) *
				particle.sway
			const lift =
				Math.cos(time * DAY_OF_THE_DEAD_SWAY_SPEED_Y + particle.phase) *
				particle.sway *
				0.4

			particle.x += (particle.vx + sway) * delta
			particle.y += (particle.vy + lift) * delta
			particle.rotation += particle.rotationSpeed * delta

			if (
				particle.x < -DAY_OF_THE_DEAD_FIELD_MARGIN ||
				particle.x > width + DAY_OF_THE_DEAD_FIELD_MARGIN ||
				particle.y < -DAY_OF_THE_DEAD_FIELD_MARGIN ||
				particle.y > height + DAY_OF_THE_DEAD_FIELD_MARGIN
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

		const mountSpirits = () => {
			if (hasCanceled) return
			const style = document.createElement('style')
			const overlayNode = document.createElement('div')
			const halo = document.createElement('div')

			style.setAttribute('data-day-of-the-dead', 'overlay')
			style.textContent = `
@keyframes day-of-the-dead-halo-reveal {
	0% { opacity: 0; transform: translate(0, 0) scale(0.96); }
	100% { opacity: ${DAY_OF_THE_DEAD_HALO_OPACITY}; transform: translate(0, 0) scale(1); }
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
			halo.style.opacity = shouldAnimate ? '0' : DAY_OF_THE_DEAD_HALO_OPACITY
			halo.style.background =
				'radial-gradient(circle at 30% 30%, rgba(251, 191, 36, 0.4), rgba(251, 146, 60, 0.18) 35%, rgba(226, 232, 240, 0) 70%)'
			halo.style.filter = 'blur(20px)'

			if (shouldAnimate) {
				halo.style.animation =
					'day-of-the-dead-halo-reveal 4s ease-out 0.8s forwards'
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
			canvas.style.opacity = DAY_OF_THE_DEAD_FIELD_OPACITY
			canvas.style.filter = DAY_OF_THE_DEAD_FIELD_FILTER
			canvas.style.mixBlendMode = 'screen'

			document.body.appendChild(canvas)
			resizeCanvas()
			resetParticles(performance.now())
			window.addEventListener('resize', resizeCanvas)

			if (shouldAnimate) {
				lastTime = performance.now()
				animationFrameId =
					animationController.requestAnimationFrame(renderFrame)
			} else {
				drawStaticFrame()
			}
		}

		timeoutId = window.setTimeout(mountSpirits, DAY_OF_THE_DEAD_MOUNT_DELAY_MS)

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
			if (overlay && overlay.parentElement) {
				overlay.parentElement.removeChild(overlay)
			}
			if (styleEl && styleEl.parentElement) {
				styleEl.parentElement.removeChild(styleEl)
			}
		}
	} catch (error) {
		console.error('Failed to launch Day of the Dead event', error)
		return () => {}
	}
}

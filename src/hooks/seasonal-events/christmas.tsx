import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'

const CHRISTMAS_MONTH = 11
const CHRISTMAS_DAY = 25
const CHRISTMAS_MOUNT_DELAY_MS = 900
const CHRISTMAS_FIELD_OPACITY = '0.7'
const CHRISTMAS_FIELD_FILTER = 'saturate(135%)'
const CHRISTMAS_FIELD_MAX_DPR = 2
const CHRISTMAS_FIELD_MARGIN = 160
const CHRISTMAS_PARTICLE_COUNT = 120
const CHRISTMAS_FADE_IN_DELAY_RANGE = { min: 0, max: 2400 }
const CHRISTMAS_FADE_IN_DURATION_RANGE = { min: 1200, max: 2200 }
const CHRISTMAS_SCALE_RANGE = { min: 0.45, max: 0.9 }
const CHRISTMAS_SIZE_RANGE = { min: 2.5, max: 6.5 }
const CHRISTMAS_VELOCITY_X_RANGE = { min: -4.5, max: 4.5 }
const CHRISTMAS_VELOCITY_Y_RANGE = { min: 10, max: 20 }
const CHRISTMAS_SWAY_RANGE = { min: 1.2, max: 4 }
const CHRISTMAS_ROTATION_SPEED_RANGE = { min: -0.35, max: 0.35 }
const CHRISTMAS_SWAY_SPEED_X = 0.00045
const CHRISTMAS_SWAY_SPEED_Y = 0.00025
const CHRISTMAS_GLOW_RANGE = { min: 10, max: 18 }
const CHRISTMAS_SPARKLE_CHANCE = 0.3
const CHRISTMAS_LIGHTS_OPACITY = '0.5'
const CHRISTMAS_LIGHTS_GRADIENT =
	'radial-gradient(30% 30% at 15% 10%, rgba(250, 204, 21, 0.22), rgba(15, 23, 42, 0) 70%), radial-gradient(25% 25% at 50% -5%, rgba(248, 113, 113, 0.18), rgba(15, 23, 42, 0) 70%), radial-gradient(28% 30% at 80% 12%, rgba(74, 222, 128, 0.2), rgba(15, 23, 42, 0) 70%)'
const CHRISTMAS_COLORS = [
	'#f8fafc',
	'#e2e8f0',
	'#e0f2fe',
	'#fde68a',
	'#fca5a5',
	'#86efac',
]

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Christmas Day marks the celebration of the birth of Jesus, and for many
				people it has also become a broader season of generosity, reflection,
				and togetherness.
			</Trans>
		</p>
		<p>
			<Trans>
				It is observed around the world in both deeply religious and entirely
				secular ways, often blending the two.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The holiday we recognise today grew from early Christian tradition,
				layered over much older European midwinter customs tied to light,
				renewal, and community.
			</Trans>
		</p>
		<p>
			<Trans>
				Across centuries and cultures, distinctive local practices emerged —
				from midnight services and carolling to bustling festive markets and
				public celebrations.
			</Trans>
		</p>

		<h2>
			<Trans>Symbols and rituals</Trans>
		</h2>
		<p>
			<Trans>
				Evergreens, candles, bells, and stars echo a shared theme drawn from
				those early traditions: light enduring through the darkest part of the
				year in the cultures where the holiday first formed.
			</Trans>
		</p>
		<p>
			<Trans>
				Decorated trees, stockings, gift-giving, and shared meals now connect
				people across many climates and continents in a sense of home and
				continuity.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				There’s something quietly luminous about the day itself — the glow of
				lights in windows, slow mornings, familiar songs, and tables set for
				gathering.
			</Trans>
		</p>
		<p>
			<Trans>It’s a holiday that invites both celebration and pause.</Trans>
		</p>
	</>
)

export const christmasEvent: SeasonalEvent = {
	id: 'christmas-day',
	isActive: isChristmasDay,
	run: launchChristmasSnowfall,
	details: EventDetails,
	tileAccent: {
		colors: ['#fef3c7', '#fca5a5', '#86efac', '#fde68a', '#fef3c7'],
	},
}

function isChristmasDay({ date }: SeasonalEventContext) {
	return date.getMonth() === CHRISTMAS_MONTH && date.getDate() === CHRISTMAS_DAY
}

async function launchChristmasSnowfall() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const style = document.createElement('style')
		const overlay = document.createElement('div')
		const glow = document.createElement('div')
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for christmas canvas')
		}

		type SnowParticle = {
			x: number
			y: number
			vx: number
			vy: number
			size: number
			opacity: number
			color: string
			glow: number
			phase: number
			sway: number
			birthTime: number
			fadeDuration: number
			rotation: number
			rotationSpeed: number
			scaleFrom: number
			hasSparkle: boolean
		}

		let timeoutId: number | null = null
		let animationFrameId: number | null = null
		let hasCanceled = false
		let width = window.innerWidth
		let height = window.innerHeight
		let particles: SnowParticle[] = []
		let lastTime = performance.now()

		const randomColor = () =>
			CHRISTMAS_COLORS[Math.floor(Math.random() * CHRISTMAS_COLORS.length)]
		const createParticle = (time: number): SnowParticle => ({
			x: randomInRange({
				min: -CHRISTMAS_FIELD_MARGIN,
				max: width + CHRISTMAS_FIELD_MARGIN,
			}),
			y: randomInRange({
				min: -CHRISTMAS_FIELD_MARGIN,
				max: height + CHRISTMAS_FIELD_MARGIN,
			}),
			vx: randomInRange(CHRISTMAS_VELOCITY_X_RANGE),
			vy: randomInRange(CHRISTMAS_VELOCITY_Y_RANGE),
			size: randomInRange(CHRISTMAS_SIZE_RANGE),
			opacity: randomInRange({ min: 0.35, max: 0.8 }),
			color: randomColor(),
			glow: randomInRange(CHRISTMAS_GLOW_RANGE),
			phase: randomInRange({ min: 0, max: Math.PI * 2 }),
			sway: randomInRange(CHRISTMAS_SWAY_RANGE),
			birthTime: time + randomInRange(CHRISTMAS_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(CHRISTMAS_FADE_IN_DURATION_RANGE),
			rotation: randomInRange({ min: 0, max: Math.PI * 2 }),
			rotationSpeed: randomInRange(CHRISTMAS_ROTATION_SPEED_RANGE),
			scaleFrom: randomInRange(CHRISTMAS_SCALE_RANGE),
			hasSparkle: Math.random() < CHRISTMAS_SPARKLE_CHANCE,
		})
		const resetParticles = (time: number) => {
			particles = Array.from({ length: CHRISTMAS_PARTICLE_COUNT }, () =>
				createParticle(time),
			)
		}
		const respawnParticle = (particle: SnowParticle, time: number) => {
			Object.assign(particle, createParticle(time))
			particle.y = -randomInRange({ min: 0, max: CHRISTMAS_FIELD_MARGIN })
		}
		const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)
		const resizeCanvas = () => {
			const dpr = Math.min(
				window.devicePixelRatio || 1,
				CHRISTMAS_FIELD_MAX_DPR,
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
					particle.x < -CHRISTMAS_FIELD_MARGIN ||
					particle.x > width + CHRISTMAS_FIELD_MARGIN ||
					particle.y < -CHRISTMAS_FIELD_MARGIN ||
					particle.y > height + CHRISTMAS_FIELD_MARGIN
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
		const drawSnowSparkle = (size: number) => {
			context.lineWidth = Math.max(0.6, size * 0.18)
			context.beginPath()
			context.moveTo(-size, 0)
			context.lineTo(size, 0)
			context.moveTo(0, -size)
			context.lineTo(0, size)
			context.stroke()
		}
		const drawParticle = (particle: SnowParticle, time: number) => {
			const lifeProgress = (time - particle.birthTime) / particle.fadeDuration
			if (lifeProgress < 0) {
				return
			}

			const eased = easeOutCubic(Math.min(1, lifeProgress))
			const twinkle = 0.7 + Math.sin(time * 0.002 + particle.phase) * 0.3
			const scale = particle.scaleFrom + (1 - particle.scaleFrom) * eased
			const alpha = particle.opacity * eased * twinkle
			const glowRadius = particle.size * 3.2

			context.save()
			context.translate(particle.x, particle.y)
			context.rotate(particle.rotation)
			context.scale(scale, scale)

			context.globalAlpha = alpha * 0.4
			const glow = context.createRadialGradient(0, 0, 0, 0, 0, glowRadius)
			glow.addColorStop(0, particle.color)
			glow.addColorStop(1, 'rgba(15, 23, 42, 0)')
			context.fillStyle = glow
			context.beginPath()
			context.arc(0, 0, glowRadius, 0, Math.PI * 2)
			context.fill()

			context.globalAlpha = alpha
			context.fillStyle = particle.color
			context.shadowColor = particle.color
			context.shadowBlur = particle.glow
			context.beginPath()
			context.arc(0, 0, particle.size, 0, Math.PI * 2)
			context.fill()
			context.shadowBlur = 0
			context.shadowColor = 'transparent'

			if (particle.hasSparkle) {
				context.globalAlpha = alpha * 0.6
				context.strokeStyle = particle.color
				drawSnowSparkle(particle.size * 1.1)
			}

			context.restore()
		}
		const updateParticle = (
			particle: SnowParticle,
			delta: number,
			time: number,
		) => {
			if (time < particle.birthTime) {
				return
			}

			const sway =
				Math.sin(time * CHRISTMAS_SWAY_SPEED_X + particle.phase) * particle.sway
			const flutter =
				Math.cos(time * CHRISTMAS_SWAY_SPEED_Y + particle.phase) *
				particle.sway *
				0.35

			particle.x += (particle.vx + sway) * delta
			particle.y += (particle.vy + flutter) * delta
			particle.rotation += particle.rotationSpeed * delta

			if (
				particle.y > height + CHRISTMAS_FIELD_MARGIN ||
				particle.x < -CHRISTMAS_FIELD_MARGIN ||
				particle.x > width + CHRISTMAS_FIELD_MARGIN
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

		const mountChristmas = () => {
			if (hasCanceled) return

			style.setAttribute('data-christmas', 'lights')
			style.textContent = `
@keyframes christmas-lights-reveal {
	0% { opacity: 0; transform: translate3d(0, -2%, 0) scale(1.02); }
	100% { opacity: ${CHRISTMAS_LIGHTS_OPACITY}; transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes christmas-lights-drift {
	0% { transform: translate3d(0, 0, 0) scale(1); }
	50% { transform: translate3d(-1.5%, 1%, 0) scale(1.01); }
	100% { transform: translate3d(0, 0, 0) scale(1); }
}
`

			overlay.setAttribute('aria-hidden', 'true')
			overlay.style.position = 'fixed'
			overlay.style.inset = '0'
			overlay.style.pointerEvents = 'none'
			overlay.style.zIndex = '0'
			overlay.style.mixBlendMode = 'screen'

			glow.style.position = 'absolute'
			glow.style.inset = '-20% -10% 0 -10%'
			glow.style.background = CHRISTMAS_LIGHTS_GRADIENT
			glow.style.opacity = shouldAnimate ? '0' : CHRISTMAS_LIGHTS_OPACITY
			glow.style.filter = 'blur(26px)'
			glow.style.willChange = 'opacity, transform'

			if (shouldAnimate) {
				glow.style.animation =
					'christmas-lights-reveal 4.4s ease-out 0.6s forwards, christmas-lights-drift 18s ease-in-out infinite 4.4s'
			}

			overlay.appendChild(glow)
			document.head.appendChild(style)
			document.body.appendChild(overlay)

			canvas.setAttribute('aria-hidden', 'true')
			canvas.style.position = 'fixed'
			canvas.style.inset = '0'
			canvas.style.pointerEvents = 'none'
			canvas.style.zIndex = '1'
			canvas.style.opacity = CHRISTMAS_FIELD_OPACITY
			canvas.style.filter = CHRISTMAS_FIELD_FILTER
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

		timeoutId = window.setTimeout(mountChristmas, CHRISTMAS_MOUNT_DELAY_MS)

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
		console.error('Failed to launch christmas snowfall', error)
		return () => {}
	}
}

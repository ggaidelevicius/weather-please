import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'
import { getCanvasDpr, randomInRange } from './utils'

const WINTER_SOLSTICE_DATES_NORTHERN = new Set([
	'2026-12-21',
	'2027-12-22',
	'2028-12-21',
	'2029-12-21',
	'2030-12-21',
	'2031-12-22',
	'2032-12-21',
	'2033-12-21',
	'2034-12-21',
	'2035-12-22',
	'2036-12-21',
	'2037-12-21',
	'2038-12-21',
	'2039-12-22',
	'2040-12-21',
	'2041-12-21',
	'2042-12-21',
	'2043-12-22',
])
const WINTER_SOLSTICE_DATES_SOUTHERN = new Set([
	'2026-06-21',
	'2027-06-21',
	'2028-06-20',
	'2029-06-21',
	'2030-06-21',
	'2031-06-21',
	'2032-06-20',
	'2033-06-21',
	'2034-06-21',
	'2035-06-21',
	'2036-06-20',
	'2037-06-21',
	'2038-06-21',
	'2039-06-21',
	'2040-06-20',
	'2041-06-20',
	'2042-06-21',
	'2043-06-21',
])
const WINTER_MOUNT_DELAY_MS = 900
const WINTER_FIELD_OPACITY = '0.6'
const WINTER_FIELD_FILTER = 'saturate(115%)'
const WINTER_FIELD_MAX_DPR = 2
const WINTER_FIELD_MARGIN = 150
const WINTER_PARTICLE_COUNT = 90
const WINTER_FADE_IN_DELAY_RANGE = { min: 0, max: 2600 }
const WINTER_FADE_IN_DURATION_RANGE = { min: 1200, max: 2100 }
const WINTER_SIZE_RANGE = { min: 4, max: 11 }
const WINTER_VELOCITY_X_RANGE = { min: -6, max: 6 }
const WINTER_VELOCITY_Y_RANGE = { min: -5, max: 5 }
const WINTER_SWAY_RANGE = { min: 1.5, max: 6 }
const WINTER_ROTATION_SPEED_RANGE = { min: -0.25, max: 0.25 }
const WINTER_SWAY_SPEED_X = 0.00045
const WINTER_SWAY_SPEED_Y = 0.0004
const WINTER_GLOW_RANGE = { min: 6, max: 14 }
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

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The winter solstice marks the shortest day and longest night of the
				year, and the turning point toward gradually longer daylight.
			</Trans>
		</p>
		<p>
			<Trans>
				It signals the beginning of winter in the northern hemisphere and the
				start of summer in the southern hemisphere.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Across many cultures, traditions such as Yule and Saturnalia developed
				around this moment, gathering warmth, light, and community during the
				darkest part of the year in the regions where they first formed.
			</Trans>
		</p>
		<p>
			<Trans>
				Monuments and ancient sites around the world are aligned to mark the
				solstice and the return of the Sun’s path.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				In the depth of the long night, even a single candle can feel like a
				sunrise.
			</Trans>
		</p>
		<p>
			<Trans>
				Each added minute of daylight carries the quiet promise of change.
			</Trans>
		</p>
	</>
)

export const winterSolsticeEvent: SeasonalEvent = {
	id: 'winter-solstice',
	isActive: isWinterSolstice,
	run: launchWinterSolstice,
	details: EventDetails,
	tileAccent: {
		colors: ['#e2e8f0', '#c7d2fe', '#bae6fd', '#e0f2fe', '#e2e8f0'],
	},
}

function isWinterSolstice({ date, hemisphere }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const solsticeDates =
		hemisphere === 'southern'
			? WINTER_SOLSTICE_DATES_SOUTHERN
			: WINTER_SOLSTICE_DATES_NORTHERN
	return solsticeDates.has(`${year}-${month}-${day}`)
}

async function launchWinterSolstice() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const style = document.createElement('style')
		const overlay = document.createElement('div')
		const aurora = document.createElement('div')
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for winter solstice canvas')
		}

		type Particle = {
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
		}

		let timeoutId: number | null = null
		let animationFrameId: number | null = null
		let hasCanceled = false
		let width = window.innerWidth
		let height = window.innerHeight
		let particles: Particle[] = []
		let lastTime = performance.now()

		const randomColor = () =>
			WINTER_COLORS[Math.floor(Math.random() * WINTER_COLORS.length)]
		const createParticle = (time: number): Particle => ({
			x: randomInRange({
				min: -WINTER_FIELD_MARGIN,
				max: width + WINTER_FIELD_MARGIN,
			}),
			y: randomInRange({
				min: -WINTER_FIELD_MARGIN,
				max: height + WINTER_FIELD_MARGIN,
			}),
			vx: randomInRange(WINTER_VELOCITY_X_RANGE),
			vy: randomInRange(WINTER_VELOCITY_Y_RANGE),
			size: randomInRange(WINTER_SIZE_RANGE),
			opacity: randomInRange({ min: 0.35, max: 0.7 }),
			color: randomColor(),
			glow: randomInRange(WINTER_GLOW_RANGE),
			phase: randomInRange({ min: 0, max: Math.PI * 2 }),
			sway: randomInRange(WINTER_SWAY_RANGE),
			birthTime: time + randomInRange(WINTER_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(WINTER_FADE_IN_DURATION_RANGE),
			rotation: randomInRange({ min: 0, max: Math.PI * 2 }),
			rotationSpeed: randomInRange(WINTER_ROTATION_SPEED_RANGE),
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
			const dpr = getCanvasDpr({ width, height, maxDpr: WINTER_FIELD_MAX_DPR })

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

			animationFrameId = window.requestAnimationFrame(renderFrame)
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
				animationFrameId = window.requestAnimationFrame(renderFrame)
			} else {
				drawStaticFrame()
			}
		}

		timeoutId = window.setTimeout(mountWinterSolstice, WINTER_MOUNT_DELAY_MS)

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
		console.error('Failed to launch winter solstice', error)
		return () => {}
	}
}

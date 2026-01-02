import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'

const SUMMER_SOLSTICE_DATES_NORTHERN = new Set([
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
const SUMMER_SOLSTICE_DATES_SOUTHERN = new Set([
	'2026-12-21',
	'2027-12-21',
	'2028-12-21',
	'2029-12-21',
	'2030-12-21',
	'2031-12-21',
	'2032-12-21',
	'2033-12-21',
	'2034-12-21',
	'2035-12-21',
	'2036-12-21',
	'2037-12-21',
	'2038-12-21',
	'2039-12-21',
	'2040-12-21',
	'2041-12-21',
	'2042-12-21',
	'2043-12-21',
])
const SOLSTICE_MOUNT_DELAY_MS = 900
const SOLSTICE_POLLEN_COUNT = 52
const SOLSTICE_POLLEN_OPACITY = '0.55'
const SOLSTICE_POLLEN_FILTER = 'saturate(125%)'
const SOLSTICE_POLLEN_MAX_DPR = 2
const SOLSTICE_POLLEN_MARGIN = 120
const SOLSTICE_POLLEN_FADE_IN_DELAY_RANGE = { min: 0, max: 2400 }
const SOLSTICE_POLLEN_FADE_IN_DURATION_RANGE = { min: 1000, max: 1800 }
const SOLSTICE_WASH_OPACITY = '0.5'
const SOLSTICE_HALO_OPACITY = '0.65'
const SOLSTICE_POLLEN_COLORS = [
	'#fef3c7',
	'#fde68a',
	'#fcd34d',
	'#fdba74',
	'#f59e0b',
	'#fbbf24',
	'#fed7aa',
	'#fecdd3',
	'#fda4af',
	'#fb7185',
	'#f97316',
	'#fef9c3',
]
const SOLSTICE_POLLEN_SIZE_RANGE = { min: 6, max: 16 }
const SOLSTICE_POLLEN_VELOCITY_X = { min: -6, max: 6 }
const SOLSTICE_POLLEN_VELOCITY_Y = { min: 6, max: 14 }
const SOLSTICE_POLLEN_SWAY_RANGE = { min: 2, max: 10 }
const SOLSTICE_POLLEN_GLOW_RANGE = { min: 6, max: 14 }

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				The summer solstice marks the longest day of the year, when the sun
				reaches its highest path across the sky.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Ancient monuments such as Stonehenge are aligned with the solstice
				sunrise, and midsummer festivals across many cultures celebrate light
				and abundance.
			</Trans>
		</p>
		<p>
			<Trans>
				Bonfires, late gatherings, and all-night vigils have long been part of
				welcoming this turning point of the year.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				Twilight lingers, insects fill the air with song, and the sky can feel
				almost endless.
			</Trans>
		</p>
		<p>
			<Trans>
				In far northern regions, the sun may barely set at all, creating the
				phenomenon of the midnight sun.
			</Trans>
		</p>
	</>
)

export const summerSolsticeEvent: SeasonalEvent = {
	id: 'summer-solstice',
	isActive: isSummerSolstice,
	run: launchSummerSolstice,
	details: EventDetails,
	tileAccent: {
		colors: ['#fef3c7', '#fde68a', '#fdba74', '#f59e0b', '#fef3c7'],
	},
}

function isSummerSolstice({ date, hemisphere }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const solsticeDates =
		hemisphere === 'southern'
			? SUMMER_SOLSTICE_DATES_SOUTHERN
			: SUMMER_SOLSTICE_DATES_NORTHERN
	return solsticeDates.has(`${year}-${month}-${day}`)
}

async function launchSummerSolstice() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const style = document.createElement('style')
		const overlay = document.createElement('div')
		const wash = document.createElement('div')
		const halo = document.createElement('div')
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for summer solstice canvas')
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
			hasSparkle: boolean
			sparklePhase: number
		}

		let timeoutId: number | null = null
		let animationFrameId: number | null = null
		let hasCanceled = false
		let width = window.innerWidth
		let height = window.innerHeight
		let particles: Particle[] = []
		let lastTime = performance.now()

		const randomColor = () =>
			SOLSTICE_POLLEN_COLORS[
				Math.floor(Math.random() * SOLSTICE_POLLEN_COLORS.length)
			]
		const createParticle = (time: number): Particle => ({
			x: randomInRange({
				min: -SOLSTICE_POLLEN_MARGIN,
				max: width + SOLSTICE_POLLEN_MARGIN,
			}),
			y: randomInRange({
				min: -SOLSTICE_POLLEN_MARGIN,
				max: height + SOLSTICE_POLLEN_MARGIN,
			}),
			vx: randomInRange(SOLSTICE_POLLEN_VELOCITY_X),
			vy: randomInRange(SOLSTICE_POLLEN_VELOCITY_Y),
			size: randomInRange(SOLSTICE_POLLEN_SIZE_RANGE),
			opacity: randomInRange({ min: 0.35, max: 0.75 }),
			color: randomColor(),
			glow: randomInRange(SOLSTICE_POLLEN_GLOW_RANGE),
			phase: randomInRange({ min: 0, max: Math.PI * 2 }),
			sway: randomInRange(SOLSTICE_POLLEN_SWAY_RANGE),
			birthTime: time + randomInRange(SOLSTICE_POLLEN_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(SOLSTICE_POLLEN_FADE_IN_DURATION_RANGE),
			hasSparkle: Math.random() < 0.25,
			sparklePhase: randomInRange({ min: 0, max: Math.PI * 2 }),
		})
		const resetParticles = (time: number) => {
			particles = Array.from({ length: SOLSTICE_POLLEN_COUNT }, () =>
				createParticle(time),
			)
		}
		const respawnParticle = (particle: Particle, time: number) => {
			Object.assign(particle, createParticle(time))
		}
		const resizeCanvas = () => {
			const dpr = Math.min(
				window.devicePixelRatio || 1,
				SOLSTICE_POLLEN_MAX_DPR,
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
					particle.x < -SOLSTICE_POLLEN_MARGIN ||
					particle.x > width + SOLSTICE_POLLEN_MARGIN ||
					particle.y < -SOLSTICE_POLLEN_MARGIN ||
					particle.y > height + SOLSTICE_POLLEN_MARGIN
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

			const fade = Math.min(1, lifeProgress)
			const pulse = 0.75 + Math.sin(time * 0.001 + particle.phase) * 0.2
			const alpha = particle.opacity * fade * pulse
			const radius = particle.size

			context.save()
			context.translate(particle.x, particle.y)
			context.globalAlpha = alpha
			context.shadowColor = particle.color
			context.shadowBlur = particle.glow

			const gradient = context.createRadialGradient(
				0,
				0,
				radius * 0.1,
				0,
				0,
				radius,
			)
			gradient.addColorStop(0, particle.color)
			gradient.addColorStop(0.6, particle.color)
			gradient.addColorStop(1, 'transparent')
			context.fillStyle = gradient
			context.beginPath()
			context.arc(0, 0, radius, 0, Math.PI * 2)
			context.fill()

			if (particle.hasSparkle) {
				const sparklePulse = Math.sin(time * 0.002 + particle.sparklePhase)
				if (sparklePulse > 0.92) {
					const sparkleAlpha = ((sparklePulse - 0.92) / 0.08) * alpha
					context.globalAlpha = sparkleAlpha
					context.fillStyle = '#fff7d6'
					context.shadowColor = '#fff7d6'
					context.shadowBlur = particle.glow * 1.6
					context.beginPath()
					context.arc(0, 0, radius * 0.28, 0, Math.PI * 2)
					context.fill()
				}
			}

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

			const sway = Math.sin(time * 0.001 + particle.phase) * particle.sway
			const lift =
				Math.cos(time * 0.0007 + particle.phase) * particle.sway * 0.3

			particle.x += (particle.vx + sway) * delta
			particle.y += (particle.vy + lift) * delta

			if (
				particle.x < -SOLSTICE_POLLEN_MARGIN ||
				particle.x > width + SOLSTICE_POLLEN_MARGIN ||
				particle.y < -SOLSTICE_POLLEN_MARGIN ||
				particle.y > height + SOLSTICE_POLLEN_MARGIN
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
		const mountPollen = () => {
			if (hasCanceled) return
			style.setAttribute('data-summer-solstice', 'wash')
			style.textContent = `
@keyframes summer-solstice-wash {
	0% { opacity: 0.25; transform: translate(0, 0) scale(1); }
	50% { opacity: 0.45; transform: translate(2%, 1%) scale(1.02); }
	100% { opacity: 0.25; transform: translate(0, 0) scale(1); }
}
@keyframes summer-solstice-wash-reveal {
	0% { opacity: 0; }
	100% { opacity: ${SOLSTICE_WASH_OPACITY}; }
}
@keyframes summer-solstice-halo-reveal {
	0% { opacity: 0; transform: translate(0, 0) scale(0.96); }
	100% { opacity: ${SOLSTICE_HALO_OPACITY}; transform: translate(0, 0) scale(1); }
}
@keyframes summer-solstice-halo {
	0% { opacity: ${SOLSTICE_HALO_OPACITY}; transform: translate(0, 0) scale(1); }
	50% { opacity: 0.78; transform: translate(1%, -1%) scale(1.03); }
	100% { opacity: ${SOLSTICE_HALO_OPACITY}; transform: translate(0, 0) scale(1); }
}
`

			overlay.setAttribute('aria-hidden', 'true')
			overlay.style.position = 'fixed'
			overlay.style.inset = '0'
			overlay.style.pointerEvents = 'none'
			overlay.style.zIndex = '0'
			overlay.style.opacity = shouldAnimate ? '0' : SOLSTICE_WASH_OPACITY
			overlay.style.mixBlendMode = 'screen'

			wash.style.position = 'absolute'
			wash.style.inset = '-12%'
			wash.style.background =
				'radial-gradient(circle at 18% 18%, rgba(251, 191, 36, 0.32), rgba(251, 191, 36, 0.08) 35%, rgba(251, 191, 36, 0) 70%), radial-gradient(circle at 85% 90%, rgba(253, 186, 116, 0.22), rgba(253, 186, 116, 0) 65%)'

			halo.style.position = 'absolute'
			halo.style.inset = '-30%'
			halo.style.opacity = shouldAnimate ? '0' : SOLSTICE_HALO_OPACITY
			halo.style.background =
				'radial-gradient(circle at 12% 20%, rgba(252, 211, 77, 0.5), rgba(252, 211, 77, 0.12) 35%, rgba(252, 211, 77, 0) 70%)'
			halo.style.filter = 'blur(14px)'
			halo.style.willChange = 'opacity, transform'

			if (shouldAnimate) {
				overlay.style.animation =
					'summer-solstice-wash-reveal 2.4s ease-out 0.4s forwards'
				wash.style.animation = 'summer-solstice-wash 18s ease-in-out infinite'
				halo.style.animation =
					'summer-solstice-halo-reveal 4.5s ease-out 1s forwards, summer-solstice-halo 22s ease-in-out infinite 5.5s'
			}

			overlay.append(wash, halo)

			canvas.setAttribute('aria-hidden', 'true')
			canvas.style.position = 'fixed'
			canvas.style.inset = '0'
			canvas.style.pointerEvents = 'none'
			canvas.style.zIndex = '1'
			canvas.style.opacity = SOLSTICE_POLLEN_OPACITY
			canvas.style.filter = SOLSTICE_POLLEN_FILTER
			canvas.style.mixBlendMode = 'screen'

			document.head.appendChild(style)
			document.body.appendChild(overlay)
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

		timeoutId = window.setTimeout(mountPollen, SOLSTICE_MOUNT_DELAY_MS)

		return () => {
			hasCanceled = true
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId)
			}
			if (animationFrameId !== null) {
				window.cancelAnimationFrame(animationFrameId)
			}
			window.removeEventListener('resize', resizeCanvas)
			if (document.body.contains(overlay)) {
				document.body.removeChild(overlay)
			}
			if (document.body.contains(canvas)) {
				document.body.removeChild(canvas)
			}
			if (document.head.contains(style)) {
				document.head.removeChild(style)
			}
		}
	} catch (error) {
		console.error('Failed to launch summer solstice effect', error)
		return () => {}
	}
}

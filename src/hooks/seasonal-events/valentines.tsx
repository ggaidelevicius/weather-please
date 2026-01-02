import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'
import { getCanvasDpr, randomInRange } from './utils'

const VALENTINES_MONTH = 1
const VALENTINES_DAY = 14
const HEARTS_MOUNT_DELAY_MS = 900
const HEARTS_FIELD_OPACITY = '0.78'
const HEARTS_FIELD_FILTER = 'saturate(170%) contrast(110%)'
const HEARTS_FIELD_MAX_DPR = 2
const HEARTS_FIELD_MARGIN = 140
const HEARTS_FIELD_COUNT = 72
const HEARTS_GLOW_OPACITY = '0.4'
const HEARTS_GLOW_GRADIENT =
	'radial-gradient(120% 90% at 50% 100%, rgba(244, 114, 182, 0.5), rgba(251, 113, 133, 0.25) 45%, rgba(15, 23, 42, 0) 75%)'
const HEARTS_FADE_IN_DELAY_RANGE = { min: 0, max: 2200 }
const HEARTS_FADE_IN_DURATION_RANGE = { min: 900, max: 1600 }
const HEARTS_SCALE_RANGE = { min: 0.4, max: 0.75 }
const HEARTS_SIZE_RANGE = { min: 12, max: 26 }
const HEARTS_VELOCITY_X_RANGE = { min: -6, max: 6 }
const HEARTS_VELOCITY_Y_RANGE = { min: -5, max: 5 }
const HEARTS_SWAY_RANGE = { min: 2, max: 8 }
const HEARTS_ROTATION_SPEED_RANGE = { min: -0.35, max: 0.35 }
const HEARTS_GLOW_RANGE = { min: 16, max: 28 }
const HEARTS_GRADIENTS = [
	{ inner: '#ffe1f2', mid: '#ff8fc1', outer: '#e11d48' },
	{ inner: '#ffd1e8', mid: '#ff6ea8', outer: '#d81b60' },
	{ inner: '#ffbfe3', mid: '#ff5faa', outer: '#c2185b' },
	{ inner: '#ffb3e1', mid: '#ff4da0', outer: '#b3125e' },
	{ inner: '#ff9ad5', mid: '#ff3b86', outer: '#ad1457' },
	{ inner: '#ffc1c1', mid: '#ff6b6b', outer: '#b91c1c' },
	{ inner: '#ffd6d6', mid: '#fb7185', outer: '#be123c' },
	{ inner: '#ffe4e6', mid: '#fb7185', outer: '#e11d48' },
] as const
const HEARTS_SHAPES = ['parametric', 'arc'] as const

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Valentine’s Day celebrates affection in many forms, from romantic love
				to friendship and quiet acts of care.
			</Trans>
		</p>
		<p>
			<Trans>
				It is often marked by small gestures that simply say someone has been
				remembered.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The holiday draws on legends of Saint Valentine and the traditions of
				medieval courtly love.
			</Trans>
		</p>
		<p>
			<Trans>
				By the eighteenth century, handwritten notes and printed cards had
				helped turn the day into a ritual of letters and messages.
			</Trans>
		</p>

		<h2>
			<Trans>Symbols and rituals</Trans>
		</h2>
		<p>
			<Trans>
				Hearts, roses, and red ribbons became familiar symbols of devotion,
				warmth, and connection.
			</Trans>
		</p>
		<p>
			<Trans>
				Shared sweets, flowers, and small gifts keep the celebration intimate
				and personal.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				The oldest known Valentine is a fifteenth-century poem written from
				imprisonment in the Tower of London.
			</Trans>
		</p>
		<p>
			<Trans>
				Even today, paper hearts and quiet notes continue the tradition of
				deliberate kindness.
			</Trans>
		</p>
	</>
)

export const valentinesEvent: SeasonalEvent = {
	id: 'valentines-day',
	isActive: isValentinesDay,
	run: launchValentinesHearts,
	details: EventDetails,
	tileAccent: {
		colors: ['#fbcfe8', '#f9a8d4', '#f472b6', '#fb7185', '#fbcfe8'],
	},
}

function isValentinesDay({ date }: SeasonalEventContext) {
	return (
		date.getMonth() === VALENTINES_MONTH && date.getDate() === VALENTINES_DAY
	)
}

async function launchValentinesHearts() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for valentines canvas')
		}

		type HeartParticle = {
			x: number
			y: number
			vx: number
			vy: number
			size: number
			rotation: number
			rotationSpeed: number
			opacity: number
			gradient: (typeof HEARTS_GRADIENTS)[number]
			shape: (typeof HEARTS_SHAPES)[number]
			glow: number
			phase: number
			sway: number
			birthTime: number
			fadeDuration: number
			scaleFrom: number
		}

		let timeoutId: number | null = null
		let animationFrameId: number | null = null
		let hasCanceled = false
		let width = window.innerWidth
		let height = window.innerHeight
		let particles: HeartParticle[] = []
		let lastTime = performance.now()
		let overlay: HTMLDivElement | null = null
		let styleEl: HTMLStyleElement | null = null

		const randomGradient = () =>
			HEARTS_GRADIENTS[Math.floor(Math.random() * HEARTS_GRADIENTS.length)]
		const randomShape = () =>
			HEARTS_SHAPES[Math.floor(Math.random() * HEARTS_SHAPES.length)]
		const createParticle = (time: number): HeartParticle => ({
			x: randomInRange({
				min: -HEARTS_FIELD_MARGIN,
				max: width + HEARTS_FIELD_MARGIN,
			}),
			y: randomInRange({
				min: -HEARTS_FIELD_MARGIN,
				max: height + HEARTS_FIELD_MARGIN,
			}),
			vx: randomInRange(HEARTS_VELOCITY_X_RANGE),
			vy: randomInRange(HEARTS_VELOCITY_Y_RANGE),
			size: randomInRange(HEARTS_SIZE_RANGE),
			rotation: randomInRange({ min: 0, max: Math.PI * 2 }),
			rotationSpeed: randomInRange(HEARTS_ROTATION_SPEED_RANGE),
			opacity: randomInRange({ min: 0.45, max: 0.85 }),
			gradient: randomGradient(),
			shape: randomShape(),
			glow: randomInRange(HEARTS_GLOW_RANGE),
			phase: randomInRange({ min: 0, max: Math.PI * 2 }),
			sway: randomInRange(HEARTS_SWAY_RANGE),
			birthTime: time + randomInRange(HEARTS_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(HEARTS_FADE_IN_DURATION_RANGE),
			scaleFrom: randomInRange(HEARTS_SCALE_RANGE),
		})
		const resetParticles = (time: number) => {
			particles = Array.from({ length: HEARTS_FIELD_COUNT }, () =>
				createParticle(time),
			)
		}
		const respawnParticle = (particle: HeartParticle, time: number) => {
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
			const dpr = getCanvasDpr({ width, height, maxDpr: HEARTS_FIELD_MAX_DPR })

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
					particle.x < -HEARTS_FIELD_MARGIN ||
					particle.x > width + HEARTS_FIELD_MARGIN ||
					particle.y < -HEARTS_FIELD_MARGIN ||
					particle.y > height + HEARTS_FIELD_MARGIN
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
		const drawHeart = (size: number, shape: (typeof HEARTS_SHAPES)[number]) => {
			if (shape === 'arc') {
				const radius = size * 0.46
				const centerY = -size * 0.08
				const bottom = size * 0.95
				const leftCenterX = -radius
				const rightCenterX = radius

				context.beginPath()
				context.moveTo(0, bottom)
				context.quadraticCurveTo(
					-size * 1.05,
					size * 0.45,
					leftCenterX - radius,
					centerY,
				)
				context.arc(leftCenterX, centerY, radius, Math.PI, 0, false)
				context.arc(rightCenterX, centerY, radius, Math.PI, 0, false)
				context.quadraticCurveTo(size * 1.05, size * 0.45, 0, bottom)
				context.closePath()
				context.fill()
				return
			}

			const steps = 52
			const scale = size / 22

			context.beginPath()
			for (let i = 0; i <= steps; i += 1) {
				const t = (i / steps) * Math.PI * 2
				const sinT = Math.sin(t)
				const cosT = Math.cos(t)
				const x = 16 * Math.pow(sinT, 3)
				const y = -(
					13 * cosT -
					5 * Math.cos(2 * t) -
					2 * Math.cos(3 * t) -
					Math.cos(4 * t)
				)
				const px = x * scale
				const py = y * scale
				if (i === 0) {
					context.moveTo(px, py)
				} else {
					context.lineTo(px, py)
				}
			}
			context.closePath()
			context.fill()
		}
		const drawParticle = (particle: HeartParticle, time: number) => {
			const lifeProgress = (time - particle.birthTime) / particle.fadeDuration
			if (lifeProgress < 0) {
				return
			}

			const eased = easeOutCubic(Math.min(1, lifeProgress))
			const pulse =
				0.75 + Math.sin(time * 0.001 + particle.phase) * particle.sway * 0.05
			const scale = particle.scaleFrom + (1 - particle.scaleFrom) * eased

			context.save()
			context.translate(particle.x, particle.y)
			context.rotate(particle.rotation)
			context.scale(scale, scale)
			context.globalAlpha = particle.opacity * eased * pulse
			const gradient = context.createRadialGradient(
				0,
				0,
				particle.size * 0.15,
				0,
				0,
				particle.size,
			)
			gradient.addColorStop(0, particle.gradient.inner)
			gradient.addColorStop(0.55, particle.gradient.mid)
			gradient.addColorStop(1, particle.gradient.outer)
			context.fillStyle = gradient
			context.shadowColor = particle.gradient.mid
			context.shadowBlur = particle.glow * 1.5
			drawHeart(particle.size, particle.shape)
			context.restore()
		}
		const updateParticle = (
			particle: HeartParticle,
			delta: number,
			time: number,
		) => {
			if (time < particle.birthTime) {
				return
			}

			const sway = Math.sin(time * 0.001 + particle.phase) * particle.sway
			const lift =
				Math.cos(time * 0.0014 + particle.phase) * particle.sway * 0.5

			particle.x += (particle.vx + sway) * delta
			particle.y += (particle.vy + lift) * delta
			particle.rotation += particle.rotationSpeed * delta

			if (
				particle.x < -HEARTS_FIELD_MARGIN ||
				particle.x > width + HEARTS_FIELD_MARGIN ||
				particle.y < -HEARTS_FIELD_MARGIN ||
				particle.y > height + HEARTS_FIELD_MARGIN
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

		const mountHearts = () => {
			if (hasCanceled) return
			const style = document.createElement('style')
			const overlayNode = document.createElement('div')
			const glow = document.createElement('div')

			style.setAttribute('data-valentines', 'glow')
			style.textContent = `
@keyframes valentines-glow-reveal {
	0% { opacity: 0; transform: translate3d(0, 2%, 0) scale(1.02); }
	100% { opacity: ${HEARTS_GLOW_OPACITY}; transform: translate3d(0, 0, 0) scale(1); }
}
`

			overlayNode.setAttribute('aria-hidden', 'true')
			overlayNode.style.position = 'fixed'
			overlayNode.style.inset = '0'
			overlayNode.style.pointerEvents = 'none'
			overlayNode.style.zIndex = '0'
			overlayNode.style.mixBlendMode = 'screen'

			glow.style.position = 'absolute'
			glow.style.inset = '40% -10% -30% -10%'
			glow.style.background = HEARTS_GLOW_GRADIENT
			glow.style.opacity = shouldAnimate ? '0' : HEARTS_GLOW_OPACITY
			glow.style.filter = 'blur(26px)'
			glow.style.willChange = 'opacity, transform'

			if (shouldAnimate) {
				glow.style.animation =
					'valentines-glow-reveal 4s ease-out 0.8s forwards'
			}

			overlayNode.appendChild(glow)
			document.head.appendChild(style)
			document.body.appendChild(overlayNode)
			overlay = overlayNode
			styleEl = style

			canvas.setAttribute('aria-hidden', 'true')
			canvas.style.position = 'fixed'
			canvas.style.inset = '0'
			canvas.style.pointerEvents = 'none'
			canvas.style.zIndex = '1'
			canvas.style.opacity = HEARTS_FIELD_OPACITY
			canvas.style.filter = HEARTS_FIELD_FILTER
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

		timeoutId = window.setTimeout(mountHearts, HEARTS_MOUNT_DELAY_MS)

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
		console.error('Failed to launch valentines hearts', error)
		return () => {}
	}
}

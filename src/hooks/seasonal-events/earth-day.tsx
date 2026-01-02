import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'
import { Trans } from '@lingui/react/macro'

const EARTH_DAY_DATES = new Set([
	'2026-04-22',
	'2027-04-22',
	'2028-04-22',
	'2029-04-22',
	'2030-04-22',
	'2031-04-22',
	'2032-04-22',
	'2033-04-22',
	'2034-04-22',
	'2035-04-22',
	'2036-04-22',
	'2037-04-22',
	'2038-04-22',
	'2039-04-22',
	'2040-04-22',
	'2041-04-22',
	'2042-04-22',
	'2043-04-22',
])
const EARTH_FIELD_MOUNT_DELAY_MS = 900
const EARTH_FIELD_PARTICLE_COUNT = 90
const EARTH_FIELD_OPACITY = '0.78'
const EARTH_FIELD_FILTER = 'saturate(130%)'
const EARTH_FIELD_MAX_DPR = 2
const EARTH_FIELD_MARGIN = 140
const EARTH_GLOW_OPACITY = '0.35'
const EARTH_GLOW_GRADIENT =
	'radial-gradient(120% 90% at 50% 100%, rgba(34, 197, 94, 0.35), rgba(16, 185, 129, 0.18) 45%, rgba(15, 23, 42, 0) 75%)'
const EARTH_FIELD_FADE_IN_DELAY_RANGE = { min: 0, max: 2200 }
const EARTH_FIELD_FADE_IN_DURATION_RANGE = { min: 900, max: 1600 }
const EARTH_FIELD_SCALE_RANGE = { min: 0.4, max: 0.75 }
const EARTH_FIELD_KIND_POOL = [
	'leaf',
	'leaf',
	'leaf',
	'sprout',
	'sprout',
	'drop',
	'drop',
	'drop',
	'flower',
	'flower',
	'flower',
	'flower',
] as const
const EARTH_FIELD_COLORS = {
	leaf: ['#4ade80', '#22c55e', '#86efac'],
	sprout: ['#34d399', '#2dd4bf', '#a7f3d0'],
	drop: ['#7dd3fc', '#38bdf8', '#60a5fa'],
	flower: [
		'#fde68a',
		'#fbbf24',
		'#f9a8d4',
		'#f472b6',
		'#f0abfc',
		'#a5b4fc',
		'#c4b5fd',
		'#93c5fd',
		'#67e8f9',
		'#6ee7b7',
		'#34d399',
		'#fda4af',
		'#f97316',
		'#fb7185',
		'#f472b6',
		'#d946ef',
	],
} as const
const EARTH_FLOWER_GRADIENTS = [
	{ inner: '#fbcfe8', mid: '#f472b6', outer: '#fb7185' },
	{ inner: '#fecdd3', mid: '#fb7185', outer: '#f97316' },
	{ inner: '#fde68a', mid: '#facc15', outer: '#f59e0b' },
	{ inner: '#f5d0fe', mid: '#f0abfc', outer: '#c084fc' },
	{ inner: '#c7d2fe', mid: '#a5b4fc', outer: '#818cf8' },
	{ inner: '#e9d5ff', mid: '#d8b4fe', outer: '#a855f7' },
	{ inner: '#fed7aa', mid: '#fdba74', outer: '#fb923c' },
	{ inner: '#bbf7d0', mid: '#86efac', outer: '#4ade80' },
	{ inner: '#a7f3d0', mid: '#5eead4', outer: '#2dd4bf' },
	{ inner: '#bae6fd', mid: '#7dd3fc', outer: '#38bdf8' },
	{ inner: '#c7d2fe', mid: '#a5b4fc', outer: '#6366f1' },
	{ inner: '#fee2e2', mid: '#fca5a5', outer: '#f87171' },
	{ inner: '#fef3c7', mid: '#fcd34d', outer: '#f59e0b' },
	{ inner: '#dcfce7', mid: '#86efac', outer: '#22c55e' },
	{ inner: '#cffafe', mid: '#67e8f9', outer: '#22d3ee' },
	{ inner: '#fce7f3', mid: '#f9a8d4', outer: '#ec4899' },
	{ inner: '#ede9fe', mid: '#c4b5fd', outer: '#8b5cf6' },
	{ inner: '#ffe4e6', mid: '#fda4af', outer: '#fb7185' },
	{ inner: '#ffedd5', mid: '#fdba74', outer: '#f97316' },
] as const
const EARTH_FLOWER_CENTER_COLORS = ['#fef3c7', '#fde68a', '#facc15'] as const
const EARTH_FIELD_SIZE_RANGE = {
	leaf: { min: 12, max: 26 },
	sprout: { min: 10, max: 22 },
	drop: { min: 10, max: 20 },
	flower: { min: 12, max: 22 },
} as const
const EARTH_FIELD_VELOCITY = {
	leaf: { x: { min: -14, max: 14 }, y: { min: -10, max: -2 } },
	sprout: { x: { min: -10, max: 10 }, y: { min: -8, max: -1 } },
	drop: { x: { min: -8, max: 8 }, y: { min: -4, max: 6 } },
	flower: { x: { min: -8, max: 8 }, y: { min: -6, max: 3 } },
} as const
const EARTH_FIELD_GLOW_RANGE = {
	leaf: { min: 6, max: 14 },
	sprout: { min: 6, max: 12 },
	drop: { min: 4, max: 10 },
	flower: { min: 4, max: 12 },
} as const

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				Earth Day invites a pause to notice the planet that sustains us, and to
				consider how we care for it.
			</Trans>
		</p>
		<p>
			<Trans>
				It stands as both a celebration of the natural world and a call to
				responsible action.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				The first Earth Day, held in 1970, grew out of environmental activism
				and nationwide teach-ins across the United States.
			</Trans>
		</p>
		<p>
			<Trans>
				It has since become a global observance, often drawing attention to
				local ecosystems, conservation efforts, and environmental challenges.
			</Trans>
		</p>

		<h2>
			<Trans>Ways to observe</Trans>
		</h2>
		<p>
			<Trans>
				Community cleanups, tree planting, and habitat restoration are among the
				most common activities.
			</Trans>
		</p>
		<p>
			<Trans>
				Even small choices — repairing, reusing, conserving, or simply walking a
				familiar trail — reflect its underlying spirit.
			</Trans>
		</p>

		<h2>
			<Trans>Little wonder</Trans>
		</h2>
		<p>
			<Trans>
				Small actions accumulate: a planted tree, a cleared shoreline, a renewed
				path.
			</Trans>
		</p>
		<p>
			<Trans>
				It’s a quiet reminder that care for the world and a sense of wonder
				often move together.
			</Trans>
		</p>
	</>
)

export const earthDayEvent: SeasonalEvent = {
	id: 'earth-day',
	isActive: isEarthDay,
	run: launchEarthDay,
	details: EventDetails,
	tileAccent: {
		colors: ['#bbf7d0', '#5eead4', '#60a5fa', '#34d399', '#bbf7d0'],
	},
}

function isEarthDay({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return EARTH_DAY_DATES.has(`${year}-${month}-${day}`)
}

async function launchEarthDay() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for Earth Day canvas')
		}

		type ParticleKind = (typeof EARTH_FIELD_KIND_POOL)[number]
		type Particle = {
			x: number
			y: number
			vx: number
			vy: number
			size: number
			rotation: number
			rotationSpeed: number
			opacity: number
			kind: ParticleKind
			color: string
			glow: number
			phase: number
			sway: number
			pulse: number
			birthTime: number
			fadeDuration: number
			scaleFrom: number
			flowerPetal?: (typeof EARTH_FLOWER_GRADIENTS)[number]
			flowerCenter?: (typeof EARTH_FLOWER_CENTER_COLORS)[number]
		}

		let timeoutId: number | null = null
		let animationFrameId: number | null = null
		let hasCanceled = false
		let width = window.innerWidth
		let height = window.innerHeight
		let particles: Particle[] = []
		let lastTime = performance.now()
		let overlay: HTMLDivElement | null = null
		let styleEl: HTMLStyleElement | null = null

		const randomFromPool = <T,>(items: readonly T[]) =>
			items[Math.floor(Math.random() * items.length)]
		const createParticle = (time: number): Particle => {
			const kind = randomFromPool(EARTH_FIELD_KIND_POOL)
			const color = randomFromPool(EARTH_FIELD_COLORS[kind])
			const sizeRange = EARTH_FIELD_SIZE_RANGE[kind]
			const velocity = EARTH_FIELD_VELOCITY[kind]
			const glowRange = EARTH_FIELD_GLOW_RANGE[kind]
			const flowerPetal =
				kind === 'flower' ? randomFromPool(EARTH_FLOWER_GRADIENTS) : undefined
			const flowerCenter =
				kind === 'flower'
					? randomFromPool(EARTH_FLOWER_CENTER_COLORS)
					: undefined

			return {
				x: randomInRange({
					min: -EARTH_FIELD_MARGIN,
					max: width + EARTH_FIELD_MARGIN,
				}),
				y: randomInRange({
					min: -EARTH_FIELD_MARGIN,
					max: height + EARTH_FIELD_MARGIN,
				}),
				vx: randomInRange(velocity.x),
				vy: randomInRange(velocity.y),
				size: randomInRange(sizeRange),
				rotation: randomInRange({ min: 0, max: Math.PI * 2 }),
				rotationSpeed: randomInRange({ min: -0.5, max: 0.5 }),
				opacity: randomInRange({ min: 0.45, max: 0.85 }),
				kind,
				color,
				glow: randomInRange(glowRange),
				phase: randomInRange({ min: 0, max: Math.PI * 2 }),
				sway: randomInRange({ min: 1.5, max: 6 }),
				pulse: randomInRange({ min: 0.12, max: 0.28 }),
				birthTime: time + randomInRange(EARTH_FIELD_FADE_IN_DELAY_RANGE),
				fadeDuration: randomInRange(EARTH_FIELD_FADE_IN_DURATION_RANGE),
				scaleFrom: randomInRange(EARTH_FIELD_SCALE_RANGE),
				flowerPetal,
				flowerCenter,
			}
		}
		const resetParticles = (time: number) => {
			particles = Array.from({ length: EARTH_FIELD_PARTICLE_COUNT }, () =>
				createParticle(time),
			)
		}
		const respawnParticle = (particle: Particle, time: number) => {
			Object.assign(particle, createParticle(time))
		}
		const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)
		const resizeCanvas = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, EARTH_FIELD_MAX_DPR)
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
					particle.x < -EARTH_FIELD_MARGIN ||
					particle.x > width + EARTH_FIELD_MARGIN ||
					particle.y < -EARTH_FIELD_MARGIN ||
					particle.y > height + EARTH_FIELD_MARGIN
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

		const drawLeaf = (size: number) => {
			context.beginPath()
			context.moveTo(0, -size)
			context.quadraticCurveTo(size * 0.9, 0, 0, size)
			context.quadraticCurveTo(-size * 0.9, 0, 0, -size)
			context.closePath()
			context.fill()
			context.save()
			context.globalAlpha *= 0.5
			context.lineWidth = Math.max(1, size * 0.08)
			context.beginPath()
			context.moveTo(0, -size * 0.7)
			context.lineTo(0, size * 0.7)
			context.stroke()
			context.restore()
		}
		const drawSprout = (size: number) => {
			context.lineWidth = Math.max(1, size * 0.08)
			context.beginPath()
			context.moveTo(0, size * 0.2)
			context.lineTo(0, size * 1.1)
			context.stroke()
			context.save()
			context.translate(-size * 0.35, 0)
			context.rotate(-0.6)
			drawLeaf(size * 0.65)
			context.restore()
			context.save()
			context.translate(size * 0.35, 0)
			context.rotate(0.6)
			drawLeaf(size * 0.65)
			context.restore()
		}
		const drawDrop = (size: number) => {
			context.beginPath()
			context.moveTo(0, -size)
			context.quadraticCurveTo(size * 0.8, -size * 0.2, size * 0.45, size * 0.4)
			context.quadraticCurveTo(0, size * 0.95, -size * 0.45, size * 0.4)
			context.quadraticCurveTo(-size * 0.8, -size * 0.2, 0, -size)
			context.closePath()
			context.fill()
		}
		const drawFlower = (
			size: number,
			petalGradient?: (typeof EARTH_FLOWER_GRADIENTS)[number],
			centerColor?: (typeof EARTH_FLOWER_CENTER_COLORS)[number],
		) => {
			const petalRadius = size * 0.45
			const petalOffset = size * 0.6
			for (let i = 0; i < 5; i += 1) {
				const angle = (Math.PI * 2 * i) / 5
				const x = Math.cos(angle) * petalOffset
				const y = Math.sin(angle) * petalOffset
				if (petalGradient) {
					const gradient = context.createRadialGradient(
						x,
						y,
						petalRadius * 0.1,
						x,
						y,
						petalRadius,
					)
					gradient.addColorStop(0, petalGradient.inner)
					gradient.addColorStop(0.55, petalGradient.mid)
					gradient.addColorStop(1, petalGradient.outer)
					context.fillStyle = gradient
				}
				context.beginPath()
				context.arc(x, y, petalRadius, 0, Math.PI * 2)
				context.fill()
			}
			context.save()
			context.globalAlpha *= 0.85
			if (centerColor) {
				context.fillStyle = centerColor
			}
			context.beginPath()
			context.arc(0, 0, size * 0.32, 0, Math.PI * 2)
			context.fill()
			context.restore()
		}
		const drawParticle = (particle: Particle, time: number) => {
			const lifeProgress = (time - particle.birthTime) / particle.fadeDuration
			if (lifeProgress < 0) {
				return
			}
			const eased = easeOutCubic(Math.min(1, lifeProgress))
			const pulse =
				0.75 + Math.sin(time * 0.001 + particle.phase) * particle.pulse
			const scale = particle.scaleFrom + (1 - particle.scaleFrom) * eased

			context.save()
			context.translate(particle.x, particle.y)
			context.rotate(particle.rotation)
			context.scale(scale, scale)
			context.globalAlpha = particle.opacity * eased * pulse
			context.fillStyle = particle.color
			context.strokeStyle = particle.color
			context.shadowColor = particle.color
			context.shadowBlur = particle.glow

			switch (particle.kind) {
				case 'leaf':
					drawLeaf(particle.size)
					break
				case 'sprout':
					drawSprout(particle.size)
					break
				case 'drop':
					drawDrop(particle.size)
					break
				case 'flower':
					drawFlower(particle.size, particle.flowerPetal, particle.flowerCenter)
					break
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
				Math.cos(time * 0.0013 + particle.phase) * particle.sway * 0.6

			particle.x += (particle.vx + sway) * delta
			particle.y += (particle.vy + lift) * delta
			particle.rotation += particle.rotationSpeed * delta

			if (
				particle.x < -EARTH_FIELD_MARGIN ||
				particle.x > width + EARTH_FIELD_MARGIN ||
				particle.y < -EARTH_FIELD_MARGIN ||
				particle.y > height + EARTH_FIELD_MARGIN
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

		const mountField = () => {
			if (hasCanceled) return
			const style = document.createElement('style')
			const overlayNode = document.createElement('div')
			const glow = document.createElement('div')

			style.setAttribute('data-earth-day', 'glow')
			style.textContent = `
@keyframes earth-day-glow-reveal {
	0% { opacity: 0; transform: translate3d(0, 2%, 0) scale(1.02); }
	100% { opacity: ${EARTH_GLOW_OPACITY}; transform: translate3d(0, 0, 0) scale(1); }
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
			glow.style.background = EARTH_GLOW_GRADIENT
			glow.style.opacity = shouldAnimate ? '0' : EARTH_GLOW_OPACITY
			glow.style.filter = 'blur(26px)'
			glow.style.willChange = 'opacity, transform'

			if (shouldAnimate) {
				glow.style.animation = 'earth-day-glow-reveal 4s ease-out 0.8s forwards'
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
			canvas.style.opacity = EARTH_FIELD_OPACITY
			canvas.style.filter = EARTH_FIELD_FILTER
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

		timeoutId = window.setTimeout(mountField, EARTH_FIELD_MOUNT_DELAY_MS)

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
		console.error('Failed to launch Earth Day effect', error)
		return () => {}
	}
}

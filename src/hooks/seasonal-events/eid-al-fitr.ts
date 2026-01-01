import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'

const EID_AL_FITR_DATES = new Set([
	'2026-03-20',
	'2027-03-09',
	'2028-02-26',
	'2029-02-14',
	'2030-02-04',
	'2031-01-24',
	'2032-01-14',
	'2033-01-02',
	'2033-12-23',
	'2034-12-12',
	'2035-12-01',
	'2036-11-20',
	'2037-11-09',
	'2038-10-28',
	'2039-10-17',
	'2040-10-06',
	'2041-09-25',
	'2042-09-14',
	'2043-09-05',
])
const EID_MOUNT_DELAY_MS = 900
const EID_OVERLAY_OPACITY = '0.75'
const EID_OVERLAY_FILTER = 'saturate(125%)'
const EID_MAX_DPR = 2
const EID_STAR_COUNT = 90
const EID_STAR_RADIUS_RANGE = { min: 0.5, max: 1.6 }
const EID_STAR_OPACITY_RANGE = { min: 0.18, max: 0.55 }
const EID_STAR_TWINKLE_RANGE = { min: 0.0006, max: 0.0015 }
const EID_LANTERN_COUNT = 22
const EID_LANTERN_SIZE_RANGE = { min: 18, max: 36 }
const EID_LANTERN_SPEED_RANGE = { min: 8, max: 20 }
const EID_LANTERN_SWAY_RANGE = { min: 4, max: 14 }
const EID_LANTERN_OPACITY_RANGE = { min: 0.35, max: 0.75 }
const EID_LANTERN_FADE_IN_DELAY_RANGE = { min: 0, max: 1800 }
const EID_LANTERN_FADE_IN_DURATION_RANGE = { min: 1000, max: 2000 }
const EID_LANTERN_COLORS = [
	'rgba(253, 230, 138, 0.9)',
	'rgba(251, 191, 36, 0.85)',
	'rgba(94, 234, 212, 0.75)',
	'rgba(167, 139, 250, 0.7)',
]

export const eidAlFitrEvent: SeasonalEvent = {
	id: 'eid-al-fitr',
	isActive: isEidAlFitr,
	run: launchEidAlFitrGlow,
	tileAccent: {
		colors: ['#fef3c7', '#facc15', '#38bdf8', '#a78bfa', '#fef3c7'],
	},
}

function isEidAlFitr({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return EID_AL_FITR_DATES.has(`${year}-${month}-${day}`)
}

async function launchEidAlFitrGlow() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const overlay = document.createElement('div')
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to create 2D context for Eid canvas')
		}

		type Star = {
			x: number
			y: number
			radius: number
			opacity: number
			twinkle: number
			phase: number
		}
		type Lantern = {
			baseX: number
			y: number
			vy: number
			size: number
			opacity: number
			color: string
			sway: number
			phase: number
			birthTime: number
			fadeDuration: number
		}

		let timeoutId: number | null = null
		let animationFrameId: number | null = null
		let width = window.innerWidth
		let height = window.innerHeight
		let stars: Star[] = []
		let lanterns: Lantern[] = []
		let lastTime = performance.now()

		const randomLanternColor = () =>
			EID_LANTERN_COLORS[Math.floor(Math.random() * EID_LANTERN_COLORS.length)]

		const createStar = (): Star => ({
			x: Math.random() * width,
			y: Math.random() * height,
			radius: randomInRange(EID_STAR_RADIUS_RANGE),
			opacity: randomInRange(EID_STAR_OPACITY_RANGE),
			twinkle: randomInRange(EID_STAR_TWINKLE_RANGE),
			phase: Math.random() * Math.PI * 2,
		})

		const createLantern = (time: number): Lantern => ({
			baseX: Math.random() * width,
			y: height + Math.random() * height * 0.3,
			vy: randomInRange(EID_LANTERN_SPEED_RANGE),
			size: randomInRange(EID_LANTERN_SIZE_RANGE),
			opacity: randomInRange(EID_LANTERN_OPACITY_RANGE),
			color: randomLanternColor(),
			sway: randomInRange(EID_LANTERN_SWAY_RANGE),
			phase: Math.random() * Math.PI * 2,
			birthTime: time + randomInRange(EID_LANTERN_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(EID_LANTERN_FADE_IN_DURATION_RANGE),
		})

		const resetField = (time: number) => {
			stars = Array.from({ length: EID_STAR_COUNT }, createStar)
			lanterns = Array.from({ length: EID_LANTERN_COUNT }, () =>
				createLantern(time),
			)
		}

		const resizeCanvas = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, EID_MAX_DPR)
			width = window.innerWidth
			height = window.innerHeight
			canvas.width = Math.round(width * dpr)
			canvas.height = Math.round(height * dpr)
			canvas.style.width = `${width}px`
			canvas.style.height = `${height}px`
			context.setTransform(dpr, 0, 0, dpr, 0, 0)
			resetField(performance.now())
		}

		const drawCrescent = () => {
			const radius = Math.min(width, height) * 0.18
			const cx = width * 0.16
			const cy = height * 0.2
			context.save()
			context.globalAlpha = 1
			context.globalCompositeOperation = 'source-over'
			const glow = context.createRadialGradient(
				cx,
				cy,
				radius * 0.2,
				cx,
				cy,
				radius,
			)
			glow.addColorStop(0, 'rgba(255, 246, 214, 0.95)')
			glow.addColorStop(0.55, 'rgba(255, 236, 179, 0.55)')
			glow.addColorStop(1, 'rgba(255, 236, 179, 0)')
			context.fillStyle = glow
			context.beginPath()
			context.arc(cx, cy, radius, 0, Math.PI * 2)
			context.fill()
			const mask = context.createRadialGradient(
				cx + radius * 0.42,
				cy - radius * 0.12,
				radius * 0.2,
				cx + radius * 0.42,
				cy - radius * 0.12,
				radius * 0.95,
			)
			mask.addColorStop(0, '#1a1b1e')
			mask.addColorStop(0.82, '#1a1b1e')
			mask.addColorStop(1, 'rgba(26, 27, 30, 0)')
			context.fillStyle = mask
			context.beginPath()
			context.arc(
				cx + radius * 0.42,
				cy - radius * 0.12,
				radius * 0.95,
				0,
				Math.PI * 2,
			)
			context.fill()
			context.restore()
		}

		const drawStars = (time: number) => {
			context.fillStyle = 'rgba(226, 232, 240, 1)'
			for (const star of stars) {
				const twinkle = 0.6 + 0.4 * Math.sin(time * star.twinkle + star.phase)
				context.globalAlpha = star.opacity * twinkle
				context.beginPath()
				context.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
				context.fill()
			}
		}

		const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)

		const drawLantern = (lantern: Lantern, time: number, alpha: number) => {
			const sway = Math.sin(time * 0.0004 + lantern.phase) * lantern.sway
			const x = lantern.baseX + sway
			const y = lantern.y
			const radius = lantern.size * 1.2
			const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
			gradient.addColorStop(0, lantern.color)
			gradient.addColorStop(0.7, lantern.color.replace('0.', '0.25'))
			gradient.addColorStop(1, 'rgba(15, 23, 42, 0)')
			context.globalAlpha = alpha
			context.fillStyle = gradient
			context.beginPath()
			context.arc(x, y, radius, 0, Math.PI * 2)
			context.fill()
		}

		const tick = (time: number) => {
			const delta = Math.min(time - lastTime, 48)
			lastTime = time
			context.clearRect(0, 0, width, height)
			context.globalAlpha = 1
			drawCrescent()
			context.globalCompositeOperation = 'lighter'
			drawStars(time)

			for (const lantern of lanterns) {
				lantern.y -= (lantern.vy * delta) / 1000
				if (lantern.y < -lantern.size * 2) {
					Object.assign(lantern, createLantern(time))
				}

				const fadeProgress = Math.min(
					Math.max((time - lantern.birthTime) / lantern.fadeDuration, 0),
					1,
				)
				const fade = easeOutCubic(fadeProgress)
				drawLantern(lantern, time, lantern.opacity * fade)
			}

			if (shouldAnimate) {
				animationFrameId = window.requestAnimationFrame(tick)
			}
		}

		const drawStatic = () => {
			const now = performance.now()
			context.clearRect(0, 0, width, height)
			context.globalAlpha = 1
			drawCrescent()
			context.globalCompositeOperation = 'lighter'
			drawStars(now)
			for (let i = 0; i < Math.min(8, lanterns.length); i += 1) {
				const lantern = createLantern(now)
				lantern.baseX = width * (0.1 + i * 0.1)
				lantern.y = height * (0.85 - i * 0.06)
				drawLantern(lantern, now, lantern.opacity)
			}
		}

		overlay.style.position = 'fixed'
		overlay.style.inset = '0'
		overlay.style.pointerEvents = 'none'
		overlay.style.zIndex = '0'
		overlay.style.opacity = EID_OVERLAY_OPACITY
		overlay.style.filter = EID_OVERLAY_FILTER
		overlay.appendChild(canvas)

		const mount = () => {
			document.body.appendChild(overlay)
			resizeCanvas()
			if (shouldAnimate) {
				lastTime = performance.now()
				animationFrameId = window.requestAnimationFrame(tick)
			} else {
				drawStatic()
			}
		}

		timeoutId = window.setTimeout(mount, EID_MOUNT_DELAY_MS)

		const handleResize = () => {
			resizeCanvas()
			if (!shouldAnimate) {
				drawStatic()
			}
		}
		window.addEventListener('resize', handleResize)

		return () => {
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId)
			}
			if (animationFrameId !== null) {
				window.cancelAnimationFrame(animationFrameId)
			}
			window.removeEventListener('resize', handleResize)
			if (overlay.parentElement) {
				overlay.parentElement.removeChild(overlay)
			}
		}
	} catch (error) {
		console.error('Failed to launch Eid al-Fitr glow', error)
		return () => {}
	}
}

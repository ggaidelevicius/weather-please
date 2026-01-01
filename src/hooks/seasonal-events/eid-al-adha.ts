import { randomInRange } from './utils'
import type { SeasonalEvent, SeasonalEventContext } from './types'

const EID_AL_ADHA_DATES = new Set([
	'2024-06-16',
	'2025-06-06',
	'2026-05-27',
	'2027-05-17',
	'2028-05-05',
	'2029-04-24',
	'2030-04-14',
	'2031-04-02',
	'2032-03-22',
	'2033-03-11',
	'2034-03-01',
	'2035-02-18',
	'2036-02-07',
])
const EID_ADHA_MOUNT_DELAY_MS = 900
const EID_ADHA_OVERLAY_OPACITY = '0.72'
const EID_ADHA_OVERLAY_FILTER = 'saturate(120%)'
const EID_ADHA_MAX_DPR = 2
const EID_ADHA_STAR_COUNT = 140
const EID_ADHA_STAR_RADIUS_RANGE = { min: 0.5, max: 1.5 }
const EID_ADHA_STAR_OPACITY_RANGE = { min: 0.2, max: 0.55 }
const EID_ADHA_STAR_TWINKLE_RANGE = { min: 0.0005, max: 0.0013 }
const EID_ADHA_EMBER_COUNT = 26
const EID_ADHA_EMBER_SIZE_RANGE = { min: 6, max: 14 }
const EID_ADHA_EMBER_SPEED_RANGE = { min: 8, max: 18 }
const EID_ADHA_EMBER_SWAY_RANGE = { min: 6, max: 16 }
const EID_ADHA_EMBER_OPACITY_RANGE = { min: 0.35, max: 0.75 }
const EID_ADHA_EMBER_FADE_IN_DELAY_RANGE = { min: 0, max: 2000 }
const EID_ADHA_EMBER_FADE_IN_DURATION_RANGE = { min: 1100, max: 2200 }
const EID_ADHA_SCENE_FADE_DELAY_MS = 300
const EID_ADHA_SCENE_FADE_DURATION_MS = 1400
const EID_ADHA_EMBER_COLORS = [
	'rgba(254, 243, 199, 0.9)',
	'rgba(253, 230, 138, 0.85)',
	'rgba(251, 191, 36, 0.78)',
	'rgba(245, 158, 11, 0.68)',
	'rgba(52, 211, 153, 0.6)',
]

export const eidAlAdhaEvent: SeasonalEvent = {
	id: 'eid-al-adha',
	isActive: isEidAlAdha,
	run: launchEidAlAdhaGlow,
	tileAccent: {
		colors: ['#fef3c7', '#fbbf24', '#f59e0b', '#34d399', '#fef3c7'],
	},
}

function isEidAlAdha({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return EID_AL_ADHA_DATES.has(`${year}-${month}-${day}`)
}

async function launchEidAlAdhaGlow() {
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
			throw new Error('Unable to create 2D context for Eid al-Adha canvas')
		}

		type Star = {
			x: number
			y: number
			radius: number
			opacity: number
			twinkle: number
			phase: number
		}
		type Ember = {
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
		let embers: Ember[] = []
		let lastTime = performance.now()
		let sceneFadeStart = performance.now()

		const randomEmberColor = () =>
			EID_ADHA_EMBER_COLORS[
				Math.floor(Math.random() * EID_ADHA_EMBER_COLORS.length)
			]

		const createStar = (): Star => ({
			x: Math.random() * width,
			y: Math.random() * height,
			radius: randomInRange(EID_ADHA_STAR_RADIUS_RANGE),
			opacity: randomInRange(EID_ADHA_STAR_OPACITY_RANGE),
			twinkle: randomInRange(EID_ADHA_STAR_TWINKLE_RANGE),
			phase: Math.random() * Math.PI * 2,
		})

		const createEmber = (time: number): Ember => ({
			baseX: Math.random() * width,
			y: height + Math.random() * height * 0.35,
			vy: randomInRange(EID_ADHA_EMBER_SPEED_RANGE),
			size: randomInRange(EID_ADHA_EMBER_SIZE_RANGE),
			opacity: randomInRange(EID_ADHA_EMBER_OPACITY_RANGE),
			color: randomEmberColor(),
			sway: randomInRange(EID_ADHA_EMBER_SWAY_RANGE),
			phase: Math.random() * Math.PI * 2,
			birthTime: time + randomInRange(EID_ADHA_EMBER_FADE_IN_DELAY_RANGE),
			fadeDuration: randomInRange(EID_ADHA_EMBER_FADE_IN_DURATION_RANGE),
		})

		const resetField = (time: number) => {
			stars = Array.from({ length: EID_ADHA_STAR_COUNT }, createStar)
			embers = Array.from({ length: EID_ADHA_EMBER_COUNT }, () =>
				createEmber(time),
			)
		}

		const resizeCanvas = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, EID_ADHA_MAX_DPR)
			width = window.innerWidth
			height = window.innerHeight
			canvas.width = Math.round(width * dpr)
			canvas.height = Math.round(height * dpr)
			canvas.style.width = `${width}px`
			canvas.style.height = `${height}px`
			context.setTransform(dpr, 0, 0, dpr, 0, 0)
			resetField(performance.now())
		}

		const drawCrescent = (alpha: number) => {
			const radius = Math.min(width, height) * 0.12
			const cx = width * 0.8
			const cy = height * 0.2
			context.save()
			context.globalAlpha = alpha
			context.globalCompositeOperation = 'source-over'
			const glow = context.createRadialGradient(
				cx,
				cy,
				radius * 0.25,
				cx,
				cy,
				radius,
			)
			glow.addColorStop(0, 'rgba(255, 246, 214, 0.9)')
			glow.addColorStop(0.55, 'rgba(255, 220, 140, 0.55)')
			glow.addColorStop(1, 'rgba(255, 220, 140, 0)')
			context.fillStyle = glow
			context.beginPath()
			context.arc(cx, cy, radius, 0, Math.PI * 2)
			context.fill()

			context.globalAlpha = 1
			context.fillStyle = '#1a1b1e'
			context.beginPath()
			context.arc(
				cx + radius * 0.4,
				cy - radius * 0.1,
				radius * 0.9,
				0,
				Math.PI * 2,
			)
			context.fill()
			context.restore()
		}

		const drawStars = (time: number, alpha: number) => {
			context.fillStyle = 'rgba(226, 232, 240, 1)'
			for (const star of stars) {
				const twinkle = 0.65 + 0.35 * Math.sin(time * star.twinkle + star.phase)
				context.globalAlpha = alpha * star.opacity * twinkle
				context.beginPath()
				context.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
				context.fill()
			}
		}

		const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)

		const drawEmber = (
			ember: Ember,
			time: number,
			alpha: number,
			sceneAlpha: number,
		) => {
			const sway = Math.sin(time * 0.0005 + ember.phase) * ember.sway
			const x = ember.baseX + sway
			const y = ember.y
			const radius = ember.size * 1.4
			const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
			gradient.addColorStop(0, ember.color)
			gradient.addColorStop(0.7, ember.color.replace('0.', '0.22'))
			gradient.addColorStop(1, 'rgba(15, 23, 42, 0)')
			context.globalAlpha = alpha * sceneAlpha
			context.fillStyle = gradient
			context.beginPath()
			context.arc(x, y, radius, 0, Math.PI * 2)
			context.fill()
		}

		const tick = (time: number) => {
			const delta = Math.min(time - lastTime, 48)
			lastTime = time
			const sceneFadeProgress = Math.min(
				Math.max((time - sceneFadeStart) / EID_ADHA_SCENE_FADE_DURATION_MS, 0),
				1,
			)
			const sceneAlpha = easeOutCubic(sceneFadeProgress)
			context.clearRect(0, 0, width, height)
			drawCrescent(sceneAlpha)
			context.globalCompositeOperation = 'lighter'
			drawStars(time, sceneAlpha)

			for (const ember of embers) {
				ember.y -= (ember.vy * delta) / 1000
				if (ember.y < -ember.size * 2) {
					Object.assign(ember, createEmber(time))
				}

				const fadeProgress = Math.min(
					Math.max((time - ember.birthTime) / ember.fadeDuration, 0),
					1,
				)
				const fade = easeOutCubic(fadeProgress)
				drawEmber(ember, time, ember.opacity * fade, sceneAlpha)
			}

			if (shouldAnimate) {
				animationFrameId = window.requestAnimationFrame(tick)
			}
		}

		const drawStatic = () => {
			const now = performance.now()
			context.clearRect(0, 0, width, height)
			drawCrescent(1)
			context.globalCompositeOperation = 'lighter'
			drawStars(now, 1)
			for (let i = 0; i < Math.min(7, embers.length); i += 1) {
				const ember = createEmber(now)
				ember.baseX = width * (0.12 + i * 0.12)
				ember.y = height * (0.82 - i * 0.05)
				drawEmber(ember, now, ember.opacity, 1)
			}
		}

		overlay.style.position = 'fixed'
		overlay.style.inset = '0'
		overlay.style.pointerEvents = 'none'
		overlay.style.zIndex = '0'
		overlay.style.opacity = EID_ADHA_OVERLAY_OPACITY
		overlay.style.filter = EID_ADHA_OVERLAY_FILTER
		overlay.appendChild(canvas)

		const mount = () => {
			document.body.appendChild(overlay)
			resizeCanvas()
			sceneFadeStart = performance.now() + EID_ADHA_SCENE_FADE_DELAY_MS
			if (shouldAnimate) {
				lastTime = performance.now()
				animationFrameId = window.requestAnimationFrame(tick)
			} else {
				drawStatic()
			}
		}

		timeoutId = window.setTimeout(mount, EID_ADHA_MOUNT_DELAY_MS)

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
		console.error('Failed to launch Eid al-Adha glow', error)
		return () => {}
	}
}

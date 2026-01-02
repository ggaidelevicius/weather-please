import type { SeasonalEvent, SeasonalEventContext } from './types'

const TOTAL_LUNAR_ECLIPSE_DATES = new Set([
	'2025-03-14',
	'2025-09-07',
	'2026-03-03',
	'2028-12-31',
	'2029-01-01',
	'2029-06-25',
	'2029-06-26',
	'2029-12-20',
	'2029-12-21',
	'2032-04-25',
	'2032-04-26',
	'2032-10-18',
	'2032-10-19',
	'2033-04-14',
	'2033-04-15',
	'2033-10-07',
	'2033-10-08',
	'2036-02-11',
	'2036-02-12',
	'2040-05-26',
	'2040-11-18',
	'2040-11-19',
	'2043-03-25',
	'2043-03-26',
	'2043-09-18',
	'2043-09-19',
])
const LUNAR_ECLIPSE_MOUNT_DELAY_MS = 900

export const totalLunarEclipseEvent: SeasonalEvent = {
	id: 'total-lunar-eclipse',
	isActive: isTotalLunarEclipse,
	run: launchTotalLunarEclipse,
	tileAccent: {
		colors: ['#1f2937', '#7f1d1d', '#ef4444', '#fca5a5', '#1f2937'],
	},
}

function isTotalLunarEclipse({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return TOTAL_LUNAR_ECLIPSE_DATES.has(`${year}-${month}-${day}`)
}

async function launchTotalLunarEclipse() {
	try {
		if (typeof window === 'undefined') {
			return () => {}
		}

		const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)')
			.matches
		const style = document.createElement('style')
		const overlay = document.createElement('div')
		const backdrop = document.createElement('div')
		const container = document.createElement('div')
		const glow = document.createElement('div')
		const shadow = document.createElement('div')
		const moon = document.createElement('div')
		const haze = document.createElement('div')

		style.textContent = `
			.wp-lunar-eclipse-overlay {
				position: fixed;
				inset: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				pointer-events: none;
				z-index: 0;
				--eclipse-fade: 0;
			}
			.wp-lunar-eclipse-backdrop,
			.wp-lunar-eclipse-layer {
				opacity: calc(var(--eclipse-fade) * var(--eclipse-layer-opacity, 1));
				transition: opacity 1200ms ease;
			}
			.wp-lunar-eclipse-layer {
				--eclipse-layer-opacity: 1;
				transform: scale(0.98);
				transition: opacity 1200ms ease, transform 1600ms ease;
			}
			.wp-lunar-eclipse-layer--glow {
				transition-delay: 0ms;
			}
			.wp-lunar-eclipse-layer--shadow {
				transition-delay: 120ms;
			}
			.wp-lunar-eclipse-layer--moon {
				transition-delay: 220ms;
			}
			.wp-lunar-eclipse-layer--haze {
				transition-delay: 320ms;
			}
			.wp-lunar-eclipse-overlay.is-visible {
				--eclipse-fade: 1;
			}
			.wp-lunar-eclipse-overlay.is-visible .wp-lunar-eclipse-layer {
				transform: scale(1);
			}
			.wp-lunar-eclipse-backdrop {
				position: absolute;
				inset: 0;
				background: radial-gradient(120% 120% at 50% 50%, rgba(15, 23, 42, 0.35), rgba(2, 6, 23, 0.92));
			}
			.wp-lunar-eclipse-container {
				position: relative;
				width: min(70vw, 70vh);
				height: min(70vw, 70vh);
			}
			.wp-lunar-eclipse-glow {
				position: absolute;
				inset: 0;
				border-radius: 9999px;
				--eclipse-layer-opacity: 0.6;
				background: radial-gradient(circle, rgba(248, 113, 113, 0.35) 0%, rgba(248, 113, 113, 0.18) 38%, rgba(15, 23, 42, 0) 72%);
				filter: blur(18px);
				animation: lunar-eclipse-pulse 6s ease-in-out infinite;
			}
			.wp-lunar-eclipse-shadow {
				position: absolute;
				inset: 10%;
				border-radius: 9999px;
				--eclipse-layer-opacity: 0.65;
				background: radial-gradient(circle at 60% 40%, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0.5));
				filter: blur(8px);
			}
			.wp-lunar-eclipse-moon {
				position: absolute;
				inset: 20%;
				border-radius: 9999px;
				--eclipse-layer-opacity: 0.95;
				background: radial-gradient(circle at 35% 35%, rgba(220, 38, 38, 0.96), rgba(127, 29, 29, 0.98));
				box-shadow: 0 0 30px rgba(185, 28, 28, 0.6);
			}
			.wp-lunar-eclipse-haze {
				position: absolute;
				inset: 6%;
				border-radius: 9999px;
				--eclipse-layer-opacity: 0.45;
				background: radial-gradient(circle, rgba(248, 113, 113, 0.25), rgba(2, 6, 23, 0));
				filter: blur(22px);
			}
			@keyframes lunar-eclipse-pulse {
				0%, 100% { transform: scale(0.98); }
				50% { transform: scale(1.04); }
			}
		`

		overlay.className = 'wp-lunar-eclipse-overlay'
		backdrop.className = 'wp-lunar-eclipse-backdrop'
		container.className = 'wp-lunar-eclipse-container'
		glow.className =
			'wp-lunar-eclipse-glow wp-lunar-eclipse-layer wp-lunar-eclipse-layer--glow'
		shadow.className =
			'wp-lunar-eclipse-shadow wp-lunar-eclipse-layer wp-lunar-eclipse-layer--shadow'
		moon.className =
			'wp-lunar-eclipse-moon wp-lunar-eclipse-layer wp-lunar-eclipse-layer--moon'
		haze.className =
			'wp-lunar-eclipse-haze wp-lunar-eclipse-layer wp-lunar-eclipse-layer--haze'

		if (!shouldAnimate) {
			glow.style.animation = 'none'
		}

		container.appendChild(glow)
		container.appendChild(shadow)
		container.appendChild(moon)
		container.appendChild(haze)
		overlay.appendChild(backdrop)
		overlay.appendChild(container)

		let timeoutId: number | null = null

		const mount = () => {
			document.head.appendChild(style)
			document.body.appendChild(overlay)
			requestAnimationFrame(() => {
				overlay.getBoundingClientRect()
				overlay.classList.add('is-visible')
			})
		}

		timeoutId = window.setTimeout(mount, LUNAR_ECLIPSE_MOUNT_DELAY_MS)

		return () => {
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId)
			}
			if (overlay.parentElement) {
				overlay.parentElement.removeChild(overlay)
			}
			if (style.parentElement) {
				style.parentElement.removeChild(style)
			}
		}
	} catch (error) {
		console.error('Failed to launch total lunar eclipse event', error)
		return () => {}
	}
}

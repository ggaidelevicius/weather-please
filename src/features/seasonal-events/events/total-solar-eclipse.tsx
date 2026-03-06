import {
	SeasonalEventId,
	type SeasonalEvent,
	type SeasonalEventContext,
} from '../core/types'
import { Trans } from '@lingui/react/macro'
import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'

const TOTAL_SOLAR_ECLIPSE_DATES = new Set([
	'2026-08-12',
	'2027-08-02',
	'2028-07-22',
	'2030-11-25',
	'2031-11-14',
	'2033-03-30',
	'2034-03-20',
	'2035-09-01',
	'2035-09-02',
	'2037-07-13',
	'2038-12-26',
	'2039-12-15',
	'2041-04-30',
	'2042-04-20',
	'2043-04-09',
])
const ECLIPSE_MOUNT_DELAY_MS = 900

const EventDetails = () => (
	<>
		<h2>
			<Trans>Overview</Trans>
		</h2>
		<p>
			<Trans>
				A total solar eclipse occurs when the Moon moves directly in front of
				the Sun, briefly transforming daylight into twilight.
			</Trans>
		</p>
		<p>
			<Trans>
				The phase of totality is short and can only be seen from a narrow path
				across the Earth’s surface.
			</Trans>
		</p>

		<h2>
			<Trans>History and meaning</Trans>
		</h2>
		<p>
			<Trans>
				Solar eclipses have been recorded for thousands of years, inspiring awe,
				uncertainty, and careful study.
			</Trans>
		</p>
		<p>
			<Trans>
				Today, many people travel great distances to stand within the path of
				totality.
			</Trans>
		</p>

		<h2>
			<Trans>What it feels like</Trans>
		</h2>
		<p>
			<Trans>
				Light shifts to a silvery tone, shadows sharpen, and temperatures may
				drop noticeably within minutes.
			</Trans>
		</p>
		<p>
			<Trans>
				Animals can grow quiet, while the horizon glows like a complete circle
				of sunset.
			</Trans>
		</p>

		<h2>
			<Trans>Good to know</Trans>
		</h2>
		<p>
			<Trans>
				During totality, the Sun’s corona — normally invisible — appears as a
				shimmering halo of white light. Bright stars and planets become visible
				in the middle of the day.
			</Trans>
		</p>
		<p>
			<Trans>
				Eclipse glasses are essential during all partial phases. Only during the
				brief seconds of total coverage is it safe to look with the naked eye.
			</Trans>
		</p>
	</>
)

export const totalSolarEclipseEvent: SeasonalEvent = {
	id: SeasonalEventId.TotalSolarEclipse,
	isActive: isTotalSolarEclipse,
	run: launchTotalSolarEclipse,
	details: EventDetails,
	tileAccent: {
		colors: ['#0f172a', '#334155', '#fbbf24', '#fde68a', '#0f172a'],
	},
}

function isTotalSolarEclipse({ date }: SeasonalEventContext) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return TOTAL_SOLAR_ECLIPSE_DATES.has(`${year}-${month}-${day}`)
}

async function launchTotalSolarEclipse() {
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
		const backdrop = document.createElement('div')
		const container = document.createElement('div')
		const corona = document.createElement('div')
		const glow = document.createElement('div')
		const ring = document.createElement('div')
		const moon = document.createElement('div')

		style.textContent = `
			.wp-eclipse-overlay {
				position: fixed;
				inset: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				pointer-events: none;
				z-index: 0;
				--eclipse-fade: 0;
			}
			.wp-eclipse-backdrop,
			.wp-eclipse-layer {
				opacity: calc(var(--eclipse-fade) * var(--eclipse-layer-opacity, 1));
				transition: opacity 1200ms ease;
			}
			.wp-eclipse-layer {
				--eclipse-layer-opacity: 1;
				transform: scale(0.98);
				transition: opacity 1200ms ease, transform 1600ms ease;
			}
			.wp-eclipse-layer--corona {
				transition-delay: 0ms;
			}
			.wp-eclipse-layer--glow {
				transition-delay: 120ms;
			}
			.wp-eclipse-layer--ring {
				transition-delay: 200ms;
			}
			.wp-eclipse-layer--moon {
				transition-delay: 280ms;
			}
			.wp-eclipse-overlay.is-visible {
				--eclipse-fade: 1;
			}
			.wp-eclipse-overlay.is-visible .wp-eclipse-layer {
				transform: scale(1);
			}
			.wp-eclipse-overlay.no-motion .wp-eclipse-corona,
			.wp-eclipse-overlay.no-motion .wp-eclipse-glow,
			.wp-eclipse-overlay.no-motion .wp-eclipse-corona::before {
				animation: none !important;
			}
			.wp-eclipse-backdrop {
				position: absolute;
				inset: 0;
				background: radial-gradient(120% 120% at 50% 50%, rgba(15, 23, 42, 0.35), rgba(2, 6, 23, 0.92));
			}
			.wp-eclipse-container {
				position: relative;
				width: min(70vw, 70vh);
				height: min(70vw, 70vh);
			}
			.wp-eclipse-corona {
				position: absolute;
				inset: 0;
				border-radius: 9999px;
				--eclipse-layer-opacity: 0.75;
				background: radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, rgba(251, 191, 36, 0.2) 38%, rgba(15, 23, 42, 0) 70%);
				filter: blur(12px);
				mix-blend-mode: screen;
				animation: eclipse-corona-pulse 6s ease-in-out infinite;
				overflow: hidden;
			}
			.wp-eclipse-corona::before {
				content: '';
				position: absolute;
				inset: 0;
				border-radius: inherit;
				background: conic-gradient(
					from 18deg,
					rgba(251, 191, 36, 0.18),
					rgba(226, 232, 240, 0.04) 18%,
					rgba(251, 191, 36, 0.14) 32%,
					rgba(226, 232, 240, 0.03) 48%,
					rgba(251, 191, 36, 0.16) 63%,
					rgba(226, 232, 240, 0.03) 78%,
					rgba(251, 191, 36, 0.14)
				);
				filter: blur(14px);
				opacity: 0.42;
				animation: eclipse-glow-spin 70s linear infinite reverse;
			}
			.wp-eclipse-corona::after {
				content: '';
				position: absolute;
				inset: 8%;
				border-radius: inherit;
				background:
					radial-gradient(ellipse at 22% 36%, rgba(251, 191, 36, 0.18) 0%, rgba(15, 23, 42, 0) 24%),
					radial-gradient(ellipse at 74% 30%, rgba(251, 191, 36, 0.16) 0%, rgba(15, 23, 42, 0) 22%),
					radial-gradient(ellipse at 62% 74%, rgba(251, 191, 36, 0.15) 0%, rgba(15, 23, 42, 0) 26%);
				filter: blur(10px);
				opacity: 0.32;
			}
			.wp-eclipse-glow {
				position: absolute;
				inset: 4%;
				border-radius: 9999px;
				--eclipse-layer-opacity: 0.7;
				background: conic-gradient(from 0deg, rgba(251, 191, 36, 0.16), rgba(226, 232, 240, 0.05), rgba(251, 191, 36, 0.12));
				filter: blur(18px);
				animation: eclipse-glow-spin 100s linear infinite;
			}
			.wp-eclipse-ring {
				position: absolute;
				inset: 16%;
				border-radius: 9999px;
				--eclipse-layer-opacity: 0.85;
				border: 1px solid rgba(251, 191, 36, 0.25);
				box-shadow: 0 0 40px rgba(251, 191, 36, 0.55), 0 0 120px rgba(251, 191, 36, 0.25);
			}
			.wp-eclipse-moon {
				position: absolute;
				inset: 22%;
				border-radius: 9999px;
				--eclipse-layer-opacity: 0.95;
				background: radial-gradient(circle at 35% 35%, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
				box-shadow:
					0 0 35px rgba(2, 6, 23, 0.65),
					inset 10px -14px 26px rgba(2, 6, 23, 0.45),
					inset -6px 10px 18px rgba(148, 163, 184, 0.05);
				overflow: hidden;
			}
			.wp-eclipse-moon::before {
				content: '';
				position: absolute;
				inset: 0;
				border-radius: inherit;
				background:
					radial-gradient(ellipse at 30% 38%, rgba(71, 85, 105, 0.2) 0%, rgba(2, 6, 23, 0) 34%),
					radial-gradient(ellipse at 68% 34%, rgba(71, 85, 105, 0.16) 0%, rgba(2, 6, 23, 0) 28%),
					radial-gradient(ellipse at 46% 64%, rgba(71, 85, 105, 0.14) 0%, rgba(2, 6, 23, 0) 30%),
					radial-gradient(ellipse at 74% 70%, rgba(71, 85, 105, 0.12) 0%, rgba(2, 6, 23, 0) 24%);
				mix-blend-mode: soft-light;
				filter: blur(0.6px);
				opacity: 0.28;
			}
			@keyframes eclipse-corona-pulse {
				0%, 100% { transform: scale(0.98); }
				50% { transform: scale(1.04); }
			}
			@keyframes eclipse-glow-spin {
				from { transform: rotate(0deg); }
				to { transform: rotate(360deg); }
			}
		`

		overlay.className = 'wp-eclipse-overlay'
		backdrop.className = 'wp-eclipse-backdrop'
		container.className = 'wp-eclipse-container'
		corona.className =
			'wp-eclipse-corona wp-eclipse-layer wp-eclipse-layer--corona'
		glow.className = 'wp-eclipse-glow wp-eclipse-layer wp-eclipse-layer--glow'
		ring.className = 'wp-eclipse-ring wp-eclipse-layer wp-eclipse-layer--ring'
		moon.className = 'wp-eclipse-moon wp-eclipse-layer wp-eclipse-layer--moon'

		if (!shouldAnimate) {
			overlay.classList.add('no-motion')
			corona.style.animation = 'none'
			glow.style.animation = 'none'
		}

		container.appendChild(corona)
		container.appendChild(glow)
		container.appendChild(ring)
		container.appendChild(moon)
		overlay.appendChild(backdrop)
		overlay.appendChild(container)

		let timeoutId: number | null = null

		const mount = () => {
			document.head.appendChild(style)
			document.body.appendChild(overlay)
			animationController.requestAnimationFrame(() => {
				overlay.getBoundingClientRect()
				overlay.classList.add('is-visible')
			})
		}

		timeoutId = window.setTimeout(mount, ECLIPSE_MOUNT_DELAY_MS)

		return () => {
			animationController.dispose()
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
		console.error('Failed to launch total solar eclipse event', error)
		return () => {}
	}
}

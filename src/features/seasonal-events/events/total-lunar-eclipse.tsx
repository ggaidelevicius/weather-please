import { createSettingsModalAnimationController } from '../../../shared/lib/settings-modal-animation-controller'

const LUNAR_ECLIPSE_MOUNT_DELAY_MS = 900

export async function launchTotalLunarEclipse() {
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
				background:
					radial-gradient(circle at 28% 26%, rgba(254, 226, 226, 0.3) 0%, rgba(220, 38, 38, 0) 34%),
					radial-gradient(circle at 66% 70%, rgba(69, 10, 10, 0.35) 0%, rgba(127, 29, 29, 0) 44%),
					radial-gradient(circle at 52% 48%, rgba(220, 38, 38, 0.97) 0%, rgba(127, 29, 29, 0.98) 70%, rgba(69, 10, 10, 1) 100%);
				box-shadow:
					0 0 30px rgba(185, 28, 28, 0.6),
					inset 18px -20px 34px rgba(69, 10, 10, 0.42),
					inset -10px 12px 22px rgba(254, 226, 226, 0.1);
				overflow: hidden;
			}
			.wp-lunar-eclipse-moon::before {
				content: '';
				position: absolute;
				inset: 0;
				border-radius: inherit;
				background:
					radial-gradient(ellipse at 30% 38%, rgba(69, 10, 10, 0.48) 0%, rgba(69, 10, 10, 0) 34%),
					radial-gradient(ellipse at 67% 36%, rgba(69, 10, 10, 0.35) 0%, rgba(69, 10, 10, 0) 28%),
					radial-gradient(ellipse at 47% 58%, rgba(69, 10, 10, 0.42) 0%, rgba(69, 10, 10, 0) 30%),
					radial-gradient(ellipse at 74% 68%, rgba(69, 10, 10, 0.28) 0%, rgba(69, 10, 10, 0) 24%),
					radial-gradient(ellipse at 36% 74%, rgba(69, 10, 10, 0.26) 0%, rgba(69, 10, 10, 0) 22%);
				mix-blend-mode: multiply;
				filter: blur(0.3px);
				opacity: 0.74;
			}
			.wp-lunar-eclipse-moon::after {
				content: '';
				position: absolute;
				inset: 0;
				border-radius: inherit;
				background:
					radial-gradient(circle at 26% 24%, rgba(254, 226, 226, 0.08) 0%, rgba(127, 29, 29, 0) 4.8%),
					radial-gradient(circle at 38% 30%, rgba(254, 226, 226, 0.06) 0%, rgba(127, 29, 29, 0) 4.2%),
					radial-gradient(circle at 62% 26%, rgba(254, 226, 226, 0.05) 0%, rgba(127, 29, 29, 0) 4.6%),
					radial-gradient(circle at 72% 42%, rgba(254, 226, 226, 0.06) 0%, rgba(127, 29, 29, 0) 4.4%),
					radial-gradient(circle at 44% 52%, rgba(254, 226, 226, 0.06) 0%, rgba(127, 29, 29, 0) 4.4%),
					radial-gradient(circle at 56% 66%, rgba(254, 226, 226, 0.05) 0%, rgba(127, 29, 29, 0) 4.6%),
					radial-gradient(circle at 30% 68%, rgba(254, 226, 226, 0.06) 0%, rgba(127, 29, 29, 0) 4.2%),
					radial-gradient(circle at 78% 72%, rgba(254, 226, 226, 0.05) 0%, rgba(127, 29, 29, 0) 4.6%),
					radial-gradient(circle at 80% 50%, rgba(2, 6, 23, 0.28) 0%, rgba(2, 6, 23, 0) 22%);
				filter: saturate(110%) blur(1.2px);
				mix-blend-mode: soft-light;
				opacity: 0.34;
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

		let timeoutId: null | number = null

		const mount = () => {
			document.head.appendChild(style)
			document.body.appendChild(overlay)
			animationController.requestAnimationFrame(() => {
				overlay.getBoundingClientRect()
				overlay.classList.add('is-visible')
			})
		}

		timeoutId = window.setTimeout(mount, LUNAR_ECLIPSE_MOUNT_DELAY_MS)

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
		console.error('Failed to launch total lunar eclipse event', error)
		return () => {}
	}
}

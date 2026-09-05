import { motion } from 'framer-motion'
import type { ForecastViewId } from '../model/view-navigation'

const DETAIL_FALLBACK_AURORA_GRADIENTS: Record<ForecastViewId, string> = {
	'air-quality':
		'radial-gradient(120% 80% at 15% 0%, rgba(20, 184, 166, 0.21), rgba(13, 148, 136, 0.1) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(45, 212, 191, 0.15), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(34, 197, 94, 0.11), rgba(15, 23, 42, 0) 70%)',
	conditions:
		'radial-gradient(120% 80% at 15% 0%, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.09) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(52, 211, 153, 0.15), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(34, 197, 94, 0.11), rgba(15, 23, 42, 0) 70%)',
	forecast:
		'radial-gradient(120% 80% at 15% 0%, rgba(59, 130, 246, 0.24), rgba(14, 116, 144, 0.1) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(129, 140, 248, 0.17), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(52, 211, 153, 0.13), rgba(15, 23, 42, 0) 70%)',
	map: 'radial-gradient(120% 80% at 15% 0%, rgba(6, 182, 212, 0.22), rgba(14, 116, 144, 0.11) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(56, 189, 248, 0.15), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(34, 211, 238, 0.12), rgba(15, 23, 42, 0) 70%)',
	precipitation:
		'radial-gradient(120% 80% at 15% 0%, rgba(14, 165, 233, 0.22), rgba(8, 145, 178, 0.1) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(56, 189, 248, 0.16), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(45, 212, 191, 0.11), rgba(15, 23, 42, 0) 70%)',
	sun: 'radial-gradient(120% 80% at 15% 0%, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.09) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(251, 191, 36, 0.14), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(244, 114, 182, 0.1), rgba(15, 23, 42, 0) 70%)',
	temperature:
		'radial-gradient(120% 80% at 15% 0%, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.08) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(96, 165, 250, 0.13), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(244, 114, 182, 0.09), rgba(15, 23, 42, 0) 70%)',
	wind: 'radial-gradient(120% 80% at 15% 0%, rgba(56, 189, 248, 0.17), rgba(51, 65, 85, 0.1) 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, rgba(217, 70, 239, 0.12), rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, rgba(148, 163, 184, 0.12), rgba(15, 23, 42, 0) 70%)',
}

const getTemperatureDetailFallbackGradient = (accentColor: string) =>
	`radial-gradient(120% 80% at 15% 0%, ${toRgba(accentColor, 0.22)}, ${toRgba(accentColor, 0.09)} 45%, rgba(15, 23, 42, 0) 72%), radial-gradient(90% 60% at 80% 8%, ${toRgba(accentColor, 0.15)}, rgba(15, 23, 42, 0) 70%), radial-gradient(70% 50% at 45% 0%, ${toRgba(accentColor, 0.1)}, rgba(15, 23, 42, 0) 70%)`

const toRgba = (rgbColor: string, alpha: number) =>
	rgbColor.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)

export const DetailFallbackGlow = ({
	activeViewId,
	isVisible,
	temperatureAccentColor,
}: Readonly<{
	activeViewId: ForecastViewId
	isVisible: boolean
	temperatureAccentColor: string
}>) => {
	const activeGradient =
		activeViewId === 'temperature'
			? getTemperatureDetailFallbackGradient(temperatureAccentColor)
			: DETAIL_FALLBACK_AURORA_GRADIENTS[activeViewId]

	return (
		<motion.div
			animate={{
				background: activeGradient,
				opacity: isVisible ? 0.68 : 0,
			}}
			aria-hidden="true"
			className="pointer-events-none absolute -top-[15%] right-[-10%] bottom-0 left-[-10%] z-1 mix-blend-screen"
			initial={false}
			style={{
				background: activeGradient,
				filter: 'blur(24px)',
				transform: 'translate3d(0, 0, 0)',
				willChange: 'background, opacity',
			}}
			transition={{ duration: 0.35, ease: 'easeOut' }}
		/>
	)
}

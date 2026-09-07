import type { ReactNode } from 'react'

import { motion } from 'framer-motion'

import type { ForecastViewId } from '../model/view-navigation'

import { getViewRelativePosition } from '../model/view-navigation'

const VIEW_TRANSITION_DISTANCE = 120

type DirectionalViewProps = {
	activeViewId: ForecastViewId
	children: ReactNode
	className: string
	previousTransitionViewId: ForecastViewId | null
	viewId: ForecastViewId
}

export const DirectionalView = ({
	activeViewId,
	children,
	className,
	previousTransitionViewId,
	viewId,
}: Readonly<DirectionalViewProps>) => {
	const isActive = activeViewId === viewId
	const relativePosition = getViewRelativePosition({ activeViewId, viewId })
	const shouldWillChange =
		isActive ||
		Math.abs(relativePosition) === 1 ||
		previousTransitionViewId === viewId
	const y = relativePosition * VIEW_TRANSITION_DISTANCE

	return (
		<motion.div
			animate={{
				opacity: isActive ? 1 : 0,
				scale: isActive ? 1 : 0.92,
				y,
			}}
			aria-hidden={!isActive}
			className={`absolute inset-0 ${
				shouldWillChange ? 'will-change-[transform,opacity]' : ''
			} ${className}`}
			initial={false}
			style={{
				pointerEvents: isActive ? 'auto' : 'none',
				zIndex: isActive ? 2 : 1,
			}}
			transition={{ damping: 32, stiffness: 280, type: 'spring' }}
		>
			{children}
		</motion.div>
	)
}

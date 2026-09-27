import type { AnimationDefinition } from 'framer-motion'
import type { ReactNode } from 'react'

import { motion } from 'framer-motion'
import { Activity, useState } from 'react'

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
	const [visibility, setVisibility] = useState({
		activeViewId,
		isVisible: isActive,
	})
	if (visibility.activeViewId !== activeViewId) {
		setVisibility({
			activeViewId,
			isVisible: isActive || visibility.isVisible,
		})
	}
	const relativePosition = getViewRelativePosition({ activeViewId, viewId })
	const shouldWillChange =
		isActive ||
		Math.abs(relativePosition) === 1 ||
		previousTransitionViewId === viewId
	const y = relativePosition * VIEW_TRANSITION_DISTANCE
	const handleAnimationComplete = (definition: AnimationDefinition) => {
		if (
			isActive ||
			typeof definition !== 'object' ||
			!('opacity' in definition) ||
			definition.opacity !== 0 ||
			!('y' in definition) ||
			definition.y !== y
		) {
			return
		}

		// A superseded exit must not hide a view that has since been reopened.
		setVisibility((current) =>
			current === visibility && current.isVisible
				? { ...current, isVisible: false }
				: current,
		)
	}

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
			inert={!isActive}
			initial={false}
			onAnimationComplete={handleAnimationComplete}
			style={{
				pointerEvents: isActive ? 'auto' : 'none',
				zIndex: isActive ? 2 : 1,
			}}
			transition={{ damping: 32, stiffness: 280, type: 'spring' }}
		>
			<Activity mode={visibility.isVisible ? 'visible' : 'hidden'}>
				{children}
			</Activity>
		</motion.div>
	)
}

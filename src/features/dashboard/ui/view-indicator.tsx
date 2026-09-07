import type { MotionValue } from 'framer-motion'
import type { MouseEvent as ReactMouseEvent, ReactNode, RefObject } from 'react'

import { Trans } from '@lingui/react/macro'
import {
	AnimatePresence,
	motion,
	useMotionValue,
	useSpring,
	useTransform,
} from 'framer-motion'
import { useRef, useState } from 'react'

import type { ForecastViewId } from '../model/view-navigation'

import { getMagnifiedSizes } from '../../weather/model/view-indicator-magnification'

const VIEW_INDICATOR_LABELS: Record<ForecastViewId, string> = {
	'air-quality': 'air quality',
	conditions: 'conditions',
	forecast: 'forecast',
	map: 'map',
	precipitation: 'precipitation',
	sun: 'sun',
	temperature: 'temperature',
	wind: 'wind',
}

const VIEW_INDICATOR_LABEL_NODES: Record<ForecastViewId, ReactNode> = {
	'air-quality': <Trans>air quality</Trans>,
	conditions: <Trans>conditions</Trans>,
	forecast: <Trans>forecast</Trans>,
	map: <Trans>map</Trans>,
	precipitation: <Trans>precipitation</Trans>,
	sun: <Trans>sun</Trans>,
	temperature: <Trans>temperature</Trans>,
	wind: <Trans>wind</Trans>,
}

// Dock-style magnification tuning. `RADIUS` is how far (px) from the cursor a
// dot starts to grow; sizes are the dot diameter in px at rest and at the
// cursor's exact position.
const VIEW_INDICATOR_MAGNIFY_RADIUS = 55

const VIEW_INDICATOR_REST_SIZE = 10

const VIEW_INDICATOR_MAX_SIZE = 32

const VIEW_INDICATOR_TOTAL_GROWTH = 40

export const ViewIndicator = ({
	activeViewId,
	isVisible,
	onMouseEnter,
	onMouseLeave,
	onSelectView,
	viewIds,
}: Readonly<{
	activeViewId: ForecastViewId
	isVisible: boolean
	onMouseEnter: () => void
	onMouseLeave: () => void
	onSelectView: (viewId: ForecastViewId) => void
	viewIds: readonly ForecastViewId[]
}>) => {
	const pointerY = useMotionValue(Number.POSITIVE_INFINITY)
	const indicatorRef = useRef<HTMLDivElement>(null)

	const handleMouseMove = (event: ReactMouseEvent) => {
		pointerY.set(event.clientY)
	}

	const handleMouseLeave = () => {
		pointerY.set(Number.POSITIVE_INFINITY)
		onMouseLeave()
	}

	return (
		<motion.div
			animate={{ opacity: isVisible ? 1 : 0 }}
			aria-hidden={!isVisible}
			aria-label="Weather view navigation"
			className="absolute inset-y-0 left-0 z-30 flex w-8 flex-col items-center justify-center"
			initial={false}
			onMouseEnter={onMouseEnter}
			onMouseLeave={handleMouseLeave}
			onMouseMove={handleMouseMove}
			ref={indicatorRef}
			role="navigation"
			transition={{ duration: 0.25 }}
		>
			{viewIds.map((viewId, index) => (
				<ViewIndicatorDot
					index={index}
					indicatorRef={indicatorRef}
					isActive={activeViewId === viewId}
					isVisible={isVisible}
					key={viewId}
					onSelect={() => onSelectView(viewId)}
					pointerY={pointerY}
					viewId={viewId}
				/>
			))}
		</motion.div>
	)
}

const ViewIndicatorDot = ({
	index,
	indicatorRef,
	isActive,
	isVisible,
	onSelect,
	pointerY,
	viewId,
}: Readonly<{
	index: number
	indicatorRef: RefObject<HTMLDivElement | null>
	isActive: boolean
	isVisible: boolean
	onSelect: () => void
	pointerY: MotionValue<number>
	viewId: ForecastViewId
}>) => {
	// Normalizing every dot against one growth budget keeps the stack's total
	// height fixed while the magnified region moves toward either end.
	const sizeTarget = useTransform(pointerY, (y) => {
		const dots = indicatorRef.current?.querySelectorAll<HTMLElement>(
			'[data-view-indicator-dot]',
		)
		if (!dots) return VIEW_INDICATOR_REST_SIZE

		const distances = Array.from(dots, (dot) => {
			const bounds = dot.getBoundingClientRect()
			return y - (bounds.y + bounds.height / 2)
		})
		const sizes = getMagnifiedSizes({
			distances,
			maxSize: VIEW_INDICATOR_MAX_SIZE,
			radius: VIEW_INDICATOR_MAGNIFY_RADIUS,
			restSize: VIEW_INDICATOR_REST_SIZE,
			totalGrowth: VIEW_INDICATOR_TOTAL_GROWTH,
		})

		return sizes[index] ?? VIEW_INDICATOR_REST_SIZE
	})
	const size = useSpring(sizeTarget, {
		damping: 18,
		mass: 0.1,
		stiffness: 260,
	})

	const [isHovered, setIsHovered] = useState(false)

	const handleMouseEnter = () => setIsHovered(true)
	const handleMouseLeave = () => setIsHovered(false)

	// The button fills its full slot (vertical padding, no gaps between slots) so
	// the strip is one continuous hit target — like the macOS dock, the cursor is
	// always over exactly one option and that option's label always shows.
	return (
		<button
			aria-current={isActive ? 'page' : undefined}
			aria-label={`Show ${VIEW_INDICATOR_LABELS[viewId]} view`}
			className="group relative flex w-full cursor-pointer items-center justify-center py-1 focus:outline-none"
			onBlur={handleMouseLeave}
			onClick={onSelect}
			onFocus={handleMouseEnter}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			tabIndex={isVisible ? 0 : -1}
			type="button"
		>
			<motion.span
				animate={{ opacity: isActive ? 1 : 0.45, scale: isActive ? 1 : 0.6 }}
				className="rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.45)] group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-white"
				data-view-indicator-dot
				initial={false}
				style={{ height: size, width: size }}
				transition={{ damping: 24, stiffness: 420, type: 'spring' }}
			/>
			<AnimatePresence>
				{isHovered ? (
					<motion.span
						animate={{ opacity: 1, x: 0 }}
						className="pointer-events-none absolute top-1/2 left-full ml-1 -translate-y-1/2 rounded-md bg-black/55 px-2 py-1 text-xs whitespace-nowrap text-white capitalize backdrop-blur-sm before:absolute before:top-1/2 before:right-full before:-translate-y-1/2 before:border-6 before:border-transparent before:border-r-black/55 before:content-['']"
						exit={{ opacity: 0, x: -4 }}
						initial={{ opacity: 0, x: -4 }}
						transition={{ duration: 0.15 }}
					>
						{VIEW_INDICATOR_LABEL_NODES[viewId]}
					</motion.span>
				) : null}
			</AnimatePresence>
		</button>
	)
}

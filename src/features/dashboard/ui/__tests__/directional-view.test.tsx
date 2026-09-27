import type { HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ForecastViewId } from '../../model/view-navigation'

import { DirectionalView } from '../directional-view'

type MotionTestProps = Omit<HTMLMotionProps<'div'>, 'children'> & {
	children?: ReactNode
}

const { motionRenders } = vi.hoisted(() => ({
	motionRenders: [] as MotionTestProps[],
}))

vi.mock('framer-motion', () => ({
	motion: {
		div: (props: MotionTestProps) => {
			motionRenders.push(props)
			return (
				<div
					aria-hidden={props['aria-hidden']}
					data-testid="panel"
					inert={props.inert}
				>
					{props.children}
				</div>
			)
		},
	},
}))

afterEach(() => {
	cleanup()
	motionRenders.length = 0
})

describe('DirectionalView activity', () => {
	it('keeps an exiting view inert, then stops effects without discarding its state', () => {
		const startEffect = vi.fn()
		const stopEffect = vi.fn()
		const content = (
			<StatefulContent onStart={startEffect} onStop={stopEffect} />
		)
		const { rerender } = renderPanel('temperature', content)
		fireEvent.click(screen.getByRole('button', { name: 'Count 0' }))
		expect(startEffect).toHaveBeenCalledTimes(1)

		rerender(panel('wind', content))
		expect(screen.getByTestId('panel')).toHaveAttribute('inert')
		expect(screen.getByTestId('panel')).toHaveAttribute('aria-hidden', 'true')
		expect(screen.getByText('Count 1')).toBeVisible()
		expect(stopEffect).not.toHaveBeenCalled()

		completeAnimation()
		expect(screen.getByText('Count 1')).not.toBeVisible()
		expect(stopEffect).toHaveBeenCalledTimes(1)

		rerender(panel('temperature', content))
		expect(screen.getByRole('button', { name: 'Count 1' })).toBeVisible()
		expect(screen.getByTestId('panel')).not.toHaveAttribute('inert')
		expect(startEffect).toHaveBeenCalledTimes(2)
	})

	it('does not start effects for initially hidden views', () => {
		const startEffect = vi.fn()
		const stopEffect = vi.fn()
		const content = (
			<StatefulContent onStart={startEffect} onStop={stopEffect} />
		)
		const { rerender } = renderPanel('forecast', content)
		expect(startEffect).not.toHaveBeenCalled()

		rerender(panel('temperature', content))
		expect(screen.getByRole('button', { name: 'Count 0' })).toBeVisible()
		expect(startEffect).toHaveBeenCalledTimes(1)
	})

	it('ignores superseded completions when switching away, back, and away again', () => {
		const startEffect = vi.fn()
		const stopEffect = vi.fn()
		const content = (
			<StatefulContent onStart={startEffect} onStop={stopEffect} />
		)
		const { rerender } = renderPanel('temperature', content)
		rerender(panel('wind', content))
		const firstExit = getLatestAnimation()

		rerender(panel('temperature', content))
		completeAnimation(firstExit)
		expect(screen.getByRole('button', { name: 'Count 0' })).toBeVisible()
		expect(stopEffect).not.toHaveBeenCalled()

		rerender(panel('wind', content))
		const secondExit = getLatestAnimation()
		completeAnimation(firstExit)
		expect(stopEffect).not.toHaveBeenCalled()
		completeAnimation(secondExit)
		expect(stopEffect).toHaveBeenCalledTimes(1)
		expect(screen.getByText('Count 0')).not.toBeVisible()
	})

	it('ignores an old target delivered to the latest animation callback', () => {
		const stopEffect = vi.fn()
		const content = <StatefulContent onStart={vi.fn()} onStop={stopEffect} />
		const { rerender } = renderPanel('temperature', content)
		rerender(panel('wind', content))
		const firstExit = getLatestAnimation()
		rerender(panel('map', content))
		const latestExit = getLatestAnimation()
		act(() => latestExit.onAnimationComplete?.(firstExit.animate))
		expect(stopEffect).not.toHaveBeenCalled()
		completeAnimation(latestExit)
		expect(stopEffect).toHaveBeenCalledTimes(1)
	})
})

const StatefulContent = ({
	onStart,
	onStop,
}: {
	onStart: () => void
	onStop: () => void
}) => {
	const [count, setCount] = useState(0)
	useEffect(() => {
		onStart()
		return onStop
	}, [onStart, onStop])
	return <button onClick={() => setCount(count + 1)}>Count {count}</button>
}

const panel = (activeViewId: ForecastViewId, children: ReactNode) => (
	<DirectionalView
		activeViewId={activeViewId}
		className=""
		previousTransitionViewId={null}
		viewId="temperature"
	>
		{children}
	</DirectionalView>
)

const renderPanel = (activeViewId: ForecastViewId, children: ReactNode) =>
	render(panel(activeViewId, children))

const getLatestAnimation = () => {
	const props = motionRenders.at(-1)
	if (!props || !props.animate || typeof props.animate === 'boolean') {
		throw new Error('Expected an animated view')
	}
	return {
		animate: props.animate,
		onAnimationComplete: props.onAnimationComplete,
	}
}

const completeAnimation = (animation = getLatestAnimation()) => {
	act(() => animation.onAnimationComplete?.(animation.animate))
}

import type { ComponentType } from 'react'

import { Trans } from '@lingui/react/macro'
import { useEffect, useState } from 'react'

import type { SeasonalEventId } from '../core/types'

type ViewingGuideProps = Readonly<{
	date: Date
	eventId: SeasonalEventId
	latitude: number
	longitude: number
}>

export const LazyMeteorViewingGuide = (props: ViewingGuideProps) => {
	const [Guide, setGuide] = useState<ComponentType<ViewingGuideProps> | null>(
		null,
	)
	const [hasFailed, setHasFailed] = useState(false)
	const [attempt, setAttempt] = useState(0)

	useEffect(() => {
		let hasCanceled = false
		import('./viewing-guide')
			.then(({ MeteorViewingGuide }) => {
				if (!hasCanceled) setGuide(() => MeteorViewingGuide)
			})
			.catch((error: unknown) => {
				console.error('Failed to load meteor viewing guidance', error)
				if (!hasCanceled) setHasFailed(true)
			})
		return () => {
			hasCanceled = true
		}
	}, [attempt])

	const handleRetry = () => {
		setHasFailed(false)
		setAttempt((value) => value + 1)
	}

	if (Guide) return <Guide {...props} />

	return (
		<div aria-live="polite" className="rounded-xl border border-white/10 p-4">
			{hasFailed ? (
				<>
					<p>
						<Trans>Viewing guidance could not be loaded.</Trans>
					</p>
					<button
						className="mt-2 text-blue-400 underline"
						onClick={handleRetry}
						type="button"
					>
						<Trans>Try again</Trans>
					</button>
				</>
			) : (
				<p>
					<Trans>Calculating local viewing times…</Trans>
				</p>
			)}
		</div>
	)
}

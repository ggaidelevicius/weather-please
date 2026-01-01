import { useEffect, useRef } from 'react'
import {
	getActiveSeasonalSurprise,
	runSeasonalSurprise,
} from './seasonal-surprises'
import type { SeasonalSurpriseId } from './seasonal-surprises'

type UseSeasonalSurprisesOptions = {
	isEnabled: boolean
	isHydrated?: boolean
	isOnboarded?: boolean
}

export const useSeasonalSurprises = ({
	isEnabled,
	isHydrated = true,
	isOnboarded = true,
}: Readonly<UseSeasonalSurprisesOptions>) => {
	const triggeredSurprises = useRef<Set<SeasonalSurpriseId>>(new Set())
	const activeSurprise =
		isHydrated && isEnabled && isOnboarded
			? getActiveSeasonalSurprise(new Date())
			: null

	useEffect(() => {
		if (!activeSurprise) return
		if (triggeredSurprises.current.has(activeSurprise)) return

		triggeredSurprises.current.add(activeSurprise)

		let cleanup = () => {}
		let hasCanceled = false

		const runSurprise = async () => {
			try {
				const nextCleanup = await runSeasonalSurprise(activeSurprise)

				if (hasCanceled) {
					nextCleanup()
					return
				}

				cleanup = nextCleanup
			} catch (error) {
				console.error('Failed to load seasonal surprise', error)
			}
		}

		void runSurprise()

		return () => {
			hasCanceled = true
			cleanup()
		}
	}, [activeSurprise])

	return activeSurprise
}

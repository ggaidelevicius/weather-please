import { cacheLife } from 'next/cache'

import { getHeroForecast, type HeroForecast } from './hero-forecast'

export const getCachedHeroForecast = async (): Promise<HeroForecast> => {
	'use cache'

	const forecast = await getHeroForecast()

	cacheLife({
		// Allow a short background refresh window, then wait for current dates.
		expire: forecast.revalidateSeconds + 5 * 60,
		revalidate: forecast.revalidateSeconds,
		stale: 5 * 60,
	})

	return forecast
}

import { newYearsSurprise } from './new-years'
import { valentinesSurprise } from './valentines'
import type {
	SeasonalSurprise,
	SeasonalSurpriseId,
	SeasonalSurpriseTileAccent,
} from './types'

const seasonalSurprises: SeasonalSurprise[] = [
	newYearsSurprise,
	valentinesSurprise,
]
const seasonalSurpriseMap = new Map<SeasonalSurpriseId, SeasonalSurprise>(
	seasonalSurprises.map((surprise) => [surprise.id, surprise]),
)

export type { SeasonalSurpriseId } from './types'
export type { SeasonalSurpriseTileAccent } from './types'

export const getSeasonalSurpriseForDate = (
	date: Date,
): SeasonalSurprise | null => {
	for (const surprise of seasonalSurprises) {
		if (surprise.isActive(date)) {
			return surprise
		}
	}

	return null
}

export const getActiveSeasonalSurprise = (
	date: Date,
): SeasonalSurpriseId | null => {
	const surprise = getSeasonalSurpriseForDate(date)
	return surprise ? surprise.id : null
}

export const runSeasonalSurprise = (surpriseId: SeasonalSurpriseId) => {
	const surprise = seasonalSurpriseMap.get(surpriseId)

	if (!surprise) {
		return Promise.resolve(() => {})
	}

	return surprise.run()
}

export const getSeasonalTileAccent = (
	date: Date,
): SeasonalSurpriseTileAccent | null => {
	const surprise = getSeasonalSurpriseForDate(date)
	return surprise?.tileAccent ?? null
}

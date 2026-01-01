export type SeasonalSurpriseId = 'new-years-day' | 'valentines-day'

export type SeasonalSurpriseTileAccent = {
	colors: readonly string[]
}

export type SeasonalSurprise = {
	id: SeasonalSurpriseId
	isActive: (date: Date) => boolean
	run: () => Promise<() => void>
	tileAccent?: SeasonalSurpriseTileAccent
}

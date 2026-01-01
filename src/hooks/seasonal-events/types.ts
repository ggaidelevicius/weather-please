export type SeasonalEventId =
	| 'new-years-day'
	| 'valentines-day'
	| 'lunar-new-year'
	| 'spring-equinox'
	| 'earth-day'

export type SeasonalEventTileAccent = {
	colors: readonly string[]
}

export type SeasonalEvent = {
	id: SeasonalEventId
	isActive: (date: Date) => boolean
	run: () => Promise<() => void>
	tileAccent?: SeasonalEventTileAccent
}

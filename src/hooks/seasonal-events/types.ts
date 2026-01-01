export type SeasonalEventId =
	| 'new-years-day'
	| 'valentines-day'
	| 'lunar-new-year'
	| 'spring-equinox'
	| 'autumn-equinox'
	| 'diwali'
	| 'holi'
	| 'earth-day'
	| 'summer-solstice'
	| 'winter-solstice'
	| 'halloween'
	| 'perseids'
	| 'geminids'

export type Hemisphere = 'northern' | 'southern'

export type SeasonalEventContext = {
	date: Date
	hemisphere: Hemisphere
}

export type SeasonalEventTileAccent = {
	colors: readonly string[]
}

export type SeasonalEvent = {
	id: SeasonalEventId
	isActive: (context: SeasonalEventContext) => boolean
	run: () => Promise<() => void>
	tileAccent?: SeasonalEventTileAccent
}

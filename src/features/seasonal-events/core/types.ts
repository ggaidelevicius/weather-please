export enum Hemisphere {
	Northern = 'northern',
	Southern = 'southern',
}

export enum SeasonalEventId {
	AutumnEquinox = 'autumn-equinox',
	ChristmasDay = 'christmas-day',
	DayOfTheDead = 'day-of-the-dead',
	Diwali = 'diwali',
	EarthDay = 'earth-day',
	Easter = 'easter',
	EidAlAdha = 'eid-al-adha',
	EidAlFitr = 'eid-al-fitr',
	EtaAquariids = 'eta-aquariids',
	EventHorizonDay = 'event-horizon-day',
	Geminids = 'geminids',
	Halloween = 'halloween',
	Hanukkah = 'hanukkah',
	Holi = 'holi',
	Leonids = 'leonids',
	LunarNewYear = 'lunar-new-year',
	Lyrids = 'lyrids',
	NewYearsDay = 'new-years-day',
	Orionids = 'orionids',
	Perseids = 'perseids',
	Quadrantids = 'quadrantids',
	SpringEquinox = 'spring-equinox',
	SummerSolstice = 'summer-solstice',
	TotalLunarEclipse = 'total-lunar-eclipse',
	TotalSolarEclipse = 'total-solar-eclipse',
	ValentinesDay = 'valentines-day',
	WinterSolstice = 'winter-solstice',
}

export const SEASONAL_EVENT_OVERRIDE_NONE = 'none' as const

export type SeasonalEvent = {
	details?: SeasonalEventDetails
	id: SeasonalEventId
	isActive: (context: SeasonalEventContext) => boolean
	run: () => Promise<() => void>
	tileAccent?: SeasonalEventTileAccent
}

import type { ReactElement } from 'react'

export type SeasonalEventContext = {
	date: Date
	hemisphere: Hemisphere
}

export type SeasonalEventDetails = () => ReactElement

export type SeasonalEventOverride =
	| SeasonalEventId
	| typeof SEASONAL_EVENT_OVERRIDE_NONE

export type SeasonalEventTileAccent = {
	colors: readonly string[]
}

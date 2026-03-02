export enum SeasonalEventId {
	NewYearsDay = 'new-years-day',
	ValentinesDay = 'valentines-day',
	LunarNewYear = 'lunar-new-year',
	SpringEquinox = 'spring-equinox',
	AutumnEquinox = 'autumn-equinox',
	Diwali = 'diwali',
	Holi = 'holi',
	EarthDay = 'earth-day',
	SummerSolstice = 'summer-solstice',
	WinterSolstice = 'winter-solstice',
	Halloween = 'halloween',
	Perseids = 'perseids',
	Quadrantids = 'quadrantids',
	Lyrids = 'lyrids',
	EtaAquariids = 'eta-aquariids',
	Orionids = 'orionids',
	Leonids = 'leonids',
	TotalSolarEclipse = 'total-solar-eclipse',
	TotalLunarEclipse = 'total-lunar-eclipse',
	DayOfTheDead = 'day-of-the-dead',
	Easter = 'easter',
	Geminids = 'geminids',
	EidAlFitr = 'eid-al-fitr',
	EidAlAdha = 'eid-al-adha',
	Hanukkah = 'hanukkah',
	ChristmasDay = 'christmas-day',
}

export enum Hemisphere {
	Northern = 'northern',
	Southern = 'southern',
}

import type { ReactElement } from 'react'

export type SeasonalEventContext = {
	date: Date
	hemisphere: Hemisphere
}

export type SeasonalEventTileAccent = {
	colors: readonly string[]
}

export type SeasonalEventDetails = () => ReactElement

export type SeasonalEvent = {
	id: SeasonalEventId
	isActive: (context: SeasonalEventContext) => boolean
	run: () => Promise<() => void>
	details?: SeasonalEventDetails
	tileAccent?: SeasonalEventTileAccent
}

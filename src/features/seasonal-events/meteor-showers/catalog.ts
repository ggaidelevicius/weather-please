import { SeasonalEventId } from '../core/types'

export type MeteorShower = Readonly<{
	eventId: SeasonalEventId
	peakDay: number
	peakMonth: number
	peakWindowDays: number
	radiantDeclinationDegrees: number
	radiantRightAscensionDegrees: number
}>

export const getMeteorShower = (
	eventId: SeasonalEventId,
): MeteorShower | undefined =>
	METEOR_SHOWERS.find((shower) => shower.eventId === eventId)

// IMO 2026 calendar, Table 5: J2000 radiants near maximum; see README.md.
// Months are 1-based; the window extends this many days either side of the date.
const METEOR_SHOWERS: ReadonlyArray<MeteorShower> = [
	{
		eventId: SeasonalEventId.Quadrantids,
		peakDay: 3,
		peakMonth: 1,
		peakWindowDays: 3,
		radiantDeclinationDegrees: 49,
		radiantRightAscensionDegrees: 230,
	},
	{
		eventId: SeasonalEventId.Lyrids,
		peakDay: 22,
		peakMonth: 4,
		peakWindowDays: 3,
		radiantDeclinationDegrees: 34,
		radiantRightAscensionDegrees: 271,
	},
	{
		eventId: SeasonalEventId.EtaAquariids,
		peakDay: 6,
		peakMonth: 5,
		peakWindowDays: 3,
		radiantDeclinationDegrees: -1,
		radiantRightAscensionDegrees: 338,
	},
	{
		eventId: SeasonalEventId.Perseids,
		peakDay: 13,
		peakMonth: 8,
		peakWindowDays: 3,
		radiantDeclinationDegrees: 58,
		radiantRightAscensionDegrees: 48,
	},
	{
		eventId: SeasonalEventId.Orionids,
		peakDay: 21,
		peakMonth: 10,
		peakWindowDays: 3,
		radiantDeclinationDegrees: 16,
		radiantRightAscensionDegrees: 95,
	},
	{
		eventId: SeasonalEventId.Leonids,
		peakDay: 17,
		peakMonth: 11,
		peakWindowDays: 3,
		radiantDeclinationDegrees: 22,
		radiantRightAscensionDegrees: 152,
	},
	{
		eventId: SeasonalEventId.Geminids,
		peakDay: 14,
		peakMonth: 12,
		peakWindowDays: 3,
		radiantDeclinationDegrees: 33,
		radiantRightAscensionDegrees: 112,
	},
]

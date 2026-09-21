import { SeasonalEventId } from '../core/types'

export type MeteorShower = Readonly<{
	eventId: SeasonalEventId
	radiantRightAscensionDegrees: number
	radiantDeclinationDegrees: number
	peakMonth: number
	peakDay: number
	peakWindowDays: number
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
		radiantRightAscensionDegrees: 230,
		radiantDeclinationDegrees: 49,
		peakMonth: 1,
		peakDay: 3,
		peakWindowDays: 3,
	},
	{
		eventId: SeasonalEventId.Lyrids,
		radiantRightAscensionDegrees: 271,
		radiantDeclinationDegrees: 34,
		peakMonth: 4,
		peakDay: 22,
		peakWindowDays: 3,
	},
	{
		eventId: SeasonalEventId.EtaAquariids,
		radiantRightAscensionDegrees: 338,
		radiantDeclinationDegrees: -1,
		peakMonth: 5,
		peakDay: 6,
		peakWindowDays: 3,
	},
	{
		eventId: SeasonalEventId.Perseids,
		radiantRightAscensionDegrees: 48,
		radiantDeclinationDegrees: 58,
		peakMonth: 8,
		peakDay: 13,
		peakWindowDays: 3,
	},
	{
		eventId: SeasonalEventId.Orionids,
		radiantRightAscensionDegrees: 95,
		radiantDeclinationDegrees: 16,
		peakMonth: 10,
		peakDay: 21,
		peakWindowDays: 3,
	},
	{
		eventId: SeasonalEventId.Leonids,
		radiantRightAscensionDegrees: 152,
		radiantDeclinationDegrees: 22,
		peakMonth: 11,
		peakDay: 17,
		peakWindowDays: 3,
	},
	{
		eventId: SeasonalEventId.Geminids,
		radiantRightAscensionDegrees: 112,
		radiantDeclinationDegrees: 33,
		peakMonth: 12,
		peakDay: 14,
		peakWindowDays: 3,
	},
]

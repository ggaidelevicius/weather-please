import {
	Body,
	Equator,
	EquatorFromVector,
	Horizon,
	Illumination,
	Observer,
	RotateVector,
	Rotation_EQJ_EQD,
	Spherical,
	VectorFromSphere,
} from 'astronomy-engine'
import { describe, expect, it } from 'vitest'

import { SeasonalEventId } from '../../core/types'
import { getMeteorShower } from '../catalog'
import { getMeteorViewingGuide, type MeteorViewingGuide } from '../viewing'

type AvailableGuide = Extract<MeteorViewingGuide, { status: 'available' }>

describe('meteor shower viewing guidance', () => {
	it('finds a dark pre-dawn Eta Aquariids window in Perth', () => {
		const guide = getMeteorViewingGuide({
			eventId: SeasonalEventId.EtaAquariids,
			date: new Date(2026, 4, 6),
			latitude: -31.95,
			longitude: 115.86,
		})
		expectAvailable(guide)
		expect(guide.timeZone).toBe('Australia/Perth')
		expect(localParts(guide.start, guide.timeZone)).toMatchObject({
			day: 7,
			month: 5,
			year: 2026,
		})
		expect(localParts(guide.end, guide.timeZone).hour).toBeLessThanOrEqual(6)
		assertPhysicallyUsable({
			guide,
			eventId: SeasonalEventId.EtaAquariids,
			latitude: -31.95,
			longitude: 115.86,
		})
	})

	it('offers the Perseids in London but rejects the low radiant in Perth', () => {
		const request = {
			eventId: SeasonalEventId.Perseids,
			date: new Date(2026, 7, 13),
		}
		const london = getMeteorViewingGuide({
			...request,
			latitude: 51.51,
			longitude: -0.13,
		})
		expectAvailable(london)
		expect(london.timeZone).toBe('Europe/London')
		assertPhysicallyUsable({
			guide: london,
			eventId: request.eventId,
			latitude: 51.51,
			longitude: -0.13,
		})
		expect(
			getMeteorViewingGuide({
				...request,
				latitude: -31.95,
				longitude: 115.86,
			}),
		).toEqual({ status: 'radiant-too-low', timeZone: 'Australia/Perth' })
	})

	it('does not suggest a window during polar daylight', () => {
		expect(
			getMeteorViewingGuide({
				eventId: SeasonalEventId.Perseids,
				date: new Date(2026, 7, 13),
				latitude: 80,
				longitude: 20,
				timeZone: 'Arctic/Longyearbyen',
			}),
		).toEqual({ status: 'no-darkness', timeZone: 'Arctic/Longyearbyen' })
	})

	it.each([
		{
			name: 'Auckland',
			latitude: -36.85,
			longitude: 174.76,
			timeZone: 'Pacific/Auckland',
			firstNoon: '2026-12-13T23:00:00Z',
			nextNoon: '2026-12-14T23:00:00Z',
		},
		{
			name: 'Los Angeles',
			latitude: 34.05,
			longitude: -118.24,
			timeZone: 'America/Los_Angeles',
			firstNoon: '2026-12-14T20:00:00Z',
			nextNoon: '2026-12-15T20:00:00Z',
		},
	])('uses the selected civil night in $name across the date line', (place) => {
		const guide = getMeteorViewingGuide({
			eventId: SeasonalEventId.Geminids,
			date: new Date(2026, 11, 14, 0, 0),
			latitude: place.latitude,
			longitude: place.longitude,
		})
		expectAvailable(guide)
		expect(guide.timeZone).toBe(place.timeZone)
		expect(guide.start.getTime()).toBeGreaterThanOrEqual(
			Date.parse(place.firstNoon),
		)
		expect(guide.end.getTime()).toBeLessThanOrEqual(Date.parse(place.nextNoon))
		assertPhysicallyUsable({
			guide,
			eventId: SeasonalEventId.Geminids,
			latitude: place.latitude,
			longitude: place.longitude,
		})
	})

	it('handles a night whose clocks move forward', () => {
		const guide = getMeteorViewingGuide({
			eventId: SeasonalEventId.Lyrids,
			date: new Date(1982, 3, 24),
			latitude: 40.71,
			longitude: -74.01,
			timeZone: 'America/New_York',
		})
		expectAvailable(guide)
		// US DST started on 25 April in 1982; the next noon is only 23 hours later.
		expect(guide.start.getTime()).toBeGreaterThanOrEqual(
			Date.parse('1982-04-24T17:00:00Z'),
		)
		expect(guide.end.getTime()).toBeLessThanOrEqual(
			Date.parse('1982-04-25T16:00:00Z'),
		)
		expect(localParts(guide.referenceTime, guide.timeZone).day).toBe(25)
		assertPhysicallyUsable({
			guide,
			eventId: SeasonalEventId.Lyrids,
			latitude: 40.71,
			longitude: -74.01,
		})
	})

	it('handles a night whose clocks move backward', () => {
		const guide = getMeteorViewingGuide({
			eventId: SeasonalEventId.Orionids,
			date: new Date(1981, 9, 24),
			latitude: 51.51,
			longitude: -0.13,
			timeZone: 'Europe/London',
		})
		expectAvailable(guide)
		expect(guide.start.getTime()).toBeGreaterThanOrEqual(
			Date.parse('1981-10-24T11:00:00Z'),
		)
		expect(guide.end.getTime()).toBeLessThanOrEqual(
			Date.parse('1981-10-25T12:00:00Z'),
		)
		expect(localParts(guide.referenceTime, guide.timeZone).day).toBe(25)
		assertPhysicallyUsable({
			guide,
			eventId: SeasonalEventId.Orionids,
			latitude: 51.51,
			longitude: -0.13,
		})
	})

	it('continues calculating precessed radiant positions in 2043', () => {
		const guide = getMeteorViewingGuide({
			eventId: SeasonalEventId.Geminids,
			date: new Date(2043, 11, 14),
			latitude: 51.51,
			longitude: -0.13,
		})
		expectAvailable(guide)
		assertPhysicallyUsable({
			guide,
			eventId: SeasonalEventId.Geminids,
			latitude: 51.51,
			longitude: -0.13,
		})
		const observer = new Observer(51.51, -0.13, 0)
		const unprecessed = Horizon(guide.referenceTime, observer, 112 / 15, 33)
		expect(
			Math.abs(unprecessed.altitude - guide.radiantAltitude),
		).toBeGreaterThan(0.01)
	})

	it('limits guidance to three days either side of the usual peak', () => {
		const request = {
			eventId: SeasonalEventId.Geminids,
			latitude: 51.51,
			longitude: -0.13,
		}
		for (const day of [11, 14, 17]) {
			expectAvailable(
				getMeteorViewingGuide({ ...request, date: new Date(2043, 11, day) }),
			)
		}
		for (const day of [10, 18]) {
			expect(
				getMeteorViewingGuide({ ...request, date: new Date(2043, 11, day) })
					.status,
			).toBe('out-of-season')
		}
	})

	it('handles a peak window that crosses New Year', () => {
		const guide = getMeteorViewingGuide({
			eventId: SeasonalEventId.Quadrantids,
			date: new Date(2026, 11, 31),
			latitude: 51.51,
			longitude: -0.13,
		})
		expectAvailable(guide)
		expect(localParts(guide.referenceTime, guide.timeZone).year).toBe(2027)
	})

	it.each([
		{ latitude: NaN },
		{ longitude: Infinity },
		{ latitude: 90.01 },
		{ longitude: -180.01 },
		{ date: new Date('invalid') },
		{ date: new Date(2101, 11, 14) },
		{ timeZone: 'not/a-zone' },
		{ timeZone: '' },
		{ eventId: SeasonalEventId.ChristmasDay },
	])(
		'returns unavailable for invalid or unsupported requests: %s',
		(override) => {
			expect(
				getMeteorViewingGuide({
					eventId: SeasonalEventId.Geminids,
					date: new Date(2026, 11, 14),
					latitude: 51.51,
					longitude: -0.13,
					...override,
				}).status,
			).toBe('unavailable')
		},
	)
})

function expectAvailable(
	guide: MeteorViewingGuide,
): asserts guide is AvailableGuide {
	expect(guide.status).toBe('available')
}

function localParts(date: Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		hourCycle: 'h23',
	}).formatToParts(date)
	const read = (type: Intl.DateTimeFormatPartTypes) =>
		Number(parts.find((part) => part.type === type)?.value)
	return {
		year: read('year'),
		month: read('month'),
		day: read('day'),
		hour: read('hour'),
	}
}

function assertPhysicallyUsable({
	guide,
	eventId,
	latitude,
	longitude,
}: {
	guide: AvailableGuide
	eventId: SeasonalEventId
	latitude: number
	longitude: number
}) {
	const shower = getMeteorShower(eventId)
	if (!shower) throw new Error('Expected a meteor shower in the test')
	const observer = new Observer(latitude, longitude, 0)
	const durationMinutes = (guide.end.getTime() - guide.start.getTime()) / 60_000
	expect(durationMinutes).toBeGreaterThanOrEqual(30)
	expect(durationMinutes).toBeLessThanOrEqual(120)
	expect(guide.referenceTime.getTime()).toBe(
		(guide.start.getTime() + guide.end.getTime()) / 2,
	)

	const moonAltitudes: number[] = []
	const sunAltitudes: number[] = []
	for (
		let instant = guide.start.getTime();
		instant <= guide.end.getTime();
		instant += 60_000
	) {
		const date = new Date(instant)
		const sun = Equator(Body.Sun, date, observer, true, true)
		const moon = Equator(Body.Moon, date, observer, true, true)
		const sunAltitude = Horizon(date, observer, sun.ra, sun.dec).altitude
		const moonAltitude = Horizon(
			date,
			observer,
			moon.ra,
			moon.dec,
			'normal',
		).altitude
		sunAltitudes.push(sunAltitude)
		moonAltitudes.push(moonAltitude)

		// An independent coordinate path also detects mixing J2000 with of-date RA.
		const radiant = EquatorFromVector(
			RotateVector(
				Rotation_EQJ_EQD(date),
				VectorFromSphere(
					new Spherical(
						shower.radiantDeclinationDegrees,
						shower.radiantRightAscensionDegrees,
						1,
					),
					date,
				),
			),
		)
		const horizon = Horizon(date, observer, radiant.ra, radiant.dec)
		expect(sunAltitude).toBeLessThanOrEqual(-12)
		expect(horizon.altitude).toBeGreaterThanOrEqual(10)
		if (instant === guide.referenceTime.getTime()) {
			expect(guide.radiantAltitude).toBeCloseTo(horizon.altitude, 6)
			expect(guide.radiantAzimuth).toBeCloseTo(horizon.azimuth, 6)
		}
	}
	expect(guide.moonIllumination).toBeGreaterThanOrEqual(0)
	expect(guide.moonIllumination).toBeLessThanOrEqual(1)
	expect(guide.moonIllumination).toBeCloseTo(
		Illumination(Body.Moon, guide.referenceTime).phase_fraction,
		8,
	)
	expect(guide.hasTwilight).toBe(
		sunAltitudes.some((altitude) => altitude > -18),
	)
	if (guide.moonVisibility === 'below') {
		expect(Math.max(...moonAltitudes)).toBeLessThan(0)
	} else if (guide.moonVisibility === 'above') {
		expect(Math.min(...moonAltitudes)).toBeGreaterThanOrEqual(0)
	} else {
		expect(Math.min(...moonAltitudes)).toBeLessThan(0)
		expect(Math.max(...moonAltitudes)).toBeGreaterThanOrEqual(0)
	}
}

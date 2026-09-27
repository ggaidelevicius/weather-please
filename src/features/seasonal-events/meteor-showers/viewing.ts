import tzLookup from '@photostructure/tz-lookup'
import {
	Body,
	Equator,
	Horizon,
	HorizonFromVector,
	Illumination,
	Observer,
	RotateVector,
	Rotation_EQJ_HOR,
	Spherical,
	VectorFromSphere,
} from 'astronomy-engine'
import { z } from 'zod'

import { SeasonalEventId } from '../core/types'
import { getMeteorShower, type MeteorShower } from './catalog'

export type MeteorViewingGuide =
	| {
			end: Temporal.Instant
			hasTwilight: boolean
			moonIllumination: number
			moonVisibility: 'above' | 'below' | 'mixed'
			radiantAltitude: number
			radiantAzimuth: number
			referenceTime: Temporal.Instant
			start: Temporal.Instant
			status: 'available'
			timeZone: string
	  }
	| {
			status:
				| 'no-darkness'
				| 'no-window'
				| 'out-of-season'
				| 'radiant-too-low'
				| 'unavailable'
			timeZone?: string
	  }

export function getMeteorViewingGuide({
	date,
	eventId,
	latitude,
	longitude,
	timeZone,
}: {
	date: Temporal.PlainDate
	eventId: SeasonalEventId
	latitude: number
	longitude: number
	timeZone?: string
}): MeteorViewingGuide {
	const request = viewingRequestSchema.safeParse({
		date,
		eventId,
		latitude,
		longitude,
		timeZone,
	})
	if (!request.success) return { status: 'unavailable' }
	const shower = getMeteorShower(eventId)
	if (!shower) return { status: 'unavailable' }

	try {
		const selectedTimeZone = timeZone ?? tzLookup(latitude, longitude)
		const localNoon = date.toZonedDateTime({
			plainTime: '12:00',
			timeZone: selectedTimeZone,
		})
		if (!isNearPeak({ date, shower })) {
			return { status: 'out-of-season', timeZone: selectedTimeZone }
		}

		const start = localNoon.toInstant()
		const end = localNoon.add({ days: 1 }).toInstant()

		const observer = new Observer(latitude, longitude, 0)
		const samples: SkySample[] = []
		for (
			let instant = start;
			Temporal.Instant.compare(instant, end) <= 0;
			instant = instant.add({ minutes: SAMPLE_MINUTES })
		) {
			samples.push(getSkySample({ instant, observer, shower }))
		}
		if (!samples.some((sample) => sample.sunAltitude <= -12)) {
			return { status: 'no-darkness', timeZone: selectedTimeZone }
		}
		if (!samples.some(isEligible)) {
			return { status: 'radiant-too-low', timeZone: selectedTimeZone }
		}

		const window = findBestWindow(samples)
		if (!window) {
			return { status: 'no-window', timeZone: selectedTimeZone }
		}
		const first = window[0]
		const last = window[window.length - 1]
		const reference = getSkySample({
			instant: first.time.add({
				milliseconds: first.time.until(last.time).total('milliseconds') / 2,
			}),
			observer,
			shower,
		})
		const hasMoonAbove = window.some((sample) => sample.moonAltitude >= 0)
		const hasMoonBelow = window.some((sample) => sample.moonAltitude < 0)

		return {
			end: last.time,
			hasTwilight: window.some((sample) => sample.sunAltitude > -18),
			moonIllumination: reference.moonIllumination,
			moonVisibility: hasMoonAbove
				? hasMoonBelow
					? 'mixed'
					: 'above'
				: 'below',
			radiantAltitude: reference.radiantAltitude,
			radiantAzimuth: reference.radiantAzimuth,
			referenceTime: reference.time,
			start: first.time,
			status: 'available',
			timeZone: selectedTimeZone,
		}
	} catch {
		return { status: 'unavailable' }
	}
}

const SAMPLE_MINUTES = 10
const MIN_WINDOW_INTERVALS = 3
const MAX_WINDOW_INTERVALS = 12
const DEG_TO_RAD = Math.PI / 180

const viewingRequestSchema = z.object({
	date: z
		.instanceof(Temporal.PlainDate)
		.refine(
			(value) =>
				value.year >= 1900 &&
				value.year <= 2100 &&
				value.calendarId === 'iso8601',
		),
	eventId: z.enum(SeasonalEventId),
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
	timeZone: z.string().min(1).optional(),
})

type SkySample = {
	moonAltitude: number
	moonIllumination: number
	radiantAltitude: number
	radiantAzimuth: number
	sunAltitude: number
	time: Temporal.Instant
}

function findBestWindow(samples: SkySample[]): null | SkySample[] {
	let bestWindow: null | SkySample[] = null
	let bestScore = -Infinity
	let runStart = 0

	while (runStart < samples.length) {
		if (!isEligible(samples[runStart])) {
			runStart += 1
			continue
		}
		let runEnd = runStart
		while (runEnd + 1 < samples.length && isEligible(samples[runEnd + 1])) {
			runEnd += 1
		}
		const intervals = Math.min(MAX_WINDOW_INTERVALS, runEnd - runStart)
		if (intervals >= MIN_WINDOW_INTERVALS) {
			for (let index = runStart; index + intervals <= runEnd; index += 1) {
				const window = samples.slice(index, index + intervals + 1)
				const score =
					(window.reduce((total, sample) => total + scoreSample(sample), 0) /
						window.length) *
					Math.sqrt(intervals / MAX_WINDOW_INTERVALS)
				if (score > bestScore) {
					bestScore = score
					bestWindow = window
				}
			}
		}
		runStart = runEnd + 1
	}
	return bestWindow
}

function getSkySample({
	instant,
	observer,
	shower,
}: {
	instant: Temporal.Instant
	observer: Observer
	shower: MeteorShower
}): SkySample {
	// Astronomy Engine accepts Date rather than Temporal values.
	const date = new Date(instant.epochMilliseconds)
	const radiant = HorizonFromVector(
		RotateVector(
			Rotation_EQJ_HOR(date, observer),
			VectorFromSphere(
				new Spherical(
					shower.radiantDeclinationDegrees,
					shower.radiantRightAscensionDegrees,
					1,
				),
				date,
			),
		),
		'',
	)
	const sun = Equator(Body.Sun, date, observer, true, true)
	const moon = Equator(Body.Moon, date, observer, true, true)

	return {
		moonAltitude: Horizon(date, observer, moon.ra, moon.dec, 'normal').altitude,
		moonIllumination: Illumination(Body.Moon, date).phase_fraction,
		radiantAltitude: radiant.lat,
		radiantAzimuth: radiant.lon,
		sunAltitude: Horizon(date, observer, sun.ra, sun.dec).altitude,
		time: instant,
	}
}

function isEligible(sample: SkySample): boolean {
	return sample.sunAltitude <= -12 && sample.radiantAltitude >= 10
}

function isNearPeak({
	date,
	shower,
}: {
	date: Temporal.PlainDate
	shower: MeteorShower
}): boolean {
	const year = date.year
	return [year - 1, year, year + 1].some(
		(peakYear) =>
			Math.abs(
				date.until(
					Temporal.PlainDate.from({
						day: shower.peakDay,
						month: shower.peakMonth,
						year: peakYear,
					}),
				).days,
			) <= shower.peakWindowDays,
	)
}

function scoreSample(sample: SkySample): number {
	const radiantHeight = Math.sin(sample.radiantAltitude * DEG_TO_RAD)
	const moonlight =
		sample.moonIllumination *
		Math.max(0, Math.sin(sample.moonAltitude * DEG_TO_RAD))
	const darkness = 0.7 + 0.3 * Math.min(1, (-sample.sunAltitude - 12) / 6)
	return radiantHeight * (1 - 0.65 * moonlight) * darkness
}

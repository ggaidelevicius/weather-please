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
			status: 'available'
			timeZone: string
			start: Date
			end: Date
			referenceTime: Date
			radiantAltitude: number
			radiantAzimuth: number
			moonIllumination: number
			moonVisibility: 'below' | 'above' | 'mixed'
			hasTwilight: boolean
	  }
	| {
			status:
				| 'out-of-season'
				| 'unavailable'
				| 'no-darkness'
				| 'radiant-too-low'
				| 'no-window'
			timeZone?: string
	  }

export function getMeteorViewingGuide({
	eventId,
	date,
	latitude,
	longitude,
	timeZone,
}: {
	eventId: SeasonalEventId
	date: Date
	latitude: number
	longitude: number
	timeZone?: string
}): MeteorViewingGuide {
	const request = viewingRequestSchema.safeParse({
		eventId,
		date,
		latitude,
		longitude,
		timeZone,
	})
	if (!request.success) return { status: 'unavailable' }
	const shower = getMeteorShower(eventId)
	if (!shower) return { status: 'unavailable' }

	try {
		const selectedTimeZone = timeZone ?? tzLookup(latitude, longitude)
		const formatter = new Intl.DateTimeFormat('en-GB', {
			calendar: 'gregory',
			day: '2-digit',
			hour: '2-digit',
			hourCycle: 'h23',
			minute: '2-digit',
			month: '2-digit',
			numberingSystem: 'latn',
			second: '2-digit',
			timeZone: selectedTimeZone,
			year: 'numeric',
		})
		if (!isNearPeak({ date, shower })) {
			return { status: 'out-of-season', timeZone: selectedTimeZone }
		}

		// Forecast dates are civil calendar labels, not instants in the browser's zone.
		const civilNoon = Date.UTC(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			12,
		)
		const start = getZonedInstant({ civilTime: civilNoon, formatter })
		const end = getZonedInstant({
			civilTime: civilNoon + DAY_MS,
			formatter,
		})
		if (start === null || end === null) {
			return { status: 'unavailable', timeZone: selectedTimeZone }
		}

		const observer = new Observer(latitude, longitude, 0)
		const samples: SkySample[] = []
		for (let time = start; time <= end; time += SAMPLE_MS) {
			samples.push(getSkySample({ time, shower, observer }))
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
			time: (first.time + last.time) / 2,
			shower,
			observer,
		})
		const hasMoonAbove = window.some((sample) => sample.moonAltitude >= 0)
		const hasMoonBelow = window.some((sample) => sample.moonAltitude < 0)

		return {
			status: 'available',
			timeZone: selectedTimeZone,
			start: new Date(first.time),
			end: new Date(last.time),
			referenceTime: new Date(reference.time),
			radiantAltitude: reference.radiantAltitude,
			radiantAzimuth: reference.radiantAzimuth,
			moonIllumination: reference.moonIllumination,
			moonVisibility: hasMoonAbove
				? hasMoonBelow
					? 'mixed'
					: 'above'
				: 'below',
			hasTwilight: window.some((sample) => sample.sunAltitude > -18),
		}
	} catch {
		return { status: 'unavailable' }
	}
}

const DAY_MS = 24 * 60 * 60 * 1000
const SAMPLE_MS = 10 * 60 * 1000
const MIN_WINDOW_INTERVALS = 3
const MAX_WINDOW_INTERVALS = 12
const DEG_TO_RAD = Math.PI / 180

const viewingRequestSchema = z.object({
	eventId: z.enum(SeasonalEventId),
	date: z
		.date()
		.refine(
			(value) => value.getFullYear() >= 1900 && value.getFullYear() <= 2100,
		),
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
	timeZone: z.string().min(1).optional(),
})

type SkySample = {
	time: number
	sunAltitude: number
	radiantAltitude: number
	radiantAzimuth: number
	moonAltitude: number
	moonIllumination: number
}

function isNearPeak({
	date,
	shower,
}: {
	date: Date
	shower: MeteorShower
}): boolean {
	const year = date.getFullYear()
	const civilDay = Date.UTC(year, date.getMonth(), date.getDate())
	return [year - 1, year, year + 1].some(
		(peakYear) =>
			Math.abs(
				civilDay - Date.UTC(peakYear, shower.peakMonth - 1, shower.peakDay),
			) <=
			shower.peakWindowDays * DAY_MS,
	)
}

function getZonedInstant({
	civilTime,
	formatter,
}: {
	civilTime: number
	formatter: Intl.DateTimeFormat
}): number | null {
	let instant = civilTime
	for (let attempt = 0; attempt < 4; attempt += 1) {
		const parts = formatter.formatToParts(new Date(instant))
		const read = (type: Intl.DateTimeFormatPartTypes) =>
			Number(parts.find((part) => part.type === type)?.value)
		const displayedTime = Date.UTC(
			read('year'),
			read('month') - 1,
			read('day'),
			read('hour'),
			read('minute'),
			read('second'),
		)
		const difference = civilTime - displayedTime
		if (difference === 0) return instant
		instant += difference
	}
	return null
}

function getSkySample({
	time,
	shower,
	observer,
}: {
	time: number
	shower: MeteorShower
	observer: Observer
}): SkySample {
	const date = new Date(time)
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
		time,
		sunAltitude: Horizon(date, observer, sun.ra, sun.dec).altitude,
		radiantAltitude: radiant.lat,
		radiantAzimuth: radiant.lon,
		moonAltitude: Horizon(date, observer, moon.ra, moon.dec, 'normal').altitude,
		moonIllumination: Illumination(Body.Moon, date).phase_fraction,
	}
}

function isEligible(sample: SkySample): boolean {
	return sample.sunAltitude <= -12 && sample.radiantAltitude >= 10
}

function findBestWindow(samples: SkySample[]): SkySample[] | null {
	let bestWindow: SkySample[] | null = null
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

function scoreSample(sample: SkySample): number {
	const radiantHeight = Math.sin(sample.radiantAltitude * DEG_TO_RAD)
	const moonlight =
		sample.moonIllumination *
		Math.max(0, Math.sin(sample.moonAltitude * DEG_TO_RAD))
	const darkness = 0.7 + 0.3 * Math.min(1, (-sample.sunAltitude - 12) / 6)
	return radiantHeight * (1 - 0.65 * moonlight) * darkness
}

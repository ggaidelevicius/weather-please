import { describe, expect, it } from 'vitest'

import {
	getCometDots,
	getCubicBezierPoint,
	getPrivacyBeamFrame,
	PRIVACY_BEAM_PAUSE_MS,
	PRIVACY_BEAM_TRAVEL_MS,
} from '../privacy-beam'

const CYCLE_MS = PRIVACY_BEAM_TRAVEL_MS + PRIVACY_BEAM_PAUSE_MS
const ROUTE_LENGTHS = [100, 100, 100]

describe('getPrivacyBeamFrame', () => {
	it('starts the first beam at its provider', () => {
		expect(
			getPrivacyBeamFrame({
				elapsedMs: 0,
				landingDistance: 20,
				routeLengths: ROUTE_LENGTHS,
			}),
		).toEqual({
			beamIndex: 0,
			headProgress: 0,
			isBrowserLit: false,
			isProviderLit: true,
		})
	})

	it('lights the browser as the beam lands', () => {
		const frame = getPrivacyBeamFrame({
			elapsedMs: PRIVACY_BEAM_TRAVEL_MS * 0.9,
			landingDistance: 20,
			routeLengths: ROUTE_LENGTHS,
		})

		expect(frame.isBrowserLit).toBe(true)
		expect(frame.isProviderLit).toBe(false)
		expect(frame.headProgress).toBeGreaterThan(0.9)
	})

	it('waits to light the browser until the head reaches it', () => {
		const elapsedMs = PRIVACY_BEAM_TRAVEL_MS * 0.6
		const { headProgress } = getPrivacyBeamFrame({
			elapsedMs,
			landingDistance: 0,
			routeLengths: ROUTE_LENGTHS,
		})
		const distanceLeft = 100 - (headProgress ?? 0) * 100

		expect(
			getPrivacyBeamFrame({
				elapsedMs,
				landingDistance: distanceLeft - 1,
				routeLengths: ROUTE_LENGTHS,
			}).isBrowserLit,
		).toBe(false)
		expect(
			getPrivacyBeamFrame({
				elapsedMs,
				landingDistance: distanceLeft + 1,
				routeLengths: ROUTE_LENGTHS,
			}).isBrowserLit,
		).toBe(true)
	})

	it('rests between beams, then moves to the next route', () => {
		expect(
			getPrivacyBeamFrame({
				elapsedMs: PRIVACY_BEAM_TRAVEL_MS + 100,
				landingDistance: 20,
				routeLengths: ROUTE_LENGTHS,
			}),
		).toMatchObject({ headProgress: null, isBrowserLit: true })
		expect(
			getPrivacyBeamFrame({
				elapsedMs: CYCLE_MS,
				landingDistance: 20,
				routeLengths: ROUTE_LENGTHS,
			}).beamIndex,
		).toBe(1)
	})

	it('wraps back to the first route and ignores negative time', () => {
		expect(
			getPrivacyBeamFrame({
				elapsedMs: CYCLE_MS * 3,
				landingDistance: 20,
				routeLengths: ROUTE_LENGTHS,
			}).beamIndex,
		).toBe(0)
		expect(
			getPrivacyBeamFrame({
				elapsedMs: -16,
				landingDistance: 20,
				routeLengths: ROUTE_LENGTHS,
			}).beamIndex,
		).toBe(0)
	})
})

describe('getCometDots', () => {
	it('trails dots behind the head and fades them', () => {
		const dots = getCometDots({
			count: 3,
			headDistance: 50,
			routeLength: 100,
			spacing: 10,
		})

		expect(dots.map((dot) => dot?.distance)).toEqual([50, 40, 30])
		expect(dots[0]?.strength).toBe(1)
		expect(dots[1]?.strength).toBeCloseTo(2 / 3)
		expect(dots[2]?.strength).toBeCloseTo(1 / 3)
	})

	it('drops dots that fall off either end of the route', () => {
		const dots = getCometDots({
			count: 3,
			headDistance: 10,
			routeLength: 100,
			spacing: 8,
		})

		expect(dots.map((dot) => dot?.distance ?? null)).toEqual([10, 2, null])
	})
})

describe('getCubicBezierPoint', () => {
	it('returns the endpoints and the midpoint of a curve', () => {
		const points = [
			{ x: 0, y: 0 },
			{ x: 0, y: 100 },
			{ x: 100, y: 100 },
			{ x: 100, y: 0 },
		] as const

		expect(getCubicBezierPoint({ points, t: 0 })).toEqual({ x: 0, y: 0 })
		expect(getCubicBezierPoint({ points, t: 1 })).toEqual({ x: 100, y: 0 })
		expect(getCubicBezierPoint({ points, t: 0.5 })).toEqual({ x: 50, y: 75 })
	})
})

export const PRIVACY_BEAM_TRAVEL_MS = 1800
export const PRIVACY_BEAM_PAUSE_MS = 450

export type PrivacyBeamFrame = {
	beamIndex: number
	// Eased distance of the beam's head along its route, from 0 to 1, or null
	// while the beam rests between routes.
	headProgress: null | number
	isBrowserLit: boolean
	isProviderLit: boolean
}

// One beam travels at a time, provider to browser, cycling through routes.
// The browser lights up once the head is within `landingDistance` of the end
// of its route, where it disappears beneath the browser node.
export const getPrivacyBeamFrame = ({
	elapsedMs,
	landingDistance,
	routeLengths,
}: Readonly<{
	elapsedMs: number
	landingDistance: number
	routeLengths: readonly number[]
}>): PrivacyBeamFrame => {
	const cycleMs = PRIVACY_BEAM_TRAVEL_MS + PRIVACY_BEAM_PAUSE_MS
	const safeElapsedMs = Math.max(0, elapsedMs)
	const progress = (safeElapsedMs % cycleMs) / PRIVACY_BEAM_TRAVEL_MS
	const beamIndex = Math.floor(safeElapsedMs / cycleMs) % routeLengths.length
	const routeLength = routeLengths[beamIndex] ?? 0
	const headProgress = progress <= 1 ? easeInOutCubic(progress) : null

	return {
		beamIndex,
		headProgress,
		isBrowserLit:
			headProgress === null ||
			headProgress * routeLength >= routeLength - landingDistance,
		isProviderLit: progress < PROVIDER_LIT_PROGRESS,
	}
}

export type CometDot = {
	distance: number
	strength: number
}

// Dots trail the head along the route, fading towards the tail. Dots that
// fall outside the route are dropped.
export const getCometDots = ({
	count,
	headDistance,
	routeLength,
	spacing,
}: Readonly<{
	count: number
	headDistance: number
	routeLength: number
	spacing: number
}>): (CometDot | null)[] =>
	Array.from({ length: count }, (_, index) => {
		const distance = headDistance - index * spacing
		if (distance < 0 || distance > routeLength) return null

		return { distance, strength: 1 - index / count }
	})

export type Point = Readonly<{ x: number; y: number }>

export const getCubicBezierPoint = ({
	points: [start, firstControl, secondControl, end],
	t,
}: Readonly<{
	points: readonly [Point, Point, Point, Point]
	t: number
}>): Point => {
	const inverse = 1 - t
	const weights = [
		inverse ** 3,
		3 * inverse ** 2 * t,
		3 * inverse * t ** 2,
		t ** 3,
	] as const

	return {
		x:
			weights[0] * start.x +
			weights[1] * firstControl.x +
			weights[2] * secondControl.x +
			weights[3] * end.x,
		y:
			weights[0] * start.y +
			weights[1] * firstControl.y +
			weights[2] * secondControl.y +
			weights[3] * end.y,
	}
}

const PROVIDER_LIT_PROGRESS = 0.35

const easeInOutCubic = (t: number) =>
	t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2

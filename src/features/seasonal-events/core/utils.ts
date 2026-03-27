import { Hemisphere } from './types'

export function getHemisphereFromLatitude(
	latitude: null | number | string | undefined,
): Hemisphere {
	if (latitude === null || latitude === undefined) {
		return Hemisphere.Northern
	}

	const numericLatitude =
		typeof latitude === 'string' ? Number.parseFloat(latitude) : latitude

	if (!Number.isFinite(numericLatitude)) {
		return Hemisphere.Northern
	}

	return numericLatitude < 0 ? Hemisphere.Southern : Hemisphere.Northern
}

export function randomInRange({ max, min }: { max: number; min: number }) {
	return Math.random() * (max - min) + min
}

const DEFAULT_CANVAS_MAX_PIXELS = 8_000_000

export function createAdaptiveDprController({
	cooldownMs = 1500,
	fastFps = 58,
	maxDpr,
	minScale = 0.6,
	sampleCount = 30,
	slowFps = 50,
	step = 0.1,
}: {
	cooldownMs?: number
	fastFps?: number
	maxDpr: number
	minScale?: number
	sampleCount?: number
	slowFps?: number
	step?: number
}) {
	let scale = 1
	let lastFrameTime: null | number = null
	let lastAdjustment = 0
	const samples: number[] = []

	const getDpr = ({ height, width }: { height: number; width: number }) =>
		getCanvasDpr({ height, maxDpr: maxDpr * scale, width })

	const reportFrame = (time: number) => {
		if (lastFrameTime === null) {
			lastFrameTime = time
			return false
		}

		const delta = time - lastFrameTime
		lastFrameTime = time
		if (delta <= 0) {
			return false
		}

		samples.push(1000 / delta)
		if (samples.length < sampleCount) {
			return false
		}

		const avgFps =
			samples.reduce((total, value) => total + value, 0) / samples.length
		samples.length = 0

		if (time - lastAdjustment < cooldownMs) {
			return false
		}

		if (avgFps < slowFps && scale > minScale) {
			scale = Math.max(minScale, scale - step)
			lastAdjustment = time
			return true
		}

		if (avgFps > fastFps && scale < 1) {
			scale = Math.min(1, scale + step)
			lastAdjustment = time
			return true
		}

		return false
	}

	return { getDpr, reportFrame }
}

export function getCanvasDpr({
	height,
	maxDpr,
	maxPixels = DEFAULT_CANVAS_MAX_PIXELS,
	width,
}: {
	height: number
	maxDpr: number
	maxPixels?: number
	width: number
}) {
	const devicePixelRatio =
		typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
	const safeWidth = Math.max(width, 1)
	const safeHeight = Math.max(height, 1)
	const pixelBudgetDpr = Math.sqrt(maxPixels / (safeWidth * safeHeight))

	if (!Number.isFinite(pixelBudgetDpr)) {
		return Math.min(maxDpr, devicePixelRatio)
	}

	return Math.min(maxDpr, devicePixelRatio, pixelBudgetDpr)
}

const SOFTWARE_RENDERER_HINTS = [
	'swiftshader',
	'llvmpipe',
	'software',
	'warp',
	'angle (software)',
	'microsoft basic render driver',
	'mesa offscreen',
] as const

let cachedIsSoftwareRenderer: boolean | null = null

const getWebglRendererInfo = () => {
	if (typeof document === 'undefined') {
		return null
	}

	const canvas = document.createElement('canvas')
	const gl =
		canvas.getContext('webgl2') ||
		canvas.getContext('webgl') ||
		canvas.getContext('experimental-webgl')

	if (!isWebglContext(gl)) {
		return null
	}

	const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
	const renderer = debugInfo
		? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
		: gl.getParameter(gl.RENDERER)
	const vendor = debugInfo
		? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
		: gl.getParameter(gl.VENDOR)

	return {
		renderer: typeof renderer === 'string' ? renderer : '',
		vendor: typeof vendor === 'string' ? vendor : '',
	}
}

const isWebglContext = (
	context: null | RenderingContext,
): context is WebGL2RenderingContext | WebGLRenderingContext =>
	Boolean(
		context &&
		'getExtension' in context &&
		'getParameter' in context &&
		'RENDERER' in context &&
		'VENDOR' in context,
	)

export const isLikelySoftwareRenderer = () => {
	if (typeof window === 'undefined') {
		return false
	}

	if (cachedIsSoftwareRenderer !== null) {
		return cachedIsSoftwareRenderer
	}

	const info = getWebglRendererInfo()
	if (!info) {
		cachedIsSoftwareRenderer = true
		return cachedIsSoftwareRenderer
	}

	const combined = `${info.vendor} ${info.renderer}`.toLowerCase()
	cachedIsSoftwareRenderer = SOFTWARE_RENDERER_HINTS.some((hint) =>
		combined.includes(hint),
	)

	return cachedIsSoftwareRenderer
}

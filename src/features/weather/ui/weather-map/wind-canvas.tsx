import type {
	WeatherMapDimensions,
	WeatherMapViewport,
} from '../../model/detail-types'
import type { WeatherMapData } from '../../model/types'
import { useRef, useEffect } from 'react'
import { getWeatherMapOverlayScale } from '../../model/weather-map/geometry'
import {
	createWeatherMapParticles,
	getInterpolatedWeatherMapWindPoints,
	getNearestWeatherMapWindPoint,
	resetWeatherMapParticle,
} from '../../model/weather-map/wind'
import {
	WEATHER_MAP_PARTICLE_MAX_FRAME_MULTIPLIER,
	WEATHER_MAP_PARTICLE_FRAME_MS,
	WEATHER_MAP_PARTICLE_TRAIL_ALPHA,
} from '../../model/weather-map/constants'
import { max } from '../../model/detail-formatting'

export const WeatherMapWindParticleCanvas = ({
	dimensions,
	frames,
	isActive,
	playbackPosition,
	viewport,
}: Readonly<{
	dimensions: WeatherMapDimensions
	frames: WeatherMapData['frames']
	isActive: boolean
	playbackPosition: number
	viewport: WeatherMapViewport
}>) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const framesRef = useRef(frames)
	const playbackPositionRef = useRef(playbackPosition)
	const mapHeight = dimensions.height
	const mapWidth = dimensions.width
	const viewportCenterX = viewport.centerX
	const viewportCenterY = viewport.centerY

	useEffect(() => {
		framesRef.current = frames
	}, [frames])

	useEffect(() => {
		playbackPositionRef.current = playbackPosition
	}, [playbackPosition])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas || !isActive) {
			return
		}

		const context = canvas.getContext('2d')
		if (!context) {
			return
		}

		const animationDimensions = {
			height: mapHeight,
			width: mapWidth,
		}
		const animationViewport = {
			centerX: viewportCenterX,
			centerY: viewportCenterY,
			dimensions: animationDimensions,
		}

		canvas.width = mapWidth
		canvas.height = mapHeight
		context.setTransform(1, 0, 0, 1, 0, 0)

		const overlayScale = getWeatherMapOverlayScale(animationDimensions)
		const particles = createWeatherMapParticles(animationDimensions)
		let animationFrame = 0
		let lastFrameTime = 0

		const draw = (time: number) => {
			const frameMultiplier =
				lastFrameTime === 0
					? 1
					: Math.min(
							WEATHER_MAP_PARTICLE_MAX_FRAME_MULTIPLIER,
							(time - lastFrameTime) / WEATHER_MAP_PARTICLE_FRAME_MS,
						)
			lastFrameTime = time
			const projectedPoints = getInterpolatedWeatherMapWindPoints({
				framePosition: playbackPositionRef.current,
				frames: framesRef.current,
				viewport: animationViewport,
			})
			const maxWind = Math.max(
				1,
				max(projectedPoints.map(({ speed }) => speed)),
			)
			const trailAlpha = Math.pow(
				WEATHER_MAP_PARTICLE_TRAIL_ALPHA,
				frameMultiplier,
			)
			context.globalCompositeOperation = 'destination-in'
			context.fillStyle = `rgba(0, 0, 0, ${trailAlpha})`
			context.fillRect(0, 0, mapWidth, mapHeight)
			context.globalCompositeOperation = 'source-over'
			context.lineCap = 'round'

			for (const particle of particles) {
				const nearestPoint = getNearestWeatherMapWindPoint({
					particle,
					projectedPoints,
				})
				if (!nearestPoint) {
					resetWeatherMapParticle({
						dimensions: animationDimensions,
						particle,
					})
					continue
				}

				const windRatio = nearestPoint.speed / maxWind
				const radians = ((nearestPoint.direction + 180 - 90) * Math.PI) / 180
				const speed = (0.05 + Math.pow(windRatio, 1.85) * 0.74) * overlayScale
				const frameSpeed = speed * frameMultiplier
				const nextX = particle.x + Math.cos(radians) * frameSpeed
				const nextY = particle.y + Math.sin(radians) * frameSpeed

				context.lineWidth = (0.85 + windRatio * 1.25) * overlayScale
				context.strokeStyle = `rgba(236, 254, 255, ${0.18 + windRatio * 0.42})`
				context.beginPath()
				context.moveTo(particle.x, particle.y)
				context.lineTo(nextX, nextY)
				context.stroke()

				particle.x = nextX
				particle.y = nextY
				particle.age += frameMultiplier

				if (
					particle.age > 180 ||
					particle.x < -12 ||
					particle.x > mapWidth + 12 ||
					particle.y < -12 ||
					particle.y > mapHeight + 12
				) {
					resetWeatherMapParticle({
						dimensions: animationDimensions,
						particle,
					})
				}
			}

			animationFrame = window.requestAnimationFrame(draw)
		}

		context.clearRect(0, 0, mapWidth, mapHeight)
		animationFrame = window.requestAnimationFrame(draw)

		return () => {
			window.cancelAnimationFrame(animationFrame)
		}
	}, [isActive, mapHeight, mapWidth, viewportCenterX, viewportCenterY])

	return (
		<canvas
			aria-hidden
			className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen"
			ref={canvasRef}
		/>
	)
}

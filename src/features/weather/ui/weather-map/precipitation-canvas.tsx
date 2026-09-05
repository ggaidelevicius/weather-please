import type {
	WeatherMapDimensions,
	WeatherMapViewport,
} from '../../model/detail-types'
import type { WeatherMapData } from '../../model/types'
import { useRef, useEffect } from 'react'
import {
	getWeatherMapPrecipitationMeshDimensions,
	getInterpolatedWeatherMapPrecipitationPoints,
	createWeatherMapPrecipitationMeshImageData,
} from '../../model/weather-map/precipitation'
import { WEATHER_MAP_PRECIPITATION_FRAME_INTERVAL_MS } from '../../model/weather-map/constants'

export const WeatherMapPrecipitationCanvas = ({
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
		const meshDimensions =
			getWeatherMapPrecipitationMeshDimensions(animationDimensions)
		const meshCanvas = document.createElement('canvas')
		const meshContext = meshCanvas.getContext('2d')
		if (!meshContext) {
			return
		}

		let animationFrame = 0

		canvas.width = mapWidth
		canvas.height = mapHeight
		meshCanvas.width = meshDimensions.width
		meshCanvas.height = meshDimensions.height
		context.setTransform(1, 0, 0, 1, 0, 0)

		let lastDrawTime = 0

		const draw = (time: number) => {
			if (time - lastDrawTime < WEATHER_MAP_PRECIPITATION_FRAME_INTERVAL_MS) {
				animationFrame = window.requestAnimationFrame(draw)
				return
			}

			lastDrawTime = time
			const precipitationPoints = getInterpolatedWeatherMapPrecipitationPoints({
				framePosition: playbackPositionRef.current,
				frames: framesRef.current,
				viewport: animationViewport,
			})
			const precipitationImageData = createWeatherMapPrecipitationMeshImageData(
				{
					context: meshContext,
					dimensions: animationDimensions,
					meshDimensions,
					points: precipitationPoints,
				},
			)

			context.clearRect(0, 0, mapWidth, mapHeight)
			context.globalCompositeOperation = 'source-over'
			context.filter = 'none'
			context.imageSmoothingEnabled = true
			meshContext.putImageData(precipitationImageData, 0, 0)
			context.drawImage(meshCanvas, 0, 0, mapWidth, mapHeight)
			animationFrame = window.requestAnimationFrame(draw)
		}

		animationFrame = window.requestAnimationFrame(draw)

		return () => {
			window.cancelAnimationFrame(animationFrame)
		}
	}, [isActive, mapHeight, mapWidth, viewportCenterX, viewportCenterY])

	return (
		<canvas
			aria-hidden
			className="pointer-events-none absolute inset-0 h-full w-full"
			ref={canvasRef}
		/>
	)
}

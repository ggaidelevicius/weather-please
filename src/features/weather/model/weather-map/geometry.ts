import type { WeatherMapData } from '../types'
import type {
	WeatherMapViewport,
	WeatherMapDimensions,
	WeatherMapDisplaySize,
	WeatherMapTile,
	WeatherMapPlaybackState,
} from '../detail-types'
import {
	WEATHER_MAP_RENDER_SCALE,
	WEATHER_MAP_TILE_SIZE,
	WEATHER_MAP_ZOOM,
	WEATHER_MAP_BASE_HEIGHT,
	WEATHER_MAP_FRAME_DURATION_MS,
} from './constants'

export const getWeatherMapFrame = ({
	frameIndex,
	weatherMapData,
}: {
	frameIndex: number
	weatherMapData: null | WeatherMapData
}) => {
	if (!weatherMapData || weatherMapData.frames.length === 0) {
		return null
	}

	return (
		weatherMapData.frames[
			Math.min(Math.max(frameIndex, 0), weatherMapData.frames.length - 1)
		] ?? null
	)
}

export const projectWeatherMapPoint = ({
	point,
	viewport,
}: {
	point: WeatherMapData['frames'][number]['points'][number]
	viewport: WeatherMapViewport
}) => {
	const { x, y } = coordinateToWeatherMapWorld(point)

	return {
		x: x - viewport.centerX + viewport.dimensions.width / 2,
		y: y - viewport.centerY + viewport.dimensions.height / 2,
	}
}

export const getWeatherMapDimensions = ({
	height,
	width,
}: WeatherMapDisplaySize): WeatherMapDimensions => ({
	height: Math.max(1, Math.round(height * WEATHER_MAP_RENDER_SCALE)),
	width: Math.max(1, Math.round(width * WEATHER_MAP_RENDER_SCALE)),
})

export const getWeatherMapTiles = ({
	center,
	dimensions,
}: {
	center: WeatherMapData['center']
	dimensions: WeatherMapDimensions
}): WeatherMapTile[] => {
	const viewport = getWeatherMapViewport({ center, dimensions })
	const minTileX = Math.floor(
		(viewport.centerX - dimensions.width / 2) / WEATHER_MAP_TILE_SIZE,
	)
	const maxTileX = Math.floor(
		(viewport.centerX + dimensions.width / 2) / WEATHER_MAP_TILE_SIZE,
	)
	const minTileY = Math.floor(
		(viewport.centerY - dimensions.height / 2) / WEATHER_MAP_TILE_SIZE,
	)
	const maxTileY = Math.floor(
		(viewport.centerY + dimensions.height / 2) / WEATHER_MAP_TILE_SIZE,
	)
	const tiles: WeatherMapTile[] = []

	for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
		for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
			const wrappedTileX = wrapWeatherMapTileX(tileX)
			const clampedTileY = clampWeatherMapTileY(tileY)
			tiles.push({
				key: `${wrappedTileX}-${clampedTileY}`,
				url: `https://tile.openstreetmap.org/${WEATHER_MAP_ZOOM}/${wrappedTileX}/${clampedTileY}.png`,
				x:
					tileX * WEATHER_MAP_TILE_SIZE -
					viewport.centerX +
					dimensions.width / 2,
				y:
					tileY * WEATHER_MAP_TILE_SIZE -
					viewport.centerY +
					dimensions.height / 2,
			})
		}
	}

	return tiles
}

export const getWeatherMapViewport = ({
	center,
	dimensions,
}: {
	center: WeatherMapData['center']
	dimensions: WeatherMapDimensions
}): WeatherMapViewport => {
	const { x, y } = coordinateToWeatherMapWorld(center)
	return { centerX: x, centerY: y, dimensions }
}

export const getWeatherMapOverlayScale = ({ height }: WeatherMapDimensions) =>
	height / WEATHER_MAP_BASE_HEIGHT

export const getWeatherMapPlaybackState = ({
	frames,
	startedAt,
	time,
}: {
	frames: WeatherMapData['frames']
	startedAt: number
	time: number
}): WeatherMapPlaybackState => {
	const frameCount = frames.length
	const firstFrame = frames[0]

	if (frameCount <= 1 || !firstFrame) {
		return {
			frameIndex: 0,
			framePosition: 0,
			frameProgress: 0,
			time: firstFrame?.time ?? 0,
			totalProgress: 0,
		}
	}

	const segmentCount = frameCount - 1
	const duration = segmentCount * WEATHER_MAP_FRAME_DURATION_MS
	const elapsed = (((time - startedAt) % duration) + duration) % duration
	const framePosition = elapsed / WEATHER_MAP_FRAME_DURATION_MS
	const frameIndex = Math.min(segmentCount - 1, Math.floor(framePosition))
	const frameProgress = framePosition - frameIndex
	const fromFrame = frames[frameIndex] ?? firstFrame
	const toFrame = frames[frameIndex + 1] ?? fromFrame

	return {
		frameIndex,
		framePosition,
		frameProgress,
		time: fromFrame.time + (toFrame.time - fromFrame.time) * frameProgress,
		totalProgress: elapsed / duration,
	}
}

export const getWeatherMapFrameInterpolation = ({
	framePosition,
	frames,
}: {
	framePosition: number
	frames: WeatherMapData['frames']
}) => {
	const frameCount = frames.length
	if (frameCount === 0) {
		return null
	}

	const lastFrameIndex = frameCount - 1
	const fromIndex = Math.min(
		lastFrameIndex,
		Math.max(0, Math.floor(framePosition)),
	)
	const toIndex = Math.min(lastFrameIndex, fromIndex + 1)
	const fromFrame = frames[fromIndex]
	const toFrame = frames[toIndex]

	if (!fromFrame || !toFrame) {
		return null
	}

	return {
		fromFrame,
		progress: Math.min(1, Math.max(0, framePosition - fromIndex)),
		toFrame,
	}
}

export const coordinateToWeatherMapWorld = ({
	lat,
	lon,
}: {
	lat: number
	lon: number
}) => {
	const scale = WEATHER_MAP_TILE_SIZE * 2 ** WEATHER_MAP_ZOOM
	const clampedLat = Math.min(Math.max(lat, -85.05112878), 85.05112878)
	const latRadians = (clampedLat * Math.PI) / 180

	return {
		x: ((lon + 180) / 360) * scale,
		y:
			(0.5 -
				Math.log((1 + Math.sin(latRadians)) / (1 - Math.sin(latRadians))) /
					(4 * Math.PI)) *
			scale,
	}
}

export const wrapWeatherMapTileX = (tileX: number) => {
	const tileCount = 2 ** WEATHER_MAP_ZOOM
	return ((tileX % tileCount) + tileCount) % tileCount
}

export const clampWeatherMapTileY = (tileY: number) => {
	const maxTile = 2 ** WEATHER_MAP_ZOOM - 1
	return Math.min(Math.max(tileY, 0), maxTile)
}

import type { CSSProperties } from 'react'

import { useEffect, useState } from 'react'

import {
	getWeatherTileColumnCount,
	WEATHER_TILE_MIN_WIDTH_PX,
} from '../model/tile-grid'

type UseWeatherTileGridParams = {
	horizontalPadding?: number
	tileCount: number
}

type UseWeatherTileGridResult = {
	gridStyle: CSSProperties
}

export const useWeatherTileGrid = ({
	horizontalPadding = 40,
	tileCount,
}: UseWeatherTileGridParams): UseWeatherTileGridResult => {
	const [columnCount, setColumnCount] = useState(1)

	useEffect(() => {
		const updateColumnCount = () => {
			setColumnCount(
				getWeatherTileColumnCount({
					availableWidth: getAvailableWidth({ horizontalPadding }),
					tileCount,
				}),
			)
		}

		updateColumnCount()

		window.addEventListener('resize', updateColumnCount)
		window.visualViewport?.addEventListener('resize', updateColumnCount)

		return () => {
			window.removeEventListener('resize', updateColumnCount)
			window.visualViewport?.removeEventListener('resize', updateColumnCount)
		}
	}, [horizontalPadding, tileCount])

	return {
		gridStyle: {
			gridTemplateColumns: `repeat(${columnCount}, minmax(${WEATHER_TILE_MIN_WIDTH_PX}px, 1fr))`,
		},
	}
}

type AvailableWidthParams = {
	horizontalPadding: number
}

const getAvailableWidth = ({
	horizontalPadding,
}: AvailableWidthParams): number => {
	if (typeof window === 'undefined') {
		return 0
	}

	const viewportWidth =
		window.visualViewport?.width ||
		document.documentElement.clientWidth ||
		window.innerWidth

	return Math.max(0, viewportWidth - horizontalPadding)
}

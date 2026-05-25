export const WEATHER_TILE_GRID_GAP_PX = 20
export const WEATHER_TILE_MIN_WIDTH_PX = 220

type WeatherTileColumnCountParams = {
	availableWidth: number
	gap?: number
	minTileWidth?: number
	tileCount: number
}

export const getWeatherTileColumnCount = ({
	availableWidth,
	gap = WEATHER_TILE_GRID_GAP_PX,
	minTileWidth = WEATHER_TILE_MIN_WIDTH_PX,
	tileCount,
}: WeatherTileColumnCountParams): number => {
	if (tileCount <= 1 || availableWidth <= 0) {
		return 1
	}

	const preferredMaxColumns = getPreferredMaxColumns({ tileCount })
	const maxColumns = Math.max(
		1,
		Math.min(
			preferredMaxColumns,
			tileCount,
			Math.floor((availableWidth + gap) / (minTileWidth + gap)),
		),
	)

	if (maxColumns >= tileCount) {
		return tileCount
	}

	const rowCount = Math.ceil(tileCount / maxColumns)
	const minimumColumnsForRowCount = Math.ceil(tileCount / rowCount)
	let bestColumnCount = maxColumns
	let bestImbalance = getRowImbalance({
		columnCount: maxColumns,
		tileCount,
	})

	for (
		let columnCount = minimumColumnsForRowCount;
		columnCount < maxColumns;
		columnCount += 1
	) {
		const imbalance = getRowImbalance({ columnCount, tileCount })
		const hasBetterBalance = imbalance < bestImbalance
		const hasSameBalanceWithMoreSpace =
			imbalance === bestImbalance && columnCount > bestColumnCount

		if (hasBetterBalance || hasSameBalanceWithMoreSpace) {
			bestColumnCount = columnCount
			bestImbalance = imbalance
		}
	}

	return bestColumnCount
}

type PreferredMaxColumnsParams = {
	tileCount: number
}

const getPreferredMaxColumns = ({
	tileCount,
}: PreferredMaxColumnsParams): number => {
	if (tileCount === 6) {
		return 3
	}

	if (tileCount === 8) {
		return 4
	}

	if (tileCount === 9) {
		return 3
	}

	return tileCount
}

type RowImbalanceParams = {
	columnCount: number
	tileCount: number
}

const getRowImbalance = ({
	columnCount,
	tileCount,
}: RowImbalanceParams): number => {
	const finalRowCount = tileCount % columnCount || columnCount

	return columnCount - finalRowCount
}

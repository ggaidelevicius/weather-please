export const isLocationInAustralia = (lat: string, lon: string): boolean => {
	const latValue = Number(lat)
	const lonValue = Number(lon)

	if (!Number.isFinite(latValue) || !Number.isFinite(lonValue)) {
		return false
	}

	return (
		latValue >= -44 && latValue <= -10 && lonValue >= 112 && lonValue <= 154
	)
}

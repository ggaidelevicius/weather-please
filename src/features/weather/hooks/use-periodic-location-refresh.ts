import { useEffect, useEffectEvent } from 'react'

const DEFAULT_LOCATION_CHANGE_THRESHOLD_KM = 1
const DEFAULT_LOCATION_CHECK_INTERVAL_MS = 60 * 1000
const EARTH_RADIUS_KM = 6371

type UsePeriodicLocationRefreshOptions = {
	changeThresholdKm?: number
	enabled: boolean
	intervalMs?: number
	lat: string
	lon: string
	onLocationChange: (coords: { lat: string; lon: string }) => void
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

export const calculateDistanceKm = (
	currentLat: number,
	currentLon: number,
	incomingLat: number,
	incomingLon: number,
) => {
	const dLat = toRadians(incomingLat - currentLat)
	const dLon = toRadians(incomingLon - currentLon)
	const lat1 = toRadians(currentLat)
	const lat2 = toRadians(incomingLat)

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

	return EARTH_RADIUS_KM * c
}

export const usePeriodicLocationRefresh = ({
	changeThresholdKm = DEFAULT_LOCATION_CHANGE_THRESHOLD_KM,
	enabled,
	intervalMs = DEFAULT_LOCATION_CHECK_INTERVAL_MS,
	lat,
	lon,
	onLocationChange,
}: Readonly<UsePeriodicLocationRefreshOptions>) => {
	const handleDetectedLocationChange = useEffectEvent(onLocationChange)

	useEffect(() => {
		if (!enabled) {
			return
		}

		const handleLocationUpdate = () => {
			if (!navigator.geolocation) {
				console.error('Geolocation is not supported in this browser.')
				return
			}

			navigator.geolocation.getCurrentPosition(
				(pos) => {
					const nextLat = pos.coords.latitude
					const nextLon = pos.coords.longitude

					if (!lat || !lon) {
						handleDetectedLocationChange({
							lat: nextLat.toString(),
							lon: nextLon.toString(),
						})
						return
					}

					const currentLat = Number.parseFloat(lat)
					const currentLon = Number.parseFloat(lon)
					const distance = calculateDistanceKm(
						currentLat,
						currentLon,
						nextLat,
						nextLon,
					)

					if (distance > changeThresholdKm) {
						handleDetectedLocationChange({
							lat: nextLat.toString(),
							lon: nextLon.toString(),
						})
					}
				},
				(geoError) => {
					console.error('Geolocation error:', geoError)
				},
			)
		}

		handleLocationUpdate()
		const intervalId = setInterval(handleLocationUpdate, intervalMs)

		return () => clearInterval(intervalId)
	}, [enabled, lat, lon, changeThresholdKm, intervalMs])
}

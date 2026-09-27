import { useEffect, useEffectEvent } from 'react'

import {
	readSharedResource,
	requestSharedResource,
	subscribeSharedResource,
} from '../../../shared/lib/shared-resource'
import { getCurrentTimestamp } from '../../../shared/lib/time'
import {
	type DeviceLocationResult,
	deviceLocationResultSchema,
	fetchDeviceLocation,
} from '../../location/api/device-location'
import { isAbortError } from '../model/error-names'

const DEFAULT_LOCATION_CHANGE_THRESHOLD_KM = 1
const DEFAULT_LOCATION_CHECK_INTERVAL_MS = 60 * 1000
const EARTH_RADIUS_KM = 6371
const DEVICE_LOCATION_RESOURCE_KEY = 'device-location'

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
	const handleDetectedLocation = useEffectEvent(
		(location: DeviceLocationResult) => {
			if (!enabled || location.status !== 'success') return
			const currentLat = Number.parseFloat(lat)
			const currentLon = Number.parseFloat(lon)
			const hasCurrentLocation =
				Number.isFinite(currentLat) && Number.isFinite(currentLon)
			if (
				!hasCurrentLocation ||
				calculateDistanceKm(
					currentLat,
					currentLon,
					location.lat,
					location.lon,
				) > changeThresholdKm
			) {
				onLocationChange({
					lat: location.lat.toString(),
					lon: location.lon.toString(),
				})
			}
		},
	)

	useEffect(() => {
		if (!enabled) {
			return
		}

		const controller = new AbortController()
		let timeoutId: ReturnType<typeof setTimeout> | undefined
		let lastAppliedAt: null | number = null
		const scheduleNextCheck = (updatedAt = getCurrentTimestamp()) => {
			clearTimeout(timeoutId)
			if (controller.signal.aborted || document.visibilityState !== 'visible')
				return
			timeoutId = setTimeout(
				checkLocation,
				Math.max(1, updatedAt + intervalMs + 1 - getCurrentTimestamp()),
			)
		}
		const adoptSharedLocation = () => {
			if (controller.signal.aborted) return false
			const sharedLocation = readSharedResource({
				key: DEVICE_LOCATION_RESOURCE_KEY,
				maxAgeMs: intervalMs,
				schema: deviceLocationResultSchema,
			})
			if (!sharedLocation) return false
			if (sharedLocation.updatedAt !== lastAppliedAt) {
				lastAppliedAt = sharedLocation.updatedAt
				handleDetectedLocation(sharedLocation.value)
			}
			scheduleNextCheck(sharedLocation.updatedAt)
			return true
		}
		const checkLocation = () => {
			clearTimeout(timeoutId)
			if (document.visibilityState !== 'visible') return
			void requestSharedResource({
				fetcher: fetchDeviceLocation,
				key: DEVICE_LOCATION_RESOURCE_KEY,
				maxAgeMs: intervalMs,
				schema: deviceLocationResultSchema,
				signal: controller.signal,
			})
				.then(() => {
					if (!adoptSharedLocation()) scheduleNextCheck()
				})
				.catch((error) => {
					if (!controller.signal.aborted && !isAbortError(error)) {
						console.error('Location check failed:', error)
					}
					scheduleNextCheck()
				})
		}
		const handleVisibilityChange = () => {
			clearTimeout(timeoutId)
			if (!adoptSharedLocation() && document.visibilityState === 'visible') {
				checkLocation()
			}
		}
		const unsubscribe = subscribeSharedResource({
			key: DEVICE_LOCATION_RESOURCE_KEY,
			onChange: adoptSharedLocation,
		})
		document.addEventListener('visibilitychange', handleVisibilityChange)
		document.addEventListener('resume', handleVisibilityChange)
		window.addEventListener('pageshow', handleVisibilityChange)
		handleVisibilityChange()

		return () => {
			controller.abort()
			clearTimeout(timeoutId)
			unsubscribe()
			document.removeEventListener('visibilitychange', handleVisibilityChange)
			document.removeEventListener('resume', handleVisibilityChange)
			window.removeEventListener('pageshow', handleVisibilityChange)
		}
	}, [enabled, intervalMs])
}

import { useEffect, useRef, useState } from 'react'
import {
	AsyncStatus,
	isLoadingStatus,
} from '../../../shared/hooks/async-status'
import { isLocationInAustralia } from '../../../shared/lib/location'
import { deriveAlertsFromWeather, createEmptyAlerts } from '../model/alerts'
import { getCachedWeather, writeCachedWeather } from '../model/cache'
import {
	fetchWeatherResponse,
	getUserTimeZone,
	mapWeatherResponseToForecastData,
	type WeatherResponse,
} from '../api/weather-api'
import {
	CACHE_REFRESH_DELAY_MINUTE,
	CACHE_REFRESH_INTERVAL_MS,
	type Alerts,
	type Data,
} from '../model/types'
import { isAbortError } from '../model/error-names'

export type { Alerts } from '../model/types'

export const useWeather = (
	lat: string,
	lon: string,
	changedLocation: boolean,
	useAirQualityUvOverride: boolean,
) => {
	const userTimeZone = getUserTimeZone()
	const shouldUseAirQualityUv =
		useAirQualityUvOverride || isLocationInAustralia(lat, lon)
	const [alertData, setAlertData] = useState<Alerts>(createEmptyAlerts)
	const [weatherData, setWeatherData] = useState<Data | []>([])
	const [usingCachedData, setUsingCachedData] = useState(true)
	const [data, setData] = useState<WeatherResponse | null>(null)
	const [error, setError] = useState<Error | null>(null)
	const [status, setStatus] = useState<AsyncStatus>(AsyncStatus.Idle)
	const [refreshToken, setRefreshToken] = useState(0)

	const lastHourRef = useRef(new Date().getHours())
	const latestRequestRef = useRef(0)
	const activeRequestControllerRef = useRef<AbortController | null>(null)

	useEffect(() => {
		if (!lat || !lon || usingCachedData) {
			if (!lat || !lon) {
				setStatus(AsyncStatus.Idle)
			}
			return
		}

		const requestId = latestRequestRef.current + 1
		latestRequestRef.current = requestId
		setError(null)
		setStatus(AsyncStatus.Loading)

		activeRequestControllerRef.current?.abort()
		const controller = new AbortController()
		activeRequestControllerRef.current = controller

		void fetchWeatherResponse({
			lat,
			lon,
			timeZone: userTimeZone,
			shouldUseAirQualityUv,
			signal: controller.signal,
		})
			.then((responseData) => {
				if (latestRequestRef.current !== requestId) {
					return
				}
				setData(responseData)
				setStatus(AsyncStatus.Success)
			})
			.catch((fetchError) => {
				if (latestRequestRef.current !== requestId) {
					return
				}
				if (isAbortError(fetchError)) {
					return
				}
				setData(null)
				setStatus(AsyncStatus.Error)
				setError(
					fetchError instanceof Error
						? fetchError
						: new Error('Weather fetch failed'),
				)
			})

		return () => {
			controller.abort()
		}
	}, [
		lat,
		lon,
		userTimeZone,
		shouldUseAirQualityUv,
		usingCachedData,
		refreshToken,
	])

	useEffect(() => {
		if (data) {
			const now = new Date()
			const currentHour = now.getHours()
			lastHourRef.current = currentHour

			const futureData = mapWeatherResponseToForecastData(data)
			const alerts = deriveAlertsFromWeather(data, currentHour)

			setWeatherData(futureData)
			setAlertData(alerts)
			writeCachedWeather({
				weatherData: futureData,
				alertData: alerts,
				lat,
				lon,
				timeZone: userTimeZone,
				shouldUseAirQualityUv,
				lastUpdatedDate: now,
			})
		} else if (error) {
			console.error('Weather fetch error:', error)
		}
	}, [data, error, lat, lon, userTimeZone, shouldUseAirQualityUv])

	useEffect(() => {
		const interval = setInterval(() => {
			const now = new Date()
			const currentHour = now.getHours()
			const currentMinute = now.getMinutes()
			if (
				currentHour !== lastHourRef.current &&
				currentMinute >= CACHE_REFRESH_DELAY_MINUTE
			) {
				lastHourRef.current = currentHour
				setUsingCachedData(false)
				setRefreshToken((previous) => previous + 1)
			}
		}, CACHE_REFRESH_INTERVAL_MS)

		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		if (!lat || !lon) {
			return
		}

		if (changedLocation) {
			setUsingCachedData(false)
			setRefreshToken((previous) => previous + 1)
			setStatus(AsyncStatus.Loading)
			return
		}

		const cached = getCachedWeather({
			lat,
			lon,
			timeZone: userTimeZone,
			shouldUseAirQualityUv,
		})

		if (!cached) {
			setUsingCachedData(false)
			setStatus(AsyncStatus.Loading)
			return
		}

		const now = new Date()
		setWeatherData(cached.weatherData)
		setAlertData(cached.alertData)
		setStatus(AsyncStatus.Success)
		lastHourRef.current = cached.lastUpdatedDate.getHours()

		const shouldRefresh =
			now.getHours() !== cached.lastUpdatedDate.getHours() &&
			now.getMinutes() >= CACHE_REFRESH_DELAY_MINUTE
		setUsingCachedData(!shouldRefresh)

		if (shouldRefresh) {
			setRefreshToken((previous) => previous + 1)
		}
	}, [lat, lon, changedLocation, userTimeZone, shouldUseAirQualityUv])

	const retry = () => {
		setUsingCachedData(false)
		setStatus(AsyncStatus.Loading)
		setRefreshToken((previous) => previous + 1)
	}

	const hasData = weatherData.length > 0

	return {
		weatherData,
		alertData,
		status,
		hasData,
		isLoading:
			!Boolean(lat) ||
			!Boolean(lon) ||
			(isLoadingStatus(status) && weatherData.length === 0 && !data),
		error,
		retry,
	}
}

import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { isLocationInAustralia } from '../lib/location'
import { queryClient } from '../lib/query-client'
import {
	deriveAlertsFromWeather,
	createEmptyAlerts,
} from '../lib/weather/alerts'
import { getCachedWeather, writeCachedWeather } from '../lib/weather/cache'
import {
	fetchWeatherResponse,
	getUserTimeZone,
	mapWeatherResponseToForecastData,
	type WeatherResponse,
} from '../lib/weather/api'
import {
	CACHE_REFRESH_DELAY_MINUTE,
	CACHE_REFRESH_INTERVAL_MS,
	type Alerts,
	type Data,
} from '../lib/weather/types'

export type { Alerts } from '../lib/weather/types'

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

	const lastHourRef = useRef(new Date().getHours())

	const { error, data, refetch } = useQuery<WeatherResponse>({
		queryKey: ['weather', lat, lon, userTimeZone, shouldUseAirQualityUv],
		queryFn: () =>
			fetchWeatherResponse({
				lat,
				lon,
				timeZone: userTimeZone,
				shouldUseAirQualityUv,
			}),
		enabled: Boolean(lat) && Boolean(lon) && !usingCachedData,
	})

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
				queryClient.invalidateQueries({ queryKey: ['weather'] })
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
			return
		}

		const now = new Date()
		setWeatherData(cached.weatherData)
		setAlertData(cached.alertData)
		lastHourRef.current = cached.lastUpdatedDate.getHours()

		const shouldRefresh =
			now.getHours() !== cached.lastUpdatedDate.getHours() &&
			now.getMinutes() >= CACHE_REFRESH_DELAY_MINUTE
		setUsingCachedData(!shouldRefresh)

		if (shouldRefresh) {
			queryClient.invalidateQueries({ queryKey: ['weather'] })
		}
	}, [lat, lon, changedLocation, userTimeZone, shouldUseAirQualityUv])

	const retry = () => {
		setUsingCachedData(false)
		refetch()
	}

	return {
		weatherData,
		alertData,
		isLoading:
			!Boolean(lat) || !Boolean(lon) || (weatherData.length === 0 && !data),
		error,
		retry,
	}
}

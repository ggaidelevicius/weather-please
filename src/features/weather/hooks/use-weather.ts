import { useEffect, useReducer, useRef } from 'react'

import {
	AsyncStatus,
	isLoadingStatus,
} from '../../../shared/hooks/async-status'
import { isLocationInAustralia } from '../../../shared/lib/location'
import {
	fetchWeatherResponse,
	getUserTimeZone,
	mapWeatherResponseToForecastData,
} from '../api/weather-api'
import { createEmptyAlerts, deriveAlertsFromWeather } from '../model/alerts'
import { getCachedWeather, writeCachedWeather } from '../model/cache'
import { isAbortError } from '../model/error-names'
import {
	type Alerts,
	CACHE_REFRESH_DELAY_MINUTE,
	CACHE_REFRESH_INTERVAL_MS,
	type Data,
} from '../model/types'

type WeatherAction =
	| {
			alertData: Alerts
			shouldRefresh: boolean
			type: 'hydrate-cache'
			weatherData: [] | Data
	  }
	| {
			alertData: Alerts
			type: 'fetch-success'
			weatherData: [] | Data
	  }
	| {
			error: Error
			type: 'fetch-error'
	  }
	| {
			status?: AsyncStatus
			type: 'request-refresh'
	  }
	| {
			type: 'reset-no-location'
	  }
	| {
			type: 'start-fetch'
	  }
	| {
			type: 'use-network'
	  }

type WeatherState = {
	alertData: Alerts
	error: Error | null
	refreshToken: number
	status: AsyncStatus
	usingCachedData: boolean
	weatherData: [] | Data
}

export type { Alerts } from '../model/types'

const createInitialWeatherState = (): WeatherState => ({
	alertData: createEmptyAlerts(),
	error: null,
	refreshToken: 0,
	status: AsyncStatus.Idle,
	usingCachedData: true,
	weatherData: [],
})

const weatherReducer = (
	state: WeatherState,
	action: WeatherAction,
): WeatherState => {
	switch (action.type) {
		case 'fetch-error':
			return {
				...state,
				error: action.error,
				status: AsyncStatus.Error,
			}
		case 'fetch-success':
			return {
				...state,
				alertData: action.alertData,
				error: null,
				status: AsyncStatus.Success,
				weatherData: action.weatherData,
			}
		case 'hydrate-cache':
			return {
				...state,
				alertData: action.alertData,
				error: null,
				refreshToken: state.refreshToken + (action.shouldRefresh ? 1 : 0),
				status: AsyncStatus.Success,
				usingCachedData: !action.shouldRefresh,
				weatherData: action.weatherData,
			}
		case 'request-refresh':
			return {
				...state,
				refreshToken: state.refreshToken + 1,
				status: action.status ?? state.status,
				usingCachedData: false,
			}
		case 'reset-no-location':
			return {
				...state,
				error: null,
				status: AsyncStatus.Idle,
			}
		case 'start-fetch':
			return {
				...state,
				error: null,
				status: AsyncStatus.Loading,
			}
		case 'use-network':
			return {
				...state,
				status: AsyncStatus.Loading,
				usingCachedData: false,
			}
	}
}

export const useWeather = (
	lat: string,
	lon: string,
	locationChangeToken: number,
	useAirQualityUvOverride: boolean,
) => {
	const userTimeZone = getUserTimeZone()
	const shouldUseAirQualityUv =
		useAirQualityUvOverride || isLocationInAustralia(lat, lon)
	const [state, dispatch] = useReducer(
		weatherReducer,
		undefined,
		createInitialWeatherState,
	)

	const lastHourRef = useRef(new Date().getHours())
	const latestRequestRef = useRef(0)
	const activeRequestControllerRef = useRef<AbortController | null>(null)

	useEffect(() => {
		if (!lat || !lon || state.usingCachedData) {
			if (!lat || !lon) {
				dispatch({ type: 'reset-no-location' })
			}
			return
		}

		const requestId = latestRequestRef.current + 1
		latestRequestRef.current = requestId
		dispatch({ type: 'start-fetch' })

		activeRequestControllerRef.current?.abort()
		const controller = new AbortController()
		activeRequestControllerRef.current = controller

		void fetchWeatherResponse({
			lat,
			lon,
			shouldUseAirQualityUv,
			signal: controller.signal,
			timeZone: userTimeZone,
		})
			.then((responseData) => {
				if (latestRequestRef.current !== requestId) {
					return
				}
				const now = new Date()
				const currentHour = now.getHours()
				lastHourRef.current = currentHour

				const weatherData = mapWeatherResponseToForecastData(responseData)
				const alertData = deriveAlertsFromWeather(responseData, currentHour)
				writeCachedWeather({
					alertData,
					lastUpdatedDate: now,
					lat,
					lon,
					shouldUseAirQualityUv,
					timeZone: userTimeZone,
					weatherData,
				})
				dispatch({
					alertData,
					type: 'fetch-success',
					weatherData,
				})
			})
			.catch((fetchError) => {
				if (latestRequestRef.current !== requestId) {
					return
				}
				if (isAbortError(fetchError)) {
					return
				}
				const error =
					fetchError instanceof Error
						? fetchError
						: new Error('Weather fetch failed')
				console.error('Weather fetch error:', error)
				dispatch({
					error,
					type: 'fetch-error',
				})
			})

		return () => {
			controller.abort()
		}
	}, [
		lat,
		lon,
		userTimeZone,
		shouldUseAirQualityUv,
		state.refreshToken,
		state.usingCachedData,
	])

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
				dispatch({ type: 'request-refresh' })
			}
		}, CACHE_REFRESH_INTERVAL_MS)

		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		if (!lat || !lon) {
			return
		}

		if (locationChangeToken > 0) {
			dispatch({
				status: AsyncStatus.Loading,
				type: 'request-refresh',
			})
			return
		}

		const cached = getCachedWeather({
			lat,
			lon,
			shouldUseAirQualityUv,
			timeZone: userTimeZone,
		})

		if (!cached) {
			dispatch({ type: 'use-network' })
			return
		}

		const now = new Date()
		lastHourRef.current = cached.lastUpdatedDate.getHours()

		const shouldRefresh =
			now.getHours() !== cached.lastUpdatedDate.getHours() &&
			now.getMinutes() >= CACHE_REFRESH_DELAY_MINUTE
		dispatch({
			alertData: cached.alertData,
			shouldRefresh,
			type: 'hydrate-cache',
			weatherData: cached.weatherData,
		})
	}, [lat, lon, locationChangeToken, userTimeZone, shouldUseAirQualityUv])

	const retry = () => {
		dispatch({
			status: AsyncStatus.Loading,
			type: 'request-refresh',
		})
	}

	const hasData = state.weatherData.length > 0

	return {
		alertData: state.alertData,
		error: state.error,
		hasData,
		isLoading:
			!Boolean(lat) ||
			!Boolean(lon) ||
			(isLoadingStatus(state.status) && state.weatherData.length === 0),
		retry,
		status: state.status,
		weatherData: state.weatherData,
	}
}

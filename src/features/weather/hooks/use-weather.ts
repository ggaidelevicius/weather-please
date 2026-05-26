import { useEffect, useReducer, useRef } from 'react'

import {
	AsyncStatus,
	isLoadingStatus,
} from '../../../shared/hooks/async-status'
import { isLocationInAustralia } from '../../../shared/lib/location'
import {
	fetchWeatherMapData,
	fetchWeatherResponse,
	getUserTimeZone,
	mapWeatherResponseToForecastData,
	mapWeatherResponseToNext24HoursData,
} from '../api/weather-api'
import {
	createEmptyAlerts,
	deriveAlertsFromNext24HoursData,
	deriveAlertsFromWeather,
} from '../model/alerts'
import {
	type CachedWeather,
	getCachedWeather,
	writeCachedWeather,
	writeCachedWeatherMapData,
} from '../model/cache'
import { isAbortError } from '../model/error-names'
import {
	type Alerts,
	CACHE_REFRESH_DELAY_MINUTE,
	CACHE_REFRESH_INTERVAL_MS,
	type Data,
	type Next24HoursData,
	NEXT_24_HOURS_FORECAST_HOURS,
	type WeatherMapData,
} from '../model/types'

type WeatherAction =
	| {
			alertData: Alerts
			error: Error
			lastUpdatedDate: Date
			next24HoursData: Next24HoursData
			type: 'fetch-degraded-cache'
			weatherData: [] | Data
			weatherMapData: null | WeatherMapData
	  }
	| {
			alertData: Alerts
			next24HoursData: Next24HoursData
			shouldRefresh: boolean
			type: 'hydrate-cache'
			weatherData: [] | Data
			weatherMapData: null | WeatherMapData
	  }
	| {
			alertData: Alerts
			next24HoursData: Next24HoursData
			type: 'fetch-success'
			weatherData: [] | Data
			weatherMapData: null | WeatherMapData
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
			type: 'fetch-map-success'
			weatherMapData: WeatherMapData
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
	degradedForecast: null | {
		error: Error
		lastUpdatedDate: Date
	}
	error: Error | null
	next24HoursData: [] | Next24HoursData
	refreshToken: number
	status: AsyncStatus
	usingCachedData: boolean
	weatherData: [] | Data
	weatherMapData: null | WeatherMapData
}

export type { Alerts } from '../model/types'

const createInitialWeatherState = (): WeatherState => ({
	alertData: createEmptyAlerts(),
	degradedForecast: null,
	error: null,
	next24HoursData: [],
	refreshToken: 0,
	status: AsyncStatus.Idle,
	usingCachedData: true,
	weatherData: [],
	weatherMapData: null,
})

const weatherReducer = (
	state: WeatherState,
	action: WeatherAction,
): WeatherState => {
	switch (action.type) {
		case 'fetch-degraded-cache':
			return {
				...state,
				alertData: action.alertData,
				degradedForecast: {
					error: action.error,
					lastUpdatedDate: action.lastUpdatedDate,
				},
				error: null,
				next24HoursData: action.next24HoursData,
				status: AsyncStatus.Success,
				usingCachedData: true,
				weatherData: action.weatherData,
				weatherMapData: action.weatherMapData,
			}
		case 'fetch-error':
			return {
				...state,
				degradedForecast: null,
				error: action.error,
				status: AsyncStatus.Error,
			}
		case 'fetch-map-success':
			return {
				...state,
				weatherMapData: action.weatherMapData,
			}
		case 'fetch-success':
			return {
				...state,
				alertData: action.alertData,
				degradedForecast: null,
				error: null,
				next24HoursData: action.next24HoursData,
				status: AsyncStatus.Success,
				weatherData: action.weatherData,
				weatherMapData: action.weatherMapData,
			}
		case 'hydrate-cache':
			return {
				...state,
				alertData: action.alertData,
				degradedForecast: null,
				error: null,
				next24HoursData: action.next24HoursData,
				refreshToken: state.refreshToken + (action.shouldRefresh ? 1 : 0),
				status: AsyncStatus.Success,
				usingCachedData: !action.shouldRefresh,
				weatherData: action.weatherData,
				weatherMapData: action.weatherMapData,
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
				degradedForecast: null,
				error: null,
				status: AsyncStatus.Idle,
			}
		case 'start-fetch':
			return {
				...state,
				degradedForecast: null,
				error: null,
				status: AsyncStatus.Loading,
			}
		case 'use-network':
			return {
				...state,
				degradedForecast: null,
				status: AsyncStatus.Loading,
				usingCachedData: false,
			}
	}
}

const getReducedCachedWeather = ({
	cached,
	now,
}: {
	cached: CachedWeather
	now: Date
}) => {
	const nowSeconds = Math.floor(now.getTime() / 1000)
	const todayStart = new Date(now)
	todayStart.setHours(0, 0, 0, 0)
	const todayStartSeconds = Math.floor(todayStart.getTime() / 1000)
	const next24HoursData = cached.next24HoursData
		.filter(({ time }) => time >= nowSeconds)
		.slice(0, NEXT_24_HOURS_FORECAST_HOURS)
	const weatherData = cached.weatherData.filter(
		({ day }) => day >= todayStartSeconds,
	)
	const weatherMapData = cached.weatherMapData
		? {
				...cached.weatherMapData,
				frames: cached.weatherMapData.frames.filter(
					({ time }) => time >= nowSeconds,
				),
			}
		: null

	if (weatherData.length === 0 && next24HoursData.length === 0) {
		return null
	}

	return {
		alertData: deriveAlertsFromNext24HoursData(next24HoursData),
		next24HoursData,
		weatherData,
		weatherMapData,
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
	const missingMapRequestKeyRef = useRef<null | string>(null)

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

		const weatherRequest = fetchWeatherResponse({
			lat,
			lon,
			shouldUseAirQualityUv,
			signal: controller.signal,
			timeZone: userTimeZone,
		})

		void weatherRequest
			.then((responseData) => {
				if (latestRequestRef.current !== requestId) {
					return
				}
				const now = new Date()
				const currentHour = now.getHours()
				lastHourRef.current = currentHour

				const weatherData = mapWeatherResponseToForecastData(responseData)
				const next24HoursData = mapWeatherResponseToNext24HoursData({
					currentHour,
					data: responseData,
				})
				const alertData = deriveAlertsFromWeather(responseData, currentHour)
				writeCachedWeather({
					alertData,
					lastUpdatedDate: now,
					lat,
					lon,
					next24HoursData,
					shouldUseAirQualityUv,
					timeZone: userTimeZone,
					weatherData,
					weatherMapData: null,
				})
				dispatch({
					alertData,
					next24HoursData,
					type: 'fetch-success',
					weatherData,
					weatherMapData: null,
				})

				void fetchWeatherMapData({
					lat,
					lon,
					signal: controller.signal,
					timeZone: userTimeZone,
				})
					.then((weatherMapData) => {
						if (latestRequestRef.current !== requestId) {
							return
						}

						writeCachedWeatherMapData({ weatherMapData })
						dispatch({ type: 'fetch-map-success', weatherMapData })
					})
					.catch((weatherMapError) => {
						if (isAbortError(weatherMapError)) {
							return
						}
						console.error('Weather map fetch error:', weatherMapError)
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

				const cached = getCachedWeather({
					allowStale: true,
					lat,
					lon,
					shouldUseAirQualityUv,
					timeZone: userTimeZone,
				})
				const reducedCached = cached
					? getReducedCachedWeather({ cached, now: new Date() })
					: null

				if (cached && reducedCached) {
					dispatch({
						alertData: reducedCached.alertData,
						error,
						lastUpdatedDate: cached.lastUpdatedDate,
						next24HoursData: reducedCached.next24HoursData,
						type: 'fetch-degraded-cache',
						weatherData: reducedCached.weatherData,
						weatherMapData: reducedCached.weatherMapData,
					})
					return
				}

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
		if (
			!lat ||
			!lon ||
			!state.usingCachedData ||
			state.weatherData.length === 0 ||
			state.weatherMapData
		) {
			return
		}

		const requestKey = `${lat}:${lon}:${userTimeZone}:${shouldUseAirQualityUv}`
		if (missingMapRequestKeyRef.current === requestKey) {
			return
		}

		missingMapRequestKeyRef.current = requestKey
		const controller = new AbortController()

		void fetchWeatherMapData({
			lat,
			lon,
			signal: controller.signal,
			timeZone: userTimeZone,
		})
			.then((weatherMapData) => {
				writeCachedWeatherMapData({ weatherMapData })
				dispatch({ type: 'fetch-map-success', weatherMapData })
			})
			.catch((weatherMapError) => {
				if (isAbortError(weatherMapError)) {
					return
				}
				console.error('Weather map fetch error:', weatherMapError)
				missingMapRequestKeyRef.current = null
			})

		return () => {
			controller.abort()
		}
	}, [
		lat,
		lon,
		shouldUseAirQualityUv,
		state.usingCachedData,
		state.weatherData.length,
		state.weatherMapData,
		userTimeZone,
	])

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
			(now.getHours() !== cached.lastUpdatedDate.getHours() &&
				now.getMinutes() >= CACHE_REFRESH_DELAY_MINUTE) ||
			cached.next24HoursData.length === 0
		dispatch({
			alertData: cached.alertData,
			next24HoursData: cached.next24HoursData,
			shouldRefresh,
			type: 'hydrate-cache',
			weatherData: cached.weatherData,
			weatherMapData: cached.weatherMapData,
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
		degradedForecast: state.degradedForecast,
		error: state.error,
		hasData,
		isLoading:
			!Boolean(lat) ||
			!Boolean(lon) ||
			(isLoadingStatus(state.status) && state.weatherData.length === 0),
		next24HoursData: state.next24HoursData,
		retry,
		status: state.status,
		weatherData: state.weatherData,
		weatherMapData: state.weatherMapData,
	}
}

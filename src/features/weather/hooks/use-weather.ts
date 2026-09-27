import { useEffect, useReducer, useRef } from 'react'

import {
	AsyncStatus,
	isLoadingStatus,
} from '../../../shared/hooks/async-status'
import { isLocationInAustralia } from '../../../shared/lib/location'
import { getUserTimeZone } from '../api/weather-api'
import {
	createEmptyAlerts,
	deriveAlertsFromNext24HoursData,
} from '../model/alerts'
import { type CachedWeather, writeCachedWeatherDegraded } from '../model/cache'
import { isAbortError } from '../model/error-names'
import {
	type Alerts,
	CACHE_REFRESH_INTERVAL_MS,
	CACHE_VALIDITY_MS,
	type Data,
	type Next24HoursData,
	NEXT_24_HOURS_FORECAST_HOURS,
	type WeatherMapData,
} from '../model/types'
import {
	isWeatherCacheFresh,
	readSharedWeatherCache,
	requestSharedWeather,
	requestSharedWeatherMap,
	subscribeSharedWeather,
} from '../services/shared-weather'

type WeatherAction =
	| {
			alertData: Alerts
			degradedForecast: null | {
				error: Error
				lastUpdatedDate: Date
			}
			next24HoursData: Next24HoursData
			shouldRefresh: boolean
			type: 'hydrate-cache'
			weatherData: [] | Data
			weatherMapData: null | WeatherMapData
	  }
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
			type: 'fetch-success'
			weatherData: [] | Data
			weatherMapData: null | WeatherMapData
	  }
	| {
			error: Error
			type: 'fetch-error'
	  }
	| {
			shouldForceRefresh?: boolean
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
	shouldForceRefresh: boolean
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
	shouldForceRefresh: false,
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
				degradedForecast: action.degradedForecast,
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
				shouldForceRefresh: action.shouldForceRefresh ?? false,
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
	const latestRequestRef = useRef(0)
	const lastAppliedAtRef = useRef(0)
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
		const controller = new AbortController()
		const identity = {
			lat,
			lon,
			shouldUseAirQualityUv,
			timeZone: userTimeZone,
		}

		void requestSharedWeather({
			...identity,
			force: state.shouldForceRefresh,
			signal: controller.signal,
		})
			.then((weather) => {
				if (controller.signal.aborted || latestRequestRef.current !== requestId)
					return

				lastAppliedAtRef.current = weather.lastUpdatedAt
				dispatch({
					...weather,
					type: 'fetch-success',
					weatherMapData:
						readSharedWeatherCache(identity)?.weatherMapData ?? null,
				})

				void requestSharedWeatherMap({
					...identity,
					force: state.shouldForceRefresh,
					signal: controller.signal,
				})
					.then((weatherMapData) => {
						if (
							controller.signal.aborted ||
							latestRequestRef.current !== requestId
						)
							return
						dispatch({ type: 'fetch-map-success', weatherMapData })
					})
					.catch((weatherMapError) => {
						if (isAbortError(weatherMapError)) return
						console.error('Weather map fetch error:', weatherMapError)
					})
			})
			.catch((fetchError) => {
				if (
					controller.signal.aborted ||
					latestRequestRef.current !== requestId ||
					isAbortError(fetchError)
				)
					return
				const error =
					fetchError instanceof Error
						? fetchError
						: new Error('Weather fetch failed')
				console.error('Weather fetch error:', error)

				const cached = readSharedWeatherCache(identity)
				const reducedCached = cached
					? getReducedCachedWeather({ cached, now: new Date() })
					: null

				if (cached && reducedCached) {
					writeCachedWeatherDegraded(identity)
					dispatch({
						...reducedCached,
						error,
						lastUpdatedDate: cached.lastUpdatedDate,
						type: 'fetch-degraded-cache',
					})
					return
				}

				dispatch({ error, type: 'fetch-error' })
			})

		return () => controller.abort()
	}, [
		lat,
		lon,
		userTimeZone,
		shouldUseAirQualityUv,
		state.refreshToken,
		state.shouldForceRefresh,
		state.usingCachedData,
	])

	useEffect(() => {
		if (!lat || !lon) return
		const identity = {
			lat,
			lon,
			shouldUseAirQualityUv,
			timeZone: userTimeZone,
		}
		const handleRefresh = () => {
			if (document.visibilityState === 'hidden') return
			const cached = readSharedWeatherCache(identity)
			if (!cached || !isWeatherCacheFresh({ cached })) {
				dispatch({ type: 'request-refresh' })
			}
		}
		const handleVisibilityChange = () => {
			if (document.visibilityState !== 'hidden') {
				dispatch({ type: 'request-refresh' })
			}
		}
		const interval = setInterval(handleRefresh, CACHE_REFRESH_INTERVAL_MS)
		document.addEventListener('visibilitychange', handleVisibilityChange)
		document.addEventListener('resume', handleVisibilityChange)
		window.addEventListener('pageshow', handleVisibilityChange)
		return () => {
			clearInterval(interval)
			document.removeEventListener('visibilitychange', handleVisibilityChange)
			document.removeEventListener('resume', handleVisibilityChange)
			window.removeEventListener('pageshow', handleVisibilityChange)
		}
	}, [lat, lon, shouldUseAirQualityUv, userTimeZone])

	useEffect(() => {
		if (!lat || !lon) return
		const identity = {
			lat,
			lon,
			shouldUseAirQualityUv,
			timeZone: userTimeZone,
		}
		return subscribeSharedWeather({
			identity,
			onChange: () => {
				const cached = readSharedWeatherCache(identity)
				if (!cached || cached.isDegraded) return
				const updatedAt = cached.lastUpdatedDate.getTime()
				if (updatedAt < lastAppliedAtRef.current) return
				lastAppliedAtRef.current = updatedAt
				dispatch({ ...cached, type: 'fetch-success' })
			},
		})
	}, [lat, lon, shouldUseAirQualityUv, userTimeZone])

	useEffect(() => {
		if (
			!lat ||
			!lon ||
			!state.usingCachedData ||
			state.weatherData.length === 0 ||
			state.weatherMapData
		)
			return

		const requestKey = JSON.stringify([lat, lon, userTimeZone])
		if (missingMapRequestKeyRef.current === requestKey) return
		missingMapRequestKeyRef.current = requestKey
		const controller = new AbortController()

		void requestSharedWeatherMap({
			lat,
			lon,
			shouldUseAirQualityUv,
			signal: controller.signal,
			timeZone: userTimeZone,
		})
			.then((weatherMapData) => {
				if (controller.signal.aborted) return
				dispatch({ type: 'fetch-map-success', weatherMapData })
			})
			.catch((weatherMapError) => {
				if (isAbortError(weatherMapError)) return
				console.error('Weather map fetch error:', weatherMapError)
				missingMapRequestKeyRef.current = null
			})

		return () => {
			controller.abort()
			if (missingMapRequestKeyRef.current === requestKey) {
				missingMapRequestKeyRef.current = null
			}
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
		lastAppliedAtRef.current = 0
		if (!lat || !lon) return

		if (locationChangeToken > 0) {
			dispatch({ status: AsyncStatus.Loading, type: 'request-refresh' })
			return
		}

		const cached = readSharedWeatherCache({
			lat,
			lon,
			shouldUseAirQualityUv,
			timeZone: userTimeZone,
		})
		const now = new Date()
		if (
			!cached ||
			now.getTime() - cached.lastUpdatedDate.getTime() > CACHE_VALIDITY_MS ||
			cached.lastUpdatedDate.getTime() > now.getTime()
		) {
			dispatch({ type: 'use-network' })
			return
		}

		lastAppliedAtRef.current = cached.lastUpdatedDate.getTime()
		const reducedCached = cached.isDegraded
			? getReducedCachedWeather({ cached, now })
			: null
		if (cached.isDegraded && !reducedCached) {
			dispatch({ type: 'use-network' })
			return
		}

		dispatch({
			alertData: reducedCached?.alertData ?? cached.alertData,
			degradedForecast: cached.isDegraded
				? {
						error: new Error('Weather refresh previously failed'),
						lastUpdatedDate: cached.lastUpdatedDate,
					}
				: null,
			next24HoursData: reducedCached?.next24HoursData ?? cached.next24HoursData,
			shouldRefresh: !isWeatherCacheFresh({ cached, now: now.getTime() }),
			type: 'hydrate-cache',
			weatherData: reducedCached?.weatherData ?? cached.weatherData,
			weatherMapData: reducedCached?.weatherMapData ?? cached.weatherMapData,
		})
	}, [lat, lon, locationChangeToken, userTimeZone, shouldUseAirQualityUv])

	const retry = () => {
		dispatch({
			shouldForceRefresh: true,
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

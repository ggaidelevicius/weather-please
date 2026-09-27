import { useEffect, useState, useSyncExternalStore } from 'react'

import { AsyncStatus } from '../../../shared/hooks/async-status'
import { isLocationInAustralia } from '../../../shared/lib/location'
import {
	getCurrentDateTime,
	getCurrentTimestamp,
} from '../../../shared/lib/time'
import { getUserTimeZone } from '../api/weather-api'
import {
	createEmptyAlerts,
	deriveAlertsFromNext24HoursData,
} from '../model/alerts'
import {
	type CachedWeather,
	type CacheIdentity,
	writeCachedWeatherDegraded,
} from '../model/cache'
import { isAbortError } from '../model/error-names'
import {
	CACHE_REFRESH_INTERVAL_MS,
	CACHE_VALIDITY_MS,
	type Data,
	NEXT_24_HOURS_FORECAST_HOURS,
} from '../model/types'
import {
	createSharedWeatherStore,
	isWeatherCacheFresh,
	requestSharedWeather,
	requestSharedWeatherMap,
} from '../services/shared-weather'

export type { Alerts } from '../model/types'

type WeatherSession = {
	error: Error | null
	failedWeatherData: Data | null
	identity: CacheIdentity
	key: string
	refreshToken: number
	shouldForceRefresh: boolean
	startedAt: number
	status: AsyncStatus
	store: ReturnType<typeof createSharedWeatherStore>
}

export const useWeather = (
	lat: string,
	lon: string,
	locationChangeToken: number,
	useAirQualityUvOverride: boolean,
) => {
	const timeZone = getUserTimeZone()
	const shouldUseAirQualityUv =
		useAirQualityUvOverride || isLocationInAustralia(lat, lon)
	const key = JSON.stringify([
		lat,
		lon,
		timeZone,
		shouldUseAirQualityUv,
		locationChangeToken,
	])
	const [session, setSession] = useState(() =>
		createWeatherSession({
			identity: { lat, lon, shouldUseAirQualityUv, timeZone },
			key,
		}),
	)
	if (session.key !== key) {
		setSession(
			createWeatherSession({
				identity: { lat, lon, shouldUseAirQualityUv, timeZone },
				key,
			}),
		)
	}
	const { identity, refreshToken, shouldForceRefresh, store } = session
	const cached = useSyncExternalStore(
		store.subscribe,
		store.getSnapshot,
		store.getServerSnapshot,
	)

	useEffect(() => {
		if (!identity.lat || !identity.lon) return
		const controller = new AbortController()
		const fetchMap = () =>
			requestSharedWeatherMap({
				...identity,
				force: shouldForceRefresh,
				signal: controller.signal,
			}).catch((error: unknown) => {
				if (controller.signal.aborted || isAbortError(error)) return
				console.error('Weather map fetch error:', error)
			})
		const current = store.getSnapshot()
		if (
			refreshToken === 0 &&
			locationChangeToken === 0 &&
			current &&
			isWeatherCacheFresh({ cached: current })
		) {
			if (current.weatherData.length > 0 && !current.weatherMapData)
				void fetchMap()
			return () => controller.abort()
		}
		void requestSharedWeather({
			...identity,
			force: shouldForceRefresh,
			signal: controller.signal,
		})
			.then(() => {
				if (controller.signal.aborted) return
				setSession((previous) =>
					previous.store === store && previous.refreshToken === refreshToken
						? {
								...previous,
								error: null,
								failedWeatherData: null,
								status: AsyncStatus.Success,
							}
						: previous,
				)
				void fetchMap()
			})
			.catch((fetchError: unknown) => {
				if (controller.signal.aborted || isAbortError(fetchError)) return
				const error =
					fetchError instanceof Error
						? fetchError
						: new Error('Weather fetch failed')
				console.error('Weather fetch error:', error)
				if (store.getSnapshot()) writeCachedWeatherDegraded(identity)
				const failedWeatherData = store.getSnapshot()?.weatherData ?? null
				setSession((previous) =>
					previous.store === store && previous.refreshToken === refreshToken
						? {
								...previous,
								error,
								failedWeatherData,
								status: AsyncStatus.Error,
							}
						: previous,
				)
			})
		return () => controller.abort()
	}, [identity, locationChangeToken, refreshToken, shouldForceRefresh, store])

	useEffect(() => {
		if (!identity.lat || !identity.lon) return
		const requestRefresh = () =>
			setSession((previous) =>
				previous.store === store
					? {
							...previous,
							refreshToken: previous.refreshToken + 1,
							shouldForceRefresh: false,
							status: AsyncStatus.Loading,
						}
					: previous,
			)
		const handleRefresh = () => {
			if (document.visibilityState === 'hidden') return
			const current = store.getSnapshot()
			if (!current || !isWeatherCacheFresh({ cached: current }))
				requestRefresh()
		}
		const handleVisibilityChange = () => {
			if (document.visibilityState !== 'hidden') requestRefresh()
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
	}, [identity, store])

	const now = getCurrentDateTime()
	const hasCurrentError = Boolean(
		session.error &&
		(!cached || cached.weatherData === session.failedWeatherData),
	)
	const shouldUseDegraded = Boolean(
		cached && (cached.isDegraded || hasCurrentError),
	)
	const reduced =
		cached && shouldUseDegraded
			? getReducedCachedWeather({ cached, now })
			: null
	const canUseCache = Boolean(
		cached &&
		cached.lastUpdatedDate.epochMilliseconds <= now.epochMilliseconds &&
		cached.lastUpdatedDate.epochMilliseconds >=
			session.startedAt - CACHE_VALIDITY_MS,
	)
	const visible = shouldUseDegraded ? reduced : canUseCache ? cached : null
	const degradedForecast =
		cached && reduced
			? {
					error:
						hasCurrentError && session.error
							? session.error
							: new Error('Weather refresh previously failed'),
					lastUpdatedDate: cached.lastUpdatedDate,
				}
			: null
	const error =
		hasCurrentError && !visible && session.status !== AsyncStatus.Loading
			? session.error
			: null
	const status = getWeatherStatus({
		error,
		hasLocation: Boolean(lat && lon),
		hasVisibleData: visible !== null,
		isRequestLoading: session.status === AsyncStatus.Loading,
	})

	return {
		alertData: visible?.alertData ?? EMPTY_ALERTS,
		degradedForecast,
		error,
		hasData: Boolean(visible?.weatherData.length),
		isLoading:
			!lat ||
			!lon ||
			(!visible?.weatherData.length && status === AsyncStatus.Loading),
		next24HoursData: visible?.next24HoursData ?? [],
		retry: () =>
			setSession((previous) => ({
				...previous,
				refreshToken: previous.refreshToken + 1,
				shouldForceRefresh: true,
				status: AsyncStatus.Loading,
			})),
		status,
		weatherData: visible?.weatherData ?? [],
		weatherMapData: visible?.weatherMapData ?? null,
	}
}

const getWeatherStatus = ({
	error,
	hasLocation,
	hasVisibleData,
	isRequestLoading,
}: {
	error: Error | null
	hasLocation: boolean
	hasVisibleData: boolean
	isRequestLoading: boolean
}): AsyncStatus => {
	if (!hasLocation) return AsyncStatus.Idle
	if (error) return AsyncStatus.Error
	if (isRequestLoading) return AsyncStatus.Loading
	return hasVisibleData ? AsyncStatus.Success : AsyncStatus.Loading
}

const createWeatherSession = ({
	identity,
	key,
}: {
	identity: CacheIdentity
	key: string
}): WeatherSession => ({
	error: null,
	failedWeatherData: null,
	identity,
	key,
	refreshToken: 0,
	shouldForceRefresh: false,
	startedAt: getCurrentTimestamp(),
	status: AsyncStatus.Idle,
	store: createSharedWeatherStore(identity),
})

const EMPTY_ALERTS = createEmptyAlerts()

const getReducedCachedWeather = ({
	cached,
	now,
}: {
	cached: CachedWeather
	now: Temporal.ZonedDateTime
}) => {
	const nowSeconds = Math.floor(now.epochMilliseconds / 1000)
	const todayStart = now.startOfDay()
	const todayStartSeconds = Math.floor(todayStart.epochMilliseconds / 1000)
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

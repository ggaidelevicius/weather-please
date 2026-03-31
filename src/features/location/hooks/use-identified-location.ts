import { useEffect, useState } from 'react'

import { AsyncStatus } from '../../../shared/hooks/async-status'
import { isAbortError } from '../../weather/model/error-names'
import { fetchReverseGeocodeLabel } from '../api/reverse-geocode-api'
import {
	getCachedIdentifiedLocationLabel,
	getIdentifiedLocationCacheKey,
	writeCachedIdentifiedLocationLabel,
} from '../model/cache'

type IdentifiedLocationAsyncResult = {
	cacheKey: null | string
	label: null | string
	status: AsyncStatus
}

const initialAsyncResult: IdentifiedLocationAsyncResult = {
	cacheKey: null,
	label: null,
	status: AsyncStatus.Idle,
}

export const useIdentifiedLocation = ({
	lat,
	locale,
	lon,
}: Readonly<{
	lat: string
	locale: string
	lon: string
}>) => {
	const currentCacheKey =
		lat && lon
			? getIdentifiedLocationCacheKey({
					lat,
					locale,
					lon,
				})
			: null
	const cachedLabel = currentCacheKey
		? getCachedIdentifiedLocationLabel({
				cacheKey: currentCacheKey,
			})
		: null
	const [asyncResult, setAsyncResult] =
		useState<IdentifiedLocationAsyncResult>(initialAsyncResult)

	useEffect(() => {
		if (!currentCacheKey || cachedLabel) {
			return
		}

		const controller = new AbortController()

		void fetchReverseGeocodeLabel({
			lat,
			locale,
			lon,
			signal: controller.signal,
		})
			.then((label) => {
				if (!label) {
					setAsyncResult({
						cacheKey: currentCacheKey,
						label: null,
						status: AsyncStatus.Error,
					})
					return
				}

				writeCachedIdentifiedLocationLabel({
					cacheKey: currentCacheKey,
					label,
				})
				setAsyncResult({
					cacheKey: currentCacheKey,
					label,
					status: AsyncStatus.Success,
				})
			})
			.catch((error) => {
				if (isAbortError(error)) {
					return
				}

				console.error('Identified location fetch error:', error)
				setAsyncResult({
					cacheKey: currentCacheKey,
					label: null,
					status: AsyncStatus.Error,
				})
			})

		return () => {
			controller.abort()
		}
	}, [cachedLabel, currentCacheKey, lat, locale, lon])

	const currentAsyncResult =
		asyncResult.cacheKey === currentCacheKey ? asyncResult : initialAsyncResult

	if (!currentCacheKey) {
		return {
			hasResolved: false,
			label: null,
			status: AsyncStatus.Idle,
		}
	}

	if (cachedLabel) {
		return {
			hasResolved: true,
			label: cachedLabel,
			status: AsyncStatus.Success,
		}
	}

	if (currentAsyncResult.status === AsyncStatus.Error) {
		return {
			hasResolved: true,
			label: null,
			status: AsyncStatus.Error,
		}
	}

	if (currentAsyncResult.status === AsyncStatus.Success) {
		return {
			hasResolved: true,
			label: currentAsyncResult.label,
			status: AsyncStatus.Success,
		}
	}

	return {
		hasResolved: false,
		label: null,
		status: AsyncStatus.Loading,
	}
}

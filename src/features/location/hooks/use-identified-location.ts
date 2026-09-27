import { useEffect, useState } from 'react'
import { z } from 'zod'

import { AsyncStatus } from '../../../shared/hooks/async-status'
import {
	readSharedResource,
	requestSharedResource,
	subscribeSharedResource,
} from '../../../shared/lib/shared-resource'
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

const identifiedLocationLabelSchema = z.string().min(1)

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
		? (readSharedResource({
				key: `location-label:${currentCacheKey}`,
				schema: identifiedLocationLabelSchema,
			})?.value ??
			getCachedIdentifiedLocationLabel({ cacheKey: currentCacheKey }))
		: null
	const [asyncResult, setAsyncResult] =
		useState<IdentifiedLocationAsyncResult>(initialAsyncResult)

	useEffect(() => {
		if (!currentCacheKey || cachedLabel) {
			return
		}

		const controller = new AbortController()
		const key = `location-label:${currentCacheKey}`
		const applyLabel = (label: string) => {
			if (controller.signal.aborted) return
			writeCachedIdentifiedLocationLabel({ cacheKey: currentCacheKey, label })
			setAsyncResult({
				cacheKey: currentCacheKey,
				label,
				status: AsyncStatus.Success,
			})
		}
		const adoptSharedLabel = () => {
			const sharedLabel = readSharedResource({
				key,
				schema: identifiedLocationLabelSchema,
			})
			if (sharedLabel) applyLabel(sharedLabel.value)
		}
		const loadLabel = () => {
			if (document.visibilityState !== 'visible') return
			void requestSharedResource({
				fetcher: async ({ signal }) => {
					const label = await fetchReverseGeocodeLabel({
						lat,
						locale,
						lon,
						signal,
					})
					if (!label) throw new Error('No identified location was returned')
					return label
				},
				key,
				maxAgeMs: Number.POSITIVE_INFINITY,
				schema: identifiedLocationLabelSchema,
				signal: controller.signal,
			})
				.then(applyLabel)
				.catch((error) => {
					if (controller.signal.aborted || isAbortError(error)) return
					console.error('Identified location fetch error:', error)
					setAsyncResult({
						cacheKey: currentCacheKey,
						label: null,
						status: AsyncStatus.Error,
					})
				})
		}
		const handleVisibilityChange = () => {
			adoptSharedLabel()
			loadLabel()
		}
		const unsubscribe = subscribeSharedResource({
			key,
			onChange: adoptSharedLabel,
		})
		document.addEventListener('visibilitychange', handleVisibilityChange)
		document.addEventListener('resume', handleVisibilityChange)
		window.addEventListener('pageshow', handleVisibilityChange)
		adoptSharedLabel()
		loadLabel()

		return () => {
			controller.abort()
			unsubscribe()
			document.removeEventListener('visibilitychange', handleVisibilityChange)
			document.removeEventListener('resume', handleVisibilityChange)
			window.removeEventListener('pageshow', handleVisibilityChange)
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

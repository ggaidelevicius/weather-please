import { Trans } from '@lingui/react/macro'

import {
	getHttpErrorStatusCode,
	isServerErrorStatusCode,
} from '../../../shared/lib/http-error-status'

export const getInlineWeatherErrorMessage = (error: Error) => {
	const httpStatusCode = getHttpErrorStatusCode(error.message)

	if (isServerErrorStatusCode(httpStatusCode)) {
		return (
			<Trans>
				Weather data couldn&apos;t be loaded due to a service issue — showing
				cached data. Please try again in a moment.
			</Trans>
		)
	}

	return (
		<Trans>
			Showing cached weather data. Retry to refresh the latest forecast.
		</Trans>
	)
}

export const getBlockingWeatherErrorMessage = (error: Error | null) => {
	const httpStatusCode = getHttpErrorStatusCode(error?.message)
	const isBrowserOffline =
		typeof navigator !== 'undefined' && navigator.onLine === false

	if (isServerErrorStatusCode(httpStatusCode)) {
		return (
			<Trans>
				Weather data couldn&apos;t be loaded because the weather service is
				having trouble. This isn&apos;t a problem with your device. Please try
				again in a moment.
			</Trans>
		)
	}

	if (httpStatusCode) {
		return (
			<Trans>
				Weather data couldn&apos;t be loaded for this location. Please check
				your location settings and try again.
			</Trans>
		)
	}

	if (!isBrowserOffline && error) {
		return (
			<Trans>
				Weather data couldn&apos;t be loaded because the weather service could
				not be reached. This usually isn&apos;t a problem with your device.
				Please try again in a moment.
			</Trans>
		)
	}

	return (
		<Trans>
			We couldn&apos;t reach the weather service. Please check your internet
			connection and try again.
		</Trans>
	)
}

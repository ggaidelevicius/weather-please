import { Trans } from '@lingui/react/macro'
import { formatHourMinute } from '../../model/detail-formatting'

export const formatOptionalHour = (time: null | number) =>
	typeof time === 'number' ? formatHourMinute(time) : <Trans>Unavailable</Trans>

export const getAqiCategory = (aqi: number) => {
	if (aqi <= 50) {
		return <Trans>Good</Trans>
	}

	if (aqi <= 100) {
		return <Trans>Moderate</Trans>
	}

	if (aqi <= 150) {
		return <Trans>Unhealthy for sensitive groups</Trans>
	}

	if (aqi <= 200) {
		return <Trans>Unhealthy</Trans>
	}

	if (aqi <= 300) {
		return <Trans>Very unhealthy</Trans>
	}

	return <Trans>Hazardous</Trans>
}

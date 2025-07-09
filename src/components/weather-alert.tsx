import type { Alerts } from '@/hooks/use-weather'
import { Trans } from '@lingui/react/macro'
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { Alert } from './alert'

interface AlertProps extends Alerts {
	useMetric: boolean
	showUvAlerts: boolean
	showWindAlerts: boolean
	showVisibilityAlerts: boolean
	showPrecipitationAlerts: boolean
}

export const WeatherAlert = ({
	totalPrecipitation,
	hoursOfExtremeUv,
	hoursOfStrongWind,
	hoursOfStrongWindGusts,
	hoursOfLowVisibility,
	useMetric,
	showUvAlerts,
	showWindAlerts,
	showVisibilityAlerts,
	showPrecipitationAlerts,
}: Readonly<AlertProps>) => {
	const [alerts, setAlerts] = useState<ReactElement[] | []>([])

	/**
	 * Monitors UV conditions and updates the alert list accordingly.
	 *
	 * If showUvAlerts is enabled and there are upcoming hours with extreme UV exposure, a UV alert
	 * is created to warn the user about the potentially harmful conditions. The alert provides
	 * information either about when the extreme UV exposure will begin or its expected duration,
	 * based on the current and forecasted UV conditions.
	 *
	 * The alert is dynamically generated based on the hoursOfExtremeUv array, where each entry
	 * indicates whether UV exposure will be extreme for the respective hour. If conditions do
	 * not require an alert, or if UV alerts are disabled, any existing UV alert is removed
	 * from the list.
	 */
	useEffect(() => {
		if (showUvAlerts) {
			let uvAlert: ReactElement | null = null
			if (hoursOfExtremeUv.includes(true)) {
				const timeUntilExtremeUv = hoursOfExtremeUv.indexOf(true) + 1
				if (timeUntilExtremeUv > 1) {
					uvAlert = (
						<Alert key="uvAlert" icon={IconAlertTriangle} variant="light-red">
							<Trans>Extreme UV starting in {timeUntilExtremeUv} hours</Trans>
						</Alert>
					)
				} else {
					const durationOfExtremeUv = hoursOfExtremeUv.indexOf(false)
					uvAlert = (
						<Alert key="uvAlert" icon={IconAlertTriangle} variant="light-red">
							{durationOfExtremeUv > 1 && (
								<Trans>
									Extreme UV for the next {durationOfExtremeUv} hours
								</Trans>
							)}
							{durationOfExtremeUv < 0 && (
								<Trans>Extreme UV for the next 12 hours</Trans>
							)}
							{durationOfExtremeUv === 1 && (
								<Trans>Extreme UV for the next hour</Trans>
							)}
						</Alert>
					)
				}
				setAlerts((prev) => {
					const prevUvAlertIndex = prev.findIndex(
						(alert) => alert.key === 'uvAlert',
					)

					if (prevUvAlertIndex !== -1) {
						const newAlerts = [...prev]
						newAlerts[prevUvAlertIndex] = uvAlert as ReactElement
						return newAlerts
					} else {
						return [...prev, uvAlert as ReactElement]
					}
				})
			} else {
				setAlerts((prev) => prev.filter((alert) => alert.key !== 'uvAlert'))
			}
		} else {
			setAlerts((prev) => prev.filter((alert) => alert.key !== 'uvAlert'))
		}
	}, [hoursOfExtremeUv, showUvAlerts])

	/**
	 * Checks for significant precipitation and updates the alert list accordingly.
	 *
	 * If showPrecipitationAlerts is enabled and the total precipitation is beyond a certain
	 * threshold (dependent on whether metric measurements are in use), a precipitation alert is created
	 * and added to the alerts list. If conditions do not warrant an alert, or if alerts for precipitation
	 * are turned off, any existing precipitation alert is removed from the list.
	 *
	 * Note: Converting mm to inches uses the value 25.4 (1 inch is approximately 25.4mm).
	 */
	useEffect(() => {
		if (showPrecipitationAlerts) {
			const { precipitation, duration } = totalPrecipitation
			let precipitationAlert: ReactElement | null = null
			if (precipitation.value >= 15) {
				precipitationAlert = (
					<Alert
						key="precipitationAlert"
						icon={IconInfoCircle}
						variant="light-blue"
					>
						{useMetric && duration.indexOf(false) === 1 && (
							<Trans>
								{precipitation.value.toFixed(1)}mm of precipitation expected
								over the next hour
							</Trans>
						)}
						{useMetric &&
							duration.indexOf(false) !== 1 &&
							duration.indexOf(false) !== -1 && (
								<Trans>
									{precipitation.value.toFixed(1)}mm of precipitation expected
									over the next {duration.indexOf(false)} hours
								</Trans>
							)}
						{useMetric && duration.indexOf(false) === -1 && (
							<Trans>
								{precipitation.value.toFixed(1)}mm of precipitation expected
								over the next {duration.length - 1} hours
							</Trans>
						)}
						{!useMetric && duration.indexOf(false) === 1 && (
							<Trans>
								{(precipitation.value / 25.4).toFixed(1)} inches of
								precipitation expected over the next hour
							</Trans>
						)}
						{!useMetric &&
							duration.indexOf(false) !== 1 &&
							duration.indexOf(false) !== -1 && (
								<Trans>
									{(precipitation.value / 25.4).toFixed(1)} inches of
									precipitation expected over the next {duration.indexOf(false)}{' '}
									hours
								</Trans>
							)}
						{!useMetric && duration.indexOf(false) === -1 && (
							<Trans>
								{(precipitation.value / 25.4).toFixed(1)} inches of
								precipitation expected over the next {duration.length - 1} hours
							</Trans>
						)}
					</Alert>
				)
				setAlerts((prev) => {
					const prevPrecipitationAlertIndex = prev.findIndex(
						(alert) => alert.key === 'precipitationAlert',
					)

					if (prevPrecipitationAlertIndex !== -1) {
						const newAlerts = [...prev]
						newAlerts[prevPrecipitationAlertIndex] =
							precipitationAlert as ReactElement
						return newAlerts
					} else {
						return [...prev, precipitationAlert as ReactElement]
					}
				})
			} else {
				setAlerts((prev) =>
					prev.filter((alert) => alert.key !== 'precipitationAlert'),
				)
			}
		} else {
			setAlerts((prev) =>
				prev.filter((alert) => alert.key !== 'precipitationAlert'),
			)
		}
	}, [useMetric, totalPrecipitation, showPrecipitationAlerts])

	/**
	 * Monitors wind conditions and updates the alert list accordingly.
	 *
	 * If showWindAlerts is enabled and there are upcoming hours of strong wind, a wind alert
	 * is created to notify the user about the situation. The alert provides details either
	 * about when strong wind conditions will start or how long they will last, based on the
	 * current and forecasted conditions.
	 *
	 * The alert is dynamically generated based on the hoursOfStrongWind array, where each entry
	 * indicates whether the wind will be high for the corresponding hour. If conditions do
	 * not warrant an alert, or if wind alerts are turned off, any existing wind alert is removed
	 * from the list.
	 */
	useEffect(() => {
		if (showWindAlerts) {
			let windAlert: ReactElement | null = null
			if (hoursOfStrongWind.includes(true)) {
				const timeUntilStrongWind = hoursOfStrongWind.indexOf(true) + 1
				if (timeUntilStrongWind > 1) {
					windAlert = (
						<Alert key="windAlert" icon={IconInfoCircle} variant="light-blue">
							<Trans>
								Generally strong wind starting in {timeUntilStrongWind} hours
							</Trans>
						</Alert>
					)
				} else {
					const durationOfStrongWind = hoursOfStrongWind.indexOf(false)
					windAlert = (
						<Alert key="windAlert" icon={IconInfoCircle} variant="light-blue">
							{durationOfStrongWind > 1 && (
								<Trans>
									Generally strong wind for the next {durationOfStrongWind}{' '}
									hours
								</Trans>
							)}
							{durationOfStrongWind < 0 && (
								<Trans>Generally strong wind for the next 24 hours</Trans>
							)}
							{durationOfStrongWind === 1 && (
								<Trans>Generally strong wind for the next hour</Trans>
							)}
						</Alert>
					)
				}
				setAlerts((prev) => {
					const prevWindAlertIndex = prev.findIndex(
						(alert) => alert.key === 'windAlert',
					)

					if (prevWindAlertIndex !== -1) {
						const newAlerts = [...prev]
						newAlerts[prevWindAlertIndex] = windAlert as ReactElement
						return newAlerts
					} else {
						return [...prev, windAlert as ReactElement]
					}
				})
			} else {
				setAlerts((prev) => prev.filter((alert) => alert.key !== 'windAlert'))
			}
		} else {
			setAlerts((prev) => prev.filter((alert) => alert.key !== 'windAlert'))
		}
	}, [hoursOfStrongWind, showWindAlerts])

	/**
	 * Monitors wind conditions and updates the alert list accordingly.
	 *
	 * If showWindAlerts is enabled and there are upcoming hours of strong wind gusts, a wind alert
	 * is created to notify the user about the situation. The alert provides details either
	 * about when strong wind gust conditions will start or how long they will last, based on the
	 * current and forecasted conditions.
	 *
	 * The alert is dynamically generated based on the hoursOfStrongWindGusts array, where each entry
	 * indicates whether the wind gusts will be strong for the corresponding hour. If conditions do
	 * not warrant an alert, or if wind alerts are turned off, any existing wind gust alert is removed
	 * from the list.
	 */
	useEffect(() => {
		if (showWindAlerts) {
			let windAlert: ReactElement | null = null
			if (hoursOfStrongWindGusts.includes(true)) {
				const timeUntilStrongWind = hoursOfStrongWindGusts.indexOf(true) + 1
				if (timeUntilStrongWind > 1) {
					windAlert = (
						<Alert key="gustAlert" icon={IconInfoCircle} variant="light-blue">
							<Trans>
								Strong wind gusts starting in {timeUntilStrongWind} hours
							</Trans>
						</Alert>
					)
				} else {
					const durationOfStrongWind = hoursOfStrongWindGusts.indexOf(false)
					windAlert = (
						<Alert key="gustAlert" icon={IconInfoCircle} variant="light-blue">
							{durationOfStrongWind > 1 && (
								<Trans>
									Strong wind gusts for the next {durationOfStrongWind} hours
								</Trans>
							)}
							{durationOfStrongWind < 0 && (
								<Trans>Strong wind gusts for the next 24 hours</Trans>
							)}
							{durationOfStrongWind === 1 && (
								<Trans>Strong wind gusts for the next hour</Trans>
							)}
						</Alert>
					)
				}
				setAlerts((prev) => {
					const prevWindAlertIndex = prev.findIndex(
						(alert) => alert.key === 'gustAlert',
					)

					if (prevWindAlertIndex !== -1) {
						const newAlerts = [...prev]
						newAlerts[prevWindAlertIndex] = windAlert as ReactElement
						return newAlerts
					} else {
						return [...prev, windAlert as ReactElement]
					}
				})
			} else {
				setAlerts((prev) => prev.filter((alert) => alert.key !== 'gustAlert'))
			}
		} else {
			setAlerts((prev) => prev.filter((alert) => alert.key !== 'gustAlert'))
		}
	}, [hoursOfStrongWindGusts, showWindAlerts])

	/**
	 * Monitors visibility conditions and manages the alert list accordingly.
	 *
	 * When showVisibilityAlerts is enabled and upcoming hours indicate low visibility,
	 * a visibility alert is generated to notify the user of potentially challenging conditions.
	 * Depending on the forecast, the alert either indicates when the low visibility is
	 * expected to start or provides the estimated duration of the low visibility condition.
	 *
	 * Alerts are dynamically produced based on the hoursOfLowVisibility array, which reflects
	 * the visibility forecast for each hour. If conditions do not warrant an alert, or
	 * if visibility alerts are turned off, any existing visibility alert is promptly removed
	 * from the list.
	 */
	useEffect(() => {
		if (showVisibilityAlerts) {
			let visibilityAlert: ReactElement | null = null
			if (hoursOfLowVisibility.includes(true)) {
				const timeUntilLowVisibility = hoursOfLowVisibility.indexOf(true) + 1 // might not need to be doing +1
				if (timeUntilLowVisibility > 1) {
					visibilityAlert = (
						<Alert
							key="visibilityAlert"
							icon={IconInfoCircle}
							variant="light-blue"
						>
							<Trans>
								Low visibility starting in {timeUntilLowVisibility} hours
							</Trans>
						</Alert>
					)
				} else {
					const durationOfLowVisibility = hoursOfLowVisibility.indexOf(false)
					visibilityAlert = (
						<Alert
							key="visibilityAlert"
							icon={IconInfoCircle}
							variant="light-blue"
						>
							{durationOfLowVisibility > 1 && (
								<Trans>
									Low visibility for the next {durationOfLowVisibility} hours
								</Trans>
							)}
							{durationOfLowVisibility < 0 && (
								<Trans>Low visibility for the next 24 hours</Trans>
							)}
							{durationOfLowVisibility === 1 && (
								<Trans>Low visibility for the next hour</Trans>
							)}
						</Alert>
					)
				}
				setAlerts((prev) => {
					const prevVisibilityAlertIndex = prev.findIndex(
						(alert) => alert.key === 'visibilityAlert',
					)

					if (prevVisibilityAlertIndex !== -1) {
						const newAlerts = [...prev]
						newAlerts[prevVisibilityAlertIndex] =
							visibilityAlert as ReactElement
						return newAlerts
					} else {
						return [...prev, visibilityAlert as ReactElement]
					}
				})
			} else {
				setAlerts((prev) =>
					prev.filter((alert) => alert.key !== 'visibilityAlert'),
				)
			}
		} else {
			setAlerts((prev) =>
				prev.filter((alert) => alert.key !== 'visibilityAlert'),
			)
		}
	}, [hoursOfLowVisibility, showVisibilityAlerts])

	if (alerts.length > 0) {
		return (
			<motion.aside
				initial={{ opacity: 0 }}
				animate={{
					scale: 1,
					opacity: 1,
					transition: {
						type: 'spring',
						duration: 2,
					},
				}}
				exit={{ scale: 0.95, opacity: 0 }}
				role="alert"
				aria-live="assertive"
				className="fixed top-0 left-0 flex w-full flex-col"
			>
				{alerts}
			</motion.aside>
		)
	}
	return <></>
}

import { Trans } from '@lingui/macro'
import { Alert as MantineAlert } from '@mantine/core'
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import type { FC, ReactElement } from 'react'
import { useEffect, useState } from 'react'
import styles from './styles.module.css'
import type { AlertProps } from './types'

const Alert: FC<AlertProps> = (props) => {
	const {
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
		width,
	} = props
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
				const alertProps = {
					className: styles.alert,
					radius: 'md',
					color: 'yellow',
					styles: {
						message: {
							fontSize: '1rem',
							display: 'flex',
							alignItems: 'center',
							gap: '1rem',
						},
					},
					key: 'uvAlert',
				}
				const timeUntilExtremeUv = hoursOfExtremeUv.indexOf(true) + 1
				if (timeUntilExtremeUv > 1) {
					uvAlert = (
						<MantineAlert {...alertProps}>
							<IconAlertTriangle size="2rem" strokeWidth={1.5} aria-hidden />
							<Trans>Extreme UV starting in {timeUntilExtremeUv} hours</Trans>
						</MantineAlert>
					)
				} else {
					const durationOfExtremeUv = hoursOfExtremeUv.indexOf(false)
					uvAlert = (
						<MantineAlert {...alertProps}>
							<IconAlertTriangle size="2rem" strokeWidth={1.5} aria-hidden />
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
						</MantineAlert>
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
					<MantineAlert
						className={styles.alert}
						radius="md"
						styles={{
							message: {
								fontSize: '1rem',
								display: 'flex',
								alignItems: 'center',
								gap: '1rem',
							},
						}}
						key="precipitationAlert"
					>
						<IconInfoCircle size="2rem" strokeWidth={1.5} aria-hidden />
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
					</MantineAlert>
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
				const alertProps = {
					className: styles.alert,
					radius: 'md',
					styles: {
						message: {
							fontSize: '1rem',
							display: 'flex',
							alignItems: 'center',
							gap: '1rem',
						},
					},
					key: 'windAlert',
				}
				const timeUntilStrongWind = hoursOfStrongWind.indexOf(true) + 1
				if (timeUntilStrongWind > 1) {
					windAlert = (
						<MantineAlert {...alertProps}>
							<IconInfoCircle size="2rem" strokeWidth={1.5} aria-hidden />
							<Trans>
								Generally strong wind starting in {timeUntilStrongWind} hours
							</Trans>
						</MantineAlert>
					)
				} else {
					const durationOfStrongWind = hoursOfStrongWind.indexOf(false)
					windAlert = (
						<MantineAlert {...alertProps}>
							<IconInfoCircle size="2rem" strokeWidth={1.5} aria-hidden />
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
						</MantineAlert>
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
				const alertProps = {
					className: styles.alert,
					radius: 'md',
					styles: {
						message: {
							fontSize: '1rem',
							display: 'flex',
							alignItems: 'center',
							gap: '1rem',
						},
					},
					key: 'gustAlert',
				}
				const timeUntilStrongWind = hoursOfStrongWindGusts.indexOf(true) + 1
				if (timeUntilStrongWind > 1) {
					windAlert = (
						<MantineAlert {...alertProps}>
							<IconInfoCircle size="2rem" strokeWidth={1.5} aria-hidden />
							<Trans>
								Strong wind gusts starting in {timeUntilStrongWind} hours
							</Trans>
						</MantineAlert>
					)
				} else {
					const durationOfStrongWind = hoursOfStrongWindGusts.indexOf(false)
					windAlert = (
						<MantineAlert {...alertProps}>
							<IconInfoCircle size="2rem" strokeWidth={1.5} aria-hidden />
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
						</MantineAlert>
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
				const alertProps = {
					className: styles.alert,
					radius: 'md',
					styles: {
						message: {
							fontSize: '1rem',
							display: 'flex',
							alignItems: 'center',
							gap: '1rem',
						},
					},
					key: 'visibilityAlert',
				}
				const timeUntilLowVisibility = hoursOfLowVisibility.indexOf(true) + 1 // might not need to be doing +1
				if (timeUntilLowVisibility > 1) {
					visibilityAlert = (
						<MantineAlert {...alertProps}>
							<IconInfoCircle size="2rem" strokeWidth={1.5} aria-hidden />
							<Trans>
								Low visibility starting in {timeUntilLowVisibility} hours
							</Trans>
						</MantineAlert>
					)
				} else {
					const durationOfLowVisibility = hoursOfLowVisibility.indexOf(false)
					visibilityAlert = (
						<MantineAlert {...alertProps}>
							<IconInfoCircle size="2rem" strokeWidth={1.5} aria-hidden />
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
						</MantineAlert>
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

	const tiles = alerts.map((alert, i: number) => (
		<motion.div
			initial={{ scale: 1, opacity: 0 }}
			animate={{
				scale: 1,
				opacity: 1,
				transition: { type: 'spring', duration: 2, delay: i * 0.075 + 1.9 },
			}}
			exit={{ scale: 0.95, opacity: 0 }}
			className={styles.wrapper}
			key={`alert-${i}`}
			layout
			style={{ gridColumn: `1/${width + 1}` }}
		>
			{alert}
		</motion.div>
	))

	return <>{tiles}</>
}

export default Alert

import type { Alerts } from '@/hooks/use-weather'
import { Trans } from '@lingui/react/macro'
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import { motion } from 'framer-motion'
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
	// Derive alerts array directly from props
	const alerts = []

	// UV Alert
	if (showUvAlerts && hoursOfExtremeUv.includes(true)) {
		const timeUntilExtremeUv = hoursOfExtremeUv.indexOf(true) + 1
		if (timeUntilExtremeUv > 1) {
			alerts.push(
				<Alert key="uvAlert" icon={IconAlertTriangle} variant="light-red">
					<Trans>Extreme UV starting in {timeUntilExtremeUv} hours</Trans>
				</Alert>,
			)
		} else {
			const durationOfExtremeUv = hoursOfExtremeUv.indexOf(false)
			alerts.push(
				<Alert key="uvAlert" icon={IconAlertTriangle} variant="light-red">
					{durationOfExtremeUv > 1 && (
						<Trans>Extreme UV for the next {durationOfExtremeUv} hours</Trans>
					)}
					{durationOfExtremeUv < 0 && (
						<Trans>Extreme UV for the next 12 hours</Trans>
					)}
					{durationOfExtremeUv === 1 && (
						<Trans>Extreme UV for the next hour</Trans>
					)}
				</Alert>,
			)
		}
	}

	// Precipitation Alert
	if (showPrecipitationAlerts && totalPrecipitation.precipitation.value >= 15) {
		const { precipitation, duration } = totalPrecipitation
		alerts.push(
			<Alert
				key="precipitationAlert"
				icon={IconInfoCircle}
				variant="light-blue"
			>
				{useMetric && duration.indexOf(false) === 1 && (
					<Trans>
						{precipitation.value.toFixed(1)}mm of precipitation expected over
						the next hour
					</Trans>
				)}
				{useMetric &&
					duration.indexOf(false) !== 1 &&
					duration.indexOf(false) !== -1 && (
						<Trans>
							{precipitation.value.toFixed(1)}mm of precipitation expected over
							the next {duration.indexOf(false)} hours
						</Trans>
					)}
				{useMetric && duration.indexOf(false) === -1 && (
					<Trans>
						{precipitation.value.toFixed(1)}mm of precipitation expected over
						the next {duration.length - 1} hours
					</Trans>
				)}
				{!useMetric && duration.indexOf(false) === 1 && (
					<Trans>
						{(precipitation.value / 25.4).toFixed(1)} inches of precipitation
						expected over the next hour
					</Trans>
				)}
				{!useMetric &&
					duration.indexOf(false) !== 1 &&
					duration.indexOf(false) !== -1 && (
						<Trans>
							{(precipitation.value / 25.4).toFixed(1)} inches of precipitation
							expected over the next {duration.indexOf(false)} hours
						</Trans>
					)}
				{!useMetric && duration.indexOf(false) === -1 && (
					<Trans>
						{(precipitation.value / 25.4).toFixed(1)} inches of precipitation
						expected over the next {duration.length - 1} hours
					</Trans>
				)}
			</Alert>,
		)
	}

	// Wind Alert
	if (showWindAlerts && hoursOfStrongWind.includes(true)) {
		const timeUntilStrongWind = hoursOfStrongWind.indexOf(true) + 1
		if (timeUntilStrongWind > 1) {
			alerts.push(
				<Alert key="windAlert" icon={IconInfoCircle} variant="light-blue">
					<Trans>
						Generally strong wind starting in {timeUntilStrongWind} hours
					</Trans>
				</Alert>,
			)
		} else {
			const durationOfStrongWind = hoursOfStrongWind.indexOf(false)
			alerts.push(
				<Alert key="windAlert" icon={IconInfoCircle} variant="light-blue">
					{durationOfStrongWind > 1 && (
						<Trans>
							Generally strong wind for the next {durationOfStrongWind} hours
						</Trans>
					)}
					{durationOfStrongWind < 0 && (
						<Trans>Generally strong wind for the next 24 hours</Trans>
					)}
					{durationOfStrongWind === 1 && (
						<Trans>Generally strong wind for the next hour</Trans>
					)}
				</Alert>,
			)
		}
	}

	// Wind Gust Alert
	if (showWindAlerts && hoursOfStrongWindGusts.includes(true)) {
		const timeUntilStrongWind = hoursOfStrongWindGusts.indexOf(true) + 1
		if (timeUntilStrongWind > 1) {
			alerts.push(
				<Alert key="gustAlert" icon={IconInfoCircle} variant="light-blue">
					<Trans>
						Strong wind gusts starting in {timeUntilStrongWind} hours
					</Trans>
				</Alert>,
			)
		} else {
			const durationOfStrongWind = hoursOfStrongWindGusts.indexOf(false)
			alerts.push(
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
				</Alert>,
			)
		}
	}

	// Visibility Alert
	if (showVisibilityAlerts && hoursOfLowVisibility.includes(true)) {
		const timeUntilLowVisibility = hoursOfLowVisibility.indexOf(true) + 1
		if (timeUntilLowVisibility > 1) {
			alerts.push(
				<Alert key="visibilityAlert" icon={IconInfoCircle} variant="light-blue">
					<Trans>
						Low visibility starting in {timeUntilLowVisibility} hours
					</Trans>
				</Alert>,
			)
		} else {
			const durationOfLowVisibility = hoursOfLowVisibility.indexOf(false)
			alerts.push(
				<Alert key="visibilityAlert" icon={IconInfoCircle} variant="light-blue">
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
				</Alert>,
			)
		}
	}

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
	return null
}

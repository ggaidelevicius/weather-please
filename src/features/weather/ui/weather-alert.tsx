import type { IconProps } from '@tabler/icons-react'
import type { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react'

import { Trans } from '@lingui/react/macro'
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'

import type { Alerts } from '../model/types'

import { Alert } from '../../../shared/ui/alert'
import { AlertVariant } from '../../../shared/ui/alert-variant'

const PRECIPITATION_ALERT_THRESHOLD_MM = 15
const UV_WARNING_LEAD_HOURS = 3
const FULL_DAY_HOURS = 24
const COMPACT_ALERT_HEIGHT_PX = 44
const COMPACT_COLLAPSED_WIDTH_PX = 44
const COMPACT_TEXT_LEFT_PADDING_PX = 50
const COMPACT_TEXT_RIGHT_PADDING_PX = 36
const COMPACT_ALERT_STORAGE_KEY = 'compactAlertExpandedKeys'

type AlertIcon = ForwardRefExoticComponent<
	IconProps & RefAttributes<SVGSVGElement>
>

type AlertItem = {
	content: ReactNode
	icon: AlertIcon
	key: string
	variant: AlertVariant
}

const getInitialExpandedAlertKeys = (useCompactAlerts: boolean) => {
	if (!useCompactAlerts || typeof window === 'undefined') {
		return new Set<string>()
	}

	try {
		const stored = localStorage.getItem(COMPACT_ALERT_STORAGE_KEY)
		if (!stored) {
			return new Set<string>()
		}
		const parsed = JSON.parse(stored)
		if (Array.isArray(parsed)) {
			return new Set(parsed.filter((value) => typeof value === 'string'))
		}
		return new Set<string>()
	} catch (error) {
		console.error('Failed to read compact alert state', error)
		return new Set<string>()
	}
}

const CompactAlertButton = ({
	alert,
	isExpanded,
	onToggle,
}: {
	alert: AlertItem
	isExpanded: boolean
	onToggle: () => void
}) => {
	const textMeasureRef = useRef<HTMLSpanElement | null>(null)
	const [textWidth, setTextWidth] = useState(0)
	const gradientClass =
		alert.variant === AlertVariant.LightRed
			? 'from-transparent to-red-500/95'
			: alert.variant === AlertVariant.LightBlue
				? 'from-transparent to-blue-500/95'
				: 'from-transparent to-blue-700'

	useLayoutEffect(() => {
		if (!textMeasureRef.current) {
			return
		}
		const width = Math.ceil(
			textMeasureRef.current.getBoundingClientRect().width,
		)
		setTextWidth((prev) => (prev === width ? prev : width))
	}, [alert.content])

	const expandedWidth = Math.max(
		COMPACT_COLLAPSED_WIDTH_PX,
		textWidth + COMPACT_TEXT_LEFT_PADDING_PX + COMPACT_TEXT_RIGHT_PADDING_PX,
	)

	return (
		<motion.button
			animate={{
				width: isExpanded ? expandedWidth : COMPACT_COLLAPSED_WIDTH_PX,
			}}
			aria-expanded={isExpanded}
			className={clsx(
				'relative flex cursor-pointer items-center overflow-hidden rounded-md text-left text-white shadow-sm transition-shadow focus:outline-2 focus:outline-offset-2 focus:outline-blue-500',
				alert.variant === AlertVariant.LightRed
					? 'bg-red-500/95 font-medium select-none'
					: alert.variant === AlertVariant.LightBlue
						? 'bg-blue-500/95 font-medium select-none'
						: 'bg-linear-to-tl from-blue-700 to-blue-500',
				'h-11 max-w-[calc(100vw-1.5rem)]',
			)}
			initial={false}
			onClick={onToggle}
			style={{ height: COMPACT_ALERT_HEIGHT_PX }}
			transition={{ damping: 32, stiffness: 360, type: 'spring' }}
			type="button"
		>
			<span className="relative z-10 flex h-11 w-11 items-center justify-center">
				<alert.icon aria-hidden size={24} strokeWidth={1.5} />
			</span>
			<motion.span
				animate={{
					opacity: isExpanded ? 1 : 0,
					x: isExpanded ? 0 : -6,
				}}
				className="absolute inset-y-0 right-0 left-0 flex items-center pr-10 pl-12 text-sm font-medium whitespace-nowrap"
				initial={false}
				transition={{ duration: 0.2 }}
			>
				{alert.content}
			</motion.span>
			<span
				aria-hidden
				className={clsx(
					'pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-r',
					gradientClass,
				)}
			/>
			<span
				aria-hidden
				className="pointer-events-none absolute top-0 left-0 text-sm font-medium whitespace-nowrap opacity-0"
				ref={textMeasureRef}
			>
				{alert.content}
			</span>
		</motion.button>
	)
}

interface AlertProps extends Alerts {
	showPrecipitationAlerts: boolean
	showUvAlerts: boolean
	showVisibilityAlerts: boolean
	showWindAlerts: boolean
	useCompactAlerts: boolean
	useMetric: boolean
}

export const WeatherAlert = ({
	hoursOfExtremeUv,
	hoursOfLowVisibility,
	hoursOfStrongWind,
	hoursOfStrongWindGusts,
	showPrecipitationAlerts,
	showUvAlerts,
	showVisibilityAlerts,
	showWindAlerts,
	totalPrecipitation,
	useCompactAlerts,
	useMetric,
}: Readonly<AlertProps>) => {
	// Derive alerts array directly from props
	const [expandedAlertKeys, setExpandedAlertKeys] = useState<Set<string>>(() =>
		getInitialExpandedAlertKeys(useCompactAlerts),
	)
	const alerts: AlertItem[] = []

	// UV Alert
	if (showUvAlerts && hoursOfExtremeUv.includes(true)) {
		const firstExtremeIndex = hoursOfExtremeUv.indexOf(true)
		const timeUntilExtremeUv = firstExtremeIndex
		let uvContent: null | ReactNode = null
		if (timeUntilExtremeUv > 0) {
			if (timeUntilExtremeUv <= UV_WARNING_LEAD_HOURS) {
				uvContent =
					timeUntilExtremeUv === 1 ? (
						<Trans>Extreme UV starting in 1 hour</Trans>
					) : (
						<Trans>Extreme UV starting in {timeUntilExtremeUv} hours</Trans>
					)
			}
		} else {
			const firstEndIndex = hoursOfExtremeUv.indexOf(false)
			const durationOfExtremeUv =
				firstEndIndex === -1 ? hoursOfExtremeUv.length - 1 : firstEndIndex
			if (durationOfExtremeUv > 1) {
				uvContent = (
					<Trans>Extreme UV for the next {durationOfExtremeUv} hours</Trans>
				)
			}
			if (durationOfExtremeUv === 1) {
				uvContent = <Trans>Extreme UV for the next hour</Trans>
			}
		}
		if (uvContent) {
			alerts.push({
				content: uvContent,
				icon: IconAlertTriangle,
				key: 'uvAlert',
				variant: AlertVariant.LightRed,
			})
		}
	}

	// Precipitation Alert
	if (
		showPrecipitationAlerts &&
		totalPrecipitation.precipitation.value >= PRECIPITATION_ALERT_THRESHOLD_MM
	) {
		const { duration, precipitation } = totalPrecipitation
		// Compute duration once: indexOf(false) gives the index of the first false,
		// which represents when the precipitation period ends
		const firstEndIndex = duration.indexOf(false)
		const durationHours = firstEndIndex === -1 ? duration.length : firstEndIndex
		const precipitationMm = precipitation.value.toFixed(1)
		const precipitationInches = (precipitation.value / 25.4).toFixed(1)

		let precipitationContent: null | ReactNode = null
		if (useMetric && durationHours === 1) {
			precipitationContent = (
				<Trans>
					{precipitationMm}mm of precipitation expected over the next hour
				</Trans>
			)
		}
		if (useMetric && durationHours >= FULL_DAY_HOURS) {
			precipitationContent = (
				<Trans>
					{precipitationMm}mm of precipitation expected over the next 24 hours
				</Trans>
			)
		}
		if (useMetric && durationHours > 1 && durationHours < FULL_DAY_HOURS) {
			precipitationContent = (
				<Trans>
					{precipitationMm}mm of precipitation expected over the next{' '}
					{durationHours} hours
				</Trans>
			)
		}
		if (!useMetric && durationHours === 1) {
			precipitationContent = (
				<Trans>
					{precipitationInches} inches of precipitation expected over the next
					hour
				</Trans>
			)
		}
		if (!useMetric && durationHours >= FULL_DAY_HOURS) {
			precipitationContent = (
				<Trans>
					{precipitationInches} inches of precipitation expected over the next
					24 hours
				</Trans>
			)
		}
		if (!useMetric && durationHours > 1 && durationHours < FULL_DAY_HOURS) {
			precipitationContent = (
				<Trans>
					{precipitationInches} inches of precipitation expected over the next{' '}
					{durationHours} hours
				</Trans>
			)
		}
		if (precipitationContent) {
			alerts.push({
				content: precipitationContent,
				icon: IconInfoCircle,
				key: 'precipitationAlert',
				variant: AlertVariant.LightBlue,
			})
		}
	}

	// Wind Alert
	if (showWindAlerts && hoursOfStrongWind.includes(true)) {
		const timeUntilStrongWind = hoursOfStrongWind.indexOf(true)
		let windContent: null | ReactNode = null
		if (timeUntilStrongWind > 0) {
			windContent =
				timeUntilStrongWind === 1 ? (
					<Trans>Generally strong wind starting in 1 hour</Trans>
				) : (
					<Trans>
						Generally strong wind starting in {timeUntilStrongWind} hours
					</Trans>
				)
		} else {
			const durationOfStrongWind = hoursOfStrongWind.indexOf(false)
			if (durationOfStrongWind > 1 && durationOfStrongWind < FULL_DAY_HOURS) {
				windContent = (
					<Trans>
						Generally strong wind for the next {durationOfStrongWind} hours
					</Trans>
				)
			}
			if (durationOfStrongWind < 0 || durationOfStrongWind >= FULL_DAY_HOURS) {
				windContent = <Trans>Generally strong wind for the next 24 hours</Trans>
			}
			if (durationOfStrongWind === 1) {
				windContent = <Trans>Generally strong wind for the next hour</Trans>
			}
		}
		if (windContent) {
			alerts.push({
				content: windContent,
				icon: IconInfoCircle,
				key: 'windAlert',
				variant: AlertVariant.LightBlue,
			})
		}
	}

	// Wind Gust Alert
	if (showWindAlerts && hoursOfStrongWindGusts.includes(true)) {
		const timeUntilStrongWind = hoursOfStrongWindGusts.indexOf(true)
		let gustContent: null | ReactNode = null
		if (timeUntilStrongWind > 0) {
			gustContent =
				timeUntilStrongWind === 1 ? (
					<Trans>Strong wind gusts starting in 1 hour</Trans>
				) : (
					<Trans>
						Strong wind gusts starting in {timeUntilStrongWind} hours
					</Trans>
				)
		} else {
			const durationOfStrongWind = hoursOfStrongWindGusts.indexOf(false)
			if (durationOfStrongWind > 1 && durationOfStrongWind < FULL_DAY_HOURS) {
				gustContent = (
					<Trans>
						Strong wind gusts for the next {durationOfStrongWind} hours
					</Trans>
				)
			}
			if (durationOfStrongWind < 0 || durationOfStrongWind >= FULL_DAY_HOURS) {
				gustContent = <Trans>Strong wind gusts for the next 24 hours</Trans>
			}
			if (durationOfStrongWind === 1) {
				gustContent = <Trans>Strong wind gusts for the next hour</Trans>
			}
		}
		if (gustContent) {
			alerts.push({
				content: gustContent,
				icon: IconInfoCircle,
				key: 'gustAlert',
				variant: AlertVariant.LightBlue,
			})
		}
	}

	// Visibility Alert
	if (showVisibilityAlerts && hoursOfLowVisibility.includes(true)) {
		const timeUntilLowVisibility = hoursOfLowVisibility.indexOf(true)
		let visibilityContent: null | ReactNode = null
		if (timeUntilLowVisibility > 0) {
			visibilityContent =
				timeUntilLowVisibility === 1 ? (
					<Trans>Low visibility starting in 1 hour</Trans>
				) : (
					<Trans>
						Low visibility starting in {timeUntilLowVisibility} hours
					</Trans>
				)
		} else {
			const durationOfLowVisibility = hoursOfLowVisibility.indexOf(false)
			if (
				durationOfLowVisibility > 1 &&
				durationOfLowVisibility < FULL_DAY_HOURS
			) {
				visibilityContent = (
					<Trans>
						Low visibility for the next {durationOfLowVisibility} hours
					</Trans>
				)
			}
			if (
				durationOfLowVisibility < 0 ||
				durationOfLowVisibility >= FULL_DAY_HOURS
			) {
				visibilityContent = <Trans>Low visibility for the next 24 hours</Trans>
			}
			if (durationOfLowVisibility === 1) {
				visibilityContent = <Trans>Low visibility for the next hour</Trans>
			}
		}
		if (visibilityContent) {
			alerts.push({
				content: visibilityContent,
				icon: IconInfoCircle,
				key: 'visibilityAlert',
				variant: AlertVariant.LightBlue,
			})
		}
	}

	if (alerts.length > 0) {
		if (useCompactAlerts) {
			const handleToggle = (key: string) => {
				setExpandedAlertKeys((current) => {
					const next = new Set(current)
					if (next.has(key)) {
						next.delete(key)
					} else {
						next.add(key)
					}
					try {
						localStorage.setItem(
							COMPACT_ALERT_STORAGE_KEY,
							JSON.stringify(Array.from(next)),
						)
					} catch (error) {
						console.error('Failed to persist compact alert state', error)
					}
					return next
				})
			}

			return (
				<motion.aside
					animate={{
						opacity: 1,
						transition: {
							duration: 2,
							type: 'spring',
						},
					}}
					aria-live="assertive"
					className="fixed top-0 left-0 z-2 flex w-auto flex-col items-start gap-2 p-3"
					exit={{ opacity: 0, scale: 0.95 }}
					initial={{ opacity: 0 }}
					role="alert"
				>
					{alerts.map((alert) => (
						<CompactAlertButton
							alert={alert}
							isExpanded={expandedAlertKeys.has(alert.key)}
							key={alert.key}
							onToggle={() => handleToggle(alert.key)}
						/>
					))}
				</motion.aside>
			)
		}

		return (
			<motion.aside
				animate={{
					opacity: 1,
					scale: 1,
					transition: {
						duration: 2,
						type: 'spring',
					},
				}}
				aria-live="assertive"
				className="fixed top-0 left-0 z-2 flex w-full flex-col"
				exit={{ opacity: 0, scale: 0.95 }}
				initial={{ opacity: 0 }}
				role="alert"
			>
				{alerts.map((alert) => (
					<Alert icon={alert.icon} key={alert.key} variant={alert.variant}>
						{alert.content}
					</Alert>
				))}
			</motion.aside>
		)
	}
	return null
}

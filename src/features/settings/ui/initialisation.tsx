import type { Dispatch, SetStateAction } from 'react'

import {
	Description,
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from '@headlessui/react'
import { Trans } from '@lingui/react/macro'
import { IconAlertTriangle, IconShieldCheckFilled } from '@tabler/icons-react'
import Image from 'next/image'
import { useState } from 'react'

import type { LocaleKey } from '../../../shared/lib/i18n'
import type { Config } from '../hooks/use-config'

import Favicon from '../../../../public/favicon.png'
import { AsyncStatus } from '../../../shared/hooks/async-status'
import { getHttpErrorStatusCode } from '../../../shared/lib/http-error-status'
import { locales } from '../../../shared/lib/i18n'
import { Alert } from '../../../shared/ui/alert'
import { AlertVariant } from '../../../shared/ui/alert-variant'
import { Button } from '../../../shared/ui/button'
import { Select } from '../../../shared/ui/input'
import { TemperatureUnit, UnitSystem } from '../model/unit-system'

enum LocationErrorCode {
	PermissionDenied = 'permission_denied',
	PositionUnavailable = 'position_unavailable',
	Timeout = 'timeout',
}

interface InitialisationProps {
	handleChange: (k: keyof Config, v: Config[keyof Config]) => void
	input: Config
	pending: boolean
	setInput: Dispatch<SetStateAction<Config>>
}

type LocationError = {
	code: LocationErrorCode
	httpStatusCode: null | number
}

const getTemperatureUnitOptions = () => [
	{
		label: <Trans>Celsius (°C)</Trans>,
		value: TemperatureUnit.Celsius,
	},
	{
		label: <Trans>Fahrenheit (°F)</Trans>,
		value: TemperatureUnit.Fahrenheit,
	},
]

const getUnitSystemOptions = () => [
	{
		label: <Trans>Metric (km/h, mm)</Trans>,
		value: UnitSystem.Metric,
	},
	{
		label: <Trans>Imperial (mph, in)</Trans>,
		value: UnitSystem.Imperial,
	},
]

export const Initialisation = ({
	handleChange,
	input,
	pending,
	setInput,
}: Readonly<InitialisationProps>) => {
	const [locationStatus, setLocationStatus] = useState<AsyncStatus>(
		AsyncStatus.Idle,
	)
	const [locationError, setLocationError] = useState<LocationError | null>(null)
	const localeKeys = Object.keys(locales) as LocaleKey[]
	const isLoading = locationStatus === AsyncStatus.Loading

	const handleClick = () => {
		setLocationStatus(AsyncStatus.Loading)
		setLocationError(null)
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setInput((prev) => ({
					...prev,
					lat: pos.coords.latitude.toString(),
					lon: pos.coords.longitude.toString(),
				}))
				setLocationStatus(AsyncStatus.Success)
			},
			(err) => {
				setLocationStatus(AsyncStatus.Error)
				const httpStatusCode = getHttpErrorStatusCode(err.message)

				if (err.code === err.PERMISSION_DENIED) {
					setLocationError({
						code: LocationErrorCode.PermissionDenied,
						httpStatusCode,
					})
				} else if (err.code === err.POSITION_UNAVAILABLE) {
					setLocationError({
						code: LocationErrorCode.PositionUnavailable,
						httpStatusCode,
					})
				} else if (err.code === err.TIMEOUT) {
					setLocationError({
						code: LocationErrorCode.Timeout,
						httpStatusCode,
					})
				}
			},
		)
	}

	const getErrorInstructions = () => {
		const errorCode = locationError?.code
		const userAgent = navigator.userAgent.toLowerCase()
		const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg')
		const isFirefox = userAgent.includes('firefox')
		const isSafari =
			userAgent.includes('safari') && !userAgent.includes('chrome')
		const isEdge = userAgent.includes('edg')
		const httpStatusCode = locationError?.httpStatusCode

		if (errorCode === LocationErrorCode.PermissionDenied) {
			if (isChrome || isEdge) {
				return (
					<Trans>
						<strong>Location access denied.</strong> Click the location icon in
						the address bar, and select &quot;always allow this to access your
						location&quot;. Then click the button below to try again.
					</Trans>
				)
			} else if (isFirefox) {
				return (
					<Trans>
						<strong>Location access denied.</strong> Click the location icon in
						the address bar, and select &quot;always allow this to access your
						location&quot;. Then click the button below to try again.
					</Trans>
				)
			} else if (isSafari) {
				return (
					<Trans>
						<strong>Location access denied.</strong> Click the location icon in
						the address bar, and select &quot;always allow this to access your
						location&quot;. Then click the button below to try again.
					</Trans>
				)
			}
			return (
				<Trans>
					<strong>Location access denied.</strong> Check your browser&apos;s
					settings to allow this site to access your location, then try again.
				</Trans>
			)
		} else if (errorCode === LocationErrorCode.PositionUnavailable) {
			if (httpStatusCode) {
				return (
					<Trans>
						We couldn&apos;t reach the location service right now - this
						isn&apos;t an issue with your device. Please try again in a moment.
					</Trans>
				)
			}

			return (
				<Trans>
					Your location is currently unavailable. Please check that location
					services are enabled on your device and try again.
				</Trans>
			)
		} else if (errorCode === LocationErrorCode.Timeout) {
			if (httpStatusCode) {
				return (
					<Trans>
						The location request timed out - this looks like a service issue
						rather than a problem on your end. Please try again in a moment.
					</Trans>
				)
			}

			return (
				<Trans>
					The location request timed out. Please check your internet connection
					and try again.
				</Trans>
			)
		}
		return null
	}

	return (
		<Dialog className="relative z-50" onClose={() => {}} open={pending}>
			<DialogBackdrop
				className="fixed inset-0 bg-black/60 backdrop-blur-lg transition duration-300 will-change-[backdrop-filter,background-color] data-closed:opacity-0"
				transition
			/>{' '}
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel
					className="m-auto w-full max-w-lg space-y-4 rounded-xl bg-dark-800 p-12 transition duration-400 will-change-[transform,opacity,filter] data-closed:scale-97 data-closed:opacity-0 data-closed:blur-xs"
					transition
				>
					{' '}
					<DialogTitle
						as="div"
						className="flex flex-row items-center justify-center gap-5"
					>
						<Image
							alt="Weather Please logo"
							className="h-16 w-16 select-none"
							priority
							quality={100}
							src={Favicon}
						/>
						<h1 className="text-4xl font-bold text-white">
							Weather <span className="text-[#ea5e57]">Please</span>
						</h1>
					</DialogTitle>
					<Description className="mt-8 mb-1 font-semibold text-white">
						<Trans>
							To get started, let&apos;s set your language, units, and location.
						</Trans>
					</Description>
					<p className="text-sm text-dark-100">
						<Trans>
							If your browser prompts you for location permissions, please
							select &quot;allow&quot;.
						</Trans>
					</p>
					<Select
						label={<Trans>Language</Trans>}
						onChange={(e) => {
							handleChange('lang', e.target.value)
						}}
						options={localeKeys.map((key) => ({
							label: locales[key].label,
							value: key,
						}))}
						value={input.lang}
					/>
					<Select
						label={<Trans>Temperature</Trans>}
						onChange={(e) => {
							handleChange('temperatureUnit', e.target.value as TemperatureUnit)
						}}
						options={getTemperatureUnitOptions()}
						value={input.temperatureUnit}
					/>
					<Select
						label={<Trans>Other units</Trans>}
						onChange={(e) => {
							handleChange('unitSystem', e.target.value as UnitSystem)
						}}
						options={getUnitSystemOptions()}
						value={input.unitSystem}
					/>
					<Alert icon={IconShieldCheckFilled}>
						<Trans>
							Your location data is securely stored exclusively on your personal
							device.
						</Trans>
					</Alert>
					{locationError && (
						<Alert icon={IconAlertTriangle} variant={AlertVariant.InfoRed}>
							{getErrorInstructions()}
						</Alert>
					)}
					<Button disabled={isLoading} onClick={handleClick}>
						{locationError ? (
							<Trans>Try again</Trans>
						) : (
							<Trans>Set my location</Trans>
						)}
					</Button>
				</DialogPanel>
			</div>
		</Dialog>
	)
}

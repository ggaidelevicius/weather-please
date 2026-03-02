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
import { Alert } from '../../../shared/ui/alert'
import { AlertVariant } from '../../../shared/ui/alert-variant'
import { Button } from '../../../shared/ui/button'
import { Select, Switch } from '../../../shared/ui/input'
import { AsyncStatus } from '../../../shared/hooks/async-status'
import { locales } from '../../../shared/lib/i18n'
import Favicon from '../../../../public/favicon.png'
import type { Config } from '../hooks/use-config'
import type { LocaleKey } from '../../../shared/lib/i18n'
import type { Dispatch, SetStateAction } from 'react'

interface InitialisationProps {
	setInput: Dispatch<SetStateAction<Config>>
	handleChange: (k: keyof Config, v: Config[keyof Config]) => void
	input: Config
	pending: boolean
}

enum LocationErrorCode {
	PermissionDenied = 'permission_denied',
	PositionUnavailable = 'position_unavailable',
	Timeout = 'timeout',
}

export const Initialisation = ({
	setInput,
	handleChange,
	input,
	pending,
}: Readonly<InitialisationProps>) => {
	const [locationStatus, setLocationStatus] = useState<AsyncStatus>(
		AsyncStatus.Idle,
	)
	const [errorCode, setErrorCode] = useState<LocationErrorCode | null>(null)
	const localeKeys = Object.keys(locales) as LocaleKey[]
	const isLoading = locationStatus === AsyncStatus.Loading

	const handleClick = () => {
		setLocationStatus(AsyncStatus.Loading)
		setErrorCode(null)
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
				if (err.code === err.PERMISSION_DENIED) {
					setErrorCode(LocationErrorCode.PermissionDenied)
				} else if (err.code === err.POSITION_UNAVAILABLE) {
					setErrorCode(LocationErrorCode.PositionUnavailable)
				} else if (err.code === err.TIMEOUT) {
					setErrorCode(LocationErrorCode.Timeout)
				}
			},
		)
	}

	const getErrorInstructions = () => {
		const userAgent = navigator.userAgent.toLowerCase()
		const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg')
		const isFirefox = userAgent.includes('firefox')
		const isSafari =
			userAgent.includes('safari') && !userAgent.includes('chrome')
		const isEdge = userAgent.includes('edg')

		if (errorCode === LocationErrorCode.PermissionDenied) {
			if (isChrome || isEdge) {
				return (
					<Trans>
						<strong>Location access denied.</strong> Click the location icon in
						the address bar, and select "always allow this to access your
						location". Then click the button below to try again.
					</Trans>
				)
			} else if (isFirefox) {
				return (
					<Trans>
						<strong>Location access denied.</strong> Click the location icon in
						the address bar, and select "always allow this to access your
						location". Then click the button below to try again.
					</Trans>
				)
			} else if (isSafari) {
				return (
					<Trans>
						<strong>Location access denied.</strong> Click the location icon in
						the address bar, and select "always allow this to access your
						location". Then click the button below to try again.
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
			return (
				<Trans>
					Your location is currently unavailable. Please check that location
					services are enabled on your device and try again.
				</Trans>
			)
		} else if (errorCode === LocationErrorCode.Timeout) {
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
		<Dialog open={pending} onClose={() => {}} className="relative z-50">
			<DialogBackdrop
				transition
				className="fixed inset-0 bg-black/60 backdrop-blur-lg transition duration-300 will-change-[backdrop-filter,background-color] data-closed:opacity-0"
			/>{' '}
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel
					transition
					className="m-auto w-full max-w-lg space-y-4 rounded-xl bg-dark-800 p-12 transition duration-400 will-change-[transform,opacity,filter] data-closed:scale-97 data-closed:opacity-0 data-closed:blur-xs"
				>
					{' '}
					<DialogTitle
						as="div"
						className="flex flex-row items-center justify-center gap-5"
					>
						<Image
							priority
							quality={100}
							src={Favicon}
							alt="Weather Please logo"
							className="h-16 w-16 select-none"
						/>
						<h1 className="text-4xl font-bold text-white">
							Weather <span className="text-[#ea5e57]">Please</span>
						</h1>
					</DialogTitle>
					<Description className="mt-8 mb-1 font-semibold text-white">
						<Trans>
							To get started, let&apos;s set your language and location.
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
						value={input.lang}
						onChange={(e) => {
							handleChange('lang', e.target.value)
						}}
						options={localeKeys.map((key) => ({
							value: key,
							label: locales[key].label,
						}))}
					/>
					<Switch
						label={<Trans>Use metric number format</Trans>}
						checked={input.useMetric}
						onChange={(e) => handleChange('useMetric', e)}
					/>
					<Alert icon={IconShieldCheckFilled}>
						<Trans>
							Your location data is securely stored exclusively on your personal
							device.
						</Trans>
					</Alert>
					{errorCode && (
						<Alert icon={IconAlertTriangle} variant={AlertVariant.InfoRed}>
							{getErrorInstructions()}
						</Alert>
					)}
					<Button onClick={handleClick} disabled={isLoading}>
						{errorCode ? (
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

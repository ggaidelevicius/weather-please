import { locales } from '@/lib/i18n'
import type { Config } from '@/pages'
import {
	Description,
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from '@headlessui/react'
import { Trans } from '@lingui/react/macro'
import { IconShieldCheckFilled } from '@tabler/icons-react'
import Image from 'next/image'
import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'
import Favicon from '../../public/favicon.png'
import { Alert } from './alert'
import { Button } from './button'
import { Select, Switch } from './input'

interface InitialisationProps {
	setInput: Dispatch<SetStateAction<Config>>
	handleChange: (k: keyof Config, v: Config[keyof Config]) => void
	input: Config
	pending: boolean
}

export const Initialisation = ({
	setInput,
	handleChange,
	input,
	pending,
}: Readonly<InitialisationProps>) => {
	const [loading, setLoading] = useState<boolean>(false)
	const handleClick = () => {
		navigator.geolocation.getCurrentPosition((pos) => {
			setInput((prev) => ({
				...prev,
				lat: pos.coords.latitude.toString(),
				lon: pos.coords.longitude.toString(),
			}))
		})
	}

	return (
		<Dialog open={pending} onClose={() => {}} className="relative z-50">
			<DialogBackdrop
				transition
				className="fixed inset-0 bg-black/60 backdrop-blur-lg transition duration-300 will-change-[backdrop-filter,background-color] data-[closed]:opacity-0"
			/>{' '}
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel
					transition
					className="m-auto w-full max-w-lg space-y-4 rounded-xl bg-dark-800 p-12 transition duration-400 will-change-[transform,opacity,filter] data-[closed]:scale-97 data-[closed]:opacity-0 data-[closed]:blur-xs"
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
						label={(<Trans>Language</Trans>) as unknown as string}
						value={input.lang}
						onChange={(e) => {
							handleChange('lang', e.target.value)
						}}
						options={Object.keys(locales).map((key) => ({
							value: key,
							label: locales[key].label,
						}))}
					/>
					<Switch
						label={
							(<Trans>Use metric number format</Trans>) as unknown as string
						}
						checked={input.useMetric}
						onChange={(e) => handleChange('useMetric', e)}
					/>
					<Alert icon={IconShieldCheckFilled}>
						<Trans>
							Your location data is securely stored exclusively on your personal
							device.
						</Trans>
					</Alert>
					<Button
						onClick={() => {
							handleClick()
							setLoading(true)
						}}
						disabled={loading}
					>
						<Trans>Set my location</Trans>
					</Button>
				</DialogPanel>
			</div>
		</Dialog>
	)
}

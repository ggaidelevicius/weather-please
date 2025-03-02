import { locales } from '@/lib/i18n'
import { HandleChange } from '@/lib/types'
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
import { Select } from './input'

interface InitialisationProps {
	setInput: Dispatch<SetStateAction<Config>>
	handleChange: HandleChange
	input: Config
}

export const Initialisation = ({
	setInput,
	handleChange,
	input,
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
		<Dialog open onClose={() => {}} className="relative z-50">
			<DialogBackdrop className="fixed inset-0 bg-black/60" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel className="max-w-lg space-y-4 rounded-xl border bg-dark-800 p-12">
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
						label="Language"
						value={input.lang}
						onChange={(e) => {
							handleChange('lang', e.target.value)
						}}
						options={Object.keys(locales).map((key) => ({
							value: key,
							label: locales[key].label,
						}))}
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
						Set my location
					</Button>
				</DialogPanel>
			</div>
		</Dialog>
	)
}

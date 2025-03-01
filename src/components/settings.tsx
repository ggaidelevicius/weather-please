import {
	Description,
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from '@headlessui/react'
import { useState } from 'react'
import { Button, IconButton } from './button'
import { IconSettings, IconShieldCheckFilled } from '@tabler/icons-react'
import { Trans } from '@lingui/react/macro'
import { Select } from './input'
import { Alert } from './alert'
import type { HandleChange } from '@/lib/types'
import type { Config } from '@/pages'
import { locales } from '@/lib/i18n'
import { Input } from './input'

interface SettingsProps {
	handleChange: HandleChange
	input: Config
}

export const Settings = ({ handleChange, input }: Readonly<SettingsProps>) => {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<>
			<IconButton
				// input={input}
				// handleChange={handleChange}
				onClick={() => {
					setIsOpen(true)
				}}
				className="fixed right-4 bottom-4"
				icon={IconSettings}
				// config={config}
				// setInput={setInput}
				// reviewLink={reviewLink}
				// settingsOpened={settingsOpened}
			>
				<Trans>Settings</Trans>
			</IconButton>
			<Dialog
				open={isOpen}
				onClose={() => setIsOpen(false)}
				className="relative z-50"
			>
				<DialogBackdrop
					transition
					className="fixed inset-0 bg-black/60 backdrop-blur-lg transition duration-300 data-[closed]:opacity-0"
				/>
				<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
					<DialogPanel
						transition
						className="w-full max-w-lg space-y-4 rounded-xl bg-dark-800 p-12 transition duration-500 data-[closed]:scale-97 data-[closed]:opacity-0 data-[closed]:blur-xs"
					>
						<DialogTitle as="h1" className="text-4xl font-bold text-white">
							<Trans>Settings</Trans>
						</DialogTitle>
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
						<Input
							label="Latitude"
							value={input.lat}
							onChange={(e) => {
								handleChange('lat', e.target.value)
							}}
						/>
						<Input
							label="Longitude"
							value={input.lon}
							onChange={(e) => {
								handleChange('lon', e.target.value)
							}}
						/>
						<Alert icon={IconShieldCheckFilled}>
							<Trans>
								Your location data is securely stored exclusively on your
								personal device.
							</Trans>
						</Alert>
						{/* <Description className="mt-8 mb-1 font-semibold text-white">
              <Trans>
                To get started, let&apos;s set your language and location.
              </Trans>
            </Description>
            <p className="text-sm text-dark-100">
              <Trans>
                If your browser prompts you for location permissions, please
                select &quot;allow&quot;.
              </Trans>
            </p> */}
					</DialogPanel>
				</div>
			</Dialog>
		</>
	)
}

import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from '@headlessui/react'
import { Trans } from '@lingui/react/macro'
import { Button } from './button'
import type { ReactNode } from 'react'

interface SeasonalEventModalProps {
	isOpen: boolean
	onClose: () => void
	title: ReactNode
	children: ReactNode
}

export const SeasonalEventModal = ({
	isOpen,
	onClose,
	title,
	children,
}: Readonly<SeasonalEventModalProps>) => (
	<Dialog open={isOpen} onClose={onClose} className="relative z-50">
		<DialogBackdrop
			transition
			className="fixed inset-0 bg-black/60 backdrop-blur-lg transition duration-300 will-change-[backdrop-filter,background-color] data-closed:opacity-0"
		/>
		<div className="fixed inset-0 flex w-screen items-center justify-center overflow-y-auto p-6">
			<DialogPanel
				transition
				className="m-auto w-full max-w-xl space-y-6 rounded-2xl bg-dark-800 p-8 transition duration-400 will-change-[transform,opacity,filter] data-closed:scale-97 data-closed:opacity-0 data-closed:blur-xs"
			>
				<DialogTitle as="h1" className="text-3xl font-bold text-white">
					{title}
				</DialogTitle>
				<div className="text-sm leading-relaxed text-dark-100 [&_a]:text-blue-400 [&_a]:underline [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-white [&_img]:w-full [&_img]:rounded-lg [&_img]:shadow-md [&_p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
					{children}
				</div>
				<div className="flex justify-end">
					<Button onClick={onClose}>
						<Trans>Close</Trans>
					</Button>
				</div>
			</DialogPanel>
		</div>
	</Dialog>
)

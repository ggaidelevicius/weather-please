import type { ReactNode } from 'react'

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { clsx } from 'clsx'
import { useRef } from 'react'

interface HelpPopoverProps {
	children: ReactNode
	className?: string
	label: string
}

export const HelpPopover = ({
	children,
	className,
	label,
}: Readonly<HelpPopoverProps>) => {
	const buttonRef = useRef<HTMLButtonElement>(null)

	return (
		<Popover className={clsx('relative inline-flex', className)}>
			{({ close, open }) => {
				const handleOpen = () => {
					if (!open) {
						buttonRef.current?.click()
					}
				}

				return (
					<div
						className="relative inline-flex"
						onBlur={(event) => {
							if (
								event.currentTarget.contains(event.relatedTarget as Node | null)
							) {
								return
							}

							close()
						}}
						onMouseEnter={handleOpen}
						onMouseLeave={() => close()}
					>
						<PopoverButton
							aria-label={label}
							className="inline-flex size-4 cursor-help items-center justify-center rounded-full border border-blue-400/80 bg-blue-500/15 align-middle text-[0.6125rem] leading-none font-semibold text-blue-300 transition hover:border-blue-300 hover:text-blue-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
							ref={buttonRef}
						>
							?
						</PopoverButton>
						<PopoverPanel
							className="absolute top-full left-0 z-10 mt-2 w-64 rounded-lg border border-white/10 bg-dark-900 px-3 py-2 text-sm leading-6 text-white shadow-2xl"
							role="tooltip"
						>
							{children}
						</PopoverPanel>
					</div>
				)
			}}
		</Popover>
	)
}

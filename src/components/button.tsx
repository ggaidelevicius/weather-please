import type { ComponentPropsWithoutRef } from 'react'
import { Button as HeadlessButton } from '@headlessui/react'

const defaultClasses =
	'bg-blue-600 hover:not-disabled:bg-blue-700 active:not-disabled:bg-blue-800 disabled:bg-blue-700 text-sm text-white font-medium p-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 select-none disabled:cursor-wait'
const fullWidthClasses =
	'bg-blue-600 hover:not-disabled:bg-blue-700 active:not-disabled:bg-blue-800 disabled:bg-blue-700 text-sm text-white font-medium p-2 rounded-md w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 select-none disabled:cursor-wait'

interface ButtonProps {
	fullWidth?: boolean
}

export const Button = ({
	children,
	onClick,
	fullWidth = false,
	disabled = false,
}: ComponentPropsWithoutRef<'button'> & ButtonProps) => {
	return (
		<HeadlessButton
			onClick={onClick}
			className={fullWidth ? fullWidthClasses : defaultClasses}
			disabled={disabled}
		>
			{children}
		</HeadlessButton>
	)
}

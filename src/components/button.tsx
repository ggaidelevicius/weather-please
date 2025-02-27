import type { ComponentPropsWithoutRef } from 'react'
import { Button as HeadlessButton } from '@headlessui/react'

const defaultClasses =
	'group relative bg-blue-600 hover:not-disabled:bg-blue-700 active:not-disabled:bg-blue-800 disabled:bg-blue-700 text-sm text-white font-medium p-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 select-none disabled:cursor-wait'
const fullWidthClasses =
	'group relative bg-blue-600 hover:not-disabled:bg-blue-700 active:not-disabled:bg-blue-800 disabled:bg-blue-700 text-sm text-white font-medium p-2 rounded-md w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 select-none disabled:cursor-wait'

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
			{disabled && (
				<span className="absolute inset-0 m-auto flex h-[20px] w-[20px] -translate-y-2 animate-spin rounded-[100%] border-3 border-t-white border-r-white border-b-transparent border-l-white opacity-0 transition group-data-[disabled]:translate-y-0 group-data-[disabled]:opacity-100"></span>
			)}
			<span className="flex place-self-center transition group-data-[disabled]:translate-y-2 group-data-[disabled]:opacity-0">
				{children}
			</span>
		</HeadlessButton>
	)
}

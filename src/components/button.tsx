import { Button as HeadlessButton } from '@headlessui/react'
import type { Icon, IconProps } from '@tabler/icons-react'
import { clsx } from 'clsx'
import type {
	ComponentPropsWithoutRef,
	ForwardRefExoticComponent,
	MouseEventHandler,
	ReactNode,
	RefAttributes,
} from 'react'

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

interface IconButtonProps {
	icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
	onClick: MouseEventHandler<HTMLButtonElement>
	className?: string
	children: ReactNode
}

export const IconButton = ({
	onClick,
	className,
	icon: Icon,
	children,
}: IconButtonProps) => {
	return (
		<HeadlessButton
			onClick={onClick}
			className={clsx(
				'rounded-md bg-dark-100/10 p-2 text-white select-none hover:bg-dark-100/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-dark-100/30',
				className,
			)}
		>
			<Icon aria-hidden size={18} />
			<span className="sr-only">{children}</span>
		</HeadlessButton>
	)
}

import { Button as HeadlessButton } from '@headlessui/react'
import type { IconProps } from '@tabler/icons-react'
import { clsx } from 'clsx'
import type {
	ForwardRefExoticComponent,
	MouseEventHandler,
	ReactNode,
	RefAttributes,
} from 'react'

interface BaseButtonProps {
	children: ReactNode
	fullWidth?: boolean
	disabled?: boolean
	secondary?: boolean
	className?: string
}

interface ControlledButtonProps extends BaseButtonProps {
	onClick: MouseEventHandler<HTMLButtonElement>
	type?: undefined
	href?: undefined
}

interface UncontrolledButtonProps extends BaseButtonProps {
	onClick?: undefined
	type: 'submit'
	href?: undefined
}

interface AnchorButtonProps extends BaseButtonProps {
	href: string
	onClick?: MouseEventHandler<HTMLAnchorElement>
	type?: undefined
}

export const Button = ({
	children,
	onClick,
	fullWidth = false,
	disabled = false,
	type,
	href,
	secondary = false,
	className,
}: ControlledButtonProps | UncontrolledButtonProps | AnchorButtonProps) => {
	const primaryClasses = fullWidth
		? `group relative flex w-full cursor-pointer items-center rounded-md bg-white px-3 py-2 text-center text-sm font-medium text-dark-600 select-none hover:not-disabled:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:not-disabled:bg-zinc-300 disabled:cursor-wait disabled:bg-zinc-200 ${className}`
		: `group relative flex cursor-pointer items-center place-self-start rounded-md bg-white px-3 py-2 text-sm font-medium text-dark-600 select-none hover:not-disabled:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:not-disabled:bg-zinc-300 disabled:cursor-wait disabled:bg-zinc-200 ${className}`

	const secondaryClasses = fullWidth
		? `group relative flex w-full cursor-pointer items-center rounded-md bg-dark-800 px-3 py-2 text-center text-sm font-medium text-white select-none hover:not-disabled:bg-dark-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:not-disabled:bg-dark-950 disabled:cursor-wait disabled:bg-dark-900 ${className}`
		: `group relative flex cursor-pointer items-center place-self-start rounded-md bg-dark-800 px-3 py-2 text-sm font-medium text-white select-none hover:not-disabled:bg-dark-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:not-disabled:bg-dark-950 disabled:cursor-wait disabled:bg-dark-900 ${className}`

	const classes = secondary ? secondaryClasses : primaryClasses

	return href ? (
		<a
			href={href}
			target="_blank"
			onClick={onClick}
			className={classes}
			aria-disabled={disabled}
		>
			{disabled && (
				<span className="absolute inset-0 m-auto flex h-5 w-5 -translate-y-2 animate-spin rounded-full border-3 border-t-dark-600 border-r-dark-600 border-b-transparent border-l-dark-600 opacity-0 transition group-data-disabled:translate-y-0 group-data-disabled:opacity-100"></span>
			)}
			<span className="flex place-self-center transition group-data-disabled:translate-y-2 group-data-disabled:opacity-0">
				{children}
			</span>
		</a>
	) : (
		<HeadlessButton
			onClick={onClick as MouseEventHandler<HTMLButtonElement>}
			className={classes}
			disabled={disabled}
			type={type}
		>
			{disabled && (
				<span className="absolute inset-0 m-auto flex h-5 w-5 -translate-y-2 animate-spin rounded-full border-3 border-t-dark-600 border-r-dark-600 border-b-transparent border-l-dark-600 opacity-0 transition group-data-disabled:translate-y-0 group-data-disabled:opacity-100"></span>
			)}
			<span className="flex place-self-center transition group-data-disabled:translate-y-2 group-data-disabled:opacity-0">
				{children}
			</span>
		</HeadlessButton>
	)
}

interface IconButtonProps {
	icon: ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>
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
				'cursor-pointer rounded-md bg-dark-100/10 p-2 text-white select-none hover:bg-dark-100/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-dark-100/30',
				className,
			)}
		>
			<Icon aria-hidden size={18} />
			<span className="sr-only">{children}</span>
		</HeadlessButton>
	)
}

import { Button as HeadlessButton } from '@headlessui/react'
import type { Icon, IconProps } from '@tabler/icons-react'
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
	icon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
	secondary?: boolean
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
	onClick?: MouseEventHandler<HTMLButtonElement>
	type?: undefined
}

export const Button = ({
	children,
	onClick,
	fullWidth = false,
	disabled = false,
	type,
	icon: Icon,
	href,
	secondary
}: ControlledButtonProps | UncontrolledButtonProps | AnchorButtonProps) => {
	const primaryClasses = fullWidth
		? "group relative flex w-full cursor-pointer items-center rounded-md bg-white px-3 py-2 text-center text-sm font-medium text-dark-600 select-none hover:not-disabled:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:not-disabled:bg-zinc-300 disabled:cursor-wait disabled:bg-zinc-200"
		: "group relative flex cursor-pointer items-center place-self-start rounded-md bg-white px-3 py-2 text-sm font-medium text-dark-600 select-none hover:not-disabled:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:not-disabled:bg-zinc-300 disabled:cursor-wait disabled:bg-zinc-200"

	const secondaryClasses = fullWidth
		? "group relative flex w-full cursor-pointer items-center rounded-md bg-dark-800 px-3 py-2 text-center text-sm font-medium text-white select-none hover:not-disabled:bg-dark-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:not-disabled:bg-dark-950 disabled:cursor-wait disabled:bg-dark-900"
		: "group relative flex cursor-pointer items-center place-self-start rounded-md bg-dark-800 px-3 py-2 text-sm font-medium text-white select-none hover:not-disabled:bg-dark-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:not-disabled:bg-dark-950 disabled:cursor-wait disabled:bg-dark-900"

	return (
		<HeadlessButton
			as={href ? 'a' : 'button'}
			href={href}
			target={href ? '_blank' : undefined}
			onClick={onClick}
			className={secondary ? secondaryClasses : primaryClasses}
			disabled={disabled}
			type={type}
		>
			{disabled && (
				<span className="absolute inset-0 m-auto flex h-[20px] w-[20px] -translate-y-2 animate-spin rounded-full border-3 border-t-dark-600 border-r-dark-600 border-b-transparent border-l-dark-600 opacity-0 transition group-data-[disabled]:translate-y-0 group-data-[disabled]:opacity-100"></span>
			)}
			{Icon && (
				<Icon
					aria-hidden
					size={18}
					className="mr-1.5 transition group-data-[disabled]:translate-y-2 group-data-[disabled]:opacity-0"
				/>
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
				'cursor-pointer rounded-md bg-dark-100/10 p-2 text-white select-none hover:bg-dark-100/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-dark-100/30',
				className,
			)}
		>
			<Icon aria-hidden size={18} />
			<span className="sr-only">{children}</span>
		</HeadlessButton>
	)
}

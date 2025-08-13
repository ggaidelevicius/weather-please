import type { Icon, IconProps } from '@tabler/icons-react'
import { clsx } from 'clsx'
import type { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react'

interface AlertProps {
	children: ReactNode
	icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
	variant?: 'light-blue' | 'light-red'
}

export const Alert = ({ children, icon: Icon, variant }: AlertProps) => {
	return (
		<div
			className={clsx(
				'flex flex-row items-center justify-center gap-4 p-4 text-white',
				variant === 'light-blue'
					? 'bg-blue-500/75 font-medium select-none'
					: variant === 'light-red'
						? 'bg-red-500/75 font-medium select-none'
						: 'w-full rounded-lg bg-gradient-to-tl from-blue-700 to-blue-500',
			)}
		>
			<Icon size={30} strokeWidth={1.5} aria-hidden />
			<span
				className={
					variant
						? 'max-w-[calc(100%-46px)]'
						: 'max-w-[calc(100%-46px)] text-sm'
				}
			>
				{children}
			</span>
		</div>
	)
}

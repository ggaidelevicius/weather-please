import type { Icon, IconProps } from '@tabler/icons-react'
import type { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react'

interface AlertProps {
	children: ReactNode
	icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
	variant?: 'light-blue' | 'light-red'
}

export const Alert = ({ children, icon: Icon, variant }: AlertProps) => {
	return (
		<div
			className={
				variant === 'light-blue'
					? 'flex flex-row items-center justify-center gap-4 bg-blue-500/75 p-4 font-medium text-white'
					: variant === 'light-red'
						? 'flex flex-row items-center justify-center gap-4 bg-red-500/75 p-4 font-medium text-white'
						: 'flex w-full flex-row items-center gap-4 rounded-lg bg-gradient-to-tl from-blue-700 to-blue-500 p-4 text-white'
			}
		>
			<Icon size={30} strokeWidth={1.5} aria-hidden />
			<span className="max-w-[calc(100%-46px)] text-sm">{children}</span>
		</div>
	)
}

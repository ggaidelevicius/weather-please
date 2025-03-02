import type { Icon, IconProps } from '@tabler/icons-react'
import type { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react'

interface AlertProps {
	children: ReactNode
	icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
	variant?: 'light-blue' | 'light-red'
}

const defaultClasses =
	'flex w-full flex-row items-center gap-4 rounded-lg bg-gradient-to-tl from-blue-700 to-blue-500 p-4 text-white'
const lightBlueClasses =
	'flex w-full flex-row items-center gap-4 w-full justify-center bg-blue-500/75 p-4 text-white font-medium'
const lightRedClasses =
	'flex w-full flex-row items-center gap-4 w-full justify-center bg-red-500/75 p-4 text-white font-medium'

export const Alert = ({ children, icon: Icon, variant }: AlertProps) => {
	return (
		<div
			className={
				variant === 'light-blue'
					? lightBlueClasses
					: variant === 'light-red'
						? lightRedClasses
						: defaultClasses
			}
		>
			<Icon size={30} strokeWidth={1.5} aria-hidden />
			<span className="max-w-[calc(100%-46px)] text-sm">{children}</span>
		</div>
	)
}

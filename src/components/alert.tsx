import type { Icon, IconProps } from '@tabler/icons-react'
import type { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react'

interface AlertProps {
	children: ReactNode
	icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
}

export const Alert = ({ children, icon: Icon }: AlertProps) => {
	return (
		<div className="flex w-full flex-row items-center gap-4 rounded-lg bg-gradient-to-tl from-blue-700 to-blue-500 p-4 text-white">
			<Icon size={30} strokeWidth={1.5} aria-hidden />
			<span className="max-w-[calc(100%-46px)] text-sm">{children}</span>
		</div>
	)
}

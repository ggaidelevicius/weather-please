import type { Icon, IconProps } from '@tabler/icons-react'
import type {
	ComponentPropsWithoutRef,
	ForwardRefExoticComponent,
	RefAttributes,
} from 'react'
import { clsx } from 'clsx'

const typeMap = {
	good: 'bg',
	informational: '',
	warning: '',
}

interface AlertProps {
	icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
}

export const Alert = ({
	children,
	icon: Icon,
	className,
}: ComponentPropsWithoutRef<'div'> & AlertProps) => {
	return (
		<div
			role="alert"
			className={clsx(
				'flex w-full flex-row items-center gap-4 rounded-lg bg-blue-500/20 p-4 text-white',
				className,
			)}
		>
			<Icon size={30} strokeWidth={1.5} aria-hidden />
			<span className="max-w-[calc(100%-46px)] text-sm">{children}</span>
		</div>
	)
}

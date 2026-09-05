import type { ReactNode } from 'react'
import { clsx } from 'clsx'

export const SETTINGS_FIELD_LAYOUT = 'split' as const

export const SettingsSubsection = ({
	bodyClassName = 'space-y-2',
	children,
	description,
	headerAccessory,
	title,
}: Readonly<{
	bodyClassName?: string
	children: ReactNode
	description?: ReactNode
	headerAccessory?: ReactNode
	title: ReactNode
}>) => (
	<div className="space-y-3">
		<div className="flex items-center justify-between gap-3">
			<h3 className="font-semibold text-white">{title}</h3>
			{headerAccessory ? (
				<div className="shrink-0">{headerAccessory}</div>
			) : null}
		</div>
		{description ? (
			<p className="text-sm text-dark-200">{description}</p>
		) : null}
		<div className={clsx(bodyClassName)}>{children}</div>
	</div>
)

export const SettingsSectionLayout = ({
	children,
}: Readonly<{ children: ReactNode }>) => (
	<div className="space-y-8">{children}</div>
)

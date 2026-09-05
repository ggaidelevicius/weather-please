import type {
	CalendarConnection,
	CalendarAccountSummary,
} from '../../../integrations/hooks/use-calendar-connection'
import { CalendarConnectionError } from '../../../integrations/hooks/use-calendar-connection'
import type { SettingsContentProps } from '../settings-types'
import { Trans } from '@lingui/react/macro'
import type { ReactNode } from 'react'
import { CalendarProvider } from '../../../integrations/model/calendar-provider'
import {
	CalendarAccountCategory,
	CALENDAR_ACCOUNT_CATEGORIES,
	CALENDAR_ACCOUNT_CATEGORY_STYLES,
} from '../../../integrations/model/account-category'
import { clsx } from 'clsx'
import { Button } from '../../../../shared/ui/button'
import { Select, Switch } from '../../../../shared/ui/input'
import { Alert } from '../../../../shared/ui/alert'
import {
	IconAlertTriangle,
	IconShieldCheckFilled,
	IconInfoCircle,
} from '@tabler/icons-react'
import { AlertVariant } from '../../../../shared/ui/alert-variant'
import {
	SETTINGS_FIELD_LAYOUT,
	SettingsSectionLayout,
	SettingsSubsection,
} from './section-layout'

export const CALENDAR_CONNECTION_ERROR_MESSAGES = {
	[CalendarConnectionError.AuthFailed]: (
		<Trans>
			We couldn&apos;t connect your calendar account. Please try again.
		</Trans>
	),
	[CalendarConnectionError.EventsFailed]: (
		<Trans>
			Some calendar events couldn&apos;t be loaded. Please try again in a
			moment.
		</Trans>
	),
} as const satisfies Record<CalendarConnectionError, ReactNode>

// Brand names are intentionally untranslated.
export const CALENDAR_PROVIDER_LABELS = {
	[CalendarProvider.Google]: 'Google Calendar',
	[CalendarProvider.Microsoft]: 'Microsoft Outlook',
} as const satisfies Record<CalendarProvider, string>

export const CALENDAR_ACCOUNT_CATEGORY_LABELS = {
	[CalendarAccountCategory.Family]: <Trans>Family</Trans>,
	[CalendarAccountCategory.Finance]: <Trans>Finance</Trans>,
	[CalendarAccountCategory.Freelance]: <Trans>Freelance</Trans>,
	[CalendarAccountCategory.Personal]: <Trans>Personal</Trans>,
	[CalendarAccountCategory.School]: <Trans>School</Trans>,
	[CalendarAccountCategory.Work]: <Trans>Work</Trans>,
} as const satisfies Record<CalendarAccountCategory, ReactNode>

export const getCalendarAccountCategoryOptions = () =>
	CALENDAR_ACCOUNT_CATEGORIES.map((category) => ({
		label: CALENDAR_ACCOUNT_CATEGORY_LABELS[category],
		value: category,
	}))

export const getVisibleCalendarProviders = ({
	accounts,
	configuredProviders,
}: Pick<CalendarConnection, 'accounts' | 'configuredProviders'>) => [
	...new Set([
		...configuredProviders,
		...accounts.map((account) => account.provider),
	]),
]

export const CalendarAccountRow = ({
	account,
	calendarConnection,
}: Readonly<{
	account: CalendarAccountSummary
	calendarConnection: CalendarConnection
}>) => (
	<article
		aria-labelledby={`calendar-account-${account.accountId}`}
		className="border-t border-white/6 px-4 py-3.5 first:border-t-0"
	>
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2.5">
					<span
						aria-hidden
						className={clsx(
							'size-2 shrink-0 rounded-full',
							CALENDAR_ACCOUNT_CATEGORY_STYLES[account.category].dotClassName,
						)}
					/>
					<p
						className="truncate text-sm text-white"
						id={`calendar-account-${account.accountId}`}
					>
						{account.accountLabel ?? <Trans>Connected account</Trans>}
					</p>
				</div>
				<Button
					className="shrink-0 justify-center"
					onClick={() => calendarConnection.disconnect(account.accountId)}
					secondary
				>
					<Trans>Disconnect</Trans>
				</Button>
			</div>
			<div>
				<Select
					label={<Trans>Category</Trans>}
					layout={SETTINGS_FIELD_LAYOUT}
					onChange={(e) => {
						calendarConnection.setAccountCategory(
							account.accountId,
							e.target.value as CalendarAccountCategory,
						)
					}}
					options={getCalendarAccountCategoryOptions()}
					value={account.category}
				/>
			</div>
		</div>
		{account.isSessionExpired ? (
			<div className="mt-3">
				<Alert icon={IconAlertTriangle} variant={AlertVariant.InfoRed}>
					<div className="flex items-center justify-between gap-3">
						<span>
							<Trans>
								This account&apos;s sign-in expired. Please reconnect it.
							</Trans>
						</span>
						<Button
							className="ml-auto"
							disabled={calendarConnection.isConnecting}
							onClick={() => {
								void calendarConnection.connect(account.provider)
							}}
						>
							<Trans>Reconnect</Trans>
						</Button>
					</div>
				</Alert>
			</div>
		) : null}
	</article>
)

export const CalendarProviderSection = ({
	accounts,
	calendarConnection,
	provider,
}: Readonly<{
	accounts: CalendarAccountSummary[]
	calendarConnection: CalendarConnection
	provider: CalendarProvider
}>) => {
	const isConfigured = calendarConnection.configuredProviders.includes(provider)

	return (
		<section
			aria-label={CALENDAR_PROVIDER_LABELS[provider]}
			className="overflow-hidden rounded-xl bg-dark-900/30 ring-1 ring-white/6"
		>
			<div className="flex items-center justify-between gap-3 bg-white/[0.015] px-4 py-3">
				<h4 className="text-sm font-medium text-white">
					{CALENDAR_PROVIDER_LABELS[provider]}
				</h4>
				{isConfigured ? (
					<Button
						disabled={calendarConnection.isConnecting}
						onClick={() => {
							void calendarConnection.connect(provider)
						}}
						secondary={accounts.length > 0}
					>
						{accounts.length > 0 ? (
							<Trans>Add account</Trans>
						) : (
							<Trans>Connect</Trans>
						)}
					</Button>
				) : null}
			</div>
			{accounts.map((account) => (
				<CalendarAccountRow
					account={account}
					calendarConnection={calendarConnection}
					key={account.accountId}
				/>
			))}
		</section>
	)
}

export const IntegrationsSettingsSection = ({
	calendarConnection,
	handleChange,
	input,
}: Pick<
	SettingsContentProps,
	'calendarConnection' | 'handleChange' | 'input'
>) => {
	const providers = getVisibleCalendarProviders(calendarConnection)

	return (
		<SettingsSectionLayout>
			<SettingsSubsection
				bodyClassName="space-y-4"
				description={
					<Trans>
						See upcoming calendar events alongside your forecast. Weather Please
						connects directly to your calendar provider, and your events never
						pass through our servers.
					</Trans>
				}
				headerAccessory={
					<span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-blue-600 to-blue-500 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white shadow-sm">
						<IconShieldCheckFilled aria-hidden size={14} />
						<Trans>Securely stored</Trans>
					</span>
				}
				title={<Trans>Calendar</Trans>}
			>
				{providers.length === 0 ? (
					<Alert icon={IconInfoCircle} variant={AlertVariant.LightBlue}>
						<Trans>
							Calendar connections aren&apos;t available in this build.
						</Trans>
					</Alert>
				) : (
					<>
						<div className="space-y-3">
							{providers.map((provider) => (
								<CalendarProviderSection
									accounts={calendarConnection.accounts.filter(
										(account) => account.provider === provider,
									)}
									calendarConnection={calendarConnection}
									key={provider}
									provider={provider}
								/>
							))}
						</div>
						{calendarConnection.accounts.length > 0 ? (
							<div className="border-t border-white/6 pt-4">
								<Switch
									checked={input.showCalendarEvents}
									label={<Trans>Show calendar events</Trans>}
									layout={SETTINGS_FIELD_LAYOUT}
									onChange={(checked) =>
										handleChange('showCalendarEvents', checked)
									}
								/>
							</div>
						) : null}
					</>
				)}
				{calendarConnection.error ? (
					<Alert icon={IconAlertTriangle} variant={AlertVariant.InfoRed}>
						{CALENDAR_CONNECTION_ERROR_MESSAGES[calendarConnection.error]}
					</Alert>
				) : null}
			</SettingsSubsection>
		</SettingsSectionLayout>
	)
}

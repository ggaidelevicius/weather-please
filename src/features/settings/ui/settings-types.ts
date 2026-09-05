import type { SeasonalEventId } from '../../seasonal-events/core/types'
import type { ReactNode } from 'react'
import type { CalendarConnection } from '../../integrations/hooks/use-calendar-connection'
import type { LocaleKey } from '../../../shared/lib/i18n'
import type { Config } from '../model/config'

export type BooleanConfigKey = {
	[K in keyof Config]: Config[K] extends boolean ? K : never
}[keyof Config]

export type SeasonalEventSection = {
	eventIds: SeasonalEventId[]
	id: string
	title: ReactNode
}

export type SettingsContentProps = {
	calendarConnection: CalendarConnection
	handleChange: (k: keyof Config, v: Config[keyof Config]) => void
	hasSoftwareRenderer: boolean
	input: Config
	localeKeys: LocaleKey[]
	platformReviewLink: string
}

export type SettingsSectionDefinition = {
	icon: ReactNode
	id: SettingsSectionId
	title: ReactNode
}

export type SettingsSectionId =
	'about' | 'developer' | 'general' | 'integrations' | 'seasonal' | 'weather'

export type SwitchDefinition<K extends BooleanConfigKey = BooleanConfigKey> = {
	key: K
	label: ReactNode
}

export type IntegrationsPromo = {
	onIntegrationsViewed: () => void
	onSettingsOpened: () => void
	shouldHighlightIntegrations: boolean
}

export interface SettingsProps {
	calendarConnection: CalendarConnection
	handleChange: (k: keyof Config, v: Config[keyof Config]) => void
	input: Config
	integrationsPromo: IntegrationsPromo
}

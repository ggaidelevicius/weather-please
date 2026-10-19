'use client'

import type { ReactNode } from 'react'

import { setupI18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { useState } from 'react'

import { messages } from '../../../locales/en/messages'

export const LandingI18nProvider = ({
	children,
}: Readonly<{ children: ReactNode }>) => {
	// Activate English before rendering without changing the dashboard's locale.
	const [i18n] = useState(() =>
		setupI18n({ locale: 'en', messages: { en: messages } }),
	)

	return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}

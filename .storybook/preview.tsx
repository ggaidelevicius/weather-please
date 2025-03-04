import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import type { Preview } from '@storybook/react'
import React from 'react'
import { messages } from '../src/locales/en/messages'
import '../src/styles/tailwind.css'

i18n.load({
	en: messages,
})
i18n.activate('en')

const preview: Preview = {
	parameters: {
		backgrounds: {
			default: 'dark-800',
			values: [
				{
					name: 'dark-800',
					value: '#1a1b1e',
				},
			],
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
	decorators: [
		(Story) => (
			<I18nProvider i18n={i18n}>
				<Story />
			</I18nProvider>
		),
	],
}

export default preview

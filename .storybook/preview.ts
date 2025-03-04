import type { Preview } from '@storybook/react'
import '../src/styles/tailwind.css'

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
}

export default preview

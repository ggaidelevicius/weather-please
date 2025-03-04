import type { Meta, StoryObj } from '@storybook/react'

import { Initialisation } from '.'
import { fn } from '@storybook/test'

const meta = {
	title: 'Initialisation',
	component: Initialisation,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Initialisation>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		setInput: fn(),
		handleChange: fn(),
		input: {
			lang: 'en',
			lat: '',
			lon: '',
			periodicLocationUpdate: false,
			useMetric: true,
			showAlerts: true,
			showUvAlerts: true,
			showWindAlerts: true,
			showVisibilityAlerts: true,
			showPrecipitationAlerts: true,
			daysToRetrieve: '3',
			identifier: 'day',
			installed: new Date().getTime(),
			displayedReviewPrompt: false,
		},
		pending: true,
	},
}

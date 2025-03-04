import type { Meta, StoryObj } from '@storybook/react'

import { Settings } from '.'
import { fn } from '@storybook/test'

const meta = {
	title: 'Settings',
	component: Settings,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Settings>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		handleChange: fn(),
		input: {
			lang: 'en',
			lat: '1',
			lon: '2',
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
	},
}

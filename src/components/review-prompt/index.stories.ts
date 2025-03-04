import type { Meta, StoryObj } from '@storybook/react'

import { ReviewPrompt } from '.'
import { fn } from '@storybook/test'

const meta = {
	title: 'Review prompt',
	component: ReviewPrompt,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof ReviewPrompt>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		setInput: fn(),
		config: {
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
			installed: 1,
			displayedReviewPrompt: false,
		},
	},
}

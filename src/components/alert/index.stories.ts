import type { Meta, StoryObj } from '@storybook/react'

import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import { Alert } from '.'

const meta = {
	title: 'Alert',
	component: Alert,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		icon: {
			control: false,
		},
		variant: {
			control: false,
		},
	},
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		children:
			'Your location data is securely stored exclusively on your personal device.',
		icon: IconInfoCircle,
	},
}

export const LightBlue: Story = {
	args: {
		children: '22.0mm of precipitation expected over the next hour',
		icon: IconInfoCircle,
		variant: 'light-blue',
	},
	parameters: {
		layout: 'fullscreen',
	},
}

export const LightRed: Story = {
	args: {
		children: 'Extreme UV starting in 4 hours',
		icon: IconAlertTriangle,
		variant: 'light-red',
	},
	parameters: {
		layout: 'fullscreen',
	},
}

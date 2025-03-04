import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Button } from '.'

const meta = {
	title: 'Button',
	component: Button,

	parameters: {
		layout: 'centered',
	},
	args: { onClick: fn() },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		children: 'Button',
		fullWidth: false,
		disabled: false,
		secondary: false,
		onClick: fn(),
	},
}

export const Secondary: Story = {
	args: {
		children: 'Button',
		fullWidth: false,
		disabled: false,
		secondary: true,
		onClick: fn(),
	},
	argTypes: {
		fullWidth: {
			control: false,
		},
		disabled: {
			control: false,
		},
		secondary: {
			control: false,
		},
	},
	parameters: {
		backgrounds: {
			default: 'dark-700',
			values: [
				{
					name: 'dark-700',
					value: '#25262b',
				},
			],
		},
	},
}

export const Disabled: Story = {
	args: {
		children: 'Button',
		fullWidth: false,
		disabled: true,
		secondary: false,
		onClick: fn(),
	},
	argTypes: {
		secondary: {
			control: false,
		},
	},
}

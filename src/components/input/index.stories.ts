import type { Meta, StoryObj } from '@storybook/react'

import { Input } from '.'
import { fn } from '@storybook/test'

const meta = {
	title: 'Input',
	component: Input,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		label: 'Latitude',
		value: '123.456789',
		onChange: fn(),
		validation: true,
		required: true,
	}
}

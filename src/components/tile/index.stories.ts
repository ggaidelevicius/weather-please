import type { Meta, StoryObj } from '@storybook/react'

import { Tile } from '.'

const meta = {
	title: 'Tile',
	component: Tile,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		description: {
			control: 'select',
			options: [
				0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75,
				77, 80, 81, 82, 85, 86, 95, 96, 99,
			],
		},
	},
} satisfies Meta<typeof Tile>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		day: 1500000000,
		max: 25.6,
		min: 10.3,
		description: 61,
		wind: 24.2,
		rain: 89.4,
		uv: 3,
		useMetric: true,
		identifier: 'day',
		index: 0,
		delayBaseline: 0,
	},
}

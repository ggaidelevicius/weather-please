import type { Meta, StoryObj } from '@storybook/react'

import { Tile } from '.'

const meta = {
	title: 'Tile',
	component: Tile,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
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

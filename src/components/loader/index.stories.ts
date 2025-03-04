import type { Meta, StoryObj } from '@storybook/react'

import { Loader } from '.'

const meta = {
	title: 'Loader',
	component: Loader,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Loader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

import type { ReactNode } from 'react'

import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

import { submitForm } from '../actions'
import Page from '../bug/page'

vi.mock('../actions', () => ({ submitForm: vi.fn() }))
vi.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams({ locale: 'en-US' }),
}))
vi.mock('@lingui/react/macro', () => ({
	Trans: ({ children }: { children: ReactNode }) => children,
}))

it('preserves a failed report, submits the fallback locale, and accepts a corrected retry', async () => {
	const submit = vi.mocked(submitForm)
	submit
		.mockResolvedValueOnce({ message: 'Please try again.', status: 'error' })
		.mockResolvedValueOnce({ message: 'Message received', status: 'success' })

	render(<Page />)
	const email = await screen.findByLabelText('Your email (optional)')
	const message = screen.getByLabelText('Your message')
	fireEvent.change(email, { target: { value: 'reporter@example.com' } })
	fireEvent.change(message, { target: { value: 'First draft' } })
	fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

	expect(await screen.findByRole('alert')).toHaveTextContent(
		'Please try again.',
	)
	expect(email).toHaveValue('reporter@example.com')
	expect(message).toHaveValue('First draft')
	expect(submit.mock.calls[0][1].get('locale')).toBe('en')

	fireEvent.change(message, { target: { value: 'Corrected report' } })
	fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

	expect(
		await screen.findByRole('heading', { name: 'Message received' }),
	).toBeVisible()
	expect(screen.queryByLabelText('Your message')).toBeNull()
	const retry = submit.mock.calls[1][1]
	expect(retry.get('message')).toBe('Corrected report')
	expect(retry.get('email')).toBe('reporter@example.com')
})

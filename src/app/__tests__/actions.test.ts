import { headers } from 'next/headers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../lib/prisma'
import { enforceRateLimit } from '../../lib/rate-limit'
import { submitForm } from '../actions'

vi.mock('next/headers', () => ({
	headers: vi.fn(),
}))

vi.mock('../../lib/rate-limit', () => ({
	enforceRateLimit: vi.fn(),
}))

vi.mock('../../lib/prisma', () => ({
	prisma: {
		formSubmission: {
			create: vi.fn(),
		},
	},
}))

const createFormData = ({
	email,
	honeypotValue = '',
	locale = 'en',
	message = 'Hello there',
}: {
	email?: string
	honeypotValue?: string
	locale?: string
	message?: string
} = {}) => {
	const formData = new FormData()
	formData.set('message', message)
	formData.set('locale', locale)
	formData.set('validation', 'honeypot')
	formData.set('honeypot', honeypotValue)
	if (email !== undefined) {
		formData.set('email', email)
	}
	return formData
}

describe('submitForm', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(headers).mockResolvedValue(
			new Headers([
				['user-agent', 'vitest'],
				['referer', 'https://weather-please.app/bug'],
				['x-forwarded-for', '127.0.0.1'],
			]),
		)
		vi.mocked(enforceRateLimit).mockResolvedValue({ ok: true })
		vi.mocked(prisma.formSubmission.create).mockResolvedValue({
			createdAt: new Date(),
			email: null,
			id: 1,
			ipSubmittedFrom: '127.0.0.1',
			locale: 'en',
			message: 'Hello there',
			referrerUrl: 'https://weather-please.app/bug',
			userAgent: 'vitest',
		})
	})

	it('blocks when rate limited', async () => {
		vi.mocked(enforceRateLimit).mockResolvedValue({
			ok: false,
			retryAfter: 42,
		})

		const result = await submitForm({ message: '' }, createFormData())

		expect(result.message).toContain('42')
		expect(prisma.formSubmission.create).not.toHaveBeenCalled()
	})

	it('rejects honeypot submissions', async () => {
		const result = await submitForm(
			{ message: '' },
			createFormData({ honeypotValue: 'bot' }),
		)

		expect(result.message).toBe('Message received')
		expect(prisma.formSubmission.create).not.toHaveBeenCalled()
	})

	it('rejects invalid payloads', async () => {
		const result = await submitForm(
			{ message: '' },
			createFormData({ message: '' }),
		)

		expect(result.message.toLowerCase()).toContain('message')
		expect(prisma.formSubmission.create).not.toHaveBeenCalled()
	})

	it('accepts valid submissions', async () => {
		const result = await submitForm({ message: '' }, createFormData())

		expect(result.message).toBe('Message received')
		expect(prisma.formSubmission.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					locale: 'en',
					message: 'Hello there',
					userAgent: 'vitest',
				}),
			}),
		)
	})
})

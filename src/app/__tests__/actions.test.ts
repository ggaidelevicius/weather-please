import { headers } from 'next/headers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { submitForm } from '../actions'
import { enforceRateLimit } from '../../lib/rate-limit'
import { prisma } from '../../lib/prisma'

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
	message = 'Hello there',
	locale = 'en',
	honeypotValue = '',
}: {
	email?: string
	message?: string
	locale?: string
	honeypotValue?: string
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
			id: 1,
			email: null,
			message: 'Hello there',
			locale: 'en',
			createdAt: new Date(),
			userAgent: 'vitest',
			referrerUrl: 'https://weather-please.app/bug',
			ipSubmittedFrom: '127.0.0.1',
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
					message: 'Hello there',
					locale: 'en',
					userAgent: 'vitest',
				}),
			}),
		)
	})
})

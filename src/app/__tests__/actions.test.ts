import { headers } from 'next/headers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../server/prisma'
import { enforceRateLimit } from '../../server/rate-limit'
import { type BugReportState, submitForm } from '../actions'

const initialState: BugReportState = { status: 'idle' }

vi.mock('next/headers', () => ({
	headers: vi.fn(),
}))

vi.mock(import('../../server/rate-limit'), async (importOriginal) => {
	const actual = await importOriginal()
	return {
		...actual,
		enforceRateLimit: vi.fn(),
	}
})

vi.mock('../../server/prisma', () => ({
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

		const result = await submitForm(initialState, createFormData())

		expect(result).toEqual({
			message: expect.stringContaining('42'),
			status: 'error',
		})
		expect(prisma.formSubmission.create).not.toHaveBeenCalled()
	})

	it('rejects honeypot submissions', async () => {
		const result = await submitForm(
			initialState,
			createFormData({ honeypotValue: 'bot' }),
		)

		expect(result).toEqual({ message: 'Message received', status: 'success' })
		expect(prisma.formSubmission.create).not.toHaveBeenCalled()
	})

	it('rejects invalid payloads', async () => {
		const result = await submitForm(
			initialState,
			createFormData({ message: '' }),
		)

		expect(result).toEqual({
			message: expect.stringContaining('message'),
			status: 'error',
		})
		expect(prisma.formSubmission.create).not.toHaveBeenCalled()
	})

	it('accepts valid submissions', async () => {
		const result = await submitForm(initialState, createFormData())

		expect(result).toEqual({ message: 'Message received', status: 'success' })
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

	it('reports storage failures as retryable errors', async () => {
		using _log = vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.mocked(prisma.formSubmission.create).mockRejectedValueOnce(
			new Error('Database unavailable'),
		)

		const result = await submitForm(initialState, createFormData())

		expect(result).toEqual({
			message: expect.stringContaining('try again'),
			status: 'error',
		})
	})
})

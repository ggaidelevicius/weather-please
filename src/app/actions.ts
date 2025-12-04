'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { rateLimit } from '../lib/rate-limit'

const formSchema = z.object({
	email: z.email().optional(),
	message: z.string().nonempty(),
	locale: z.enum([
		'bn',
		'de',
		'en',
		'es',
		'fr',
		'hi',
		'id',
		'it',
		'ja',
		'ko',
		'lt',
		'ru',
		'vi',
		'zh',
	]),
})

export const submitForm = async (
	_prevState: { message: string },
	formData: FormData,
) => {
	const requestHeaders = await headers()
	const ip = requestHeaders.get('x-forwarded-for') ?? 'unknown'
	const userAgent = requestHeaders.get('user-agent') ?? 'unknown'
	const referrerUrl = requestHeaders.get('referer') ?? 'unknown'

	const isRateLimited = rateLimit(ip)
	if (isRateLimited) {
		return { message: "You're doing that too quickly" }
	}

	// Retrieve the honeypot field name from the hidden field
	const honeypotValidation = formData.get('validation')
	if (typeof honeypotValidation !== 'string') {
		return { message: 'Form error' }
	}

	// Check the honeypot field (which should be empty if submitted by a human)
	const honeypotValue = formData.get(honeypotValidation)
	if (honeypotValue) {
		// A value here suggests the form was filled by a bot
		return { message: 'Message received' }
	}

	const rawFormData = {
		email: formData.get('email') || undefined,
		message: formData.get('message'),
		locale: formData.get('locale'),
	}

	const result = formSchema.safeParse({
		email: rawFormData.email,
		message: rawFormData.message,
		locale: rawFormData.locale,
	})

	if (!result.success) {
		const errors = Object.entries(result.error.format())
			.filter(([key]) => key !== '_errors') // Exclude generic errors
			.map(([field, details]) => {
				const messages = Array.isArray(details) ? details : details?._errors
				return messages ? `${field}: ${messages.join(', ')}` : null
			})
			.filter(Boolean) // Remove null values
			.join('; ')

		return { message: errors || 'Validation failed' }
	}

	await prisma.formSubmission.create({
		data: {
			email: result.data.email,
			message: result.data.message,
			locale: result.data.locale,
			userAgent: userAgent,
			referrerUrl: referrerUrl,
			ipSubmittedFrom: ip,
		},
	})

	return { message: 'Message received' }
}

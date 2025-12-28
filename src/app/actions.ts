'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { locales } from '../lib/i18n'
import { enforceRateLimit } from '../lib/rate-limit'
import { prisma } from '../lib/prisma'

const localeKeys = Object.keys(locales) as [
	keyof typeof locales,
	...(keyof typeof locales)[],
]

const formSchema = z.object({
	email: z.string().email().optional(),
	message: z.string().nonempty(),
	locale: z.enum(localeKeys),
})

export const submitForm = async (
	_prevState: { message: string },
	formData: FormData,
) => {
	let requestHeaders: Headers
	try {
		requestHeaders = await headers()
	} catch (error) {
		console.error('Unable to read request headers:', error)
		return {
			message:
				'Unable to submit your message at this time. Please try again later.',
		}
	}
	const userAgent = requestHeaders.get('user-agent') ?? 'unknown'
	const referrerUrl = requestHeaders.get('referer') ?? 'unknown'

	// Check rate limit with proper IP parsing
	let rateLimitResult
	try {
		rateLimitResult = await enforceRateLimit({
			scope: 'server-action',
			headers: requestHeaders,
		})
	} catch (error) {
		console.error('Rate limit check failed:', error)
		return {
			message:
				'Unable to submit your message at this time. Please try again later.',
		}
	}

	if (!rateLimitResult.ok) {
		return {
			message: `You're doing that too quickly. Please try again in ${rateLimitResult.retryAfter} seconds.`,
		}
	}

	// Get IP for logging (after rate limit check)
	const forwardedFor = requestHeaders.get('x-forwarded-for')
	const ip = forwardedFor ? forwardedFor.split(',')[0]?.trim() : 'unknown'

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

	try {
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
	} catch (error) {
		console.error('Form submission failed:', error)
		return {
			message:
				'Unable to submit your message at this time. Please try again later.',
		}
	}
}

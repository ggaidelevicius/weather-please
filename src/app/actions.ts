'use server'

import { headers } from 'next/headers'
import { z } from 'zod'

import { prisma } from '../lib/prisma'
import { enforceRateLimit } from '../lib/rate-limit'
import { locales } from '../shared/lib/i18n'

const localeKeys = Object.keys(locales) as [
	keyof typeof locales,
	...(keyof typeof locales)[],
]

const formSchema = z.object({
	email: z.string().email().optional(),
	locale: z.enum(localeKeys),
	message: z.string().nonempty(),
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
			headers: requestHeaders,
			scope: 'server-action',
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
		locale: formData.get('locale'),
		message: formData.get('message'),
	}

	const result = formSchema.safeParse({
		email: rawFormData.email,
		locale: rawFormData.locale,
		message: rawFormData.message,
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
				ipSubmittedFrom: ip,
				locale: result.data.locale,
				message: result.data.message,
				referrerUrl: referrerUrl,
				userAgent: userAgent,
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

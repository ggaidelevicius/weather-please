import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const payloadSchema = z.object({
	feedbackType: z.enum(['feedback', 'feature', 'bug', 'uninstall']),
	message: z.string(),
	email: z.union([z.string().email(), z.string()]),
	created: z.number().int(),
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
	installed: z.union([z.number().int(), z.string()]),
	reasons: z.object({
		slowsDownBrowser: z.boolean(),
		causesCrashes: z.boolean(),
		missingLanguage: z.boolean(),
		difficultToUse: z.boolean(),
		lacksFeatures: z.boolean(),
		featuresDontWork: z.boolean(),
		privacyConcerns: z.boolean(),
		securityConcerns: z.boolean(),
		noLongerNeed: z.boolean(),
		foundBetterAlternative: z.boolean(),
		consumesTooMuchProcessingPower: z.boolean(),
		consumesTooMuchBattery: z.boolean(),
		issuesAfterRecentUpdate: z.boolean(),
	}),
})

type Payload = z.infer<typeof payloadSchema>

export const POST = async (request: Request) => {
	let payload = null

	try {
		const json = await request.json()
		const parseResult = payloadSchema.safeParse(json)
		if (!parseResult.success) {
			// eslint-disable-next-line no-console
			console.error(parseResult.error)
			Sentry.captureException(parseResult.error, { extra: { payload: json } })
			return Response.json({ message: 'Bad Request' }, { status: 400 })
		}
		payload = parseResult.data
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error(e)
		Sentry.captureException(e)
		return Response.json({ message: 'Bad Request' }, { status: 400 })
	}

	const {
		feedbackType,
		message,
		email,
		created,
		locale,
		installed,
		reasons,
	}: Payload = payload

	const data = {
		fields: {
			message: {
				stringValue: message,
			},
			email: {
				stringValue: email,
			},
			locale: {
				stringValue: locale,
			},
			created: {
				integerValue: created,
			},
			installed: {
				integerValue: installed,
			},
			reasons: {
				stringValue: JSON.stringify(reasons),
			},
		},
	}

	try {
		const firestoreResponse = await fetch(
			`https://firestore.googleapis.com/v1/projects/${process.env.FIRESTORE_PROJECT_ID}/databases/(default)/documents/${feedbackType}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			},
		)

		if (!firestoreResponse.ok) {
			const errorText = await firestoreResponse.text()
			// eslint-disable-next-line no-console
			console.error(errorText)
			Sentry.captureException(new Error('Firestore Error'), {
				extra: { error: errorText },
			})
			return Response.json(
				{
					message: 'Firestore Error',
				},
				{
					status: 500,
				},
			)
		}

		return Response.json({ message: 'OK' }, { status: 200 })
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error(e)
		Sentry.captureException(e)
		return Response.json({ message: 'Internal Server Error' }, { status: 500 })
	}
}

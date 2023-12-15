import * as Sentry from '@sentry/nextjs'

export const POST = async (request: Request) => {
	let payload = null

	try {
		payload = await request.json()
	} catch (e) {
		Sentry.captureException(e)
		return new Response('Bad Request', { status: 400 })
	}

	const { feedbackType, message, email, created, locale, installed, reasons } =
		payload

	if (
		payload === null ||
		payload === undefined ||
		typeof payload !== 'object' ||
		!feedbackType ||
		typeof feedbackType !== 'string' ||
		((!message || typeof message !== 'string') &&
			feedbackType !== 'uninstall') ||
		!created ||
		typeof created !== 'number' ||
		!locale ||
		typeof locale !== 'string'
	) {
		return new Response('Invalid parameters', { status: 400 })
	}

	const data = {
		fields: {
			message: {
				stringValue: message,
			},
			email: {
				stringValue: email ? email : '',
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

		const firestoreData = await firestoreResponse.json()

		if (firestoreData.error) {
			return new Response(firestoreData?.error?.status ?? 'Firestore error', {
				status: 400,
			})
		}

		return new Response('OK', { status: 200 })
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error(e)
		Sentry.captureException(e)
		return new Response('Internal Server Error', { status: 500 })
	}
}

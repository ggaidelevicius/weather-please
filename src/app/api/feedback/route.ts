import * as Sentry from '@sentry/nextjs'

export const POST = async (request: Request) => {
	let payload = null

	try {
		payload = await request.json()
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error(e)
		Sentry.captureException(e)
		return Response.json({ message: 'Bad Request', status: 400 })
	}

	const { feedbackType, message, email, created, locale, installed, reasons } =
		payload

	if (
		payload === null ||
		payload === undefined ||
		typeof payload !== 'object' ||
		!feedbackType ||
		typeof feedbackType !== 'string' ||
		!message ||
		typeof message !== 'string' ||
		!created ||
		typeof created !== 'number' ||
		!locale ||
		typeof locale !== 'string'
	) {
		return Response.json({ message: 'Invalid parameters', status: 400 })
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
		const firestoreData = await fetch(
			`https://firestore.googleapis.com/v1/projects/${process.env.FIRESTORE_PROJECT_ID}/databases/(default)/documents/${feedbackType}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			},
		).then((res) => res.json())

		if (firestoreData.error) {
			// eslint-disable-next-line no-console
			console.error(firestoreData.error)
			Sentry.captureException(firestoreData.error)
			return Response.json({
				message: firestoreData.error?.status ?? 'Firestore error',
				status: 400,
			})
		}

		return Response.json({ message: 'OK', status: 200 })
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error(e)
		Sentry.captureException(e)
		return Response.json({ message: 'Internal Server Error', status: 500 })
	}
}

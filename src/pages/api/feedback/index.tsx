import { NextApiHandler } from 'next'

const Handler: NextApiHandler = async (req, res) => {
	if (req.method !== 'POST' || !req.body) {
		return res.status(400).json({ code: 400, message: 'Bad request' })
	}

	let parsedBody
	try {
		parsedBody = JSON.parse(req.body)
	} catch (e) {
		return res.status(400).json({ code: 400, message: 'Invalid JSON' })
	}

	const { feedbackType, message, email, created, locale, installed, reasons } =
		parsedBody

	if (!feedbackType || !message || !created || !locale) {
		return res.status(400).json({ code: 400, message: 'Missing parameters' })
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
				mapValue: JSON.stringify(reasons),
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
			return res
				.status(400)
				.json({ code: 400, message: firestoreData.error.status })
		}

		return res.status(200).json({ code: 200, message: 'Success' })
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error)
		return res.status(500).json({ code: 500, message: 'Internal Server Error' })
	}
}

export default Handler

import * as Sentry from '@sentry/nextjs'

export const register = async () => {
	if (process.env.NEXT_RUNTIME === 'edge') {
		await import('./sentry.edge.config')
	}

	if (process.env.NEXT_RUNTIME === 'nodejs') {
		await import('./sentry.server.config')
	}
}

export const onRequestError = Sentry.captureRequestError

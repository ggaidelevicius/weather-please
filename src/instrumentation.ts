export const register = async (): Promise<void> => {
	if (
		process.env.NEXT_RUNTIME !== 'nodejs' ||
		typeof globalThis.Temporal !== 'undefined'
	) {
		return
	}

	// Some hosted Node.js 26 runtimes omit Temporal despite supporting it at build time.
	const { Temporal } = await import('@js-temporal/polyfill')
	Object.defineProperty(globalThis, 'Temporal', {
		configurable: true,
		value: Temporal,
		writable: true,
	})
}

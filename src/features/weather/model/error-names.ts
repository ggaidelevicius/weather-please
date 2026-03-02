export enum ErrorName {
	AbortError = 'AbortError',
}

export const isAbortError = (error: unknown) =>
	typeof error === 'object' &&
	error !== null &&
	'name' in error &&
	error.name === ErrorName.AbortError

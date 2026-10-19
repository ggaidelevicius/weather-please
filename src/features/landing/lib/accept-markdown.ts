import { z } from 'zod'

// True when the request prefers Markdown at least as much as HTML.
export const acceptsMarkdown = ({
	accept,
}: Readonly<{ accept: null | string }>): boolean => {
	const parsedAccept = z.string().max(8192).safeParse(accept)
	if (!parsedAccept.success) return false

	const ranges = parsedAccept.data.split(',').map((range) => {
		const [type, ...parameters] = range.trim().toLowerCase().split(';')
		const qualityParameters = parameters
			.map((parameter) => parameter.trim())
			.filter((parameter) => /^q\s*=/.test(parameter))
		const qualityValue = qualityParameters[0]?.split('=')[1]?.trim()
		const quality =
			qualityParameters.length === 0
				? 1
				: qualityParameters.length === 1 &&
					  /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(qualityValue ?? '')
					? Number(qualityValue)
					: 0
		return { quality, type: type.trim() }
	})

	const getQuality = (mediaType: string): number => {
		for (const matchingType of [
			mediaType,
			`${mediaType.split('/')[0]}/*`,
			'*/*',
		]) {
			const matches = ranges.filter(({ type }) => type === matchingType)
			if (matches.length > 0) {
				return Math.max(...matches.map(({ quality }) => quality))
			}
		}
		return 0
	}

	const markdownQuality = Math.max(
		0,
		...ranges
			.filter(({ type }) => type === 'text/markdown')
			.map(({ quality }) => quality),
	)
	const htmlQuality = getQuality('text/html')
	return markdownQuality > 0 && markdownQuality >= htmlQuality
}

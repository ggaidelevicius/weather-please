export const getTemperatureAccentColor = (temperature: number) => {
	const lowerStop = TEMPERATURE_COLOUR_STOPS.findLast(
		(stop) => temperature >= stop.temperature,
	)
	const upperStop = TEMPERATURE_COLOUR_STOPS.find(
		(stop) => temperature <= stop.temperature,
	)

	if (!lowerStop) {
		return oklchToRgbCss(TEMPERATURE_COLOUR_STOPS[0].colour)
	}

	if (!upperStop) {
		return oklchToRgbCss(
			TEMPERATURE_COLOUR_STOPS.at(-1)?.colour ?? lowerStop.colour,
		)
	}

	if (lowerStop.temperature === upperStop.temperature) {
		return oklchToRgbCss(lowerStop.colour)
	}

	return oklchToRgbCss(
		mixOklch({
			from: lowerStop.colour,
			progress: normalizeRange({
				max: upperStop.temperature,
				min: lowerStop.temperature,
				value: temperature,
			}),
			to: upperStop.colour,
		}),
	)
}

const TEMPERATURE_COLOUR_STOPS = [
	{ colour: { chroma: 0.23, hue: 258, lightness: 0.57 }, temperature: -25 },
	{ colour: { chroma: 0.18, hue: 235, lightness: 0.72 }, temperature: 0 },
	{ colour: { chroma: 0.16, hue: 170, lightness: 0.79 }, temperature: 10 },
	{ colour: { chroma: 0.16, hue: 170, lightness: 0.79 }, temperature: 24 },
	{ colour: { chroma: 0.17, hue: 95, lightness: 0.89 }, temperature: 28 },
	{ colour: { chroma: 0.2, hue: 68, lightness: 0.83 }, temperature: 32 },
	{ colour: { chroma: 0.22, hue: 45, lightness: 0.72 }, temperature: 36 },
	{ colour: { chroma: 0.23, hue: 28, lightness: 0.62 }, temperature: 40 },
] as const

type OklchColor = {
	chroma: number
	hue: number
	lightness: number
}

type RgbColor = {
	blue: number
	green: number
	red: number
}

const normalizeRange = ({
	max,
	min,
	value,
}: {
	max: number
	min: number
	value: number
}) => Math.min(1, Math.max(0, (value - min) / (max - min)))

const mixOklch = ({
	from,
	progress,
	to,
}: {
	from: OklchColor
	progress: number
	to: OklchColor
}): OklchColor => ({
	chroma: mixNumber({ from: from.chroma, progress, to: to.chroma }),
	hue: mixHue({ from: from.hue, progress, to: to.hue }),
	lightness: mixNumber({
		from: from.lightness,
		progress,
		to: to.lightness,
	}),
})

const mixHue = ({
	from,
	progress,
	to,
}: {
	from: number
	progress: number
	to: number
}) => {
	const delta = ((((to - from) % 360) + 540) % 360) - 180
	return normalizeHue(from + delta * progress)
}

const normalizeHue = (hue: number) => ((hue % 360) + 360) % 360

const oklchToRgbCss = (colour: OklchColor) => {
	const rgb = oklchToRgb(colour)
	return `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`
}

const oklchToRgb = ({ chroma, hue, lightness }: OklchColor): RgbColor => {
	const hueRadians = (hue * Math.PI) / 180
	const labA = chroma * Math.cos(hueRadians)
	const labB = chroma * Math.sin(hueRadians)

	const longL = lightness + 0.3963377774 * labA + 0.2158037573 * labB
	const mediumL = lightness - 0.1055613458 * labA - 0.0638541728 * labB
	const shortL = lightness - 0.0894841775 * labA - 1.291485548 * labB

	const long = longL ** 3
	const medium = mediumL ** 3
	const short = shortL ** 3

	return {
		blue: linearRgbChannelToSrgb(
			-0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
		),
		green: linearRgbChannelToSrgb(
			-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
		),
		red: linearRgbChannelToSrgb(
			4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
		),
	}
}

const linearRgbChannelToSrgb = (value: number) => {
	const clamped = Math.min(1, Math.max(0, value))
	const gammaCorrected =
		clamped <= 0.0031308
			? 12.92 * clamped
			: 1.055 * clamped ** (1 / 2.4) - 0.055
	return Math.round(gammaCorrected * 255)
}

const mixNumber = ({
	from,
	progress,
	to,
}: {
	from: number
	progress: number
	to: number
}) => from + (to - from) * progress

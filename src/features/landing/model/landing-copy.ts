// Shared by the landing page and its Markdown version at /index.md.
export const HERO_COPY = {
	description:
		'Your local forecast and calendar on every new tab. Free and open source, with no accounts, ads, or tracking.',
	headline: ['Everything you need from a new tab.', 'Nothing you don’t.'],
} as const

export const CLOSING_COPY = {
	description:
		'Free on Chrome and Firefox. Your forecast and calendar, every time you open a new tab.',
	title: 'Get Weather Please',
} as const

export type FeatureSceneId =
	| 'alerts'
	| 'calendar'
	| 'detail'
	| 'privacy'
	| 'seasonal'

export const FEATURE_SCENE_COPY = [
	{
		description:
			'Scroll down on any new tab for the next 24 hours of temperature, rain, wind, sun, and air quality.',
		id: 'detail',
		label: 'Hourly detail',
		title: 'Every hour, one scroll away',
	},
	{
		description:
			'When extreme UV, heavy rain, or strong wind is on the way, an alert appears in the corner of your new tab.',
		id: 'alerts',
		label: 'Alerts',
		title: 'A heads-up before it hits',
	},
	{
		description:
			'Connect personal and work accounts from Google or Microsoft, and see what’s coming up next to the forecast.',
		hasGoogleApiDisclosure: true,
		id: 'calendar',
		label: 'Calendar',
		title: 'All your calendars in one place',
	},
	{
		description:
			'Your location and calendar data go straight from your browser to the weather and calendar providers.',
		id: 'privacy',
		label: 'Privacy',
		title: 'Private by design',
	},
	{
		description:
			'Subtle effects mark solstices, meteor shower peaks, holidays, and more. Each one can be turned off.',
		id: 'seasonal',
		label: 'Special occasions',
		title: 'Seasonal touches',
	},
] as const satisfies ReadonlyArray<{
	description: string
	hasGoogleApiDisclosure?: boolean
	id: FeatureSceneId
	label: string
	title: string
}>

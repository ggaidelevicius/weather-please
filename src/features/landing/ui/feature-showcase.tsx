import type { ReactNode } from 'react'

import {
	IconAlertTriangle,
	IconBell,
	IconCalendarEvent,
	IconClock,
	IconInfoCircle,
	IconLock,
	IconSparkles,
} from '@tabler/icons-react'
import { clsx } from 'clsx'
import Link from 'next/link'

import type { HeroHourlyForecast } from '../model/hero-forecast'
import type { FeatureSceneId } from '../model/landing-copy'

import {
	CALENDAR_ACCOUNT_CATEGORY_STYLES,
	CalendarAccountCategory,
} from '../../integrations/model/account-category'
import { FEATURE_SCENE_COPY } from '../model/landing-copy'
import { HourlyDetailVisual, SeasonalVisual } from './feature-demos'
import { GoogleApiDisclosure } from './google-api-disclosure'
import { PrivacyVisual } from './privacy-visual'
import { ShowcaseReveal } from './showcase-reveal'

export const FeatureShowcase = ({
	hourly,
}: Readonly<{ hourly: HeroHourlyForecast }>) => (
	<div className="py-4 sm:py-8">
		{SCENES.map((scene, index) => (
			<ShowcaseScene
				isFlipped={index % 2 === 1}
				key={scene.id}
				scene={scene}
				visual={scene.renderVisual({ hourly })}
			/>
		))}
	</div>
)

type Scene = {
	description: string
	footnote?: ReactNode
	icon: typeof IconLock
	id: FeatureSceneId
	label: string
	renderVisual: (props: Readonly<{ hourly: HeroHourlyForecast }>) => ReactNode
	title: string
}

const ShowcaseScene = ({
	isFlipped,
	scene,
	visual,
}: Readonly<{
	isFlipped: boolean
	scene: Scene
	visual: ReactNode
}>) => (
	<ShowcaseReveal
		className={clsx(
			'mx-auto grid max-w-7xl items-center gap-7 px-4 py-12 sm:px-6 lg:gap-14 lg:px-8 lg:py-16',
			isFlipped
				? 'lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]'
				: 'lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]',
		)}
	>
		<div className={clsx('relative z-10', isFlipped && 'lg:order-2')}>
			<p className="mb-3.5 flex items-center gap-1.5 text-[13px] font-medium text-sky-300">
				<scene.icon aria-hidden className="shrink-0" size={15} />
				{scene.label}
			</p>
			<h3 className="text-2xl font-medium tracking-tight text-pretty text-white sm:text-3xl">
				{scene.title}
			</h3>
			<p className="mt-4 max-w-md text-pretty text-dark-100">
				{scene.description}
			</p>
			{scene.footnote ? (
				<p className="mt-6 max-w-md text-xs/5 text-pretty text-dark-300">
					{scene.footnote}
				</p>
			) : null}
		</div>
		<div className="flex min-h-0 items-center justify-center overflow-hidden">
			{visual}
		</div>
	</ShowcaseReveal>
)

const SAMPLE_CALENDAR_ACCOUNTS = [
	{
		category: CalendarAccountCategory.Personal,
		email: 'sam@example.com',
		label: 'Personal',
		provider: 'Google',
	},
	{
		category: CalendarAccountCategory.Work,
		email: 'sam@company.example',
		label: 'Work',
		provider: 'Microsoft',
	},
	{
		category: CalendarAccountCategory.School,
		email: 'sam@university.example',
		label: 'School',
		provider: 'Google',
	},
] as const

const CalendarVisual = () => (
	<div
		aria-hidden
		className="w-full max-w-md rounded-2xl bg-dark-900 p-1.5 shadow-md ring-1 ring-white/8"
	>
		{SAMPLE_CALENDAR_ACCOUNTS.map((account) => (
			<div
				className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-white/5 p-2.5 first:border-t-0"
				key={account.email}
			>
				<span className="flex size-9 items-center justify-center rounded-lg bg-dark-700 text-sm font-bold text-dark-100">
					{account.provider[0]}
				</span>
				<span className="min-w-0">
					<span className="block text-sm font-medium text-white">
						{account.provider}
					</span>
					<span className="block truncate text-xs text-dark-300">
						{account.email}
					</span>
				</span>
				<span className="inline-flex items-center gap-1.5 rounded-full bg-white/6 px-2.5 py-1 text-xs text-dark-100">
					<span
						className={clsx(
							'size-1.5 rounded-full',
							CALENDAR_ACCOUNT_CATEGORY_STYLES[account.category].dotClassName,
						)}
					/>
					{account.label}
				</span>
			</div>
		))}
	</div>
)

// Matches the app's alert pills, which sit in the top corner of the new tab.
const SAMPLE_ALERTS = [
	{
		icon: IconAlertTriangle,
		isWarning: true,
		text: 'Extreme UV starting in 2 hours',
	},
	{
		icon: IconInfoCircle,
		isWarning: false,
		text: '8mm of precipitation expected over the next hour',
	},
	{
		icon: IconInfoCircle,
		isWarning: false,
		text: 'Strong wind gusts for the next 3 hours',
	},
] as const

const AlertsVisual = () => (
	<div
		aria-hidden
		className="flex w-fit max-w-full flex-col items-start gap-2 rounded-3xl bg-dark-900 p-6 ring-1 ring-white/6 sm:p-7"
	>
		{SAMPLE_ALERTS.map((alert) => (
			<div
				className={clsx(
					'flex h-11 max-w-full items-center overflow-hidden rounded-md pr-4 text-sm font-medium text-white shadow-sm',
					alert.isWarning ? 'bg-red-500/95' : 'bg-blue-500/95',
				)}
				key={alert.text}
			>
				<span className="flex size-11 shrink-0 items-center justify-center">
					<alert.icon size={24} strokeWidth={1.5} />
				</span>
				<span className="truncate">{alert.text}</span>
			</div>
		))}
	</div>
)

const SCENE_PRESENTATION = {
	alerts: { icon: IconBell, renderVisual: () => <AlertsVisual /> },
	calendar: { icon: IconCalendarEvent, renderVisual: () => <CalendarVisual /> },
	detail: {
		icon: IconClock,
		renderVisual: ({ hourly }) => <HourlyDetailVisual hourly={hourly} />,
	},
	privacy: { icon: IconLock, renderVisual: () => <PrivacyVisual /> },
	seasonal: { icon: IconSparkles, renderVisual: () => <SeasonalVisual /> },
} as const satisfies Record<
	FeatureSceneId,
	Pick<Scene, 'icon' | 'renderVisual'>
>

const SCENES: readonly Scene[] = FEATURE_SCENE_COPY.map((copy) => ({
	...copy,
	...SCENE_PRESENTATION[copy.id],
	footnote:
		'hasGoogleApiDisclosure' in copy ? (
			<GoogleApiDisclosure internalLink={Link} />
		) : undefined,
}))

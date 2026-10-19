import type { ReactNode } from 'react'

import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import {
	IconClock,
	IconCompass,
	IconMoon,
	IconSparkles,
	IconSunLow,
} from '@tabler/icons-react'
import { useId } from 'react'

import type { SeasonalEventId } from '../core/types'

import { getMeteorShower } from './catalog'
import { getMeteorViewingGuide } from './viewing'

type GuideRowProps = {
	children: ReactNode
	detail?: ReactNode
	icon: ReactNode
	label: ReactNode
	shouldWarn?: boolean
}

type MeteorViewingGuideProps = {
	date: Temporal.PlainDate
	eventId: SeasonalEventId
	latitude: number
	longitude: number
}

type ViewingGuide = ReturnType<typeof getMeteorViewingGuide>

export function MeteorViewingGuide({
	date,
	eventId,
	latitude,
	longitude,
}: Readonly<MeteorViewingGuideProps>) {
	const { i18n } = useLingui()
	const headingId = useId()
	if (!getMeteorShower(eventId)) return null

	let content: ReactNode
	try {
		content = getGuideContent({
			date,
			eventId,
			latitude,
			locale: i18n.locale,
			longitude,
		})
	} catch {
		content = getUnavailableMessage('unavailable')
	}

	return (
		<section
			aria-labelledby={headingId}
			className="mb-7 rounded-xl border border-sky-300/15 bg-linear-to-br from-sky-950/60 to-dark-900/70 p-4 sm:p-5"
		>
			<h3
				className="flex items-center gap-2 text-base font-medium text-sky-100"
				id={headingId}
			>
				<IconSparkles aria-hidden size={18} stroke={1.5} />
				<Trans>Viewing from your location</Trans>
			</h3>
			{content}
		</section>
	)
}

function getGuideContent({
	date,
	eventId,
	latitude,
	locale,
	longitude,
}: MeteorViewingGuideProps & { locale: string }): ReactNode {
	const guide = getMeteorViewingGuide({ date, eventId, latitude, longitude })
	if (guide.status === 'out-of-season') {
		const shower = getMeteorShower(eventId)
		const peakLabel = shower
			? Temporal.PlainDate.from({
					day: shower.peakDay,
					month: shower.peakMonth,
					year: 2000,
				}).toLocaleString(locale, {
					day: 'numeric',
					month: 'long',
				})
			: null
		return (
			<>
				<p>
					<Trans>
						Local viewing guidance appears near this shower’s usual peak.
					</Trans>
				</p>
				{peakLabel ? (
					<p className="text-xs text-dark-200">
						<Trans>Usual peak: around {peakLabel}.</Trans>
					</p>
				) : null}
			</>
		)
	}
	if (guide.status !== 'available') {
		return getUnavailableMessage(guide.status)
	}

	const nightLabel = date.toLocaleString(locale, {
		day: 'numeric',
		month: 'short',
		weekday: 'short',
	})
	const timeFormatter = new Intl.DateTimeFormat(locale, {
		timeStyle: 'short',
		timeZone: guide.timeZone,
	})
	const getTimeZoneName = (timeZoneName: 'long' | 'short') =>
		new Intl.DateTimeFormat(locale, { timeZone: guide.timeZone, timeZoneName })
			.formatToParts(guide.referenceTime.epochMilliseconds)
			.find((part) => part.type === 'timeZoneName')?.value ?? guide.timeZone
	const referenceLabel = timeFormatter.format(
		guide.referenceTime.epochMilliseconds,
	)
	const startLabel = timeFormatter.format(guide.start.epochMilliseconds)
	const endLabel = timeFormatter.format(guide.end.epochMilliseconds)
	const altitude = new Intl.NumberFormat(locale, {
		maximumFractionDigits: 0,
	}).format(guide.radiantAltitude)
	const moonBrightness = new Intl.NumberFormat(locale, {
		maximumFractionDigits: 0,
		style: 'percent',
	}).format(guide.moonIllumination)

	return (
		<>
			<dl className="mt-3 divide-y divide-white/10 border-t border-white/10">
				<GuideRow
					detail={
						<>
							<Trans>Night of {nightLabel}</Trans>
							{' · '}
							<abbr className="no-underline" title={getTimeZoneName('long')}>
								{getTimeZoneName('short')}
							</abbr>
						</>
					}
					icon={<IconClock size={18} stroke={1.5} />}
					label={<Trans>Suggested viewing window</Trans>}
				>
					<span className="font-medium tabular-nums">
						<time dateTime={guide.start.toString()}>{startLabel}</time>
						{' – '}
						<time dateTime={guide.end.toString()}>{endLabel}</time>
					</span>
				</GuideRow>
				<GuideRow
					detail={<Trans>{altitude}° above the horizon</Trans>}
					icon={<IconCompass size={18} stroke={1.5} />}
					label={<Trans>Radiant position</Trans>}
				>
					{getRadiantDirection(guide.radiantAzimuth)}
				</GuideRow>
				<GuideRow
					detail={getMoonVisibility(guide.moonVisibility)}
					icon={<IconMoon size={18} stroke={1.5} />}
					label={<Trans>Moonlight</Trans>}
				>
					<Trans>{moonBrightness} illuminated</Trans>
				</GuideRow>
				{guide.hasTwilight ? (
					<GuideRow
						icon={<IconSunLow size={18} stroke={1.5} />}
						label={<Trans>Twilight</Trans>}
						shouldWarn
					>
						<Trans>
							Twilight overlaps this window, so fainter meteors may be harder to
							see.
						</Trans>
					</GuideRow>
				) : null}
			</dl>
			<div className="border-t border-white/10 pt-1 text-xs text-dark-200">
				<p>
					<Trans>
						The radiant is where the trails appear to come from. Meteors can
						cross any part of the sky: look roughly halfway up, away from the
						Moon, with a wide, unobstructed view.
					</Trans>
				</p>
				<p>
					<Trans>
						Estimates near the usual peak, not a prediction of meteor activity
						or cloud cover. Check the local forecast and choose a dark spot away
						from lights.
					</Trans>{' '}
					<Trans>
						Sky position and Moon illumination shown for {referenceLabel}.
					</Trans>
				</p>
			</div>
		</>
	)
}

function getMoonVisibility(
	visibility: Extract<ViewingGuide, { status: 'available' }>['moonVisibility'],
): ReactNode {
	switch (visibility) {
		case 'above':
			return <Trans>Above the horizon throughout this window.</Trans>
		case 'below':
			return <Trans>Below the horizon throughout this window.</Trans>
		case 'mixed':
			return <Trans>Above the horizon for part of this window.</Trans>
	}
}

function getRadiantDirection(azimuth: number): ReactNode {
	const sector = Math.round((((azimuth % 360) + 360) % 360) / 45) % 8
	switch (sector) {
		case 0:
			return <Trans>Face north</Trans>
		case 1:
			return <Trans>Face north-east</Trans>
		case 2:
			return <Trans>Face east</Trans>
		case 3:
			return <Trans>Face south-east</Trans>
		case 4:
			return <Trans>Face south</Trans>
		case 5:
			return <Trans>Face south-west</Trans>
		case 6:
			return <Trans>Face west</Trans>
		default:
			return <Trans>Face north-west</Trans>
	}
}

function getUnavailableMessage(
	status: Exclude<ViewingGuide['status'], 'available' | 'out-of-season'>,
): ReactNode {
	switch (status) {
		case 'no-darkness':
			return (
				<p>
					<Trans>
						The sky stays too bright for a useful viewing window at this
						location on this night.
					</Trans>
				</p>
			)
		case 'no-window':
			return (
				<p>
					<Trans>
						No useful local viewing window was found for this night.
					</Trans>
				</p>
			)
		case 'radiant-too-low':
			return (
				<p>
					<Trans>
						This shower’s radiant stays too low while your sky is dark for a
						useful viewing window on this night.
					</Trans>
				</p>
			)
		default:
			return (
				<p>
					<Trans>
						Local viewing guidance isn’t available for this location. Check that
						your selected weather location is correct.
					</Trans>
				</p>
			)
	}
}

function GuideRow({
	children,
	detail,
	icon,
	label,
	shouldWarn = false,
}: Readonly<GuideRowProps>) {
	return (
		<div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 py-3">
			<dt
				className={`row-span-2 mt-0.5 ${shouldWarn ? 'text-amber-200' : 'text-sky-300'}`}
			>
				<span aria-hidden>{icon}</span>
				<span className="sr-only">{label}</span>
			</dt>
			<dd className={shouldWarn ? 'text-amber-200' : 'text-white'}>
				{children}
			</dd>
			{detail ? (
				<dd className="mt-0.5 text-xs text-dark-200">{detail}</dd>
			) : null}
		</div>
	)
}

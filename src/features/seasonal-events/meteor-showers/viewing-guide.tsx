import type { ReactNode } from 'react'

import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { IconSparkles } from '@tabler/icons-react'
import { useId } from 'react'

import type { SeasonalEventId } from '../core/types'

import { getMeteorShower } from './catalog'
import { getMeteorViewingGuide } from './viewing'

type MeteorViewingGuideProps = {
	eventId: SeasonalEventId
	date: Date
	latitude: number
	longitude: number
}

type ViewingGuide = ReturnType<typeof getMeteorViewingGuide>

export function MeteorViewingGuide({
	eventId,
	date,
	latitude,
	longitude,
}: Readonly<MeteorViewingGuideProps>) {
	const { i18n } = useLingui()
	const headingId = useId()
	if (!getMeteorShower(eventId)) return null

	let content: ReactNode
	try {
		content = getGuideContent({
			eventId,
			date,
			latitude,
			longitude,
			locale: i18n.locale,
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
	eventId,
	date,
	latitude,
	longitude,
	locale,
}: MeteorViewingGuideProps & { locale: string }): ReactNode {
	const guide = getMeteorViewingGuide({ eventId, date, latitude, longitude })
	if (guide.status === 'out-of-season') {
		const shower = getMeteorShower(eventId)
		const peakLabel = shower
			? new Intl.DateTimeFormat(locale, {
					month: 'long',
					day: 'numeric',
					timeZone: 'UTC',
				}).format(
					new Date(Date.UTC(2000, shower.peakMonth - 1, shower.peakDay)),
				)
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

	// The tile supplies a calendar date, not an instant to convert between zones.
	const nightLabel = new Intl.DateTimeFormat(locale, {
		dateStyle: 'full',
		timeZone: 'UTC',
	}).format(
		new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())),
	)
	const windowFormatter = new Intl.DateTimeFormat(locale, {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: guide.timeZone,
	})
	const referenceFormatter = new Intl.DateTimeFormat(locale, {
		hour: 'numeric',
		minute: '2-digit',
		timeZone: guide.timeZone,
		timeZoneName: 'long',
	})
	const timeZoneLabel =
		referenceFormatter
			.formatToParts(guide.referenceTime)
			.find((part) => part.type === 'timeZoneName')?.value ?? guide.timeZone
	const referenceLabel = windowFormatter.format(guide.referenceTime)
	const startLabel = windowFormatter.format(guide.start)
	const endLabel = windowFormatter.format(guide.end)
	const altitude = new Intl.NumberFormat(locale, {
		maximumFractionDigits: 0,
	}).format(guide.radiantAltitude)
	const moonBrightness = new Intl.NumberFormat(locale, {
		style: 'percent',
		maximumFractionDigits: 0,
	}).format(guide.moonIllumination)

	return (
		<>
			<div className="mt-2 text-xs leading-relaxed text-dark-200">
				<div>
					<Trans>Night of {nightLabel}</Trans>
				</div>
				<div>
					<Trans>Times in {timeZoneLabel}</Trans>
				</div>
			</div>
			<dl className="mt-4 grid gap-4 sm:grid-cols-2">
				<div className="rounded-lg bg-white/5 px-3 py-2.5 sm:col-span-2">
					<dt className="text-xs text-sky-200">
						<Trans>Suggested viewing window</Trans>
					</dt>
					<dd className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-medium text-white tabular-nums">
						<time dateTime={guide.start.toISOString()}>{startLabel}</time>
						<span className="font-normal text-dark-200">
							<Trans>to</Trans>
						</span>
						<time dateTime={guide.end.toISOString()}>{endLabel}</time>
					</dd>
				</div>
				<div>
					<dt className="text-xs text-dark-200">
						<Trans>Radiant position</Trans>
					</dt>
					<dd className="mt-1 text-white">
						<div>{getRadiantDirection(guide.radiantAzimuth)}</div>
						<div className="text-dark-100">
							<Trans>{altitude}° above the horizon</Trans>
						</div>
					</dd>
				</div>
				<div>
					<dt className="text-xs text-dark-200">
						<Trans>Moonlight</Trans>
					</dt>
					<dd className="mt-1 text-white">
						<div>
							<Trans>{moonBrightness} illuminated</Trans>
						</div>
						<div className="text-dark-100">
							{getMoonVisibility(guide.moonVisibility)}
						</div>
					</dd>
				</div>
			</dl>
			<p className="text-xs text-dark-200">
				<Trans>
					Sky position and Moon illumination shown for {referenceLabel}.
				</Trans>
			</p>
			<div className="mt-4 border-t border-white/10 pt-2">
				<p>
					<Trans>
						The radiant is where the trails appear to come from. Meteors can
						cross any part of the sky: look roughly halfway up, away from the
						Moon, with a wide, unobstructed view.
					</Trans>
				</p>
				{guide.hasTwilight ? (
					<p className="text-amber-200">
						<Trans>
							Twilight overlaps this window, so fainter meteors may be harder to
							see.
						</Trans>
					</p>
				) : null}
				<p className="text-xs text-dark-200">
					<Trans>
						Estimates near the usual peak, not a prediction of meteor activity
						or cloud cover. Check the local forecast and choose a dark spot away
						from lights.
					</Trans>
				</p>
			</div>
		</>
	)
}

function getRadiantDirection(azimuth: number): ReactNode {
	const sector = Math.round((((azimuth % 360) + 360) % 360) / 45) % 8
	switch (sector) {
		case 0:
			return <Trans>North</Trans>
		case 1:
			return <Trans>North-east</Trans>
		case 2:
			return <Trans>East</Trans>
		case 3:
			return <Trans>South-east</Trans>
		case 4:
			return <Trans>South</Trans>
		case 5:
			return <Trans>South-west</Trans>
		case 6:
			return <Trans>West</Trans>
		default:
			return <Trans>North-west</Trans>
	}
}

function getMoonVisibility(
	visibility: Extract<ViewingGuide, { status: 'available' }>['moonVisibility'],
): ReactNode {
	switch (visibility) {
		case 'below':
			return <Trans>Below the horizon throughout this window.</Trans>
		case 'above':
			return <Trans>Above the horizon throughout this window.</Trans>
		case 'mixed':
			return <Trans>Above the horizon for part of this window.</Trans>
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
		case 'radiant-too-low':
			return (
				<p>
					<Trans>
						This shower’s radiant stays too low while your sky is dark for a
						useful viewing window on this night.
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

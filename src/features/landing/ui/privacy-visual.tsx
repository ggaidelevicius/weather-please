'use client'

import type { Icon } from '@tabler/icons-react'
import type { Ref } from 'react'

import {
	IconBrowser,
	IconCalendar,
	IconCloud,
	IconMail,
	IconServer,
	IconX,
} from '@tabler/icons-react'
import { clsx } from 'clsx'
import { useReducedMotion } from 'framer-motion'
import { useEffect, useId, useRef } from 'react'

import type { Point } from '../model/privacy-beam'

import {
	getCometDots,
	getCubicBezierPoint,
	getPrivacyBeamFrame,
} from '../model/privacy-beam'

export const PrivacyVisual = () => {
	const shouldReduceMotion = useReducedMotion()
	const filterId = useId()
	const stageRef = useRef<HTMLDivElement>(null)
	const browserRef = useRef<HTMLDivElement>(null)
	const providerRefs = useRef<(HTMLDivElement | null)[]>([])
	const routeRefs = useRef<(null | SVGPathElement)[]>([])
	const dotRefs = useRef<(null | SVGCircleElement)[]>([])

	useEffect(() => {
		const stage = stageRef.current
		const browser = browserRef.current
		if (shouldReduceMotion || !stage || !browser) return

		const routes = routeRefs.current.filter((route) => route !== null)
		const routeLengths = routes.map((route) => route.getTotalLength())
		// Routes end at the browser's centre and enter it roughly level, so the
		// head disappears beneath the node half its width from the end.
		const browserReach = browser.offsetWidth / 2
		let animationFrame: null | number = null
		let startedAt = 0
		let isVisible = false

		const draw = (now: number) => {
			const frame = getPrivacyBeamFrame({
				elapsedMs: now - startedAt,
				landingDistance: browserReach,
				routeLengths,
			})
			const routeLength = routeLengths[frame.beamIndex] ?? 0
			const route = routes[frame.beamIndex]
			const dots =
				frame.headProgress === null
					? []
					: getCometDots({
							count: COMET_DOT_COUNT,
							headDistance: frame.headProgress * routeLength,
							routeLength,
							spacing: COMET_DOT_SPACING,
						})

			browser.dataset.lit = String(frame.isBrowserLit)
			providerRefs.current.forEach((provider, index) => {
				if (provider) {
					provider.dataset.lit = String(
						index === frame.beamIndex && frame.isProviderLit,
					)
				}
			})
			dotRefs.current.forEach((dot, index) => {
				if (!dot) return
				const isGlow = index < COMET_DOT_COUNT
				const cometDot = dots[index % COMET_DOT_COUNT]
				if (!cometDot || !route) {
					dot.setAttribute('r', '0')
					return
				}

				const point = route.getPointAtLength(cometDot.distance)
				const radius = 0.6 + 1.8 * cometDot.strength
				dot.setAttribute('cx', String(point.x))
				dot.setAttribute('cy', String(point.y))
				dot.setAttribute('r', String(isGlow ? radius * 2.2 : radius))
				dot.setAttribute(
					'opacity',
					String(isGlow ? cometDot.strength * 0.35 : cometDot.strength),
				)
			})
		}

		const handleFrame = (now: number) => {
			draw(now)
			animationFrame = window.requestAnimationFrame(handleFrame)
		}

		const handleVisibility = () => {
			if (animationFrame !== null) {
				window.cancelAnimationFrame(animationFrame)
				animationFrame = null
			}
			if (isVisible && !document.hidden) {
				startedAt = performance.now()
				animationFrame = window.requestAnimationFrame(handleFrame)
			}
		}

		const observer = new IntersectionObserver(([entry]) => {
			isVisible = entry.isIntersecting
			handleVisibility()
		})

		observer.observe(stage)
		document.addEventListener('visibilitychange', handleVisibility)

		return () => {
			observer.disconnect()
			document.removeEventListener('visibilitychange', handleVisibility)
			if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
		}
	}, [shouldReduceMotion])

	return (
		<div
			aria-hidden
			className="@container relative aspect-[560/380] w-full max-w-140"
		>
			{/* Laid out at 560 × 380 and scaled to the column, so it keeps its shape. */}
			<div
				className="absolute top-0 left-0 h-95 w-140 origin-top-left scale-(--privacy-scale) [--privacy-scale:tan(atan2(100cqw,560px))]"
				ref={stageRef}
			>
				<div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.13)_1px,transparent_1.2px)] mask-[radial-gradient(ellipse_70%_65%_at_50%_50%,black_30%,transparent_75%)] bg-size-[18px_18px]" />
				<svg
					className="absolute inset-0 size-full overflow-visible"
					fill="none"
					viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
				>
					<defs>
						<filter height="200%" id={filterId} width="200%" x="-50%" y="-50%">
							<feGaussianBlur stdDeviation={2.2} />
						</filter>
					</defs>
					{PROVIDERS.map((provider, index) => (
						<path
							d={getProviderRoute(provider)}
							key={provider.name}
							ref={(route) => {
								routeRefs.current[index] = route
							}}
							stroke="rgb(255 255 255 / 0.12)"
							strokeWidth={1.2}
						/>
					))}
					<path
						d={toPathData(SERVER_LINK)}
						stroke="rgb(255 255 255 / 0.18)"
						strokeDasharray="3 5"
						strokeWidth={1.2}
					/>
					<g
						className="fill-sky-300 motion-reduce:hidden"
						filter={`url(#${filterId})`}
					>
						{COMET_DOT_KEYS.map((key, index) => (
							<circle
								key={key}
								r={0}
								ref={(dot) => {
									dotRefs.current[index] = dot
								}}
							/>
						))}
					</g>
					<g className="fill-sky-300 motion-reduce:hidden">
						{COMET_DOT_KEYS.map((key, index) => (
							<circle
								key={key}
								r={0}
								ref={(dot) => {
									dotRefs.current[COMET_DOT_COUNT + index] = dot
								}}
							/>
						))}
					</g>
				</svg>
				<PrivacyNode
					detail="Chrome or Firefox"
					icon={IconBrowser}
					name="Your browser"
					nodeRef={browserRef}
					point={BROWSER}
					variant="browser"
				/>
				{PROVIDERS.map((provider, index) => (
					<PrivacyNode
						detail={provider.detail}
						icon={provider.icon}
						key={provider.name}
						name={provider.name}
						nodeRef={(node) => {
							providerRefs.current[index] = node
						}}
						point={provider}
						variant="provider"
					/>
				))}
				<PrivacyNode
					detail="Never in the path"
					icon={IconServer}
					name="Weather Please servers"
					point={SERVER}
					variant="server"
				/>
				<span
					className="absolute flex size-5.5 -translate-1/2 items-center justify-center rounded-full bg-dark-800 text-red-300 ring-1 ring-red-400/45"
					style={toPosition(SERVER_LINK_MIDPOINT)}
				>
					<IconX size={12} stroke={2.4} />
				</span>
			</div>
		</div>
	)
}

const STAGE = { height: 380, width: 560 } as const
const BROWSER = { x: 112, y: 150 } as const
const SERVER = { x: 300, y: 338 } as const
const PROVIDERS = [
	{ detail: 'Forecast', icon: IconCloud, name: 'Open-Meteo', x: 462, y: 50 },
	{ detail: 'Calendar', icon: IconCalendar, name: 'Google', x: 462, y: 150 },
	{ detail: 'Outlook', icon: IconMail, name: 'Microsoft', x: 462, y: 250 },
] as const

const COMET_DOT_COUNT = 32
const COMET_DOT_SPACING = 2.6
const COMET_DOT_KEYS = Array.from(
	{ length: COMET_DOT_COUNT },
	(_, index) => index,
)

type CubicCurve = readonly [Point, Point, Point, Point]

const SERVER_LINK: CubicCurve = [
	BROWSER,
	{ x: BROWSER.x, y: BROWSER.y + 120 },
	{ x: SERVER.x - 140, y: SERVER.y },
	SERVER,
]
const SERVER_LINK_MIDPOINT = getCubicBezierPoint({
	points: SERVER_LINK,
	t: 0.5,
})

// Routes run from each provider to the browser, the direction the beam
// travels. Nodes sit on top, so each route starts and ends at a node centre.
const getProviderRoute = (provider: Point) =>
	toPathData([
		provider,
		{ x: provider.x - 150, y: provider.y },
		{ x: BROWSER.x + 150, y: BROWSER.y },
		BROWSER,
	])

const toPathData = ([start, first, second, end]: CubicCurve) =>
	`M ${start.x} ${start.y} C ${first.x} ${first.y}, ${second.x} ${second.y}, ${end.x} ${end.y}`

const toPosition = ({ x, y }: Point) => ({
	left: `${(x / STAGE.width) * 100}%`,
	top: `${(y / STAGE.height) * 100}%`,
})

// The resting and lit shadows list the same layers in the same order, inset
// first, so the browser can fade between them instead of switching.
const PrivacyNode = ({
	detail,
	icon: NodeIcon,
	name,
	nodeRef,
	point,
	variant,
}: Readonly<{
	detail: string
	icon: Icon
	name: string
	nodeRef?: Ref<HTMLDivElement>
	point: Point
	variant: 'browser' | 'provider' | 'server'
}>) => (
	<div
		className={clsx(
			'absolute flex -translate-1/2 items-center gap-2.5 rounded-[14px] py-2.5 pr-3.5 pl-2.5 whitespace-nowrap',
			variant === 'server'
				? 'border border-dashed border-white/22 opacity-55'
				: 'bg-linear-to-b from-[#2a2b31] to-[#222327] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08),inset_0_1px_0_rgb(255_255_255/0.06),0_8px_24px_-8px_rgb(0_0_0/0.6),0_0_0_4px_rgb(56_189_248/0),0_0_28px_rgb(56_189_248/0)] transition-shadow duration-500 ease-out data-[lit=true]:duration-150 data-[lit=true]:shadow-[inset_0_0_0_1px_rgb(125_211_252/0.55),inset_0_1px_0_rgb(255_255_255/0.08),0_8px_24px_-8px_rgb(0_0_0/0.6),0_0_0_4px_rgb(56_189_248/0.12),0_0_28px_rgb(56_189_248/0.25)]',
			variant === 'browser' && 'py-3 pr-4 pl-3',
		)}
		data-lit="false"
		ref={nodeRef}
		style={toPosition(point)}
	>
		<span
			className={clsx(
				'flex items-center justify-center rounded-[9px] ring-1 ring-inset',
				variant === 'browser'
					? 'size-9.5 bg-sky-400/10 text-sky-300 ring-sky-400/25'
					: 'size-8 bg-white/5 ring-white/7',
				variant === 'provider' && 'text-dark-100',
				variant === 'server' && 'bg-transparent text-dark-300',
			)}
		>
			<NodeIcon size={18} />
		</span>
		<span>
			<span
				className={clsx(
					'block text-[13.5px] font-medium',
					variant === 'server' ? 'text-dark-100' : 'text-white',
				)}
			>
				{name}
			</span>
			<span className="block text-[11.5px] text-dark-300">{detail}</span>
		</span>
	</div>
)

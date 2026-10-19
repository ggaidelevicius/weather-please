import { useId } from 'react'

import { CLOSING_COPY } from '../model/landing-copy'
import { CHROME_STORE_URL, FIREFOX_ADDON_URL } from '../model/site'
import {
	PRIMARY_PILL_LINK_CLASS_NAME,
	SECONDARY_PILL_LINK_CLASS_NAME,
} from './pill-link'

export const ClosingCallToAction = () => (
	<section
		aria-labelledby="closing-cta-title"
		className="relative isolate overflow-hidden border-t border-white/8 bg-[radial-gradient(50%_80%_at_50%_115%,rgb(56_189_248/0.14),transparent_70%)] px-4 py-24 sm:px-6"
	>
		<div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-1/2">
			<SpinningArc />
		</div>
		<div className="mx-auto max-w-md text-center">
			<h2
				className="text-3xl font-medium tracking-tight text-balance text-white"
				id="closing-cta-title"
			>
				{CLOSING_COPY.title}
			</h2>
			<p className="mt-4 text-base/6.5 text-pretty text-dark-100">
				{CLOSING_COPY.description}
			</p>
			<div className="mt-7 flex flex-wrap items-center justify-center gap-2">
				<a
					className={PRIMARY_PILL_LINK_CLASS_NAME}
					href={CHROME_STORE_URL}
					rel="noopener noreferrer"
					target="_blank"
				>
					Add to Chrome
				</a>
				<a
					className={SECONDARY_PILL_LINK_CLASS_NAME}
					href={FIREFOX_ADDON_URL}
					rel="noopener noreferrer"
					target="_blank"
				>
					Add to Firefox
				</a>
			</div>
		</div>
	</section>
)

// The same faint ring and fading arc as Glucose Please's CircleBackground,
// with a sky-tinted ring.
const SpinningArc = () => {
	const gradientId = useId()

	return (
		<svg
			aria-hidden="true"
			className="size-90 animate-spin [animation-duration:6s] motion-reduce:animate-none sm:size-139.5"
			fill="none"
			viewBox="0 0 558 558"
		>
			<defs>
				<linearGradient
					gradientUnits="userSpaceOnUse"
					id={gradientId}
					x1="79"
					x2="105"
					y1="16"
					y2="237"
				>
					<stop stopColor="#fff" />
					<stop offset="1" stopColor="#fff" stopOpacity="0" />
				</linearGradient>
			</defs>
			<path
				d="M1 279C1 125.465 125.465 1 279 1s278 124.465 278 278-124.465 278-278 278S1 432.535 1 279Z"
				opacity=".2"
				stroke="#7dd3fc"
			/>
			<path
				d="M1 279C1 125.465 125.465 1 279 1"
				stroke={`url(#${gradientId})`}
				strokeLinecap="round"
			/>
		</svg>
	)
}

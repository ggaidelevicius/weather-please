import Head from 'next/head'
import Link from 'next/link'

import { FeatureShowcase } from '../features/landing/ui/feature-showcase'

const CHROME_STORE_URL =
	'https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn'
const FIREFOX_STORE_URL =
	'https://addons.mozilla.org/en-US/firefox/addon/weather-please/'
const GITHUB_URL = 'https://github.com/ggaidelevicius/weather-please'

const NAV_LINK_CLASS_NAME =
	'relative -mx-3 -my-2 rounded-lg px-3 py-2 text-sm text-dark-100 transition-colors hover:text-white'

const LandingPage = () => (
	<div className="min-h-screen w-full bg-dark-800">
		<Head>
			<title>Weather Please — weather and calendar in every new tab</title>
			<meta
				content="Weather Please is a free, open-source browser extension that shows your local weather forecast and upcoming calendar events on every new tab."
				name="description"
			/>
		</Head>
		<header>
			<nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-8 sm:px-6 lg:px-8">
				<div className="flex items-center gap-16">
					<Link aria-label="Home" className="flex items-center" href="/">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							alt=""
							className="size-10 flex-none rounded-xl"
							src="/favicon.png"
						/>
						<p className="ml-4 text-base font-semibold text-white">
							Weather Please
						</p>
					</Link>
					<div className="hidden gap-10 sm:flex">
						<a className={NAV_LINK_CLASS_NAME} href="#features">
							Features
						</a>
						<Link className={NAV_LINK_CLASS_NAME} href="/privacy">
							Privacy
						</Link>
						<a
							className={NAV_LINK_CLASS_NAME}
							href={GITHUB_URL}
							rel="noopener noreferrer"
							target="_blank"
						>
							GitHub
						</a>
					</div>
				</div>
				<Link
					className="hidden rounded-lg border border-white/15 px-3 py-2 text-sm text-dark-100 transition-colors hover:border-white/30 hover:text-white sm:block"
					href="/demo"
				>
					Live demo
				</Link>
			</nav>
		</header>
		<main>
			<section className="pt-16 pb-20 sm:pt-24 sm:pb-28">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="max-w-2xl">
						<h1 className="text-4xl font-medium tracking-tight text-pretty text-white sm:text-5xl">
							Your forecast and your day, in every new tab.
						</h1>
						<p className="mt-6 text-lg text-pretty text-dark-100">
							Weather Please is a free, open-source browser extension that
							replaces your new tab page with an at-a-glance local weather
							forecast — and, if you choose to connect one, the next events from
							your Google or Microsoft calendar.
						</p>
						<div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
							<a
								className="flex items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-medium text-dark-800 transition-colors hover:bg-zinc-200"
								href={CHROME_STORE_URL}
								rel="noopener noreferrer"
								target="_blank"
							>
								Add to Chrome
							</a>
							<a
								className="flex items-center justify-center rounded-lg border border-white/15 px-4 py-3 text-sm font-medium text-dark-100 transition-colors hover:border-white/30 hover:text-white"
								href={FIREFOX_STORE_URL}
								rel="noopener noreferrer"
								target="_blank"
							>
								Add to Firefox
							</a>
							<Link
								className="text-sm font-medium text-dark-100 transition-colors hover:text-white"
								href="/demo"
							>
								Try the live demo <span aria-hidden>→</span>
							</Link>
						</div>
					</div>
				</div>
			</section>
			<section className="border-t border-white/10" id="features">
				<div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
					<div className="max-w-2xl">
						<h2 className="text-3xl font-medium tracking-tight text-white">
							Everything you need from a new tab. Nothing you don&apos;t.
						</h2>
						<p className="mt-4 text-lg text-dark-100">
							No accounts, no ads, no tracking — just the information that helps
							you start the day.
						</p>
					</div>
				</div>
				<FeatureShowcase />
				<div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
					<p className="max-w-2xl text-sm text-dark-200">
						Calendar connections are optional and read-only. Weather
						Please&apos;s use of information received from Google APIs adheres
						to the{' '}
						<a
							className="font-medium text-dark-100 underline decoration-white/25 underline-offset-2 transition-colors hover:text-white"
							href="https://developers.google.com/terms/api-services-user-data-policy"
							rel="noopener noreferrer"
							target="_blank"
						>
							Google API Services User Data Policy
						</a>
						, including the Limited Use requirements. See our{' '}
						<Link
							className="font-medium text-dark-100 underline decoration-white/25 underline-offset-2 transition-colors hover:text-white"
							href="/privacy"
						>
							privacy policy
						</Link>{' '}
						for details.
					</p>
				</div>
			</section>
		</main>
		<footer className="border-t border-white/10">
			<div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-8 text-sm text-dark-200 sm:px-6 lg:px-8">
				<p>© Gus Gaidelevicius</p>
				<nav className="flex flex-wrap gap-x-6 gap-y-2">
					<Link className="transition-colors hover:text-white" href="/privacy">
						Privacy policy
					</Link>
					<a
						className="transition-colors hover:text-white"
						href={GITHUB_URL}
						rel="noopener noreferrer"
						target="_blank"
					>
						GitHub
					</a>
					<a
						className="transition-colors hover:text-white"
						href="mailto:contact@weather-please.app"
					>
						Contact
					</a>
				</nav>
			</div>
		</footer>
	</div>
)

export default LandingPage

import Head from 'next/head'
import Link from 'next/link'

import { FeatureShowcase } from '../features/landing/ui/feature-showcase'
import { HeroAtmosphere } from '../features/landing/ui/hero-atmosphere'
import { SiteFooter } from '../features/landing/ui/site-footer'
import { SiteHeader } from '../features/landing/ui/site-header'

const CHROME_STORE_URL =
	'https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn'

const LandingPage = () => (
	<div className="min-h-screen w-full bg-dark-800">
		<Head>
			<title>Weather Please — weather and calendar in every new tab</title>
			<meta
				content="Weather Please is a free, open-source browser extension that shows your local weather forecast and upcoming calendar events on every new tab."
				name="description"
			/>
			<style>{'body { overflow-x: clip; }'}</style>
		</Head>
		<SiteHeader pathname="/" />
		<main>
			<section className="relative isolate pt-16 pb-20 sm:pt-24 sm:pb-28">
				<HeroAtmosphere />
				<div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="max-w-xl">
						<h1 className="text-4xl font-medium tracking-tight text-white sm:text-5xl">
							Your forecast. Your day.
						</h1>
						<p className="mt-6 text-lg text-pretty text-dark-100">
							Weather Please is a free, open-source new-tab extension that shows
							your weather and day at a glance, with optional Google or
							Microsoft calendar sync. No accounts, ads, or tracking - just what
							helps you start the day.
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
							<Link
								className="flex items-center justify-center rounded-lg border border-white/15 px-4 py-3 text-sm font-medium text-dark-100 transition-colors hover:border-white/30 hover:text-white"
								href="/demo"
							>
								Try the live demo
							</Link>
						</div>
					</div>
				</div>
			</section>
			<section className="scroll-mt-24 border-t border-white/10" id="features">
				<div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
					<h2 className="mx-auto flex flex-col gap-2 text-center text-3xl font-medium tracking-tight">
						<span className="text-white">
							Everything you need from a new tab.
						</span>
						<span className="text-white/75">Nothing you don&apos;t.</span>
					</h2>
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
		<SiteFooter />
	</div>
)

export default LandingPage

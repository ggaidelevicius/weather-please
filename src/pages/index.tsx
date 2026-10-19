import type { GetStaticProps } from 'next'

import Head from 'next/head'
import Link from 'next/link'

import type { HeroHourlyForecast } from '../features/landing/model/hero-forecast'
import type { Data } from '../features/weather/model/types'

import { getHeroForecast } from '../features/landing/model/hero-forecast'
import { FeatureShowcase } from '../features/landing/ui/feature-showcase'
import { HeroNewTab } from '../features/landing/ui/hero-new-tab'
import { SiteFooter } from '../features/landing/ui/site-footer'
import { SiteHeader } from '../features/landing/ui/site-header'

const CHROME_STORE_URL =
	'https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn'

type LandingPageProps = {
	forecast: Data
	hourly: HeroHourlyForecast
}

export const getStaticProps = (async () => {
	const { forecast, hourly, revalidateSeconds } = await getHeroForecast()

	return { props: { forecast, hourly }, revalidate: revalidateSeconds }
}) satisfies GetStaticProps<LandingPageProps>

const LandingPage = ({ forecast, hourly }: Readonly<LandingPageProps>) => (
	<div className="min-h-screen w-full bg-dark-800">
		<Head>
			<title>Weather Please — weather and calendar in every new tab</title>
			<meta
				content="Weather Please is a free, open-source browser extension that shows your local weather forecast and upcoming calendar events on every new tab."
				name="description"
			/>
			<style>
				{'body { overflow-x: clip; } #__next { align-self: stretch; }'}
			</style>
		</Head>
		<SiteHeader pathname="/" />
		<main>
			<section className="overflow-hidden pt-10">
				<div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
					<h1 className="flex flex-col gap-2 text-3xl font-medium tracking-tight text-balance">
						<span className="text-white">
							Everything you need from a new tab.
						</span>
						<span className="text-white/75">Nothing you don&apos;t.</span>
					</h1>
					<p className="mx-auto mt-5 max-w-110 text-[15px]/6.5 text-pretty text-dark-100">
						Your local forecast and calendar on every new tab. Free and open
						source, with no accounts, ads, or tracking.
					</p>
					<div className="mt-6 flex flex-wrap items-center justify-center gap-2">
						<a
							className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-medium text-dark-800 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-9 sm:text-[13px]"
							href={CHROME_STORE_URL}
							rel="noopener noreferrer"
							target="_blank"
						>
							Add to Chrome
						</a>
						<Link
							className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/8 px-4 text-sm font-medium text-dark-100 transition-colors hover:bg-white/12 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-9 sm:text-[13px]"
							href="/demo"
						>
							Try the live demo
						</Link>
					</div>
				</div>
				<HeroNewTab forecast={forecast} />
			</section>
			<section className="scroll-mt-24 border-t border-white/10" id="features">
				<FeatureShowcase hourly={hourly} />
			</section>
		</main>
		<SiteFooter />
	</div>
)

export default LandingPage

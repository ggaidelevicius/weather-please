import Link from 'next/link'

import { getCurrentDate } from '../../../shared/lib/time'
import { SiteLogo } from './site-logo'

const linkClassName =
	'inline-flex min-h-8 items-center rounded-full px-3 text-[13px] font-medium whitespace-nowrap text-dark-100 transition-colors duration-100 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

export const SiteFooter = () => (
	<footer>
		<div className="mx-auto flex max-w-7xl flex-col items-center px-4 pt-20 pb-10 text-center sm:px-6 lg:px-8">
			<Link
				aria-label="Weather Please home"
				className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
				href="/"
			>
				<SiteLogo className="rounded-full bg-white" size={40} />
			</Link>
			<nav
				aria-label="Footer"
				className="mt-4 flex flex-wrap justify-center gap-0.5"
			>
				<Link className={linkClassName} href="/privacy">
					Privacy
				</Link>
				<a
					className={linkClassName}
					href="https://github.com/ggaidelevicius/weather-please"
					rel="noopener noreferrer"
					target="_blank"
				>
					GitHub
				</a>
				<a className={linkClassName} href="mailto:contact@weather-please.app">
					Contact
				</a>
			</nav>
			<div className="mt-6 flex flex-col items-center gap-0.5 text-xs/5 text-dark-300">
				<a
					className="transition-colors hover:text-white"
					href="https://ggaidelevicius.com"
					rel="noopener noreferrer"
					target="_blank"
				>
					ggaidelevicius.com
				</a>
				{/* The year can differ between the static build and the visitor's clock. */}
				<p suppressHydrationWarning>
					© 2020–{getCurrentDate().year} Gus Gaidelevicius
				</p>
			</div>
		</div>
	</footer>
)

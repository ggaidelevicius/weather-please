import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { clsx } from 'clsx'
import Link from 'next/link'

import { CHROME_STORE_URL } from '../model/site'
import { SiteLogo } from './site-logo'

const primaryPaths = [
	['Features', '/#features'],
	['Live demo', 'https://weather-please.app/demo'],
]

const pillClassName =
	'border border-white/10 bg-dark-700/95 shadow-[0_2px_10px_-5px_rgb(0_0_0/0.3)] backdrop-blur-xl backdrop-saturate-150 supports-backdrop-filter:bg-dark-700/80'
const linkClassName =
	'inline-flex min-h-11 items-center justify-center duration-100 rounded-full px-2.5 text-sm font-medium whitespace-nowrap text-dark-100 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-8 sm:px-3 sm:text-[13px]'
const demoClassName =
	'inline-flex min-h-11 items-center justify-center rounded-full bg-white px-3 text-sm font-medium whitespace-nowrap text-dark-800 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-8 sm:text-[13px]'

export const SiteHeader = ({ pathname }: Readonly<{ pathname: string }>) => {
	return (
		<header className="relative z-50 h-24">
			<Popover
				aria-label="Main navigation"
				as="nav"
				className="fixed top-4 left-1/2 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 sm:top-5"
			>
				{({ close }) => (
					<>
						<div
							className={clsx(
								pillClassName,
								'flex items-center gap-1 rounded-full p-1',
							)}
						>
							<Link
								aria-current={pathname === '/' ? 'page' : undefined}
								aria-label="Weather Please home"
								className="flex size-11 flex-none items-center justify-center rounded-full transition-colors duration-100 hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-8"
								href="/"
								onClick={(event) => close(event.currentTarget)}
							>
								<SiteLogo className="rounded-full bg-white" size={20} />
							</Link>
							<div className="hidden items-center gap-1 sm:flex">
								{primaryPaths.map(([label, href]) => (
									<Link
										aria-current={pathname === href ? 'page' : undefined}
										className={clsx(
											linkClassName,
											pathname === href && 'bg-white/10 text-white',
										)}
										href={href}
										key={label}
										rel={
											href.startsWith('https://')
												? 'noopener noreferrer'
												: undefined
										}
										target={href.startsWith('https://') ? '_blank' : undefined}
									>
										{label}
									</Link>
								))}
								<Link
									className={clsx(demoClassName, 'ml-1')}
									href={CHROME_STORE_URL}
									target="_blank"
								>
									Add to Chrome
								</Link>
							</div>
							<div className="flex items-center sm:hidden">
								<PopoverButton
									className={clsx(
										linkClassName,
										'gap-2 px-4 data-open:bg-white/10 data-open:text-white',
									)}
								>
									{({ open }) => (
										<>
											Menu
											<svg
												aria-hidden="true"
												className={clsx('size-3.5', open && 'rotate-180')}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 16 16"
											>
												<path
													d="m4 6 4 4 4-4"
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="1.5"
												/>
											</svg>
										</>
									)}
								</PopoverButton>
							</div>
						</div>
						<PopoverPanel
							className={clsx(
								pillClassName,
								'absolute top-full left-1/2 mt-2 w-52 -translate-x-1/2 origin-top rounded-3xl p-2 transition duration-150 ease-out data-closed:-translate-y-1 data-closed:opacity-0 motion-reduce:transition-none sm:hidden',
							)}
							transition
						>
							{primaryPaths.map(([label, href]) => (
								<PopoverButton
									aria-current={pathname === href ? 'page' : undefined}
									as={Link}
									className={clsx(
										linkClassName,
										'w-full justify-start rounded-2xl',
										pathname === href && 'bg-white/10 text-white',
									)}
									href={href}
									key={label}
									rel={
										href.startsWith('https://')
											? 'noopener noreferrer'
											: undefined
									}
									target={href.startsWith('https://') ? '_blank' : undefined}
								>
									{label}
								</PopoverButton>
							))}
							<PopoverButton
								as={Link}
								className={clsx(demoClassName, 'mt-2 w-full rounded-2xl')}
								href={CHROME_STORE_URL}
								target="_blank"
							>
								Add to Chrome
							</PopoverButton>
						</PopoverPanel>
					</>
				)}
			</Popover>
		</header>
	)
}

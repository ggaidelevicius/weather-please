import type { ComponentType, ReactNode } from 'react'

export type DisclosureLinkProps = Readonly<{
	children: ReactNode
	className?: string
	href: string
}>

// Google requires this Limited Use disclosure on the homepage. The page passes
// `next/link`; the Markdown route can't render it, so it passes a plain link.
export const GoogleApiDisclosure = ({
	internalLink: InternalLink,
}: Readonly<{ internalLink: ComponentType<DisclosureLinkProps> }>) => (
	<>
		Calendar connections are optional and read-only. Weather Please&apos;s use
		of information received from Google APIs adheres to the{' '}
		<a
			className={LINK_CLASS_NAME}
			href="https://developers.google.com/terms/api-services-user-data-policy"
			rel="noopener noreferrer"
			target="_blank"
		>
			Google API Services User Data Policy
		</a>
		, including the Limited Use requirements. See our{' '}
		<InternalLink className={LINK_CLASS_NAME} href="/privacy">
			privacy policy
		</InternalLink>{' '}
		for details.
	</>
)

const LINK_CLASS_NAME =
	'font-medium text-dark-200 underline decoration-white/25 underline-offset-2 transition-colors hover:text-white'

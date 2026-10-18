import { useId } from 'react'

export const SiteLogo = ({
	className,
	size,
}: Readonly<{ className?: string; size: number }>) => {
	const clipId = useId()

	return (
		<svg
			aria-hidden="true"
			className={className}
			focusable="false"
			height={size}
			viewBox="0 0 560 560"
			width={size}
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle cx="280" cy="280" fill="#e2e4e5" r="280" />
			<defs>
				<clipPath id={clipId}>
					<circle cx="280" cy="280" r="250" />
				</clipPath>
			</defs>
			<g clipPath={`url(#${clipId})`}>
				<circle cx="280" cy="280" fill="#20242a" r="250" />
				<path
					d="M30 251C153.3 176.1 276.7 195 400 282.8C443.3 311.6 486.7 325.8 530 340.3V530H30Z"
					fill="#d03629"
				/>
				<path
					d="M30 286.1C153.3 200.8 276.7 225.3 400 318C443.3 342.7 486.7 357.1 530 370.8V530H30Z"
					fill="#ee5e55"
				/>
			</g>
		</svg>
	)
}

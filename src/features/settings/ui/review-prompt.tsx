import type { Dispatch, SetStateAction } from 'react'

import { Trans } from '@lingui/react/macro'

import type { Config } from '../hooks/use-config'

import { Button } from '../../../shared/ui/button'

interface ReviewPromptProps {
	config: Config
	setInput: Dispatch<SetStateAction<Config>>
}

const REVIEW_PROMPT_DELAY_MS = 28 * 24 * 60 * 60 * 1000

export const ReviewPrompt = ({
	config,
	setInput,
}: Readonly<ReviewPromptProps>) => {
	const platformReviewLink =
		typeof navigator !== 'undefined' &&
		navigator.userAgent.toLowerCase().includes('firefox/')
			? 'https://addons.mozilla.org/en-US/firefox/addon/weather-please/reviews/'
			: 'https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn/reviews'

	if (
		!config.displayedReviewPrompt &&
		new Date().getTime() - config.installed >= REVIEW_PROMPT_DELAY_MS
	) {
		return (
			<div className="absolute top-5 right-5 z-2 flex flex-col rounded-lg bg-dark-700 p-5 text-white shadow-md">
				<p className="mb-2 text-lg font-medium">
					<Trans>You&apos;ve been using Weather Please for a while</Trans>
				</p>
				<p className="mb-4 text-sm text-dark-100">
					<Trans>Would you like to leave a review?</Trans>
				</p>
				<div className="flex flex-row gap-2">
					<Button
						href={platformReviewLink}
						onClick={() =>
							setInput((prev) => ({
								...prev,
								displayedReviewPrompt: true,
							}))
						}
					>
						<Trans>Leave a review</Trans>
					</Button>
					<Button
						onClick={() =>
							setInput((prev) => ({
								...prev,
								displayedReviewPrompt: true,
							}))
						}
						secondary
					>
						<Trans>Never show this again</Trans>
					</Button>
				</div>
			</div>
		)
	} else {
		return null
	}
}

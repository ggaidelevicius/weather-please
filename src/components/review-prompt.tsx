import type { Config } from '@/pages'
import { Trans } from '@lingui/react/macro'
import type { Dispatch, SetStateAction } from 'react'
import { Button } from './button'

interface ReviewPromptProps {
	config: Config
	setInput: Dispatch<SetStateAction<Config>>
}

export const ReviewPrompt = ({ config, setInput }: ReviewPromptProps) => {
	if (new Date().getTime() - config.installed >= 2419200000) { // 28 days
		return (
			<div className="absolute top-5 right-5 flex flex-col rounded-lg bg-dark-700 p-5 text-white z-1 shadow-md">
				<p className="mb-2 text-lg font-medium">
					<Trans>You&apos;ve been using Weather Please for a while</Trans>
				</p>
				<p className="mb-4 text-sm text-dark-100">
					<Trans>Would you like to leave a review?</Trans>
				</p>
				<div className="flex flex-row gap-2">
					<Button
						href="https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn/reviews"
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
						secondary
						onClick={() =>
							setInput((prev) => ({
								...prev,
								displayedReviewPrompt: true,
							}))
						}
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

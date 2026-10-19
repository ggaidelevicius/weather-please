import { createMarketingMetadata } from '../../features/landing/model/metadata'
import { PrivacyContent } from '../../features/landing/ui/privacy-content'

export const metadata = createMarketingMetadata({
	description: 'The privacy policy for the Weather Please browser extension.',
	pathname: '/privacy',
	title: 'Privacy policy — Weather Please',
})

const PrivacyPage = () => (
	<div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
		<main className="pb-10">
			<PrivacyContent />
		</main>
	</div>
)

export default PrivacyPage

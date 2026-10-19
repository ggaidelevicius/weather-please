import { SITE_URL } from '../model/site'

// React hoists these links into the head. Canonical and Markdown alternates
// belong to each page's metadata; the proxy also advertises all discovery links.
export const AgentDiscoveryLinks = () => (
	<>
		<link
			href={`${SITE_URL}/llms.txt`}
			key="llms"
			rel="describedby"
			type="text/plain"
		/>
		<link
			href={`${SITE_URL}/sitemap.xml`}
			key="sitemap"
			rel="sitemap"
			type="application/xml"
		/>
		<link
			href={`${SITE_URL}/auth.md`}
			key="auth"
			rel="help"
			type="text/markdown"
		/>
	</>
)

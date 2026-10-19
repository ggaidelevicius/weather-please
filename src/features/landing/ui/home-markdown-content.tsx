import type { DisclosureLinkProps } from './google-api-disclosure'

import {
	CLOSING_COPY,
	FEATURE_SCENE_COPY,
	HERO_COPY,
} from '../model/landing-copy'
import { CHROME_STORE_URL, FIREFOX_ADDON_URL } from '../model/site'
import { GoogleApiDisclosure } from './google-api-disclosure'

// The landing page's text, without its decorative visuals, for /index.md.
export const HomeMarkdownContent = () => (
	<>
		<h1>{HERO_COPY.headline.join(' ')}</h1>
		<p>{HERO_COPY.description}</p>
		<ul>
			<li>
				<a href={CHROME_STORE_URL}>Add to Chrome</a>
			</li>
			<li>
				<MarkdownLink href="/demo">Try the live demo</MarkdownLink>
			</li>
		</ul>
		<h2>Features</h2>
		{FEATURE_SCENE_COPY.map((scene) => (
			<section key={scene.id}>
				<h3>{scene.title}</h3>
				<p>{scene.description}</p>
				{'hasGoogleApiDisclosure' in scene ? (
					<p>
						<GoogleApiDisclosure internalLink={MarkdownLink} />
					</p>
				) : null}
			</section>
		))}
		<h2>{CLOSING_COPY.title}</h2>
		<p>{CLOSING_COPY.description}</p>
		<ul>
			<li>
				<a href={CHROME_STORE_URL}>Add to Chrome</a>
			</li>
			<li>
				<a href={FIREFOX_ADDON_URL}>Add to Firefox</a>
			</li>
		</ul>
	</>
)

// Route handlers can't render `next/link`, and Markdown only needs the href.
const MarkdownLink = ({ children, href }: DisclosureLinkProps) => (
	<a href={href}>{children}</a>
)

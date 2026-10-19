import type { MetadataRoute } from 'next'

import { MARKDOWN_PATHS, SITE_URL } from '../features/landing/model/site'

// Lists the canonical HTML pages. Their Markdown versions are advertised with
// Link headers instead.
const sitemap = (): MetadataRoute.Sitemap =>
	Object.keys(MARKDOWN_PATHS).map((path) => ({
		url: new URL(path, SITE_URL).href,
	}))

export default sitemap

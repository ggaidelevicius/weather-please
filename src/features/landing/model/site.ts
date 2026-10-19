export const SITE_URL = 'https://weather-please.app'

// Public content may be used for search, AI answers, and model training.
export const CONTENT_SIGNAL = 'search=yes, ai-input=yes, ai-train=yes'

export const CHROME_STORE_URL =
	'https://chromewebstore.google.com/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn'

export const FIREFOX_ADDON_URL =
	'https://addons.mozilla.org/en-US/firefox/addon/weather-please/'

// Canonical HTML pages and their Markdown representations.
export const MARKDOWN_PATHS = {
	'/': '/index.md',
	'/privacy': '/privacy.md',
} as const

export type MarkdownPagePath = keyof typeof MARKDOWN_PATHS

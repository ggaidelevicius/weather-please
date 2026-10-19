// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
	CLOSING_COPY,
	FEATURE_SCENE_COPY,
	HERO_COPY,
} from '../../model/landing-copy'
import { markdownResponse } from '../markdown-response'
import { getHomeMarkdown, getPrivacyMarkdown } from '../public-markdown'

describe('public Markdown', () => {
	it('carries the homepage copy and every feature scene', async () => {
		const markdown = await getHomeMarkdown()

		expect(markdown).toContain(`# ${HERO_COPY.headline.join(' ')}`)
		expect(markdown).toContain(HERO_COPY.description)
		for (const scene of FEATURE_SCENE_COPY) {
			expect(markdown).toContain(`### ${scene.title}`)
			expect(markdown).toContain(scene.description)
		}
		expect(markdown).toContain(
			'[Try the live demo](https://weather-please.app/demo)',
		)
		expect(markdown).toContain(
			'[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)',
		)
		expect(markdown).toContain(
			'[privacy policy](https://weather-please.app/privacy)',
		)
		expect(markdown).toContain(`## ${CLOSING_COPY.title}`)
		expect(markdown).toContain(CLOSING_COPY.description)
		expect(markdown).toContain(
			'[Add to Firefox](https://addons.mozilla.org/en-US/firefox/addon/weather-please/)',
		)
		expect(markdown).not.toMatch(/<[a-z]/i)
	})

	it('renders the full privacy policy with absolute links', async () => {
		const markdown = await getPrivacyMarkdown()

		expect(markdown).toMatch(
			/^# Privacy Policy for the "Weather Please" Browser Extension\n/,
		)
		expect(markdown).toContain('## 8\\. Contact Us')
		expect(markdown).toContain(
			'[Open-Meteo Privacy Policy](https://open-meteo.com/en/terms)',
		)
		expect(markdown).toContain(
			'[contact@weather-please.app](mailto:contact@weather-please.app)',
		)
		expect(markdown).not.toMatch(/<[a-z]/i)
	})

	it('serves Markdown with its canonical page and content preferences', async () => {
		const response = markdownResponse({
			canonicalPath: '/privacy',
			content: '# Privacy\n',
		})

		expect(response.headers.get('content-type')).toBe(
			'text/markdown; charset=utf-8',
		)
		expect(response.headers.get('link')).toBe(
			'<https://weather-please.app/privacy>; rel="canonical"',
		)
		expect(response.headers.get('content-signal')).toBe(
			'search=yes, ai-input=yes, ai-train=yes',
		)
		expect(response.headers.get('x-content-type-options')).toBe('nosniff')
		expect(await response.text()).toBe('# Privacy\n')
	})
})

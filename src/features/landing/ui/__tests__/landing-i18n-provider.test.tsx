import { i18n } from '@lingui/core'
import { Trans, useLingui } from '@lingui/react'
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LandingI18nProvider } from '../landing-i18n-provider'

afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
})

describe('LandingI18nProvider', () => {
	it('renders English translations during server rendering before effects run', () => {
		const html = renderToStaticMarkup(
			<LandingI18nProvider>
				<TranslationExample name="Server demo" />
			</LandingI18nProvider>,
		)

		expect(html).toContain('<p>Saturday</p>')
		expect(html).toContain('<output>en</output>')
	})

	it('does not load or activate the shared dashboard and bug form instance', () => {
		const initialLocale = i18n.locale
		const initialMessages = i18n.messages
		const activate = vi.spyOn(i18n, 'activate')
		const load = vi.spyOn(i18n, 'load')
		const loadAndActivate = vi.spyOn(i18n, 'loadAndActivate')

		render(
			<LandingI18nProvider>
				<TranslationExample name="Marketing demo" />
			</LandingI18nProvider>,
		)

		expect(screen.getByText('Saturday')).toBeInTheDocument()
		expect(activate).not.toHaveBeenCalled()
		expect(load).not.toHaveBeenCalled()
		expect(loadAndActivate).not.toHaveBeenCalled()
		expect(i18n.locale).toBe(initialLocale)
		expect(i18n.messages).toEqual(initialMessages)
	})

	it('keeps each demonstration locale independent across rerenders', () => {
		const renderExamples = () => (
			<>
				<LandingI18nProvider>
					<TranslationExample name="First demo" />
				</LandingI18nProvider>
				<LandingI18nProvider>
					<TranslationExample name="Second demo" />
				</LandingI18nProvider>
			</>
		)
		const { rerender } = render(renderExamples())
		const firstDemo = within(screen.getByRole('region', { name: 'First demo' }))
		const secondDemo = within(
			screen.getByRole('region', { name: 'Second demo' }),
		)

		fireEvent.click(firstDemo.getByRole('button', { name: 'Change locale' }))
		rerender(renderExamples())

		expect(firstDemo.getByText('Samedi')).toBeInTheDocument()
		expect(firstDemo.getByRole('status')).toHaveTextContent('fr')
		expect(secondDemo.getByText('Saturday')).toBeInTheDocument()
		expect(secondDemo.getByRole('status')).toHaveTextContent('en')
	})
})

const TranslationExample = ({ name }: Readonly<{ name: string }>) => {
	const { i18n: demoI18n } = useLingui()
	const handleChangeLocale = () => {
		demoI18n.loadAndActivate({
			locale: 'fr',
			messages: { '-5kO8P': ['Samedi'] },
		})
	}

	return (
		<section aria-label={name}>
			<p>
				<Trans id="-5kO8P" />
			</p>
			<output>{demoI18n.locale}</output>
			<button onClick={handleChangeLocale} type="button">
				Change locale
			</button>
		</section>
	)
}

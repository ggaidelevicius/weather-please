'use client'

import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { IconCircleCheckFilled } from '@tabler/icons-react'
import Form from 'next/form'
import { useSearchParams } from 'next/navigation'
import { Suspense, useActionState, useEffect, useId } from 'react'

import type { LocaleKey } from '../../shared/lib/i18n'

import { changeLocalisation, locales } from '../../shared/lib/i18n'
import { Button } from '../../shared/ui/button'
import { Input, Textarea } from '../../shared/ui/input'
import { submitForm } from '../actions'

const initialState = {
	message: '',
}

const isLocaleKey = (value: string): value is LocaleKey =>
	Object.hasOwn(locales, value)

const Page = () => {
	return (
		<Suspense>
			<ContactForm />
		</Suspense>
	)
}

const ContactForm = () => {
	const params = useSearchParams()
	const locale = params?.get('locale') ?? 'en'
	const [state, formAction, pending] = useActionState(submitForm, initialState)
	const id = useId()

	useEffect(() => {
		if (isLocaleKey(locale)) {
			changeLocalisation(locale)
		} else {
			changeLocalisation('en')
		}
	}, [locale])

	return (
		<I18nProvider i18n={i18n}>
			<Form
				action={formAction}
				className="flex w-full max-w-lg flex-col space-y-4 p-12"
			>
				{state.message === '' ? (
					<>
						<h1 className="mb-8 text-4xl font-bold text-white">
							<Trans>Report a bug</Trans>
						</h1>
						<Input
							label={<Trans>Your email (optional)</Trans>}
							name="email"
							type="email"
						/>
						<Textarea
							label={<Trans>Your message</Trans>}
							name="message"
							required
						/>
						<div className="absolute top-auto -left-2500 h-px w-px overflow-hidden">
							<label className="sr-only" htmlFor={id}>
								<Trans>Do not fill this field if you are human</Trans>
							</label>
							<input
								autoComplete="off"
								id={id}
								name={id}
								tabIndex={-1}
								type="text"
							/>
						</div>
						<input name="locale" type="hidden" value={locale} />
						<input name="validation" type="hidden" value={id} />
						<Button disabled={pending} type="submit">
							<Trans>Submit</Trans>
						</Button>
					</>
				) : (
					<h1 className="flex items-end justify-center text-center text-4xl font-bold text-white">
						<IconCircleCheckFilled aria-hidden className="mr-2" size={36} />
						{state.message}
					</h1>
				)}
			</Form>
		</I18nProvider>
	)
}

export default Page

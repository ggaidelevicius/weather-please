'use client'

import { Input, Textarea } from '@/components/input'
import { changeLocalisation, locales } from '@/lib/i18n'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { IconCircleCheckFilled } from '@tabler/icons-react'
import Form from 'next/form'
import { useSearchParams } from 'next/navigation'
import { Suspense, useActionState, useEffect, useId } from 'react'
import { Button } from '../../components/button'
import { submitForm } from '../actions'

const initialState = {
	message: '',
}

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
		if (
			Object.keys(locales)
				.map((key) => key)
				.includes(locale)
		) {
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
							label={
								(<Trans>Your email (optional)</Trans>) as unknown as string
							}
							name="email"
							type="email"
						/>
						<Textarea
							label={(<Trans>Your message</Trans>) as unknown as string}
							name="message"
							required
						/>
						<div className="absolute top-auto -left-2500 h-px w-px overflow-hidden">
							<label htmlFor={id} className="sr-only">
								<Trans>Do not fill this field if you are human</Trans>
							</label>
							<input
								type="text"
								name={id}
								id={id}
								autoComplete="off"
								tabIndex={-1}
							/>
						</div>
						<input type="hidden" name="locale" value={locale} />
						<input type="hidden" name="validation" value={id} />
						<Button type="submit" disabled={pending}>
							<Trans>Submit</Trans>
						</Button>
					</>
				) : (
					<h1 className="flex items-end justify-center text-center text-4xl font-bold text-white">
						<IconCircleCheckFilled size={36} aria-hidden className="mr-2" />
						{state.message}
					</h1>
				)}
			</Form>
		</I18nProvider>
	)
}

export default Page

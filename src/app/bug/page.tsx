'use client'

import { Input, Textarea } from '@/components/input'
import { changeLocalisation, locales } from '@/lib/i18n'
import { messages } from '@/locales/en/messages'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { IconCircleCheckFilled, IconMailFilled } from '@tabler/icons-react'
import Form from 'next/form'
import { useSearchParams } from 'next/navigation'
import { useActionState, useId } from 'react'
import { Button } from '../../components/button'
import { submitForm } from '../actions'

i18n.load({
	en: messages,
})
i18n.activate('en')

const initialState = {
	message: '',
}

const Page = () => {
	const params = useSearchParams()
	const locale = params?.get('locale') ?? 'en'
	if (
		Object.keys(locales)
			.map((key) => key)
			.includes(locale)
	) {
		changeLocalisation(locale)
	}
	const [state, formAction, pending] = useActionState(submitForm, initialState)
	const id = useId()

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
						<Input label="Your email (optional)" name="email" type="email" />
						<Textarea label="Your message" name="message" required />
						<div className="absolute top-auto left-[-10000px] h-px w-px overflow-hidden">
							<label htmlFor={id} className="sr-only">
								Do not fill this field if you are human
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
						<Button icon={IconMailFilled} type="submit" disabled={pending}>
							Submit
						</Button>
					</>
				) : (
					<h1 className="flex items-end justify-center text-center text-4xl font-bold text-white">
						<Trans>
							<IconCircleCheckFilled size={36} aria-hidden className="mr-2" />
							{state.message}
						</Trans>
					</h1>
				)}
			</Form>
		</I18nProvider>
	)
}

export default Page

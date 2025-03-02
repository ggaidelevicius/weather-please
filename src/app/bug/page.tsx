'use client'

import { submitForm } from '../actions'
import { Button } from '../../components/button'
import Form from 'next/form'
import { useActionState, useId } from 'react'
import { Input, Textarea } from '@/components/input'
import { Trans } from '@lingui/react/macro'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { messages } from '@/locales/en/messages'

i18n.load({
	en: messages,
})
i18n.activate('en')

const initialState = {
	message: '',
}

const Page = () => {
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
						{/* <input type="hidden" name="locale" value={id} /> */}
						<input type="hidden" name="validation" value={id} />
						<Button type="submit" disabled={pending} fullWidth>
							Submit
						</Button>
					</>
				) : (
					<p className="self-center text-sm/6 text-gray-300">{state.message}</p>
				)}
			</Form>
		</I18nProvider>
	)
}

export default Page

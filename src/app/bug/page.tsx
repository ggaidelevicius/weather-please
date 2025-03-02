'use client'

import { submitForm } from '../actions'
import { Button } from '../../components/button'
import Form from 'next/form'
import { useActionState, useId } from 'react'
import { Input } from '@/components/input'

const initialState = {
  message: '',
}

const Page = () => {
  const [state, formAction, pending] = useActionState(submitForm, initialState)
  const id = useId()

  return (
    <Form
      action={formAction}
      className={`relative isolate mt-8 flex flex-col items-start p-4 ${state.message === '' ? 'pt-2' : ''}`}
    >
      {state.message === '' ? (
        <>
        <Input label="Your email (optional)" name='email' />
          <label htmlFor="message" className="sr-only">
            Your message
          </label>
          <textarea
            required
            name="message"
            id="message"
            placeholder="Your message"
            disabled={pending}
            className="peer mb-6 w-full flex-auto resize-none bg-transparent px-4 py-2.5 text-[0.8125rem]/6 text-white placeholder:text-gray-500 focus:outline-hidden"
          />
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
          <button type='submit' disabled={pending}>
            Send message
          </button>
        </>
      ) : (
        <p className="self-center text-sm/6 text-gray-300">{state.message}</p>
      )}
      <div className="absolute inset-0 -z-10 rounded-lg transition peer-focus:ring-4 peer-focus:ring-sky-300/15" />
      <div className="absolute inset-0 -z-10 rounded-lg bg-white/2.5 ring-1 ring-white/15 transition peer-focus:ring-sky-300" />
    </Form>
  )
}

export default Page

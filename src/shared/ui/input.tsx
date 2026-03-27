import type {
	ChangeEventHandler,
	ComponentPropsWithoutRef,
	ReactNode,
} from 'react'

import {
	Description,
	Field,
	Input as HeadlessInput,
	Select as HeadlessSelect,
	Switch as HeadlessSwitch,
	Textarea as HeadlessTextarea,
	Label,
} from '@headlessui/react'
import { Trans } from '@lingui/react/macro'
import { IconChevronDown } from '@tabler/icons-react'

interface SelectProps {
	label: ReactNode
	onChange: ChangeEventHandler<HTMLSelectElement>
	options: { label: ReactNode; value: string }[]
	value: string
}

export const Select = ({
	label,
	onChange,
	options,
	value,
}: Readonly<
	Omit<ComponentPropsWithoutRef<'select'>, 'onChange' | 'value'> & SelectProps
>) => (
	<Field>
		<Label className="block text-sm font-medium text-white">{label}</Label>
		<div className="relative mt-2">
			<HeadlessSelect
				className="block w-full appearance-none rounded-sm bg-dark-700 px-3 py-2 text-base text-dark-100 outline-1 -outline-offset-1 outline-dark-400 select-none placeholder:text-dark-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 sm:text-sm"
				onChange={onChange}
				value={value}
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</HeadlessSelect>
			<IconChevronDown
				aria-hidden="true"
				className="group pointer-events-none absolute top-2.5 right-2.5 size-4 stroke-white/60"
			/>
		</div>
	</Field>
)

interface BaseInputProps {
	label: ReactNode
	required?: boolean
	validation?: boolean
}

interface ControlledInputProps extends BaseInputProps {
	name?: undefined
	onChange: ChangeEventHandler<HTMLInputElement>
	type?: undefined
	value: string
}

interface UncontrolledInputProps extends BaseInputProps {
	name: string
	onChange?: undefined
	type?: 'email'
	value?: undefined
}

export const Input = ({
	label,
	name,
	onChange,
	required,
	type,
	validation,
	value,
}: Readonly<ControlledInputProps | UncontrolledInputProps>) => {
	return (
		<Field>
			<Label className="block text-sm font-medium text-white">{label}</Label>
			<HeadlessInput
				className="mt-2 block w-full appearance-none rounded-sm bg-dark-700 px-3 py-2 text-base text-dark-100 outline-1 -outline-offset-1 outline-dark-400 select-none placeholder:text-dark-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 data-invalid:outline-red-500 sm:text-sm"
				invalid={validation === false}
				name={name}
				onChange={onChange}
				required={required}
				type={type}
				value={value}
			/>
			{validation === false && (
				<Description className="mt-2 text-sm text-red-400">
					<Trans>
						Invalid value. Settings will not save until this is valid.
					</Trans>
				</Description>
			)}
		</Field>
	)
}

interface BaseTextareaProps {
	label: ReactNode
	validation?: boolean
}

interface ControlledTextareaProps extends BaseTextareaProps {
	name?: undefined
	onChange: ChangeEventHandler<HTMLTextAreaElement>
	required: undefined
	value: string
}

interface UncontrolledTextareaProps extends BaseTextareaProps {
	name: string
	onChange?: undefined
	required?: boolean
	value?: undefined
}

export const Textarea = ({
	label,
	name,
	onChange,
	required,
	validation,
	value,
}: Readonly<ControlledTextareaProps | UncontrolledTextareaProps>) => {
	return (
		<Field>
			<Label className="block text-sm font-medium text-white">{label}</Label>
			<HeadlessTextarea
				className="mt-2 block w-full resize-none appearance-none rounded-sm bg-dark-700 px-3 py-2 text-base text-dark-100 outline-1 -outline-offset-1 outline-dark-400 select-none placeholder:text-dark-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 data-invalid:outline-red-500 sm:text-sm"
				invalid={validation === false}
				name={name}
				onChange={onChange}
				required={required}
				rows={4}
				value={value}
			/>
			{validation === false && (
				<Description className="mt-2 text-sm text-red-400">
					<Trans>
						Invalid value. Settings will not save until this is valid.
					</Trans>
				</Description>
			)}
		</Field>
	)
}

interface SwitchProps {
	checked: boolean
	description?: string
	label: ReactNode
	onChange: (e: boolean) => void
}

export const Switch = ({
	checked,
	description,
	label,
	onChange,
}: Readonly<SwitchProps>) => {
	return (
		<Field>
			<Label className="block text-sm font-medium text-white">{label}</Label>
			<HeadlessSwitch
				checked={checked}
				className="group mt-2 inline-flex h-6 w-11 items-center rounded-full bg-dark-500 transition-[background-color] select-none focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 data-checked:bg-blue-600"
				onChange={onChange}
			>
				<span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6" />
			</HeadlessSwitch>
			{description && (
				<Description className="mt-1 text-sm text-dark-100">
					{description}
				</Description>
			)}
		</Field>
	)
}
